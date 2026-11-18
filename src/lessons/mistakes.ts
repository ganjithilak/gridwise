import {
  colToLetters,
  printNode,
  rangeCols,
  rangeRows,
  rangeToA1,
  sameRange,
  type Node,
  type RangeAddr,
  type Sheet,
} from '@/engine';

import { astOf, refsOf } from './normalize';

export type MistakeCode =
  | 'empty'
  | 'missing-equals'
  | 'typed-value'
  | 'not-a-formula'
  | 'error-value'
  | 'wrong-row'
  | 'wrong-column'
  | 'range-short'
  | 'range-long'
  | 'wrong-range'
  | 'swapped'
  | 'wrong-operator'
  | 'not-general'
  | 'wrong-value'
  | 'function-not-used'
  | 'wrong-function'
  | 'not-filled'
  | 'needs-absolute'
  | 'wrong-selection'
  | 'wrong-format'
  | 'not-sorted'
  | 'shortcut-not-used'
  | 'not-undone'
  | 'wrong-choice';

export interface Mistake {
  code: MistakeCode;
  /** One line that tells the learner what their formula did, so they can fix it. */
  message: string;
}

const columnLabel = (sheet: Sheet, col: number): string => {
  const header = sheet.getValue({ col, row: 0 });
  const letter = colToLetters(col);
  return typeof header === 'string' && header.trim() !== '' ? `${header} (column ${letter})` : `column ${letter}`;
};

const rowLabel = (sheet: Sheet, row: number): string => {
  const header = sheet.getValue({ col: 0, row });
  return typeof header === 'string' && header.trim() !== '' ? `row ${row + 1} (${header})` : `row ${row + 1}`;
};

const shifted = (r: RangeAddr, dCol: number, dRow: number): RangeAddr => ({
  start: { col: r.start.col + dCol, row: r.start.row + dRow },
  end: { col: r.end.col + dCol, row: r.end.row + dRow },
});

/** Same cells as the answer, but every one a fixed number of rows or columns away. */
function wrongRowOrColumn(mine: RangeAddr[], wanted: RangeAddr[], sheet: Sheet): Mistake | null {
  if (mine.length === 0 || mine.length !== wanted.length) return null;
  const dCol = mine[0].start.col - wanted[0].start.col;
  const dRow = mine[0].start.row - wanted[0].start.row;
  if (dCol === 0 && dRow === 0) return null;
  if (dCol !== 0 && dRow !== 0) return null;
  if (!mine.every((r, i) => sameRange(r, shifted(wanted[i], dCol, dRow)))) return null;
  if (dRow !== 0) {
    return {
      code: 'wrong-row',
      message: `Your formula uses ${rowLabel(sheet, mine[0].start.row)}. This one is about ${rowLabel(sheet, wanted[0].start.row)}.`,
    };
  }
  return {
    code: 'wrong-column',
    message: `Your formula uses ${columnLabel(sheet, mine[0].start.col)}. This one is about ${columnLabel(sheet, wanted[0].start.col)}.`,
  };
}

/** The right column, but the range stops early, runs on too far, or starts in the wrong place. */
function wrongRangeLength(mine: RangeAddr[], wanted: RangeAddr[]): Mistake | null {
  if (mine.length !== wanted.length) return null;
  const different = mine.map((r, i) => i).filter((i) => !sameRange(mine[i], wanted[i]));
  if (different.length !== 1) return null;
  const a = mine[different[0]];
  const b = wanted[different[0]];
  if (rangeRows(b) === 1 && rangeCols(b) === 1) return null;
  const sameColumns = a.start.col === b.start.col && a.end.col === b.end.col;
  if (!sameColumns) return null;
  const said = `Your formula covers ${rangeToA1(a)}`;
  if (a.start.row === b.start.row && a.end.row < b.end.row) {
    const left: RangeAddr = { start: { col: b.start.col, row: a.end.row + 1 }, end: b.end };
    const verb = rangeRows(left) * rangeCols(left) === 1 ? 'is' : 'are';
    return { code: 'range-short', message: `${said}, so ${rangeToA1(left)} ${verb} left out.` };
  }
  if (a.start.row === b.start.row && a.end.row > b.end.row) {
    const lastCell = rangeToA1({ start: { col: b.end.col, row: b.end.row }, end: b.end });
    return { code: 'range-long', message: `${said}. It should stop at ${lastCell}.` };
  }
  return { code: 'wrong-range', message: `${said}. Look again at where the numbers you need start and stop.` };
}

const VERBS: Record<string, string> = {
  '+': 'adds them together',
  '-': 'takes one away from the other',
  '*': 'multiplies them',
  '/': 'divides one by the other',
};

/** The right two things with the wrong sign between them, or the right sign the wrong way round. */
function wrongOperation(mine: Node, wanted: Node): Mistake | null {
  if (mine.type !== 'binary' || wanted.type !== 'binary') return null;
  const [ml, mr, wl, wr] = [mine.left, mine.right, wanted.left, wanted.right].map((n) => printNode(n));
  if (mine.op === wanted.op && ml === wr && mr === wl && (mine.op === '-' || mine.op === '/')) {
    const does = mine.op === '-' ? `takes ${mr} away from ${ml}` : `divides ${ml} by ${mr}`;
    return { code: 'swapped', message: `Right cells, wrong way round: yours ${does}.` };
  }
  if (mine.op !== wanted.op && ml === wl && mr === wr && VERBS[mine.op]) {
    return {
      code: 'wrong-operator',
      message: `Right cells, but yours ${VERBS[mine.op]}. Check the sign between them.`,
    };
  }
  return null;
}

const DOES: Record<string, string> = {
  SUM: 'adds them up',
  AVERAGE: 'gives their average',
  MIN: 'finds the smallest',
  MAX: 'finds the biggest',
  COUNT: 'counts the numbers',
  COUNTA: 'counts the cells that are not empty',
  COUNTIF: 'counts the ones that match',
  SUMIF: 'adds up the ones that match',
};

/** The right cells handed to the wrong function: AVERAGE where SUM was wanted. */
function wrongFunction(mine: Node, wanted: Node): Mistake | null {
  if (mine.type !== 'call' || wanted.type !== 'call' || mine.name === wanted.name) return null;
  if (mine.args.length !== wanted.args.length) return null;
  if (!mine.args.every((arg, i) => printNode(arg) === printNode(wanted.args[i]))) return null;
  const does = DOES[mine.name] ? `, which ${DOES[mine.name]}` : '';
  return { code: 'wrong-function', message: `Right cells, but you used ${mine.name}${does}. This one needs ${wanted.name}.` };
}

/**
 * Compares the learner's formula with a correct one and, where it recognises the slip,
 * says what the learner's formula actually did. Returns null if nothing specific fits.
 */
export function diagnose(learnerRaw: string, referenceRaw: string, sheet: Sheet): Mistake | null {
  const mine = astOf(learnerRaw);
  const wanted = astOf(referenceRaw);
  if (!mine || !wanted) return null;
  const myRefs = refsOf(mine);
  const wantedRefs = refsOf(wanted);
  return (
    wrongRowOrColumn(myRefs, wantedRefs, sheet) ??
    wrongRangeLength(myRefs, wantedRefs) ??
    wrongOperation(mine, wanted) ??
    wrongFunction(mine, wanted)
  );
}
