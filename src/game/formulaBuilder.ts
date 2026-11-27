import { checkFormula, scanRefs, type SheetSpec } from '@/engine';

import { CUSTOMERS, orderSheet, shows, stockSheet, table, weekSheet, withCell } from './farmSheets';
import { int, pick, rng, shuffle, type Rng } from './random';

/**
 * Formula Builder: a farm question, a sheet, and the pieces of a formula to put together.
 * Early on there are few spare pieces; later more, and some goes become "which of these
 * formulas works?", where the others have a syntax slip or the wrong function. Every
 * answer is judged by the engine on the sheet shown, never by matching text alone.
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

export interface BuildChallenge {
  kind: 'build' | 'choose';
  skill: string;
  sheet: SheetSpec;
  /** Where the formula goes. */
  cell: string;
  ask: string;
  /** A formula that answers it, as the pieces go together. */
  answer: string;
  /** `build`: the pieces, the answer's and some spares, shuffled. Each can be used once. */
  tokens: string[];
  /** `choose`: three whole formulas, one that works. */
  options?: string[];
  /** Pieces that must appear, beyond giving the right result: "$E$1" when locking is the point. */
  mustInclude?: { text: string; why: string }[];
  /** Said once it is right: what the formula does. */
  explain: string;
}

/** What each function is for, to explain a wrong choice. */
const PURPOSE: Record<string, string> = {
  SUM: 'SUM adds them up',
  AVERAGE: 'AVERAGE gives the typical value',
  MIN: 'MIN finds the smallest',
  MAX: 'MAX finds the largest',
  COUNT: 'COUNT counts the cells with numbers',
  IF: 'IF chooses between two results',
  COUNTIF: 'COUNTIF counts what matches',
  SUMIF: 'SUMIF adds what matches',
};

