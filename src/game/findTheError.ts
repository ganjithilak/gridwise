import { shiftFormula, type CellInput, type SheetSpec } from '@/engine';

import { DAYS, listOf, shows, stockSheet, table, weekSheet, withCell } from './farmSheets';
import { int, pick, rng, shuffle, type Rng } from './random';

/**
 * Find the Error: a farm record with one thing wrong. The learner looks through it (tapping
 * a cell shows what is really in it, formula and all, in the formula bar), says which cell
 * is wrong, then chooses the correction. Feedback says why the mistake happened and how
 * the correction fixes it. Value slips come first; formula mistakes follow as formulas
 * are taught.
 */

const TYPE = 'xl.cell.type';
const ARITHMETIC = 'xl.formula.arithmetic';
const SUM_RANGE = 'xl.sum.range';
const AVERAGE = 'xl.average';
const MINMAX = 'xl.minmax';
const ABSOLUTE = 'xl.absolute';
const IF = 'xl.if';
const IFERROR = 'xl.iferror';

export interface ErrorPuzzle {
  skill: string;
  sheet: SheetSpec;
  /** What the learner is told before looking. */
  ask: string;
  /** A note to check the sheet against, such as the delivery docket. */
  note?: { title: string; lines: string[] };
  /** Cells that count as finding the problem. */
  wrong: string[];
  /** Said once it is found: what is wrong there. */
  problem: string;
  /** The cell the correction goes in (sometimes the formula the wrong cells were filled from). */
  fixCell: string;
  /** What could go in `fixCell`: the right correction among them. */
  fixes: string[];
  right: string;
  /** Said once it is corrected: why the correction works. */
  why: string;
  /** The sheet once corrected. */
  fixed: SheetSpec;
  /** Why a particular wrong correction fails, where the cell alone would not show it. */
  missWhy?: Record<string, string>;
}

/** Why a chosen correction is not the right one. */
export function fixMiss(p: ErrorPuzzle, chosen: string): string {
  const said = p.missWhy?.[chosen];
  if (said) return said;
  const current = p.sheet.cells?.[p.fixCell] ?? p.sheet.grid?.[Number(p.fixCell.replace(/^[A-Z]+/, '')) - 1]?.[p.fixCell.charCodeAt(0) - 65];
  if (String(current) === chosen) return `That is what ${p.fixCell} holds now, so nothing would change.`;
  return `With ${chosen}, ${p.fixCell} would show ${shows(p.sheet, p.fixCell, chosen)}. ${p.problem}`;
}

/** Puts `raw` in `cell`, and fills it down over `fill` when the cell was the top of a filled column. */
function apply(spec: SheetSpec, cell: string, raw: string, fill: string[] = []): SheetSpec {
  let out = withCell(spec, cell, raw);
  fill.forEach((target, i) => (out = withCell(out, target, shiftFormula(raw, 0, i + 1))));
  return out;
}

/** Ways a number gets mistyped: digits swapped, a zero added, a digit dropped. */
function typo(r: Rng, n: number): number {
  const s = String(n);
  const options: number[] = [];
  if (s.length >= 2 && s[0] !== s[1]) options.push(Number(s[1] + s[0] + s.slice(2)));
  options.push(n * 10);
  if (s.length >= 2) options.push(Number(s.slice(0, -1)));
  return pick(r, options.filter((x) => x !== n && x > 0));
}

type Maker = (r: Rng) => ErrorPuzzle;

const docket: Maker = (r) => {
  const { produce, spec } = stockSheet(r, 4);
  const row = int(r, 2, 5);
  const truth = spec.grid?.[row - 1][1] as number;
  const typed = typo(r, truth);
  const sheet = withCell(spec, `B${row}`, typed);
  let other = typo(r, typed);
  for (let i = 0; i < 4 && (other === truth || other === typed); i++) other = typo(r, truth);
  if (other === truth || other === typed) other = truth + 5;
  return {
    skill: TYPE,
    sheet,
    ask: 'The morning count is on the docket. One stock figure on the sheet does not match it. Find it.',
    note: { title: 'Stock count', lines: produce.map((p, i) => `${p}: ${spec.grid?.[i + 1][1]} kg`) },
    wrong: [`B${row}`],
    problem: `B${row} says ${typed}; the docket says ${truth} kg of ${produce[row - 2].toLowerCase()}.`,
    fixCell: `B${row}`,
    fixes: shuffle(r, [String(truth), String(typed), String(other)]),
    right: String(truth),
    why: `Selecting B${row} and typing ${truth} replaces the wrong figure: no need to delete it first.`,
    fixed: withCell(sheet, `B${row}`, truth),
  };
};

