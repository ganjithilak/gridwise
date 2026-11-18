import { fixedContext, type EngineContext } from './context';
import { err, FormulaSyntaxError, isError, type Scalar } from './errors';
import { evaluate } from './evaluator';
import { formatScalar, type NumFmt } from './format';
import { parseBody, type Node } from './parser';
import { a1, cellsInRange, range as parseRangeStrict, shiftFormula, toA1, type CellAddr, type RangeAddr } from './refs';
import type { EvalEnv } from './values';

export type CellInput = string | number | boolean | null;

export interface CellFormat {
  bold?: boolean;
  numFmt?: NumFmt;
}

export interface CellData {
  /** Exactly what was typed. A formula keeps its leading `=`. */
  readonly raw: string;
  readonly format?: CellFormat;
}

/** How lessons describe a sheet. `grid` is laid out from A1; `cells` overrides single cells. */
export interface SheetSpec {
  cols: number;
  rows: number;
  grid?: CellInput[][];
  cells?: Record<string, CellInput>;
  /** Keyed by a cell ("B2") or a range ("B2:B6"). */
  formats?: Record<string, CellFormat>;
  /**
   * The table that Sort works on, header row included ("A1:C6"). Without it, Sort takes
   * the block of filled cells around the selected one, as Excel does.
   */
  table?: string;
}

export type SheetSnapshot = ReadonlyMap<string, CellData>;

export const inputToRaw = (v: CellInput): string => {
  if (v === null) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return String(v);
};

export const isFormulaText = (raw: string): boolean => raw.startsWith('=');

const STARTS_WITH_TODAY = /^=\s*TODAY\s*\(\s*\)/i;
const NUMBER_LITERAL = /^[+-]?\$?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)%?$/;

/**
 * What typed text means when it isn't a formula. "1,200", "$4.50" and "15%" are numbers,
 * and the last two also bring their number format with them, as in Excel.
 */
export function parseLiteral(raw: string): { value: Scalar; numFmt?: NumFmt } {
  if (raw.startsWith("'")) return { value: raw.slice(1) };
  const text = raw.trim();
  if (text === '') return { value: null };
  const upper = text.toUpperCase();
  if (upper === 'TRUE') return { value: true };
  if (upper === 'FALSE') return { value: false };
  if (NUMBER_LITERAL.test(text)) {
    const percent = text.endsWith('%');
    const currency = text.includes('$');
    const n = Number(text.replace(/[$,%]/g, ''));
    return {
      value: percent ? n / 100 : n,
      numFmt: percent ? 'percent' : currency ? 'currency' : undefined,
    };
  }
  return { value: raw };
}

const astCache = new Map<string, Node | FormulaSyntaxError>();

/** Parses a formula (with its leading `=`), remembering the result. Throws FormulaSyntaxError. */
export function parseFormula(raw: string): Node {
  const body = raw.slice(1);
  let cached = astCache.get(body);
  if (cached === undefined) {
    try {
      cached = parseBody(body);
    } catch (e) {
      if (!(e instanceof FormulaSyntaxError)) throw e;
      cached = e;
    }
    astCache.set(body, cached);
  }
  if (cached instanceof FormulaSyntaxError) throw cached;
  return cached;
}

const CIRCULAR = 'This formula refers back to its own cell, so it can never finish calculating.';

/**
 * The spreadsheet model. Holds what was typed into each cell and works out what each
 * cell shows. Sheets here are tiny (a phone screen's worth), so any edit simply clears
 * every cached result and cells recalculate on demand.
 */
export class Sheet {
  readonly cols: number;
  readonly rows: number;
  readonly context: EngineContext;

  private cells = new Map<string, CellData>();
  private cache = new Map<string, Scalar>();
  private visiting = new Set<string>();
  private readonly env: EvalEnv;

  constructor(cols: number, rows: number, context: EngineContext = fixedContext) {
    this.cols = cols;
    this.rows = rows;
    this.context = context;
    this.env = {
      cols,
      rows,
      context,
      getCell: (addr) => (this.inBounds(addr) ? this.getValue(addr) : null),
    };
  }

  static fromSpec(spec: SheetSpec, context: EngineContext = fixedContext): Sheet {
    const sheet = new Sheet(spec.cols, spec.rows, context);
    spec.grid?.forEach((line, row) => {
      line.forEach((value, col) => sheet.setInput({ col, row }, value));
    });
    for (const [key, value] of Object.entries(spec.cells ?? {})) sheet.setInput(a1(key), value);
    for (const [key, format] of Object.entries(spec.formats ?? {})) {
      sheet.setFormat(parseRangeStrict(key), format);
    }
    return sheet;
  }

  clone(): Sheet {
    const copy = new Sheet(this.cols, this.rows, this.context);
    copy.cells = new Map(this.cells);
    return copy;
  }

  snapshot(): SheetSnapshot {
    return new Map(this.cells);
  }

  restore(snapshot: SheetSnapshot): void {
    this.cells = new Map(snapshot);
    this.cache.clear();
  }

  inBounds(addr: CellAddr): boolean {
    return addr.col >= 0 && addr.row >= 0 && addr.col < this.cols && addr.row < this.rows;
  }

  getRaw(addr: CellAddr): string {
    return this.cells.get(toA1(addr))?.raw ?? '';
  }

  getFormat(addr: CellAddr): CellFormat {
    return this.cells.get(toA1(addr))?.format ?? {};
  }

  isFormula(addr: CellAddr): boolean {
    return isFormulaText(this.getRaw(addr));
  }

