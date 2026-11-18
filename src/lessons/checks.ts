import {
  a1,
  cellsInRange,
  explainError,
  formatScalar,
  inputToRaw,
  isError,
  parseLiteral,
  range as rangeOf,
  rangeToA1,
  sameCell,
  sameRange,
  shiftFormula,
  toA1,
  type CellAddr,
  type RangeAddr,
  type Scalar,
  type Sheet,
} from '@/engine';
import type { SheetController } from '@/spreadsheet/controller';
import { comboText } from '@/spreadsheet/shortcuts';

import { diagnose, type MistakeCode } from './mistakes';
import { astOf, canonical, hasNumberLiteral, usesFunction } from './normalize';
import type { Check } from './types';

export type CheckOutcome =
  | { status: 'pass' }
  /** Right answer, but not the way this exercise is teaching. Retry on the spot; not a miss. */
  | { status: 'soft'; code: MistakeCode; message: string }
  | { status: 'fail'; code: MistakeCode; message: string };

/** What a check can see besides the cells: what is selected and which shortcuts were pressed. */
export interface CheckView {
  range: RangeAddr;
  /** What has been done this turn: "combo:copy", "undo". */
  actions: readonly string[];
}

const PASS: CheckOutcome = { status: 'pass' };
const fail = (code: MistakeCode, message: string): CheckOutcome => ({ status: 'fail', code, message });

export function valuesEqual(a: Scalar, b: Scalar): boolean {
  if (isError(a) || isError(b)) return isError(a) && isError(b) && a.code === b.code;
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim().toUpperCase() === b.trim().toUpperCase();
  }
  return a === b;
}

/**
 * The same sheet with every typed-in number swapped for a different one. A formula that
 * really uses the cells still agrees with the reference; one with the answer or a data
 * value typed into it does not.
 */
export function withOtherNumbers(sheet: Sheet, targets: CellAddr | readonly CellAddr[], seed: number): Sheet {
  const skip = Array.isArray(targets) ? (targets as readonly CellAddr[]) : [targets as CellAddr];
  const copy = sheet.clone();
  sheet.filled().forEach((addr, i) => {
    if (skip.some((target) => sameCell(addr, target)) || sheet.isFormula(addr)) return;
    const value = sheet.getValue(addr);
    if (typeof value !== 'number') return;
    copy.setRaw(addr, String(value * (seed + 2) + (i + 1) * (2 * seed + 3)));
  });
  return copy;
}