const shortTotal: Maker = (r) => {
  const { products, spec } = weekSheet(r, [pick(r, ['Carrots', 'Apples', 'Pears'])]);
  const sheet = withCell(withCell(spec, 'A7', 'Total'), 'B7', '=SUM(B2:B5)');
  return {
    skill: SUM_RANGE,
    sheet,
    ask: `The week’s ${products[0].toLowerCase()} total looks low. Find the cell with the problem.`,
    wrong: ['B7'],
    problem: 'B7 adds B2:B5, which stops at Thursday: Friday (B6) is left out.',
    fixCell: 'B7',
    fixes: shuffle(r, ['=SUM(B2:B6)', '=SUM(B2:B5)', '=SUM(B3:B6)']),
    right: '=SUM(B2:B6)',
    why: `B2:B6 runs from Monday to Friday, so all five days are added: ${listOf(sheet, 'B', 2, 6)}.`,
    fixed: withCell(sheet, 'B7', '=SUM(B2:B6)'),
  };
};

function valueSheet(r: Rng) {
  const { produce, spec } = stockSheet(r, 4);
  const header = [...(spec.grid?.[0] ?? []), 'Value'];
  const grid = spec.grid?.map((line, i) => (i === 0 ? header : [...line, `=B${i + 1}*C${i + 1}`])) as CellInput[][];
  return { produce, spec: { ...spec, cols: 4, grid, formats: { ...spec.formats, 'D2:D5': { numFmt: 'currency' as const } } } };
}

const wrongRow: Maker = (r) => {
  const { produce, spec } = valueSheet(r);
  const row = int(r, 2, 4);
  let sheet = withCell(spec, `D${row}`, `=B${row}*C${row + 1}`);
  // Make sure the slip shows: two neighbouring prices the same would hide it.
  if (spec.grid?.[row - 1][2] === spec.grid?.[row][2]) sheet = withCell(sheet, `C${row + 1}`, (spec.grid?.[row][2] as number) + 1);
  const right = `=B${row}*C${row}`;
  return {
    skill: ARITHMETIC,
    sheet,
    ask: 'One product’s stock value is wrong. Tap the values to see their formulas, and find it.',
    wrong: [`D${row}`],
    problem: `D${row} multiplies B${row} by C${row + 1}: the next product’s price, not the price of ${produce[row - 2].toLowerCase()}.`,
    fixCell: `D${row}`,
    fixes: shuffle(r, [right, `=B${row}*C${row + 1}`, `=B${row}+C${row}`]),
    right,
    why: `B${row} and C${row} are on the same row, so the stock is multiplied by its own price.`,
    fixed: withCell(sheet, `D${row}`, right),
  };
};

const wrongSign: Maker = (r) => {
  const { produce, spec } = valueSheet(r);
  const row = int(r, 2, 5);
  const sheet = withCell(spec, `D${row}`, `=B${row}+C${row}`);
  const right = `=B${row}*C${row}`;
  return {
    skill: ARITHMETIC,
    sheet,
    ask: 'One stock value is far too low. Find the cell with the problem.',
    wrong: [`D${row}`],
    problem: `D${row} adds the stock and the price (B${row}+C${row}) instead of multiplying them.`,
    fixCell: `D${row}`,
    fixes: shuffle(r, [right, `=B${row}+C${row}`, `=B${row}/C${row}`]),
    right,
    why: `Value is kilograms × price per kilogram, and * multiplies: ${produce[row - 2]} come to ${shows(sheet, `D${row}`, right)}.`,
    fixed: withCell(sheet, `D${row}`, right),
  };
};