const fnOf = (formula: string): string | null => /^=\s*([A-Z]+)\(/.exec(formula)?.[1] ?? null;
const rangesOf = (formula: string): string[] => scanRefs(formula).map((r) => r.text.replace(/\$/g, ''));

/**
 * Why a built formula is not the answer, in terms the learner can act on. Null if it is right.
 */
export function diagnose(ch: BuildChallenge, built: string): string | null {
  if (built.trim() === '') return 'Put the pieces together in the box above.';
  if (!built.startsWith('=')) return 'A formula starts with =. Put it first.';
  const check = checkFormula(built);
  if (!check.ok) return check.message;
  const want = shows(ch.sheet, ch.cell, ch.answer);
  const got = shows(ch.sheet, ch.cell, built);
  const wantFn = fnOf(ch.answer);
  const gotFn = fnOf(built);
  const wantRefs = rangesOf(ch.answer).join(' ');
  const gotRefs = rangesOf(built).join(' ');
  if (got === want) {
    // The same number by luck is not the same formula: AVERAGE(A2:B6) skips the day names
    // in column A and matches AVERAGE(B2:B6) today, but is pointed at the wrong cells.
    if (gotRefs !== wantRefs && !(wantFn && gotFn !== wantFn)) {
      return `That happens to show ${got} here, but it uses ${gotRefs.replace(/ /g, ' and ')}. Point it at just the cells the question is about.`;
    }
    for (const need of ch.mustInclude ?? []) if (!built.includes(need.text)) return need.why;
    if (wantFn && gotFn !== wantFn) return `That shows the right number, but this asks for ${wantFn}.`;
    return null;
  }
  if (wantFn && gotFn && wantFn !== gotFn) return `${PURPOSE[gotFn] ?? `${gotFn} is a different function`}. This needs ${wantFn}.`;
  if (wantRefs !== gotRefs && gotRefs !== '') return `That uses ${gotRefs.replace(/ /g, ' and ')}, which shows ${got}. Check which cells the question is about.`;
  return `That works out to ${got}. Read the question again: which calculation does it ask for?`;
}

/** Pieces a formula is built from, in order: "=", "SUM(", "B2", ":", "B6", ")". */
const split = (formula: string): string[] => {
  const out: string[] = [];
  const re = /(\$?[A-Z]+\$?\d+|[A-Z]+\(|"[^"]*"|>=|<=|<>|[=+\-*/:,()<>]|\d+(?:\.\d+)?)/g;
  for (const m of formula.matchAll(re)) out.push(m[0]);
  return out;
};

const spares = (r: Rng, all: string[], n: number, answer: string[]): string[] => shuffle(r, all.filter((t) => !answer.includes(t))).slice(0, n);

type Maker = (r: Rng, spare: number) => BuildChallenge;

const makers: Record<string, Maker[]> = {
  [ARITHMETIC]: [
    (r, n) => {
      const { produce, spec } = stockSheet(r, 4);
      const row = int(r, 2, 5);
      const sheet = withCell({ ...spec, grid: spec.grid?.map((line, i) => (i === 0 ? [...line, 'Value'] : line)) }, `D${row}`, null);
      const answer = `=B${row}*C${row}`;
      const t = split(answer);
      return {
        kind: 'build', skill: ARITHMETIC, sheet, cell: `D${row}`, answer,
        ask: `What is the ${produce[row - 2].toLowerCase()} in stock worth? Multiply its stock by its price, in D${row}.`,
        tokens: shuffle(r, [...t, ...spares(r, ['+', '-', `B${row === 2 ? 3 : row - 1}`, `C${row === 5 ? 4 : row + 1}`, '/'], n, t)]),
        explain: `B${row} is the kilograms and C${row} the price per kilogram; * multiplies them.`,
      };
    },
    (r, n) => {
      const picked = int(r, 10, 30) * 5;
      const sent = int(r, 2, picked / 5 - 1) * 5;
      const produce = pick(r, ['Carrots', 'Apples', 'Pears', 'Tomatoes']);
      const sheet = table(['Produce', 'Picked (kg)', 'Sent (kg)', 'Left (kg)'], [[produce, picked, sent, null]]);
      const answer = '=B2-C2';
      const t = split(answer);
      return {
        kind: 'build', skill: ARITHMETIC, sheet, cell: 'D2', answer,
        ask: `How many kilograms of ${produce.toLowerCase()} are left after the stall delivery? Work it out in D2.`,
        tokens: shuffle(r, [...t, ...spares(r, ['+', '*', 'D2', 'B1'], n, t)]),
        explain: 'Picked minus sent: B2 - C2. If either changes, the answer updates.',
      };
    },
  ],
  [SUM_RANGE]: [
    (r, n) => {
      const { products, spec } = weekSheet(r, [pick(r, ['Carrots', 'Apples', 'Plums', 'Pears'])]);
      const sheet = withCell(withCell(spec, 'A7', 'Total'), 'B7', null);
      const answer = '=SUM(B2:B6)';
      const t = split(answer);
      return {
        kind: 'build', skill: SUM_RANGE, sheet, cell: 'B7', answer,
        ask: `Total the week’s sales of ${products[0].toLowerCase()} in B7.`,
        tokens: shuffle(r, [...t, ...spares(r, ['AVERAGE(', 'B5', 'B7', '+', 'B1'], n, t)]),
        explain: 'SUM(B2:B6) adds every day from Monday (B2) to Friday (B6).',
      };
    },
  ],
  [AVERAGE]: [
    (r, n) => {
      const { products, spec } = weekSheet(r, [pick(r, ['Tomatoes', 'Potatoes', 'Apples'])]);
      const sheet = withCell(withCell(spec, 'A7', 'Average'), 'B7', null);
      const answer = '=AVERAGE(B2:B6)';
      const t = split(answer);
      return {
        kind: 'build', skill: AVERAGE, sheet, cell: 'B7', answer,
        ask: `What is a typical day’s sales of ${products[0].toLowerCase()}? Average the week in B7.`,
        tokens: shuffle(r, [...t, ...spares(r, ['SUM(', 'MAX(', 'B5', 'A2'], n, t)]),
        explain: 'AVERAGE(B2:B6) adds the five days and divides by five.',
      };
    },
  ],
  [MINMAX]: [
    (r, n) => {
      const best = r() < 0.5;
      const { products, spec } = weekSheet(r, [pick(r, ['Pears', 'Plums', 'Carrots'])]);
      const sheet = withCell(withCell(spec, 'A7', best ? 'Best day' : 'Quietest'), 'B7', null);
      const fn = best ? 'MAX' : 'MIN';
      const answer = `=${fn}(B2:B6)`;
      const t = split(answer);
      return {
        kind: 'build', skill: MINMAX, sheet, cell: 'B7', answer,
        ask: `How many kilograms of ${products[0].toLowerCase()} sold on the ${best ? 'best' : 'quietest'} day? Find it in B7.`,
        tokens: shuffle(r, [...t, ...spares(r, [best ? 'MIN(' : 'MAX(', 'SUM(', 'B5', 'B7'], n, t)]),
        explain: `${fn} looks through B2:B6 and returns the ${best ? 'largest' : 'smallest'} number.`,
      };
    },
  ],
  [COUNT]: [
    (r, n) => {
      const { spec } = weekSheet(r, ['Apples']);
      const closed = int(r, 2, 6);
      const sheet = withCell(withCell(withCell(spec, `B${closed}`, 'Closed'), 'A7', 'Days open'), 'B7', null);
      const answer = '=COUNT(B2:B6)';
      const t = split(answer);
      return {
        kind: 'build', skill: COUNT, sheet, cell: 'B7', answer,
        ask: 'The stall was closed one day. How many days have sales recorded? Count them in B7.',
        tokens: shuffle(r, [...t, ...spares(r, ['SUM(', 'B5', 'A2', 'AVERAGE('], n, t)]),
        explain: `COUNT counts only cells holding numbers, so “Closed” in B${closed} is left out.`,
      };
    },
  ],
  [ABSOLUTE]: [
    (r, n) => {
      const { produce, spec } = stockSheet(r, 4);
      const price = pick(r, [3, 4, 5]);
      const grid = spec.grid?.map((line, i) => (i === 0 ? ['Produce', 'Sold (kg)', 'Takings'] : [line[0], line[1], null]));
      const sheet = withCell(withCell({ ...spec, grid }, 'D1', 'Price'), 'E1', price);
      const answer = '=B2*$E$1';
      const t = split(answer);
      return {
        kind: 'build', skill: ABSOLUTE, sheet, cell: 'C2', answer,
        ask: `Everything sells at the price in E1. Work out the ${produce[0].toLowerCase()} takings in C2, ready to fill down.`,
        tokens: shuffle(r, [...t, 'E1', ...spares(r, ['+', 'B3', 'E2', 'E$1'], Math.max(0, n - 1), [...t, 'E1'])]),
        mustInclude: [{ text: '$E$1', why: 'Right for this row, but filled down, E1 would slide to E2, E3. Lock it: $E$1.' }],
        explain: 'B2 moves as it is filled down; $E$1 stays on the price.',
      };
    },
  ],
  [COMPARE]: [
    (r, n) => {
      const target = pick(r, [40, 50, 60]);
      const { produce, spec } = stockSheet(r, 4);
      const row = int(r, 2, 5);
      const sheet = withCell({ ...spec, grid: spec.grid?.map((line, i) => (i === 0 ? [...line, `${target} kg or more?`] : line)) }, `D${row}`, null);
      const answer = `=B${row}>=${target}`;
      const t = split(answer);
      return {
        kind: 'build', skill: COMPARE, sheet, cell: `D${row}`, answer,
        ask: `Is there at least ${target} kg of ${produce[row - 2].toLowerCase()}? Check in D${row}: TRUE or FALSE.`,
        tokens: shuffle(r, [...t, ...spares(r, ['<', '<=', '>', `C${row}`, '+'], n, t)]),
        explain: `>= means “at least”, so B${row}>=${target} is TRUE when the stock is ${target} or more.`,
      };
    },
  ],
  [IF]: [
    (r, n) => {
      const { produce, spec } = stockSheet(r, 4);
      const row = int(r, 2, 5);
      const level = pick(r, [20, 30, 40]);
      const sheet = withCell({ ...spec, grid: spec.grid?.map((line, i) => (i === 0 ? [...line, 'Order?'] : line)) }, `D${row}`, null);
      const answer = `=IF(B${row}<${level},"Reorder","OK")`;
      const t = split(answer);
      return {
        kind: 'build', skill: IF, sheet, cell: `D${row}`, answer,
        ask: `Under ${level} kg means it is time to reorder. In D${row}, show “Reorder” or “OK” for ${produce[row - 2].toLowerCase()}.`,
        tokens: shuffle(r, [...t, ...spares(r, ['>', 'SUM(', `C${row}`, '"Yes"'], n, t)]),
        explain: `IF tests B${row}<${level}: true gives “Reorder”, false gives “OK”.`,
      };
    },
  ],
  [COUNTIF]: [
    (r, n) => {
      const { produce, spec } = orderSheet(r);
      const what = pick(r, produce);
      const sheet = withCell(withCell(spec, 'D1', `${what} orders`), 'D2', null);
      const answer = `=COUNTIF(B2:B7,"${what}")`;
      const t = split(answer);
      return {
        kind: 'build', skill: COUNTIF, sheet, cell: 'D2', answer,
        ask: `How many orders were for ${what.toLowerCase()}? Count them in D2.`,
        tokens: shuffle(r, [...t, ...spares(r, ['SUMIF(', 'C2', 'C7', `"${pick(r, CUSTOMERS)}"`], n, t)]),
        explain: `COUNTIF looks down B2:B7 and counts each “${what}”.`,
      };
    },
  ],
  [SUMIF]: [
    (r, n) => {
      const { produce, spec } = orderSheet(r);
      const what = pick(r, produce);
      const sheet = withCell(withCell(spec, 'D1', `${what} kg`), 'D2', null);
      const answer = `=SUMIF(B2:B7,"${what}",C2:C7)`;
      const t = split(answer);
      return {
        kind: 'build', skill: SUMIF, sheet, cell: 'D2', answer,
        ask: `How many kilograms of ${what.toLowerCase()} were ordered in all? Total them in D2.`,
        tokens: shuffle(r, [...t, ...spares(r, ['COUNTIF(', 'A2', 'A7', 'SUM('], n, t)]),
        explain: `SUMIF finds each “${what}” in B2:B7 and adds its kilograms from C2:C7.`,
      };
    },
  ],
};

/** The same challenge, as "which of these works?": one syntax slip and one wrong function beside the answer. */
function asChoice(r: Rng, ch: BuildChallenge): BuildChallenge | null {
  const fn = fnOf(ch.answer);
  const slip = ch.answer.endsWith(')') ? ch.answer.slice(0, -1) : ch.answer.slice(1);
  const swap: Record<string, string> = { SUM: 'AVERAGE', AVERAGE: 'SUM', MIN: 'MAX', MAX: 'MIN', COUNT: 'SUM', COUNTIF: 'SUMIF', SUMIF: 'COUNTIF', IF: 'IF' };
  const wrongFn = fn && swap[fn] !== fn ? ch.answer.replace(`${fn}(`, `${swap[fn]}(`) : ch.answer.replace('*', '+').replace('-', '+').replace('>=', '<');
  if (wrongFn === ch.answer || slip === ch.answer) return null;
  if (shows(ch.sheet, ch.cell, wrongFn) === shows(ch.sheet, ch.cell, ch.answer)) return null;
  return { ...ch, kind: 'choose', options: shuffle(r, [ch.answer, slip, wrongFn]), tokens: [] };
}

/** Why a chosen formula does not work, for a `choose` challenge. */
export function diagnoseChoice(ch: BuildChallenge, chosen: string): string | null {
  if (chosen === ch.answer) return null;
  if (!chosen.startsWith('=')) return `${chosen} has no = at the start, so it would be stored as text, not worked out.`;
  const check = checkFormula(chosen);
  if (!check.ok) return `${chosen} would be refused: ${check.message.charAt(0).toLowerCase()}${check.message.slice(1)}`;
  return diagnose(ch, chosen);
}

/** Challenges in one go. */
export const BUILD_LENGTH = 6;

/**
 * One go: only skills taught, newest first in the mix, spares growing with the tier, and
 * at the top tier a third of the go asks which formula works.
 */
export function buildRound(taught: ReadonlySet<string>, newest: readonly string[], tier: 1 | 2 | 3, seed: number): BuildChallenge[] {
  const r = rng(seed);
  const skills = Object.keys(makers).filter((s) => taught.has(s));
  if (skills.length === 0) return [];
  const fresh = newest.filter((s) => skills.includes(s));
  const order: string[] = [];
  // Half the go on the newest skills, the rest spread over everything taught.
  for (let i = 0; i < BUILD_LENGTH; i++) order.push(i % 2 === 0 && fresh.length > 0 ? fresh[(i / 2) % fresh.length] : pick(r, skills));
  const spare = tier === 1 ? 1 : tier === 2 ? 2 : 3;
  return shuffle(r, order).map((skill, i) => {
    const ch = pick(r, makers[skill])(r, spare);
    if (tier === 3 && i % 3 === 2) return asChoice(r, ch) ?? ch;
    return ch;
  });
}

export const BUILDER_SKILLS = Object.keys(makers);
