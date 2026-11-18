import { err, isError, type CellError, type Scalar } from './errors';
import { roundHalfAway } from './format';
import { compareValues, isRange, numbersIn, toNumber, toText, type EvalEnv, type RangeValue, type Value } from './values';

export interface FunctionDef {
  name: string;
  /** Fewest and most arguments allowed. */
  min: number;
  max: number;
  /** Shown as a hint while typing, e.g. "SUM(number1, [number2], ...)". */
  signature: string;
  /** One line a beginner can understand. */
  summary: string;
  run(args: Value[], env: EvalEnv): Scalar;
}

const define = (def: FunctionDef): FunctionDef => def;

type Plain = Exclude<Scalar, CellError>;

const NEEDS_ONE_CELL = 'This needs one cell here, not a whole range.';

/** The single value an argument stands for. A reference to one cell is that cell's value. */
function single(arg: Value): Scalar {
  if (!isRange(arg)) return arg;
  if (arg.rows.length === 1 && arg.rows[0].length === 1) return arg.rows[0][0];
  return err('#VALUE!', NEEDS_ONE_CELL);
}

function numberArg(arg: Value): number | CellError {
  return toNumber(single(arg));
}

function textArg(arg: Value): string | CellError {
  const v = single(arg);
  return isError(v) ? v : toText(v);
}

/** Excel's idea of true and false: numbers are true unless zero, and "TRUE"/"FALSE" as text count. */
function toBool(v: Scalar): boolean | CellError {
  if (isError(v)) return v;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (v === null) return false;
  const upper = v.trim().toUpperCase();
  if (upper === 'TRUE') return true;
  if (upper === 'FALSE') return false;
  return err('#VALUE!', `"${v}" is text, so it can't be used as true or false.`);
}

/** Every cell in the arguments, in reading order. */
function flatten(args: Value[]): Scalar[] {
  const out: Scalar[] = [];
  for (const arg of args) {
    if (isRange(arg)) for (const row of arg.rows) out.push(...row);
    else out.push(arg);
  }
  return out;
}

/**
 * The true/false values AND and OR look at. Inside a range, text and blanks are skipped;
 * typed straight in, text must read as TRUE or FALSE.
 */
function logicalsIn(args: Value[]): boolean[] | CellError {
  const out: boolean[] = [];
  for (const arg of args) {
    if (isRange(arg)) {
      for (const row of arg.rows) {
        for (const v of row) {
          if (isError(v)) return v;
          if (typeof v === 'boolean') out.push(v);
          else if (typeof v === 'number') out.push(v !== 0);
        }
      }
      continue;
    }
    const b = toBool(arg);
    if (isError(b)) return b;
    out.push(b);
  }
  if (out.length === 0) return err('#VALUE!', 'There is nothing here that is true or false.');
  return out;
}

// ---- criteria (">100", "North", "a*") ---------------------------------------------------

const NUMERIC = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
type CriteriaOp = '=' | '<>' | '<' | '>' | '<=' | '>=';

interface Criteria {
  op: CriteriaOp;
  operand: number | string | boolean;
}

function parseCriteria(v: Plain): Criteria {
  if (typeof v === 'number' || typeof v === 'boolean') return { op: '=', operand: v };
  if (v === null) return { op: '=', operand: 0 };
  const m = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(v) as RegExpExecArray;
  const op = (m[1] ?? '=') as CriteriaOp;
  const rest = m[2];
  if (NUMERIC.test(rest.trim())) return { op, operand: Number(rest.trim()) };
  const upper = rest.trim().toUpperCase();
  if (upper === 'TRUE' || upper === 'FALSE') return { op, operand: upper === 'TRUE' };
  return { op, operand: rest };
}