const wrongAverage: Maker = (r) => {
  const { spec } = weekSheet(r, [pick(r, ['Tomatoes', 'Plums', 'Potatoes'])]);
  const sheet = withCell(withCell(spec, 'A7', 'Average'), 'B7', '=SUM(B2:B6)/4');
  return {
    skill: AVERAGE,
    sheet,
    ask: 'The daily average looks too high. Find the cell with the problem.',
    wrong: ['B7'],
    problem: `B7 divides the total of ${DAYS.length} days by 4.`,
    fixCell: 'B7',
    fixes: shuffle(r, ['=AVERAGE(B2:B6)', '=SUM(B2:B6)/4', '=SUM(B2:B6)']),
    right: '=AVERAGE(B2:B6)',
    why: 'AVERAGE counts the days itself, so it always divides by the right number, even if a day is added.',
    fixed: withCell(sheet, 'B7', '=AVERAGE(B2:B6)'),
  };
};

const wrongMax: Maker = (r) => {
  const { spec } = weekSheet(r, [pick(r, ['Apples', 'Plums', 'Carrots'])]);
  const sheet = withCell(withCell(spec, 'A7', 'Best day'), 'B7', '=MIN(B2:B6)');
  return {
    skill: MINMAX,
    sheet,
    ask: 'The best day’s sales cannot be right: other days sold more. Find the problem.',
    wrong: ['B7'],
    problem: 'B7 uses MIN, which finds the smallest day: the quietest, not the best.',
    fixCell: 'B7',
    fixes: shuffle(r, ['=MAX(B2:B6)', '=MIN(B2:B6)', '=SUM(B2:B6)']),
    right: '=MAX(B2:B6)',
    why: 'MAX finds the largest number in B2:B6: the best day.',
    fixed: withCell(sheet, 'B7', '=MAX(B2:B6)'),
  };
};

const unlocked: Maker = (r) => {
  const { spec } = stockSheet(r, 4);
  const price = pick(r, [3, 4, 5]);
  const grid = spec.grid?.map((line, i) => (i === 0 ? ['Produce', 'Sold (kg)', 'Takings'] : [line[0], line[1], `=B${i + 1}*E${i}`])) as CellInput[][];
  const sheet = withCell(withCell({ ...spec, grid }, 'D1', 'Price'), 'E1', price);
  const right = '=B2*$E$1';
  return {
    skill: ABSOLUTE,
    sheet,
    ask: 'C2 was filled down, and the takings below it went wrong. Find a cell that is wrong.',
    wrong: ['C3', 'C4', 'C5'],
    problem: 'C3 multiplies by E2, which is empty. Filling down moved E1 to E2, E3 and E4.',
    fixCell: 'C2',
    fixes: shuffle(r, [right, '=B2*E1', '=$B$2*E1']),
    right,
    why: '$E$1 is locked, so filling down moves B2 to B3 and B4 but keeps every row on the price in E1.',
    fixed: apply(sheet, 'C2', right, ['C3', 'C4', 'C5']),
    missWhy: {
      '=B2*E1': 'That is the formula already in C2. Filled down, E1 would still slide to E2, E3 and E4.',
      '=$B$2*E1': 'That locks B2 instead, so every row would use the first product’s sales, and E1 would still slide.',
    },
  };
};

const divZero: Maker = (r) => {
  const produce = pick(r, ['Apples', 'Pears', 'Carrots']);
  const rows = [0, 1, 2].map((i) => [`${produce} crate ${i + 1}`, int(r, 4, 12) * 10, i === 1 ? 0 : int(r, 2, 5), `=IFERROR(B${i + 2}/C${i + 2},0)`] as CellInput[]);
  rows[1][3] = '=B3/C3';
  const sheet = table(['Delivery', 'Takings', 'Trips', 'Per trip'], rows);
  const right = '=IFERROR(B3/C3,0)';
  return {
    skill: IFERROR,
    sheet,
    ask: 'One cell shows an error value. Find it.',
    wrong: ['D3'],
    problem: 'D3 divides by C3, which is 0, so it shows #DIV/0!.',
    fixCell: 'D3',
    fixes: shuffle(r, [right, '=B3/C3', '=IFERROR(B3/C2,0)']),
    right,
    why: 'IFERROR tries B3/C3 and shows 0 instead when it fails, as the rows around it already do.',
    fixed: withCell(sheet, 'D3', right),
  };
};

