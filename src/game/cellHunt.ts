import { colToLetters, parseRange, rangeToA1, type RangeAddr, type SheetSpec } from '@/engine';

import { int, rng, shuffle, type Rng } from './random';
import { stockSheet, table, PRODUCE } from './farmSheets';

/**
 * Cell Hunt: find cells, rows, columns and blocks on a real sheet. Tasks come only from
 * what has been taught: addresses first, then whole rows and columns (with the shortcut
 * the lesson taught), then blocks, then getting there with the arrow keys alone, and
 * naming a block that is already lit. Sheets change size and shape from task to task, and
 * the same address is never asked twice in a go.
 */

const ADDRESS = 'xl.cell.address';
const COLUMN = 'xl.select.column';
const ROW = 'xl.select.row';
const MOVE = 'xl.keys.move';
const EXTEND = 'xl.select.extend';
const RANGE = 'xl.select.range';

export type HuntKind = 'cell' | 'column' | 'row' | 'range' | 'arrows' | 'name';

export interface HuntTask {
  kind: HuntKind;
  skill: string;
  sheet: SheetSpec;
  /** The answer: a cell ("C4") or a block ("B1:B5"). */
  target: string;
  /** What the learner is asked. */
  ask: string;
  /** The cell selected when the task opens (always one cell; a block to name is lit after). */
  from: string;
  /** For `name`: the addresses to choose from, the right one among them. */
  options?: string[];
  /** A short line under the task saying how, while the game is new. */
  how?: string;
}

/** Tasks in one go. */
export const HUNT_LENGTH = 8;

const kindsFor = (taught: ReadonlySet<string>, tier: number): { kind: HuntKind; skill: string }[] => {
  const out: { kind: HuntKind; skill: string }[] = [];
  if (taught.has(ADDRESS)) out.push({ kind: 'cell', skill: ADDRESS }, { kind: 'cell', skill: ADDRESS });
  if (taught.has(COLUMN)) out.push({ kind: 'column', skill: COLUMN });
  if (taught.has(ROW)) out.push({ kind: 'row', skill: ROW });
  if (taught.has(ADDRESS) && taught.has(COLUMN) && tier >= 2) out.push({ kind: 'name', skill: COLUMN });
  if (taught.has(EXTEND) || taught.has(RANGE)) out.push({ kind: 'range', skill: taught.has(RANGE) ? RANGE : EXTEND });
  if (taught.has(MOVE)) out.push({ kind: 'arrows', skill: MOVE });
  return out;
};

/** A sheet of farm stock, or an empty one, in a shape that changes from task to task. */
function sheetFor(r: Rng): SheetSpec {
  if (r() < 0.6) return stockSheet(r, int(r, 4, 6)).spec;
  const cols = int(r, 4, 6);
  const rows = int(r, 5, 7);
  // A plain record with just the products down column A: most of the grid is open.
  const names = shuffle(r, PRODUCE).slice(0, rows - 1);
  return table(['Produce', ...Array.from({ length: cols - 1 }, () => null)], names.map((n) => [n]));
}

const cellIn = (r: Rng, s: SheetSpec, minRow = 1) => `${colToLetters(int(r, 0, s.cols - 1))}${int(r, minRow, s.rows)}`;

function blockIn(r: Rng, s: SheetSpec): string {
  const c0 = int(r, 0, s.cols - 2);
  const r0 = int(r, 1, s.rows - 1);
  const c1 = int(r, c0 + 1, Math.min(s.cols - 1, c0 + 2));
  const r1 = int(r, r0 + 1, Math.min(s.rows, r0 + 3));
  return `${colToLetters(c0)}${r0}:${colToLetters(c1)}${r1}`;
}