/** Turns "a*" and "?b" into a pattern. `~*` and `~?` mean a real star or question mark. */
function wildcard(pattern: string): RegExp {
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '~' && (pattern[i + 1] === '*' || pattern[i + 1] === '?' || pattern[i + 1] === '~')) {
      source += `\\${pattern[++i]}`;
    } else if (ch === '*') source += '[\\s\\S]*';
    else if (ch === '?') source += '[\\s\\S]';
    else source += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${source}$`, 'i');
}

const sameNumber = (a: number, b: number): boolean => compareValues(a, b) === 0;

function meets(cell: Scalar, c: Criteria): boolean {
  if (isError(cell)) return false;
  const { op, operand } = c;
  if (typeof operand === 'number') {
    const asNumber =
      typeof cell === 'number' ? cell : typeof cell === 'string' && NUMERIC.test(cell.trim()) ? Number(cell.trim()) : null;
    if (op === '=') return asNumber !== null && sameNumber(asNumber, operand);
    if (op === '<>') return !(asNumber !== null && sameNumber(asNumber, operand));
    // Greater and less only ever look at real numbers.
    if (typeof cell !== 'number') return false;
    const order = compareValues(cell, operand);
    return op === '<' ? order < 0 : op === '>' ? order > 0 : op === '<=' ? order <= 0 : order >= 0;
  }
  if (typeof operand === 'boolean') {
    const same = cell === operand;
    return op === '=' ? same : op === '<>' ? !same : false;
  }
  if (op === '=' || op === '<>') {
    // An empty pattern means "blank": "=" finds empty cells, "<>" finds filled ones.
    const same = operand === '' ? cell === null || cell === '' : typeof cell === 'string' && wildcard(operand).test(cell);
    return op === '=' ? same : !same;
  }
  if (typeof cell !== 'string') return false;
  const order = compareValues(cell, operand);
  return op === '<' ? order < 0 : op === '>' ? order > 0 : op === '<=' ? order <= 0 : order >= 0;
}

function criteriaArg(arg: Value): Criteria | CellError {
  const v = single(arg);
  return isError(v) ? v : parseCriteria(v);
}

const NEEDS_RANGE = 'This needs a range of cells here, like B2:B6.';

// ---- lookups ----------------------------------------------------------------------------

/** Exact match, the way lookups do it: text ignores case and may use * and ?. */
function matches(cell: Scalar, wanted: Plain, wildcards: boolean): boolean {
  if (isError(cell)) return false;
  if (typeof wanted === 'string') {
    if (typeof cell !== 'string') return false;
    return wildcards && /[*?]/.test(wanted) ? wildcard(wanted).test(cell) : cell.toUpperCase() === wanted.toUpperCase();
  }
  if (wanted === null) return cell === null;
  if (cell === null) return false;
  return typeof cell === typeof wanted && compareValues(cell, wanted) === 0;
}

const sameKind = (a: Plain, b: Plain): boolean => a !== null && b !== null && typeof a === typeof b;

/**
 * The position of the last value that is no bigger than `wanted`, found the way Excel
 * finds it: by halving a list it assumes is sorted. On unsorted data the answer is
 * unreliable, which is exactly why approximate lookups need sorted data.
 */
function lastNotAbove(values: Scalar[], wanted: Plain): number {
  let lo = 0;
  let hi = values.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const v = values[mid];
    if (!isError(v) && sameKind(v, wanted) && compareValues(v, wanted) <= 0) {
      found = mid;
      lo = mid + 1;
    } else if (!isError(v) && v !== null && !sameKind(v, wanted) && compareValues(v, wanted) < 0) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

const NOT_FOUND = "The lookup couldn't find what it was looking for.";

/** A one-row or one-column range as a flat list. */
function vector(range: RangeValue): Scalar[] | null {
  if (range.rows.length === 1) return range.rows[0];
  if (range.rows.every((row) => row.length === 1)) return range.rows.map((row) => row[0]);
  return null;
}

const DAY_MS = 86_400_000;
/** Excel counts days from here, so 1 Jan 1900 is day 1 (with its famous 1900 leap-year slip). */
const DAY_ZERO = Date.UTC(1899, 11, 30);

/** A calendar date as Excel's day number. */
export function dateToSerial(date: Date): number {
  return Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - DAY_ZERO) / DAY_MS);
}

/**
 * The function library. Each entry is checked against real Excel through
 * test/fixtures/excel-parity.xlsx, so add parity cases in the same change as a function.
 */
export const FUNCTIONS: Record<string, FunctionDef> = {
  SUM: define({
    name: 'SUM',
    min: 1,
    max: Infinity,
    signature: 'SUM(number1, [number2], ...)',
    summary: 'Adds numbers together.',
    run(args) {
      const nums = numbersIn(args);
      if (isError(nums)) return nums;
      return nums.reduce((total, n) => total + n, 0);
    },
  }),

  AVERAGE: define({
    name: 'AVERAGE',
    min: 1,
    max: Infinity,
    signature: 'AVERAGE(number1, [number2], ...)',
    summary: 'The middle value you get by sharing the total out evenly.',
    run(args) {
      const nums = numbersIn(args);
      if (isError(nums)) return nums;
      if (nums.length === 0) return err('#DIV/0!', 'There are no numbers here to average.');
      return nums.reduce((total, n) => total + n, 0) / nums.length;
    },
  }),

  MIN: define({
    name: 'MIN',
    min: 1,
    max: Infinity,
    signature: 'MIN(number1, [number2], ...)',
    summary: 'The smallest number.',
    run(args) {
      const nums = numbersIn(args);
      if (isError(nums)) return nums;
      return nums.length === 0 ? 0 : Math.min(...nums);
    },
  }),

  MAX: define({
    name: 'MAX',
    min: 1,
    max: Infinity,
    signature: 'MAX(number1, [number2], ...)',
    summary: 'The biggest number.',
    run(args) {
      const nums = numbersIn(args);
      if (isError(nums)) return nums;
      return nums.length === 0 ? 0 : Math.max(...nums);
    },
  }),

  COUNT: define({
    name: 'COUNT',
    min: 1,
    max: Infinity,
    signature: 'COUNT(value1, [value2], ...)',
    summary: 'How many cells hold a number.',
    run(args) {
      let n = 0;
      for (const arg of args) {
        if (isRange(arg)) {
          for (const row of arg.rows) for (const v of row) if (typeof v === 'number') n++;
        } else if (typeof arg === 'number' || typeof arg === 'boolean' || arg === null) {
          n++;
        } else if (typeof arg === 'string' && NUMERIC.test(arg.trim())) {
          n++;
        }
      }
      return n;
    },
  }),

  COUNTA: define({
    name: 'COUNTA',
    min: 1,
    max: Infinity,
    signature: 'COUNTA(value1, [value2], ...)',
    summary: 'How many cells are not empty.',
    run(args) {
      let n = 0;
      for (const arg of args) {
        if (isRange(arg)) {
          for (const row of arg.rows) for (const v of row) if (v !== null) n++;
        } else {
          n++;
        }
      }
      return n;
    },
  }),

  ROUND: define({
    name: 'ROUND',
    min: 2,
    max: 2,
    signature: 'ROUND(number, digits)',
    summary: 'Rounds a number to the decimal places you choose.',
    run([value, places]) {
      const n = numberArg(value);
      if (isError(n)) return n;
      const digits = numberArg(places);
      if (isError(digits)) return digits;
      return roundHalfAway(n, Math.trunc(digits));
    },
  }),

  IF: define({
    name: 'IF',
    min: 2,
    max: 3,
    signature: 'IF(test, value_if_true, [value_if_false])',
    summary: 'Gives one answer if the test is true and another if it is false.',
    run([test, whenTrue, whenFalse]) {
      const passed = toBool(single(test));
      if (isError(passed)) return passed;
      if (passed) return single(whenTrue);
      return whenFalse === undefined ? false : single(whenFalse);
    },
  }),

  AND: define({
    name: 'AND',
    min: 1,
    max: Infinity,
    signature: 'AND(test1, [test2], ...)',
    summary: 'TRUE only if every test is true.',
    run(args) {
      const values = logicalsIn(args);
      return isError(values) ? values : values.every(Boolean);
    },
  }),

  OR: define({
    name: 'OR',
    min: 1,
    max: Infinity,
    signature: 'OR(test1, [test2], ...)',
    summary: 'TRUE if any one of the tests is true.',
    run(args) {
      const values = logicalsIn(args);
      return isError(values) ? values : values.some(Boolean);
    },
  }),

  NOT: define({
    name: 'NOT',
    min: 1,
    max: 1,
    signature: 'NOT(test)',
    summary: 'Flips TRUE to FALSE and FALSE to TRUE.',
    run([test]) {
      const value = toBool(single(test));
      return isError(value) ? value : !value;
    },
  }),

  IFERROR: define({
    name: 'IFERROR',
    min: 2,
    max: 2,
    signature: 'IFERROR(value, value_if_error)',
    summary: 'Shows something friendlier when a formula gives an error.',
    run([value, fallback]) {
      const v = single(value);
      return isError(v) ? single(fallback) : v;
    },
  }),

  COUNTIF: define({
    name: 'COUNTIF',
    min: 2,
    max: 2,
    signature: 'COUNTIF(range, criteria)',
    summary: 'Counts the cells that match a rule, such as ">100" or "North".',
    run([range, rule]) {
      if (!isRange(range)) return err('#VALUE!', NEEDS_RANGE);
      const criteria = criteriaArg(rule);
      if (isError(criteria)) return criteria;
      let n = 0;
      for (const row of range.rows) for (const v of row) if (meets(v, criteria)) n++;
      return n;
    },
  }),

  SUMIF: define({
    name: 'SUMIF',
    min: 2,
    max: 3,
    signature: 'SUMIF(range, criteria, [sum_range])',
    summary: 'Adds up only the rows that match a rule.',
    run([range, rule, sumRange], env) {
      if (!isRange(range)) return err('#VALUE!', NEEDS_RANGE);
      if (sumRange !== undefined && !isRange(sumRange)) return err('#VALUE!', NEEDS_RANGE);
      const criteria = criteriaArg(rule);
      if (isError(criteria)) return criteria;
      // The cells to add start at the top-left of sum_range and follow the shape of `range`.
      const from = (sumRange ?? range).addr.start;
      let total = 0;
      for (let r = 0; r < range.rows.length; r++) {
        for (let c = 0; c < range.rows[r].length; c++) {
          if (!meets(range.rows[r][c], criteria)) continue;
          const v = env.getCell({ col: from.col + c, row: from.row + r });
          if (isError(v)) return v;
          if (typeof v === 'number') total += v;
        }
      }
      return total;
    },
  }),

  VLOOKUP: define({
    name: 'VLOOKUP',
    min: 3,
    max: 4,
    signature: 'VLOOKUP(lookup_value, table, column_number, [approximate])',
    summary: 'Finds a row by its first column and returns a value from that row.',
    run([wantedArg, table, columnArg, approxArg]) {
      const wanted = single(wantedArg);
      if (isError(wanted)) return wanted;
      if (!isRange(table)) return err('#VALUE!', NEEDS_RANGE);
      const column = numberArg(columnArg);
      if (isError(column)) return column;
      const approximate = approxArg === undefined ? true : toBool(single(approxArg));
      if (isError(approximate)) return approximate;
      const index = Math.trunc(column);
      if (index < 1) return err('#VALUE!', 'The column number starts at 1, for the first column of the table.');
      if (index > table.rows[0].length) {
        return err('#REF!', `The table only has ${table.rows[0].length} columns, so there is no column ${index}.`);
      }
      const keys = table.rows.map((row) => row[0]);
      const at = approximate ? lastNotAbove(keys, wanted) : keys.findIndex((key) => matches(key, wanted, true));
      if (at < 0) return err('#N/A', NOT_FOUND);
      return table.rows[at][index - 1];
    },
  }),

  XLOOKUP: define({
    name: 'XLOOKUP',
    min: 3,
    max: 6,
    signature: 'XLOOKUP(lookup_value, lookup_range, return_range, [if_not_found])',
    summary: 'Finds a value in one column and returns the matching value from another.',
    run([wantedArg, lookIn, giveBack, missing, matchArg, searchArg]) {
      const wanted = single(wantedArg);
      if (isError(wanted)) return wanted;
      if (!isRange(lookIn) || !isRange(giveBack)) return err('#VALUE!', NEEDS_RANGE);
      const keys = vector(lookIn);
      const results = vector(giveBack);
      if (!keys || !results || keys.length !== results.length) {
        return err('#VALUE!', 'The two ranges must be the same size: one column or one row each.');
      }
      const mode = matchArg === undefined ? 0 : numberArg(matchArg);
      if (isError(mode)) return mode;
      const direction = searchArg === undefined ? 1 : numberArg(searchArg);
      if (isError(direction)) return direction;

      const order = keys.map((_, i) => i);
      if (direction < 0) order.reverse();
      let at = order.find((i) => matches(keys[i], wanted, mode === 2)) ?? -1;
      if (at < 0 && (mode === -1 || mode === 1)) {
        // Nothing exact, so take the nearest value on the side that was asked for.
        for (const i of order) {
          const key = keys[i];
          if (isError(key) || !sameKind(key, wanted)) continue;
          const gap = compareValues(key, wanted) * mode;
          if (gap < 0) continue;
          if (at < 0 || compareValues(key, keys[at] as Plain) * mode < 0) at = i;
        }
      }
      if (at >= 0) return results[at];
      return missing === undefined ? err('#N/A', NOT_FOUND) : single(missing);
    },
  }),

  LEN: define({
    name: 'LEN',
    min: 1,
    max: 1,
    signature: 'LEN(text)',
    summary: 'How many characters the text has, spaces included.',
    run([value]) {
      const text = textArg(value);
      return isError(text) ? text : text.length;
    },
  }),

  LEFT: define({
    name: 'LEFT',
    min: 1,
    max: 2,
    signature: 'LEFT(text, [how_many])',
    summary: 'The first characters of the text.',
    run([value, countArg]) {
      const text = textArg(value);
      if (isError(text)) return text;
      const count = countArg === undefined ? 1 : numberArg(countArg);
      if (isError(count)) return count;
      if (count < 0) return err('#VALUE!', "You can't take a negative number of characters.");
      return text.slice(0, Math.trunc(count));
    },
  }),

  RIGHT: define({
    name: 'RIGHT',
    min: 1,
    max: 2,
    signature: 'RIGHT(text, [how_many])',
    summary: 'The last characters of the text.',
    run([value, countArg]) {
      const text = textArg(value);
      if (isError(text)) return text;
      const count = countArg === undefined ? 1 : numberArg(countArg);
      if (isError(count)) return count;
      if (count < 0) return err('#VALUE!', "You can't take a negative number of characters.");
      const n = Math.trunc(count);
      return n === 0 ? '' : text.slice(-n);
    },
  }),

  UPPER: define({
    name: 'UPPER',
    min: 1,
    max: 1,
    signature: 'UPPER(text)',
    summary: 'Turns the text into CAPITAL LETTERS.',
    run([value]) {
      const text = textArg(value);
      return isError(text) ? text : text.toUpperCase();
    },
  }),

  LOWER: define({
    name: 'LOWER',
    min: 1,
    max: 1,
    signature: 'LOWER(text)',
    summary: 'Turns the text into small letters.',
    run([value]) {
      const text = textArg(value);
      return isError(text) ? text : text.toLowerCase();
    },
  }),

  TRIM: define({
    name: 'TRIM',
    min: 1,
    max: 1,
    signature: 'TRIM(text)',
    summary: 'Removes extra spaces, leaving one between words.',
    run([value]) {
      const text = textArg(value);
      return isError(text) ? text : text.replace(/ +/g, ' ').replace(/^ | $/g, '');
    },
  }),

  CONCAT: define({
    name: 'CONCAT',
    min: 1,
    max: Infinity,
    signature: 'CONCAT(text1, [text2], ...)',
    summary: 'Joins pieces of text into one.',
    run(args) {
      let out = '';
      for (const v of flatten(args)) {
        if (isError(v)) return v;
        out += toText(v);
      }
      return out;
    },
  }),

  TODAY: define({
    name: 'TODAY',
    min: 0,
    max: 0,
    signature: 'TODAY()',
    summary: "Today's date.",
    run(_args, env) {
      return dateToSerial(env.context.today());
    },
  }),
};

export const functionNames = (): string[] => Object.keys(FUNCTIONS).sort();

/** A learner-friendly message if the argument count is wrong, otherwise null. */
export function arityProblem(name: string, count: number): string | null {
  const def = FUNCTIONS[name];
  if (!def) return null;
  if (count >= def.min && count <= def.max) return null;
  if (def.max === 0) return `${name} takes nothing inside its brackets: ${def.signature}`;
  const needs =
    def.max === Infinity
      ? `at least ${def.min}`
      : def.min === def.max
        ? `exactly ${def.min}`
        : `${def.min} to ${def.max}`;
  const noun = def.min === 1 && def.max === 1 ? 'input' : 'inputs';
  return `${name} needs ${needs} ${noun}: ${def.signature}`;
}