const misspelt: Maker = (r) => {
  const { spec } = weekSheet(r, [pick(r, ['Carrots', 'Tomatoes'])]);
  const sheet = withCell(withCell(spec, 'A7', 'Total'), 'B7', '=SUMM(B2:B6)');
  return {
    skill: IFERROR,
    sheet,
    ask: 'The total shows an error value. Find the cell with the problem.',
    wrong: ['B7'],
    problem: 'B7 shows #NAME?: SUMM is not a function the spreadsheet knows.',
    fixCell: 'B7',
    fixes: shuffle(r, ['=SUM(B2:B6)', '=SUMM(B2:B6)', '=SUM(B2:B5)']),
    right: '=SUM(B2:B6)',
    why: 'With the name spelled correctly, SUM adds Monday to Friday.',
    fixed: withCell(sheet, 'B7', '=SUM(B2:B6)'),
  };
};

const backwardsIf: Maker = (r) => {
  const level = 20;
  const { spec } = stockSheet(r, 4);
  const grid = spec.grid?.map((line, i) => (i === 0 ? [line[0], line[1], 'Order?'] : [line[0], line[1], `=IF(B${i + 1}<${level},"Reorder","OK")`])) as CellInput[][];
  const row = int(r, 2, 5);
  // The faulty row has plenty in stock, so its "Reorder" is plainly wrong.
  grid[row - 1][1] = int(r, 8, 20) * 5;
  grid[row - 1][2] = `=IF(B${row}>${level},"Reorder","OK")`;
  const sheet: SheetSpec = { ...spec, cols: 3, grid, formats: {} };
  const right = `=IF(B${row}<${level},"Reorder","OK")`;
  return {
    skill: IF,
    sheet,
    ask: `Anything under ${level} kg is reordered. One row asks for a reorder it does not need. Find it.`,
    wrong: [`C${row}`],
    problem: `C${row} tests B${row}>${level}, so it says “Reorder” when there is plenty.`,
    fixCell: `C${row}`,
    fixes: shuffle(r, [right, `=IF(B${row}>${level},"Reorder","OK")`, `=IF(B${row}<${level},"OK","Reorder")`]),
    right,
    why: `B${row}<${level} is TRUE only when stock is low, and IF gives its first answer, “Reorder”, only then.`,
    fixed: withCell(sheet, `C${row}`, right),
  };
};

const makers: Record<string, Maker[]> = {
  [TYPE]: [docket],
  [ARITHMETIC]: [wrongRow, wrongSign],
  [SUM_RANGE]: [shortTotal],
  [AVERAGE]: [wrongAverage],
  [MINMAX]: [wrongMax],
  [ABSOLUTE]: [unlocked],
  [IF]: [backwardsIf],
  [IFERROR]: [divZero, misspelt],
};

export const ERROR_SKILLS = Object.keys(makers);

/** Puzzles in one go. */
export const ERROR_LENGTH = 5;

export function errorRound(taught: ReadonlySet<string>, newest: readonly string[], seed: number): ErrorPuzzle[] {
  const r = rng(seed);
  const skills = ERROR_SKILLS.filter((s) => taught.has(s));
  if (skills.length === 0) return [];
  const fresh = newest.filter((s) => skills.includes(s));
  const out: ErrorPuzzle[] = [];
  for (let i = 0; i < ERROR_LENGTH; i++) {
    const skill = i % 2 === 0 && fresh.length > 0 ? fresh[(i / 2) % fresh.length] : pick(r, skills);
    out.push(pick(r, makers[skill])(r));
  }
  return shuffle(r, out);
}
