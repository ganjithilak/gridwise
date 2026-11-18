/** @jest-environment node */
import { a1, type SheetSpec } from '@/engine';
import { SheetController, type KeyId } from '@/spreadsheet/controller';

import { checkController, runChecks } from '../checks';
import { correctOptions, isRightPick, picksSeveral, shownBy } from '../pick';
import type { Check, ChoiceExercise, PredictExercise } from '../types';

/** Prices, with one shared tax rate off to the side in E2. */
const spec: SheetSpec = {
  cols: 5,
  rows: 5,
  grid: [
    ['Item', 'Price', 'Tax', '', 'Rate'],
    ['Pens', 20, null, null, 0.1],
    ['Pads', 40],
    ['Tape', 30],
    ['Glue', 50],
  ],
};

const make = (select = 'A1') => new SheetController(spec, select);
const keys = (c: SheetController, ...ks: KeyId[]) => ks.forEach((k) => c.pressKey(k));
function enter(c: SheetController, cell: string, formula: string) {
  c.tapCell(a1(cell));
  if (!c.getState().editing) c.tapCell(a1(cell));
  while (c.getState().editing?.text) c.pressKey('backspace');
  c.pressChip(formula);
  keys(c, 'enter');
}

describe('a formula filled over a block', () => {
  const filled: Check[] = [{ type: 'filledResults', range: 'C2:C5', reference: '=B2*$E$2' }];

  it('passes when every cell holds the right formula', () => {
    const c = make();
    enter(c, 'C2', '=B2*$E$2');
    c.fill('C2:C5');
    expect(checkController(filled, c)).toEqual({ status: 'pass' });
  });

  it('says how far there is still to fill', () => {
    const c = make();
    expect(checkController(filled, c)).toMatchObject({ status: 'fail', code: 'empty' });
    enter(c, 'C2', '=B2*$E$2');
    expect(checkController(filled, c)).toMatchObject({ code: 'not-filled', message: expect.stringContaining('C3') });
    c.fill('C2:C4');
    expect(checkController(filled, c)).toMatchObject({ code: 'not-filled', message: expect.stringContaining('C5') });
  });

  it('catches a fill made without the $', () => {
    const c = make();
    enter(c, 'C2', '=B2*E2');
    c.fill('C2:C5');
    const outcome = checkController(filled, c);
    expect(outcome.status).toBe('fail');
    // C2 itself is right. It is C3 that has gone wrong.
    expect(c.sheet.getValue(a1('C2'))).toBe(2);
    expect(c.sheet.getValue(a1('C3'))).toBe(0);
  });

  it('refuses numbers typed in where formulas should be', () => {
    const c = make();
    enter(c, 'C2', '=B2*$E$2');
    for (const [cell, value] of [['C3', '4'], ['C4', '3'], ['C5', '5']] as const) enter(c, cell, value);
    expect(checkController(filled, c)).toMatchObject({ status: 'fail', code: 'typed-value' });
  });

  it('accepts a different formula that gives the same answers on any numbers', () => {
    const c = make();
    enter(c, 'C2', '=$E$2*B2');
    c.fill('C2:C5');
    expect(checkController(filled, c)).toEqual({ status: 'pass' });
  });
});

describe('a formula that has to survive being filled', () => {
  const survives: Check[] = [{ type: 'fillsCorrectly', cell: 'C2', over: 'C2:C5', reference: '=B2*$E$2' }];

  it('passes on behaviour, without looking for $ signs', () => {
    for (const formula of ['=B2*$E$2', '=B2*E$2', '=$B2*$E$2']) {
      const c = make();
      enter(c, 'C2', formula);
      expect(checkController(survives, c)).toEqual({ status: 'pass' });
    }
  });

  it('explains what goes wrong without the lock, and leaves the sheet alone', () => {
    const c = make();
    enter(c, 'C2', '=B2*E2');
    expect(checkController(survives, c)).toMatchObject({ status: 'fail', code: 'needs-absolute', message: expect.stringContaining('C3') });
    // The trial fill happened on a copy.
    expect(c.sheet.getRaw(a1('C3'))).toBe('');
  });

  it('a lock in the wrong place fails too', () => {
    const c = make();
    enter(c, 'C2', '=$B$2*$E$2');
    expect(checkController(survives, c)).toMatchObject({ status: 'fail' });
  });

  it('a wrong answer in the first cell is reported as that', () => {
    const c = make();
    enter(c, 'C2', '=B2+$E$2');
    expect(checkController(survives, c)).toMatchObject({ status: 'fail', code: 'wrong-operator' });
  });
});

