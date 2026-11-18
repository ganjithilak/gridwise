import type { EngineContext } from './context';
import { err, isError, type CellError, type Scalar } from './errors';
import { formatGeneral } from './format';
import type { CellAddr, RangeAddr } from './refs';

/** A block of cells handed to a function, e.g. the B2:B6 in SUM(B2:B6). */
export interface RangeValue {
  kind: 'range';
  addr: RangeAddr;
  rows: Scalar[][];
}

/** What a function argument can be. */
export type Value = Scalar | RangeValue;

export const isRange = (v: Value): v is RangeValue =>
  typeof v === 'object' && v !== null && (v as RangeValue).kind === 'range';

/** Everything the evaluator needs to know about the sheet it is running in. */
export interface EvalEnv {
  getCell(addr: CellAddr): Scalar;
  cols: number;
  rows: number;
  context: EngineContext;
}

const NUMERIC_TEXT = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

/**
 * Excel's coercion for arithmetic: empty is 0, TRUE is 1, "5" is 5,
 * and text that isn't a number is #VALUE!.
 */
export function toNumber(v: Scalar): number | CellError {
  if (isError(v)) return v;
  if (typeof v === 'number') return v;
  if (v === null) return 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const text = v.trim();
  if (NUMERIC_TEXT.test(text)) return Number(text);
  return err('#VALUE!', `"${v}" is text, so it can't be used in a calculation.`);
}

/** Excel's coercion for `&`: empty is "", numbers print in General format. */
export function toText(v: Exclude<Scalar, CellError>): string {
  if (v === null) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return formatGeneral(v);
  return v;
}

const typeRank = (v: number | string | boolean): number =>
  typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2;

/** Excel compares numbers to 15 significant digits, so 0.1+0.2 equals 0.3. */
const comparable = (n: number): number => Number(n.toPrecision(15));

/**
 * Excel's ordering: any number < any text < FALSE < TRUE. Text ignores case.
 * An empty cell takes on the type of whatever it is compared with.
 */
export function compareValues(a: Exclude<Scalar, CellError>, b: Exclude<Scalar, CellError>): number {
  if (a === null && b === null) return 0;
  const blankLike = (other: number | string | boolean) =>
    typeof other === 'number' ? 0 : typeof other === 'string' ? '' : false;
  const x = a === null ? blankLike(b as number | string | boolean) : a;
  const y = b === null ? blankLike(a as number | string | boolean) : b;
  if (typeRank(x) !== typeRank(y)) return typeRank(x) - typeRank(y);
  if (typeof x === 'number') {
    const p = comparable(x);
    const q = comparable(y as number);
    return p < q ? -1 : p > q ? 1 : 0;
  }
  if (typeof x === 'string') {
    const p = x.toUpperCase();
    const q = (y as string).toUpperCase();
    return p < q ? -1 : p > q ? 1 : 0;
  }
  return (x ? 1 : 0) - (y ? 1 : 0);
}

/**
 * The numbers a function like SUM should use. Inside a range, text, TRUE/FALSE and
 * blanks are skipped. A value typed straight into the function ("5", TRUE) is coerced.
 * The first error found wins.
 */
export function numbersIn(args: Value[]): number[] | CellError {
  const out: number[] = [];
  for (const arg of args) {
    if (isRange(arg)) {
      for (const row of arg.rows) {
        for (const v of row) {
          if (isError(v)) return v;
          if (typeof v === 'number') out.push(v);
        }
      }
      continue;
    }
    const n = toNumber(arg);
    if (isError(n)) return n;
    out.push(n);
  }
  return out;
}
