import { shiftFormula, type CellInput, type SheetSpec } from '@/engine';

import { listOf, numberAt, orderSheet, shows, stockSheet, table, weekSheet, withCell } from './farmSheets';
import { int, pick, rng, shuffle, type Rng } from './random';

/**
 * Predict the Result: a formula sits in a cell, and the learner says what it will show
 * before it is worked out. The wrong options are the mistakes people really make (the
 * wrong function, a range read short, multiplying last), so each one teaches. The right
 * answer always comes from the engine.
 */

const ARITHMETIC = 'xl.formula.arithmetic';
const SUM_RANGE = 'xl.sum.range';
const AVERAGE = 'xl.average';
const MINMAX = 'xl.minmax';
const COUNT = 'xl.count';
const ABSOLUTE = 'xl.absolute';
const COMPARE = 'xl.compare';
const IF = 'xl.if';
const COUNTIF = 'xl.countif';
const SUMIF = 'xl.sumif';
const IFERROR = 'xl.iferror';

export interface PredictQuestion {
  skill: string;
  sheet: SheetSpec;
  cell: string;
  formula: string;
  /** What the learner is told about the formula, when the sheet alone is not enough. */
  context?: string;
  options: string[];
  right: string;
  /** Why it shows what it shows, worked through. */
  why: string;
}

/** Up to three different options, the right one among them. */
function choices(r: Rng, right: string, wrong: (string | number)[]): string[] {
  const out = [right];
  for (const w of wrong) {
    const s = String(w);
    if (!out.includes(s) && s !== 'NaN') out.push(s);
    if (out.length === 3) break;
  }
  // Too few different mistakes: near numbers, which still test reading the range.
  const n = Number(right);
  for (let d = 1; out.length < 3 && Number.isFinite(n); d++) for (const x of [n + d, n - d]) if (out.length < 3 && x >= 0 && !out.includes(String(x))) out.push(String(x));
  return shuffle(r, out);
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);

type Maker = (r: Rng) => PredictQuestion;

const ask = (sheet: SheetSpec, cell: string, formula: string) => ({ sheet: withCell(sheet, cell, null), cell, formula, right: shows(sheet, cell, formula) });