/** Wrong answers for "name the block": the same block shifted, or with its corners muddled. */
function nearMisses(r: Rng, target: string, s: SheetSpec): string[] {
  const t = parseRange(target) as RangeAddr;
  const shift = (dc: number, dr: number): string | null => {
    const start = { col: t.start.col + dc, row: t.start.row + dr };
    const end = { col: t.end.col + dc, row: t.end.row + dr };
    if (start.col < 0 || start.row < 0 || end.col >= s.cols || end.row >= s.rows) return null;
    return rangeToA1({ start, end });
  };
  const swapped = `${colToLetters(t.start.col)}${t.end.row + 1}:${colToLetters(t.end.col)}${t.start.row + 1}`;
  const all = [shift(1, 0), shift(0, 1), shift(-1, 0), shift(0, -1), swapped].filter((x): x is string => !!x && x !== target);
  return shuffle(r, [...new Set(all)]).slice(0, 2);
}

export function huntRound(taught: ReadonlySet<string>, tier: 1 | 2 | 3, seed: number): HuntTask[] {
  const r = rng(seed);
  const kinds = kindsFor(taught, tier);
  if (kinds.length === 0) return [];
  const asked = new Set<string>();
  const out: HuntTask[] = [];
  // Every kind taught gets a turn before any repeats, newest kinds last so the go ends on them.
  const order: { kind: HuntKind; skill: string }[] = [];
  while (order.length < HUNT_LENGTH) order.push(...shuffle(r, kinds));
  for (const { kind, skill } of order.slice(0, HUNT_LENGTH)) {
    const sheet = sheetFor(r);
    let task: HuntTask | null = null;
    for (let tries = 0; tries < 10 && !task; tries++) {
      task = make(r, kind, skill, sheet, tier);
      if (task && asked.has(task.target)) task = null;
    }
    if (!task) continue;
    asked.add(task.target);
    out.push(task);
  }
  return out;
}

function make(r: Rng, kind: HuntKind, skill: string, sheet: SheetSpec, tier: number): HuntTask | null {
  const help = tier === 1;
  switch (kind) {
    case 'cell': {
      const target = cellIn(r, sheet);
      return { kind, skill, sheet, target, from: awayFrom(target, sheet), ask: `Select cell ${target}.`, how: help ? 'Find the column letter along the top, then the row number down the side.' : undefined };
    }
    case 'column': {
      const col = colToLetters(int(r, 0, sheet.cols - 1));
      return { kind, skill, sheet, target: `${col}1:${col}${sheet.rows}`, from: `A${int(r, 2, sheet.rows)}`, ask: `Select the whole of column ${col}.`, how: help ? 'Select a cell in the column, then Ctrl + Space.' : undefined };
    }
    case 'row': {
      const row = int(r, 2, sheet.rows);
      return { kind, skill, sheet, target: `A${row}:${colToLetters(sheet.cols - 1)}${row}`, from: 'A1', ask: `Select the whole of row ${row}.`, how: help ? 'Select a cell in the row, then Shift + Space.' : undefined };
    }
    case 'range': {
      const target = blockIn(r, sheet);
      return { kind, skill, sheet, target, from: awayFrom(target.split(':')[0], sheet), ask: `Select the range ${target}.`, how: help ? 'Select its top-left cell, then hold Shift and use the arrows (or drag).' : undefined };
    }
    case 'arrows': {
      const from = cellIn(r, sheet);
      const target = cellIn(r, sheet);
      if (from === target) return null;
      return { kind, skill, sheet, target, from, ask: `Using the arrow keys only, go from ${from} to ${target}.`, how: help ? 'Count the columns across and the rows down.' : undefined };
    }
    case 'name': {
      const block = r() < 0.4 ? cellIn(r, sheet) : blockIn(r, sheet);
      const single = !block.includes(':');
      const options = single ? shuffle(r, [block, ...wrongCells(r, block, sheet)]) : shuffle(r, [block, ...nearMisses(r, block, sheet)]);
      if (options.length < 3) return null;
      return { kind, skill: single ? ADDRESS : skill, sheet, target: block, from: block.split(':')[0], options, ask: single ? 'Which cell is selected?' : 'Which range is selected?' };
    }
  }
}

/** Where the selection starts: A1, unless that is the answer, when it is the far corner instead. */
const awayFrom = (cell: string, s: SheetSpec): string => (cell === 'A1' ? `${colToLetters(s.cols - 1)}${s.rows}` : 'A1');