describe('what is selected, how it looks, and what order it is in', () => {
  it('says how near a wrong tap was without naming the cell to find', () => {
    const find: Check[] = [{ type: 'selectionEquals', range: 'B3' }];
    const c = make();
    const said = () => {
      const outcome = checkController(find, c);
      return outcome.status === 'fail' ? outcome.message : outcome.status;
    };
    c.selectRange('B2');
    expect(said()).toBe('B2 is selected. Right column, wrong row.');
    c.selectRange('C3');
    expect(said()).toBe('C3 is selected. Right row, wrong column.');
    c.selectRange('A1');
    expect(said()).toBe('A1 is selected. That is not the one. Check the row and the column.');
    c.selectRange('B3');
    expect(said()).toBe('pass');
  });

  it('checks the selection exactly', () => {
    const selected: Check[] = [{ type: 'selectionEquals', range: 'B2:B5' }];
    const c = make();
    expect(checkController(selected, c)).toMatchObject({ code: 'wrong-selection', message: expect.stringContaining('A1') });
    c.selectRange('B2:B4');
    expect(checkController(selected, c)).toMatchObject({ status: 'fail' });
    c.selectRange('B5:B2');
    expect(checkController(selected, c)).toEqual({ status: 'pass' });
    // Without a view there is no selection to pass.
    expect(runChecks(selected, c.sheet)).toMatchObject({ status: 'fail' });
  });

  it('checks bold and number formats over a whole range', () => {
    const tidy: Check[] = [
      { type: 'cellFormat', range: 'A1:E1', bold: true },
      { type: 'cellFormat', range: 'B2:B5', numFmt: 'currency' },
    ];
    const c = make();
    expect(checkController(tidy, c)).toMatchObject({ code: 'wrong-format', message: 'A1 should be bold.' });
    c.selectRange('A1:D1');
    c.runTool('bold');
    expect(checkController(tidy, c)).toMatchObject({ message: 'E1 should be bold.' });
    // Some of the row is bold already, so one press makes all of it bold.
    c.selectRange('A1:E1');
    c.runTool('bold');
    expect(checkController(tidy, c)).toMatchObject({ message: 'B2 should be shown as money.' });
    c.selectRange('B2:B5');
    c.runTool('currency');
    expect(checkController(tidy, c)).toEqual({ status: 'pass' });
  });

  it('checks that a column is in order, either way round', () => {
    const up: Check[] = [{ type: 'rangeSorted', range: 'B2:B5' }];
    const down: Check[] = [{ type: 'rangeSorted', range: 'B2:B5', descending: true }];
    const c = make('B2');
    expect(checkController(up, c)).toMatchObject({ code: 'not-sorted' });
    c.runTool('sortAsc');
    expect(checkController(up, c)).toEqual({ status: 'pass' });
    expect(checkController(down, c)).toMatchObject({ status: 'fail' });
    c.runTool('sortDesc');
    expect(checkController(down, c)).toEqual({ status: 'pass' });
  });
});