const HIDDEN_DATASETS = [1, 2];
const LOOKS_LIKE_FORMULA = /^\s*(?:[A-Za-z]+\s*\(|\$?[A-Za-z]{1,3}\$?\d+\s*[-+*/:^]|\d+(?:\.\d+)?\s*[-+*/^])/;

function checkOutcome(sheet: Sheet, cellName: string, reference: string): CheckOutcome {
  const cell = a1(cellName);
  const raw = sheet.getRaw(cell);
  if (raw.trim() === '') return fail('empty', `${cellName} is still empty. That's where the answer goes.`);

  const expected = sheet.preview(cell, reference);
  const actual = sheet.getValue(cell);

  if (!sheet.isFormula(cell)) {
    if (LOOKS_LIKE_FORMULA.test(raw)) {
      return fail('missing-equals', 'A formula has to start with =. Without it, what you typed is just text.');
    }
    if (valuesEqual(actual, expected)) {
      return fail(
        'typed-value',
        'Right answer, but typed in. Use a formula so it updates when the numbers change.',
      );
    }
    return fail('not-a-formula', `${cellName} needs a formula. Start with =.`);
  }

  if (!valuesEqual(actual, expected)) {
    const specific = diagnose(raw, reference, sheet);
    if (specific) return { status: 'fail', ...specific };
    if (isError(actual)) return fail('error-value', `${cellName} shows ${actual.code}. ${explainError(actual)}`);
    return fail(
      'wrong-value',
      `${cellName} shows ${formatScalar(actual, sheet.getFormat(cell).numFmt)}, which isn't right yet. Check which cells your formula uses.`,
    );
  }

  for (const seed of HIDDEN_DATASETS) {
    const other = withOtherNumbers(sheet, cell, seed);
    if (valuesEqual(other.getValue(cell), other.preview(cell, reference))) continue;
    const specific = diagnose(raw, reference, sheet);
    if (specific) return { status: 'fail', ...specific };
    const ast = astOf(raw);
    const why =
      ast && hasNumberLiteral(ast)
        ? 'A number is typed into your formula: tap its cell instead.'
        : 'Check which cells your formula uses.';
    return fail('not-general', `Works for these numbers only. ${why}`);
  }
  return PASS;
}

/** The sheets to compare on: the one on screen, then the hidden ones with other numbers. */
const datasets = (sheet: Sheet, targets: readonly CellAddr[]): Sheet[] => [
  sheet,
  ...HIDDEN_DATASETS.map((seed) => withOtherNumbers(sheet, targets, seed)),
];

/** The learner has filled a formula over a block. Every cell must match the reference filled the same way. */
function checkFilled(sheet: Sheet, rangeText: string, reference: string): CheckOutcome {
  const area = rangeOf(rangeText);
  const cells = cellsInRange(area);
  const first = cells[0];
  const blank = cells.find((cell) => sheet.getRaw(cell).trim() === '');
  if (blank) {
    if (sameCell(blank, first)) return fail('empty', `${toA1(first)} is still empty. That's where the first formula goes.`);
    return fail(
      'not-filled',
      `${toA1(blank)} is still empty. Drag the corner of ${toA1(first)} to fill as far as ${toA1(cells[cells.length - 1])}.`,
    );
  }
  const head = checkOutcome(sheet, toA1(first), reference);
  if (head.status !== 'pass') return head;

  for (const data of datasets(sheet, cells)) {
    for (const cell of cells) {
      const wanted = shiftFormula(reference, cell.col - first.col, cell.row - first.row);
      if (!sheet.isFormula(cell)) {
        return fail('typed-value', `${toA1(cell)} has a typed-in value. Fill the formula into it instead.`);
      }
      if (valuesEqual(data.getValue(cell), data.preview(cell, wanted))) continue;
      const specific = diagnose(sheet.getRaw(cell), wanted, sheet);
      if (specific) return { status: 'fail', ...specific };
      return fail('wrong-value', `${toA1(cell)} isn't right yet. Check what its formula points at.`);
    }
  }
  return PASS;
}

/**
 * Whether a formula keeps working when it is filled, which is the only thing that
 * matters about `$`. The fill happens on a copy; the learner's sheet is not touched.
 */
function checkFills(sheet: Sheet, cellName: string, overText: string, reference: string): CheckOutcome {
  const head = checkOutcome(sheet, cellName, reference);
  if (head.status !== 'pass') return head;
  const first = a1(cellName);
  const mine = sheet.getRaw(first);
  const cells = cellsInRange(rangeOf(overText));
  for (const data of datasets(sheet, cells)) {
    const trial = data.clone();
    for (const cell of cells) trial.setRaw(cell, shiftFormula(mine, cell.col - first.col, cell.row - first.row));
    for (const cell of cells) {
      const wanted = shiftFormula(reference, cell.col - first.col, cell.row - first.row);
      if (valuesEqual(trial.getValue(cell), data.preview(cell, wanted))) continue;
      const sameApartFromDollars = canonical(mine) === canonical(reference);
      if (sameApartFromDollars) {
        return fail(
          'needs-absolute',
          `It works in ${cellName}, but filled into ${toA1(cell)} it points at the wrong cell. Lock the one that must not move with $.`,
        );
      }
      return fail('wrong-value', `It works in ${cellName} but not when it is filled into ${toA1(cell)}.`);
    }
  }
  return PASS;
}

const RANK = (v: Scalar): number =>
  v === null || v === '' ? 9 : typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : typeof v === 'boolean' ? 2 : 3;

function inOrder(a: Scalar, b: Scalar, descending: boolean): boolean {
  // Empty cells belong at the bottom whichever way the sort runs.
  if (RANK(a) === 9 || RANK(b) === 9) return RANK(b) === 9;
  if (RANK(a) !== RANK(b)) return descending ? RANK(a) > RANK(b) : RANK(a) < RANK(b);
  const x = typeof a === 'string' ? a.toUpperCase() : (a as number | boolean);
  const y = typeof b === 'string' ? b.toUpperCase() : (b as number | boolean);
  return descending ? x >= y : x <= y;
}

function describeFormat(bold: boolean | undefined, numFmt: string | undefined): string {
  const parts: string[] = [];
  if (bold !== undefined) parts.push(bold ? 'bold' : 'not bold');
  if (numFmt === 'currency') parts.push('shown as money');
  else if (numFmt === 'percent') parts.push('shown as a percentage');
  else if (numFmt === 'general') parts.push('shown as a plain number');
  return parts.join(' and ');
}

function runOne(check: Check, sheet: Sheet, view: CheckView | undefined): CheckOutcome {
  switch (check.type) {
    case 'outcome':
      return checkOutcome(sheet, check.cell, check.reference);
    case 'cellValue': {
      const actual = sheet.getValue(a1(check.cell));
      const wanted = parseLiteral(inputToRaw(check.equals)).value;
      if (valuesEqual(actual, wanted)) return PASS;
      if (sheet.getRaw(a1(check.cell)).trim() === '' && wanted !== null) return fail('empty', `${check.cell} is still empty.`);
      const shows = actual === null ? 'is empty' : `shows ${formatScalar(actual)}`;
      return fail('wrong-value', `${check.cell} ${shows}, which isn't right yet.`);
    }
    case 'cellIsFormula':
      return sheet.isFormula(a1(check.cell)) ? PASS : fail('not-a-formula', `${check.cell} needs a formula. Start with =.`);
    case 'formulaUses': {
      const ast = astOf(sheet.getRaw(a1(check.cell)));
      if (ast && usesFunction(ast, check.fn)) return PASS;
      return {
        status: 'soft',
        code: 'function-not-used',
        message: `Right answer. Now do it with ${check.fn.toUpperCase()}.`,
      };
    }
    case 'filledResults':
      return checkFilled(sheet, check.range, check.reference);
    case 'fillsCorrectly':
      return checkFills(sheet, check.cell, check.over, check.reference);
    case 'selectionEquals': {
      const wanted = rangeOf(check.range);
      if (view && sameRange(view.range, wanted)) return PASS;
      const have = view ? rangeToA1(view.range) : 'nothing';
      // When the task is to find one cell, naming it would hand over the answer after one
      // wrong tap. Say how near the pick was instead; the hints are there for more.
      if (view && sameCell(wanted.start, wanted.end) && sameCell(view.range.start, view.range.end)) {
        const near =
          view.range.start.col === wanted.start.col
            ? 'Right column, wrong row.'
            : view.range.start.row === wanted.start.row
              ? 'Right row, wrong column.'
              : 'That is not the one. Check the row and the column.';
        return fail('wrong-selection', `${have} is selected. ${near}`);
      }
      return fail('wrong-selection', `${have} is selected. This one needs ${rangeToA1(wanted)}.`);
    }
    case 'cellFormat': {
      const wrong = cellsInRange(rangeOf(check.range)).find((cell) => {
        const format = sheet.getFormat(cell);
        if (check.bold !== undefined && !!format.bold !== check.bold) return true;
        return check.numFmt !== undefined && (format.numFmt ?? 'general') !== check.numFmt;
      });
      if (!wrong) return PASS;
      return fail('wrong-format', `${toA1(wrong)} should be ${describeFormat(check.bold, check.numFmt)}.`);
    }
    case 'rangeSorted': {
      const cells = cellsInRange(rangeOf(check.range));
      for (let i = 1; i < cells.length; i++) {
        if (inOrder(sheet.getValue(cells[i - 1]), sheet.getValue(cells[i]), !!check.descending)) continue;
        const way = check.descending ? 'largest first' : 'smallest first';
        return fail('not-sorted', `${rangeToA1(rangeOf(check.range))} isn't in order yet (${way}).`);
      }
      return PASS;
    }
    case 'usedShortcut':
      if (view?.actions.includes(`combo:${check.id}`)) return PASS;
      return fail('shortcut-not-used', `Use the keys this time: ${comboText(check.id)}.`);
    case 'undid':
      if (view?.actions.includes('undo')) return PASS;
      return fail('not-undone', 'Nothing has been undone yet. Make the change first, then take it back with Undo.');
  }
}

/**
 * Runs an exercise's checks against the learner's sheet. A real mistake wins over a
 * "right answer, wrong way" result, and the first real mistake is the one reported.
 */
export function runChecks(checks: Check[], sheet: Sheet, view?: CheckView): CheckOutcome {
  let soft: CheckOutcome | null = null;
  for (const check of checks) {
    const outcome = runOne(check, sheet, view);
    if (outcome.status === 'fail') return outcome;
    if (outcome.status === 'soft' && !soft) soft = outcome;
  }
  return soft ?? PASS;
}

/** Runs the checks against everything a controller holds: cells, selection and shortcuts pressed. */
export function checkController(checks: Check[], controller: SheetController): CheckOutcome {
  return runChecks(checks, controller.sheet, {
    range: controller.getState().range,
    actions: controller.actions(),
  });
}
