import { a1, formatScalar, Sheet, type CellInput, type SheetSpec } from '@/engine';

import { int, pick, sample, type Rng } from './random';

/**
 * Golden Apples Farm records for the sheet games, made fresh each question so the numbers
 * never repeat the lessons' own. Produce is the farm stall's: what the lessons sell and
 * what the stall shows.
 */
export const PRODUCE = ['Carrots', 'Potatoes', 'Tomatoes', 'Apples', 'Pears', 'Plums'] as const;
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
export const CUSTOMERS = ['River Cafe', 'Hill Market', 'Town Grocer'] as const;
const PRICES = [2.5, 3, 3.5, 4, 4.5, 6] as const;

/** A sheet with a heading row: `rows` are the data under it. */
export function table(header: CellInput[], rows: CellInput[][], extra: Partial<SheetSpec> = {}): SheetSpec {
  const cols = Math.max(header.length, ...rows.map((r) => r.length));
  return { cols, rows: rows.length + 1, grid: [header, ...rows], ...extra };
}

/** Stock and prices for a few products. */
export function stockSheet(r: Rng, n = int(r, 3, 5)) {
  const produce = sample(r, PRODUCE, n);
  const rows = produce.map((p) => [p, int(r, 2, 40) * 5, pick(r, PRICES)] as CellInput[]);
  return { produce, spec: table(['Produce', 'Stock (kg)', 'Price per kg'], rows, { formats: { [`C2:C${n + 1}`]: { numFmt: 'currency' } } }) };
}

/** A week of stall sales, in kilograms, for one or two products. */
export function weekSheet(r: Rng, products = sample(r, PRODUCE, 2)) {
  const rows = DAYS.map((d) => [d, ...products.map(() => int(r, 4, 40))] as CellInput[]);
  return { products, spec: table(['Day', ...products.map((p) => `${p} (kg)`)], rows) };
}

/** Wholesale orders: who ordered what, and how many kilograms. */
export function orderSheet(r: Rng, n = 6) {
  const produce = sample(r, PRODUCE, 3);
  const rows = Array.from({ length: n }, () => [pick(r, CUSTOMERS), pick(r, produce), int(r, 2, 12) * 5] as CellInput[]);
  // Every product turns up at least once, so a question about one always has an answer.
  produce.forEach((p, i) => (rows[i][1] = p));
  return { produce, spec: table(['Customer', 'Produce', 'Kg'], rows) };
}

/** What `raw` shows in `cell` on this sheet: the engine is the judge, never a hand-worked answer. */
export function shows(spec: SheetSpec, cell: string, raw: string): string {
  const at = a1(cell);
  const sheet = Sheet.fromSpec({ ...spec, cols: Math.max(spec.cols, at.col + 1), rows: Math.max(spec.rows, at.row + 1) });
  const value = sheet.preview(a1(cell), raw);
  return formatScalar(value, sheet.getFormat(a1(cell)).numFmt);
}

/** The value a cell holds, as a number, for working out answers to compare against. */
export function numberAt(spec: SheetSpec, cell: string): number {
  const v = Sheet.fromSpec(spec).getValue(a1(cell));
  return typeof v === 'number' ? v : NaN;
}

/** A sheet with one more cell filled in. */
export const withCell = (spec: SheetSpec, cell: string, value: CellInput, extraRow = false): SheetSpec => {
  const at = a1(cell);
  return {
    ...spec,
    cols: Math.max(spec.cols, at.col + 1),
    rows: Math.max(spec.rows, at.row + 1 + (extraRow ? 1 : 0)),
    cells: { ...(spec.cells ?? {}), [cell]: value },
  };
};

/** "12 + 8 + 15": the numbers in a column, for explanations. */
export function listOf(spec: SheetSpec, col: string, from: number, to: number, joiner = ' + '): string {
  const out: string[] = [];
  const sheet = Sheet.fromSpec(spec);
  for (let row = from; row <= to; row++) out.push(sheet.getDisplay(a1(`${col}${row}`)));
  return out.join(joiner);
}