describe('tasks that are about the doing', () => {
  it('wants the shortcut itself, not just its effect', () => {
    const viaKeys: Check[] = [{ type: 'usedShortcut', id: 'selectAll' }, { type: 'selectionEquals', range: 'A1:E5' }];
    const c = make();
    c.selectRange('A1:E5');
    expect(checkController(viaKeys, c)).toMatchObject({ code: 'shortcut-not-used', message: 'Use the keys this time: {mod} + A.' });
    c.tapCell(a1('B2'));
    c.runShortcut('selectAll');
    expect(checkController(viaKeys, c)).toEqual({ status: 'pass' });
  });

  it('knows a real undo from a sheet that just happens to look the same', () => {
    const undone: Check[] = [{ type: 'undid' }, { type: 'cellValue', cell: 'B2', equals: 20 }];
    const c = make();
    expect(checkController(undone, c)).toMatchObject({ code: 'not-undone' });
    enter(c, 'B2', '99');
    c.runTool('undo');
    expect(checkController(undone, c)).toEqual({ status: 'pass' });
  });

  it('forgets what the app did while demonstrating', () => {
    const c = make();
    c.runShortcut('selectAll');
    expect(c.actions()).toEqual(['combo:selectAll']);
    c.forgetActions();
    expect(checkController([{ type: 'usedShortcut', id: 'selectAll' }], c)).toMatchObject({ status: 'fail' });
  });

  it('an empty cell can be the right answer', () => {
    const moved: Check[] = [{ type: 'cellValue', cell: 'B3', equals: null }];
    const c = make();
    expect(checkController(moved, c)).toMatchObject({ status: 'fail', message: expect.stringContaining('40') });
    c.tapCell(a1('B3'));
    c.runTool('cut');
    c.tapCell(a1('D3'));
    c.runTool('paste');
    expect(checkController(moved, c)).toEqual({ status: 'pass' });
  });
});

describe('the right cells with the wrong function', () => {
  it('is named for what it did', () => {
    const c = make();
    enter(c, 'B5', '=AVERAGE(B2:B4)');
    const outcome = checkController([{ type: 'outcome', cell: 'B5', reference: '=SUM(B2:B4)' }], c);
    expect(outcome).toMatchObject({ status: 'fail', code: 'wrong-function' });
    expect(outcome.status === 'fail' && outcome.message).toBe('Right cells, but you used AVERAGE, which gives their average. This one needs SUM.');
  });
});

describe('questions with options', () => {
  const base = { id: 'x', skill: 's', prompt: 'p', explain: 'e', tips: ['a', 'b'], hints: ['1', '2', '3'] as const };
  const predict: PredictExercise = {
    ...base,
    type: 'predict-output',
    sheet: spec,
    cell: 'C2',
    formula: '=IF(B2>30,"Dear","Cheap")',
    options: ['Dear', 'cheap', 'TRUE', '20'],
  };
  const choice: ChoiceExercise = { ...base, type: 'choice', options: ['a', 'b', 'c'], correct: [2, 0] };

  it('works out the right option from the formula itself', () => {
    expect(shownBy(predict)).toBe('Cheap');
    expect(correctOptions(predict)).toEqual([1]);
    expect(isRightPick(predict, [1])).toBe(true);
    expect(isRightPick(predict, [0])).toBe(false);
    expect(picksSeveral(predict)).toBe(false);
  });

  it('shows numbers and errors the way the cell would', () => {
    expect(shownBy({ ...predict, formula: '=B2/3' })).toBe('6.66666666666667');
    expect(shownBy({ ...predict, formula: '=B2/D2' })).toBe('#DIV/0!');
    expect(shownBy({ ...predict, formula: '=B2>B3' })).toBe('FALSE');
  });

  it('wants exactly the right options when there are several', () => {
    expect(correctOptions(choice)).toEqual([0, 2]);
    expect(picksSeveral(choice)).toBe(true);
    expect(isRightPick(choice, [2, 0])).toBe(true);
    expect(isRightPick(choice, [0])).toBe(false);
    expect(isRightPick(choice, [0, 1, 2])).toBe(false);
    expect(isRightPick(choice, [0, 0, 2])).toBe(true);
  });
});