  /** Types `raw` into a cell, exactly as the learner would. */
  setRaw(addr: CellAddr, raw: string): void {
    if (!this.inBounds(addr)) throw new Error(`${toA1(addr)} is outside this ${this.cols}x${this.rows} sheet`);
    const key = toA1(addr);
    const previous = this.cells.get(key);
    let format = previous?.format;
    // What is typed can bring a number format with it: $4.50, 15%, and =TODAY() as a date.
    const implied = isFormulaText(raw) ? (STARTS_WITH_TODAY.test(raw) ? 'date' : undefined) : parseLiteral(raw).numFmt;
    if (implied && !format?.numFmt) format = { ...format, numFmt: implied };
    if (raw === '' && !format) this.cells.delete(key);
    else this.cells.set(key, { raw, format });
    this.cache.clear();
  }

  setInput(addr: CellAddr, value: CellInput): void {
    this.setRaw(addr, inputToRaw(value));
  }

  setFormat(target: RangeAddr, patch: CellFormat): void {
    for (const addr of cellsInRange(target)) {
      if (!this.inBounds(addr)) continue;
      const key = toA1(addr);
      const cell = this.cells.get(key);
      this.cells.set(key, { raw: cell?.raw ?? '', format: { ...cell?.format, ...patch } });
    }
  }

  /** Sets a cell's format to exactly `format`, replacing what was there. */
  replaceFormat(addr: CellAddr, format: CellFormat): void {
    if (!this.inBounds(addr)) return;
    const key = toA1(addr);
    const raw = this.cells.get(key)?.raw ?? '';
    const clean: CellFormat = {};
    if (format.bold) clean.bold = true;
    if (format.numFmt && format.numFmt !== 'general') clean.numFmt = format.numFmt;
    if (raw === '' && Object.keys(clean).length === 0) this.cells.delete(key);
    else this.cells.set(key, { raw, format: Object.keys(clean).length === 0 ? undefined : clean });
    this.cache.clear();
  }

  /**
   * Sorts the rows of `target` by the values in column `byCol`. Excel's order: numbers,
   * then text (ignoring case), then FALSE, TRUE and errors, with empty cells always last.
   * Whole rows move together, and each formula keeps pointing at its own row.
   */
  sortRows(target: RangeAddr, byCol: number, descending: boolean): void {
    const rank = (v: Scalar): number =>
      v === null ? 9 : typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : typeof v === 'boolean' ? 2 : 3;
    const order = (a: Scalar, b: Scalar): number => {
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      if (typeof a === 'number') return a - (b as number);
      if (typeof a === 'string') {
        const x = a.toUpperCase();
        const y = (b as string).toUpperCase();
        return x < y ? -1 : x > y ? 1 : 0;
      }
      if (typeof a === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0);
      return isError(a) && isError(b) ? 0 : 0;
    };
    const rows: { from: number; key: Scalar; cells: (CellData | undefined)[] }[] = [];
    for (let row = target.start.row; row <= target.end.row; row++) {
      const cells: (CellData | undefined)[] = [];
      for (let col = target.start.col; col <= target.end.col; col++) cells.push(this.cells.get(toA1({ col, row })));
      rows.push({ from: row, key: this.getValue({ col: byCol, row }), cells });
    }
    const sorted = rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        // Empty cells go last whichever way the sort runs.
        const blankA = a.row.key === null || a.row.key === '';
        const blankB = b.row.key === null || b.row.key === '';
        if (blankA !== blankB) return blankA ? 1 : -1;
        const by = order(a.row.key, b.row.key) * (descending ? -1 : 1);
        return by !== 0 ? by : a.index - b.index;
      })
      .map((entry) => entry.row);
    sorted.forEach((line, i) => {
      const row = target.start.row + i;
      line.cells.forEach((cell, c) => {
        const key = toA1({ col: target.start.col + c, row });
        if (!cell) this.cells.delete(key);
        else this.cells.set(key, { ...cell, raw: shiftFormula(cell.raw, 0, row - line.from) });
      });
    });
    this.cache.clear();
  }

  clear(target: RangeAddr): void {
    for (const addr of cellsInRange(target)) {
      if (this.inBounds(addr)) this.setRaw(addr, '');
    }
  }

  /** The parsed formula in a cell, or null if the cell isn't a readable formula. */
  getAst(addr: CellAddr): Node | null {
    const raw = this.getRaw(addr);
    if (!isFormulaText(raw)) return null;
    try {
      return parseFormula(raw);
    } catch {
      return null;
    }
  }

  getValue(addr: CellAddr): Scalar {
    const key = toA1(addr);
    if (this.cache.has(key)) return this.cache.get(key) as Scalar;
    const raw = this.cells.get(key)?.raw ?? '';
    let value: Scalar;
    if (!isFormulaText(raw)) {
      value = parseLiteral(raw).value;
    } else if (this.visiting.has(key)) {
      // Don't cache: the cells further up the chain decide what they show.
      return err('#REF!', CIRCULAR);
    } else {
      this.visiting.add(key);
      try {
        value = evaluate(parseFormula(raw), this.env);
      } catch (e) {
        if (!(e instanceof FormulaSyntaxError)) throw e;
        value = err('#ERROR!', e.message);
      } finally {
        this.visiting.delete(key);
      }
    }
    this.cache.set(key, value);
    return value;
  }

  /** The cell's value as full-precision text, with its number format applied. */
  getDisplay(addr: CellAddr): string {
    return formatScalar(this.getValue(addr), this.getFormat(addr).numFmt);
  }

  /** Works out what `raw` would show if it were typed into `addr`, without changing the sheet. */
  preview(addr: CellAddr, raw: string): Scalar {
    const trial = this.clone();
    trial.setRaw(addr, raw);
    return trial.getValue(addr);
  }

  /** Addresses of every cell that has content. */
  filled(): CellAddr[] {
    const out: CellAddr[] = [];
    for (const [key, cell] of this.cells) if (cell.raw !== '') out.push(a1(key));
    return out;
  }
}