function wrongCells(r: Rng, cell: string, s: SheetSpec): string[] {
  const m = /^([A-Z]+)(\d+)$/.exec(cell) as RegExpExecArray;
  const col = m[1];
  const row = Number(m[2]);
  const letters = (d: number) => colToLetters(Math.max(0, Math.min(s.cols - 1, col.charCodeAt(0) - 65 + d)));
  const near = [`${letters(1)}${row}`, `${col}${Math.min(s.rows, row + 1)}`, `${letters(-1)}${row}`, `${col}${Math.max(1, row - 1)}`, `${row <= 9 ? String.fromCharCode(64 + row) : col}${col.charCodeAt(0) - 64}`];
  const fits = (x: string) => {
    const m2 = /^([A-Z])([1-9]\d*)$/.exec(x);
    return !!m2 && m2[1].charCodeAt(0) - 65 < s.cols && Number(m2[2]) <= s.rows;
  };
  return shuffle(r, [...new Set(near)].filter((x) => x !== cell && fits(x))).slice(0, 2);
}

const letterOf = (col: number) => colToLetters(col);

/**
 * What to say about a wrong selection: which part is right, and which to look at again,
 * in the brief's own style ("You're in the correct column. Check the row number.").
 */
export function huntFeedback(task: HuntTask, got: RangeAddr): string {
  const t = parseRange(task.target) as RangeAddr;
  const single = (x: RangeAddr) => x.start.col === x.end.col && x.start.row === x.end.row;
  const gotText = rangeToA1(got);
  if (single(t)) {
    if (!single(got)) return `That selects ${gotText}. Just the one cell is needed.`;
    const colRight = got.start.col === t.start.col;
    const rowRight = got.start.row === t.start.row;
    if (colRight) return `You’re in the correct column. Check the row number: ${t.start.row + 1} counts down the side.`;
    if (rowRight) return `You’re in the correct row. Check the column letter: ${letterOf(t.start.col)} along the top.`;
    return `That’s ${gotText}. Column first (${letterOf(t.start.col)}, along the top), then the row (${t.start.row + 1}, down the side).`;
  }
  if (task.kind === 'column') {
    if (got.start.col === t.start.col && got.end.col === t.end.col) return `Right column. Select all of it: from row 1 to the last row.`;
    return `That’s ${gotText}. Column ${letterOf(t.start.col)} is the one under the letter ${letterOf(t.start.col)}.`;
  }
  if (task.kind === 'row') {
    if (got.start.row === t.start.row && got.end.row === t.end.row) return `Right row. Select all of it, from column A across.`;
    return `That’s ${gotText}. Row ${t.start.row + 1} is beside the number ${t.start.row + 1}.`;
  }
  const startRight = got.start.col === t.start.col && got.start.row === t.start.row;
  if (startRight) return `It starts at the right cell. It should end at ${letterOf(t.end.col)}${t.end.row + 1}, not ${letterOf(got.end.col)}${got.end.row + 1}.`;
  return `That’s ${gotText}. ${task.target} starts at its top-left corner, ${letterOf(t.start.col)}${t.start.row + 1}.`;
}

/** Said when a task is answered right, naming the idea rather than just praising. */
export function huntRight(task: HuntTask): string {
  switch (task.kind) {
    case 'cell':
    case 'arrows':
      return `${task.target}: column ${task.target.replace(/\d+/, '')}, row ${task.target.replace(/[A-Z]+/, '')}.`;
    case 'column':
      return `Column ${task.target.replace(/\d.*$/, '')} is ${task.target}.`;
    case 'row':
      return `Row ${task.target.replace(/^[A-Z]+/, '').replace(/:.*$/, '')} is ${task.target}.`;
    case 'range':
      return `${task.target}: named by its top-left and bottom-right corners.`;
    case 'name':
      return task.target.includes(':') ? `${task.target}: top-left corner, a colon, bottom-right corner.` : `${task.target}: the column letter, then the row number.`;
  }
}