const makers: Record<string, Maker[]> = {
  [ARITHMETIC]: [
    (r) => {
      const { spec } = weekSheet(r, ['Carrots']);
      const k = int(r, 2, 4);
      const formula = `=B2+B3*${k}`;
      const q = ask(withCell(spec, 'A7', 'Result'), 'B7', formula);
      const b2 = numberAt(spec, 'B2');
      const b3 = numberAt(spec, 'B3');
      return {
        skill: ARITHMETIC, ...q,
        options: choices(r, q.right, [(b2 + b3) * k, b2 * k + b3, b2 + b3]),
        why: `Multiplying comes first: B3 × ${k} = ${b3 * k}, then B2 is added: ${b2} + ${b3 * k} = ${q.right}.`,
      };
    },
    (r) => {
      const { spec } = stockSheet(r, 4);
      const row = int(r, 2, 5);
      const formula = `=B${row}*C${row}`;
      const q = ask(spec, `D${row}`, formula);
      const b = numberAt(spec, `B${row}`);
      const c = numberAt(spec, `C${row}`);
      return {
        skill: ARITHMETIC, ...q,
        options: choices(r, q.right, [fmt(b + c), fmt(b * numberAt(spec, `C${row === 5 ? 4 : row + 1}`)), fmt(b)]),
        why: `* multiplies: ${b} kg × ${c} per kg = ${q.right}.`,
      };
    },
  ],
  [SUM_RANGE]: [
    (r) => {
      const { spec } = weekSheet(r, ['Apples']);
      const end = int(r, 4, 6);
      const formula = `=SUM(B2:B${end})`;
      const q = ask(withCell(spec, 'A7', 'Total'), 'B7', formula);
      const all = [2, 3, 4, 5, 6].reduce((t, i) => t + numberAt(spec, `B${i}`), 0);
      const part = [2, 3, 4, 5, 6].slice(0, end - 2).reduce((t, i) => t + numberAt(spec, `B${i}`), 0);
      return {
        skill: SUM_RANGE, ...q,
        options: choices(r, q.right, [end === 6 ? part : all, fmt(Number(q.right) / (end - 1)), Number(q.right) + numberAt(spec, 'B2')]),
        why: `B2:B${end} is ${end - 1} days: ${listOf(spec, 'B', 2, end)} = ${q.right}.`,
      };
    },
  ],
  [AVERAGE]: [
    (r) => {
      const { spec } = weekSheet(r, ['Tomatoes']);
      const formula = '=AVERAGE(B2:B6)';
      const q = ask(withCell(spec, 'A7', 'Average'), 'B7', formula);
      const total = [2, 3, 4, 5, 6].reduce((t, i) => t + numberAt(spec, `B${i}`), 0);
      return {
        skill: AVERAGE, ...q,
        options: choices(r, q.right, [total, fmt(total / 4), numberAt(spec, 'B4')]),
        why: `AVERAGE adds the five days (${total}) and divides by 5: ${q.right}.`,
      };
    },
  ],
  [MINMAX]: [
    (r) => {
      const best = r() < 0.5;
      const { spec } = weekSheet(r, ['Pears']);
      const formula = best ? '=MAX(B2:B6)' : '=MIN(B2:B6)';
      const q = ask(withCell(spec, 'A7', best ? 'Best' : 'Lowest'), 'B7', formula);
      const values = [2, 3, 4, 5, 6].map((i) => numberAt(spec, `B${i}`));
      const other = best ? Math.min(...values) : Math.max(...values);
      return {
        skill: MINMAX, ...q,
        options: choices(r, q.right, [other, values[4], values[0]]),
        why: `${best ? 'MAX' : 'MIN'} returns the ${best ? 'largest' : 'smallest'} number in B2:B6: ${q.right}.`,
      };
    },
  ],
  [COUNT]: [
    (r) => {
      const { spec } = weekSheet(r, ['Apples']);
      const closed = int(r, 2, 6);
      const base = withCell(withCell(spec, `B${closed}`, 'Closed'), 'A7', 'Days');
      const formula = '=COUNT(B2:B6)';
      const q = ask(base, 'B7', formula);
      return {
        skill: COUNT, ...q,
        options: choices(r, q.right, [5, 3, 6]),
        why: `COUNT counts cells holding numbers. “Closed” in B${closed} is text, so it counts 4 of the 5.`,
      };
    },
  ],
  [ABSOLUTE]: [
    (r) => {
      const { spec } = stockSheet(r, 4);
      const price = pick(r, [3, 4, 5]);
      const grid = spec.grid?.map((line, i) => (i === 0 ? ['Produce', 'Sold (kg)', 'Takings'] : [line[0], line[1], i === 1 ? '=B2*$E$1' : null])) as CellInput[][];
      const sheet = withCell(withCell({ ...spec, grid, formats: {} }, 'D1', 'Price'), 'E1', price);
      const formula = shiftFormula('=B2*$E$1', 0, 2);
      const q = ask(sheet, 'C4', formula);
      const b4 = numberAt(sheet, 'B4');
      return {
        skill: ABSOLUTE, ...q,
        context: 'C2 holds =B2*$E$1, and it was filled down to C4.',
        options: choices(r, q.right, [0, fmt(numberAt(sheet, 'B2') * price), b4]),
        why: `Filled down two rows, B2 becomes B4 but $E$1 stays: ${b4} × ${price} = ${q.right}.`,
      };
    },
  ],
  [COMPARE]: [
    (r) => {
      const { produce, spec } = stockSheet(r, 4);
      const row = int(r, 2, 5);
      const b = numberAt(spec, `B${row}`);
      const target = pick(r, [b - 5, b, b + 5].filter((x) => x > 0));
      const formula = `=B${row}>=${target}`;
      const q = ask(spec, `D${row}`, formula);
      return {
        skill: COMPARE, ...q,
        options: choices(r, q.right, [q.right === 'TRUE' ? 'FALSE' : 'TRUE', b]),
        why: `B${row} is ${b} kg of ${produce[row - 2].toLowerCase()}. ${b} is ${b >= target ? '' : 'not '}at least ${target}, so it shows ${q.right}.`,
      };
    },
  ],
  [IF]: [
    (r) => {
      const { spec } = stockSheet(r, 4);
      const row = int(r, 2, 5);
      const b = numberAt(spec, `B${row}`);
      const level = pick(r, [20, 40, 60, 100]);
      const formula = `=IF(B${row}<${level},"Reorder","OK")`;
      const q = ask(spec, `D${row}`, formula);
      return {
        skill: IF, ...q,
        options: choices(r, q.right, [q.right === 'Reorder' ? 'OK' : 'Reorder', 'TRUE']),
        why: `B${row} is ${b}. ${b} < ${level} is ${b < level ? 'TRUE' : 'FALSE'}, so IF gives its ${b < level ? 'first' : 'second'} answer: ${q.right}.`,
      };
    },
  ],
  [COUNTIF]: [
    (r) => {
      const { produce, spec } = orderSheet(r);
      const what = pick(r, produce);
      const formula = `=COUNTIF(B2:B7,"${what}")`;
      const q = ask(withCell(spec, 'D1', 'Result'), 'D2', formula);
      const n = Number(q.right);
      return {
        skill: COUNTIF, ...q,
        options: choices(r, q.right, [6, n + 1, n - 1 > 0 ? n - 1 : n + 2]),
        why: `COUNTIF counts the cells in B2:B7 that say “${what}”: ${n} of the 6 orders.`,
      };
    },
  ],
  [SUMIF]: [
    (r) => {
      const { produce, spec } = orderSheet(r);
      const what = pick(r, produce);
      const formula = `=SUMIF(B2:B7,"${what}",C2:C7)`;
      const q = ask(withCell(spec, 'D1', 'Result'), 'D2', formula);
      const all = [2, 3, 4, 5, 6, 7].reduce((t, i) => t + numberAt(spec, `C${i}`), 0);
      const count = shows(spec, 'D2', `=COUNTIF(B2:B7,"${what}")`);
      return {
        skill: SUMIF, ...q,
        options: choices(r, q.right, [all, count, Number(q.right) + 5]),
        why: `SUMIF adds the kilograms in C2:C7 only where column B says “${what}”: ${q.right}.`,
      };
    },
  ],
  [IFERROR]: [
    (r) => {
      const takings = int(r, 4, 12) * 10;
      const sheet = table(['Delivery', 'Takings', 'Trips', 'Per trip'], [['Apples', takings, 0, null]]);
      const formula = '=IFERROR(B2/C2,0)';
      const q = ask(sheet, 'D2', formula);
      return {
        skill: IFERROR, ...q,
        options: choices(r, q.right, ['#DIV/0!', takings]),
        why: 'B2/C2 divides by 0 and fails, so IFERROR shows its second part instead: 0.',
      };
    },
  ],
};

export const PREDICT_SKILLS = Object.keys(makers);

/** Questions in one go. */
export const PREDICT_LENGTH = 6;

/** One go: taught skills only, with the newest in every other question. */
export function predictRound(taught: ReadonlySet<string>, newest: readonly string[], seed: number): PredictQuestion[] {
  const r = rng(seed);
  const skills = PREDICT_SKILLS.filter((s) => taught.has(s));
  if (skills.length === 0) return [];
  const fresh = newest.filter((s) => skills.includes(s));
  const out: PredictQuestion[] = [];
  for (let i = 0; i < PREDICT_LENGTH; i++) {
    const skill = i % 2 === 0 && fresh.length > 0 ? fresh[(i / 2) % fresh.length] : pick(r, skills);
    out.push(pick(r, makers[skill])(r));
  }
  return shuffle(r, out);
}

/** Said when a wrong option is chosen: what it would have needed to be true. */
export function predictMiss(q: PredictQuestion, chosen: string): string {
  return `Not ${chosen}. ${q.why}`;
}
