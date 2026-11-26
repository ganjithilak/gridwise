/**
 * Where every row and column of the sheet goes on screen. Pure arithmetic, so it can be
 * tested without drawing anything.
 *
 * A real spreadsheet never stops at the last row of data: the grid carries on past it.
 * The sheet is laid out the same way. Columns are as wide as what they hold (as if the
 * learner had double-clicked each column edge in Excel), and any space left over is
 * filled with the empty rows and columns that follow. Those are drawn quieter and do
 * not respond to taps: the exercise's sheet ends where its data ends.
 */

export const COL_HEADER_H = 24;
export const ROW_HEADER_W = 32;
export const MIN_ROW_H = 28;
export const MAX_ROW_H = 44;
/** Narrowest a column with data is drawn: room for "$0.00" at the small size. */
export const MIN_COL_W = 52;
/** Widest a column grows to fit its text before the text is clipped. */
export const MAX_COL_W = 220;
/** Columns may grow this much past their fitted width to use spare room, before empty columns appear. */
const MAX_GROW = 1.35;
/** An empty column after the data. */
export const EMPTY_COL_W = 72;
/** Columns lettered A to Z only: no sheet in the course is wider. */
const MAX_COLS = 26;
const CELL_PADDING = 14;
/** An average character is about this share of the font size wide. Counted generously. */
const CHAR_W = 0.6;

export interface SheetLayout {
  /** Left edge of each column, measured from the left of the first column (after the row headers). */
  colX: number[];
  colW: number[];
  /** Columns that hold the exercise's data. The rest are the empty ones after it. */
  dataCols: number;
  rowH: number;
  dataRows: number;
  /** Rows drawn, including the empty ones after the data; the last may be cut off. */
  rows: number;
  fontSize: number;
}

/** The width a column needs for its longest text, at this font size. */
export function fittedWidth(texts: readonly string[], fontSize: number): number {
  const longest = texts.reduce((n, t) => Math.max(n, t.length), 0);
  return Math.max(MIN_COL_W, Math.min(MAX_COL_W, Math.ceil(longest * fontSize * CHAR_W + CELL_PADDING)));
}

/**
 * Lays out a sheet in a box of `width` by `height`. `columns` holds each data column's
 * texts (its heading and values as they are shown), used to size it.
 */
export function layoutSheet(width: number, height: number, columns: readonly (readonly string[])[], dataRows: number): SheetLayout {
  const rowH = Math.max(MIN_ROW_H, Math.min(MAX_ROW_H, Math.floor((height - COL_HEADER_H) / Math.max(1, dataRows))));
  const fontSize = rowH >= 40 ? 15 : 13;
  const room = Math.max(0, width - ROW_HEADER_W);

  const fitted = columns.map((texts) => fittedWidth(texts, fontSize));
  const total = fitted.reduce((a, b) => a + b, 0);
  // Too wide: everything shrinks in proportion and long text is clipped, as before.
  // Room to spare: columns relax a little, then empty columns fill the rest.
  const scale = total > room ? room / total : Math.min(MAX_GROW, room / Math.max(1, total));
  const colW = fitted.map((w) => w * scale);

  let used = colW.reduce((a, b) => a + b, 0);
  while (used < room - 1 && colW.length < MAX_COLS) {
    colW.push(EMPTY_COL_W);
    used += EMPTY_COL_W;
  }
  const colX: number[] = [];
  let x = 0;
  for (const w of colW) {
    colX.push(x);
    x += w;
  }

  const rows = Math.max(dataRows, Math.ceil((height - COL_HEADER_H) / rowH));
  return { colX, colW, dataCols: columns.length, rowH, dataRows, rows, fontSize };
}

/** Which data column a distance from the first column's left edge falls in, kept inside the data. */
export function columnAt(layout: SheetLayout, x: number): number {
  let col = 0;
  for (let i = 0; i < layout.dataCols; i++) if (x >= layout.colX[i]) col = i;
  return col;
}

/** Which data row a distance below the column headers falls in, kept inside the data. */
export function rowAt(layout: SheetLayout, y: number): number {
  return Math.max(0, Math.min(layout.dataRows - 1, Math.floor(y / layout.rowH)));
}
