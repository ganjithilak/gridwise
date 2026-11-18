/** @jest-environment node */
import { a1, range, rangeToA1, shiftFormula, type SheetSpec } from '@/engine';

import { nextLock, SheetController, type KeyId } from '../controller';

const spec: SheetSpec = {
  cols: 5,
  rows: 7,
  grid: [
    ['Item', 'Units', 'Price', 'Total', 'Rate'],
    ['Pen', 10, 2, null, 0.1],
    ['Book', 4, 5],
    ['Lamp', 1, 30],
    ['Desk', 2, 150],
  ],
};

const make = (select = 'A1', from: SheetSpec = spec) => new SheetController(from, select);
const keys = (c: SheetController, ...ks: KeyId[]) => ks.forEach((k) => c.pressKey(k));
const raw = (c: SheetController, cell: string) => c.sheet.getRaw(a1(cell));
const value = (c: SheetController, cell: string) => c.sheet.getValue(a1(cell));
const selected = (c: SheetController) => rangeToA1(c.getState().range);
/** Types `formula` into `cell` and presses Enter. The cell is left selected, as it is for a learner. */
function enter(c: SheetController, cell: string, formula: string) {
  c.tapCell(a1(cell));
  if (!c.getState().editing) c.tapCell(a1(cell));
  // Typing in a cell keeps what is there, so clear it first.
  while (c.getState().editing?.text) c.pressKey('backspace');
  c.pressChip(formula);
  keys(c, 'enter');
}

describe('shifting a formula', () => {
  it('moves plain references and leaves $ parts where they are', () => {
    expect(shiftFormula('=B2*C2', 0, 1)).toBe('=B3*C3');
    expect(shiftFormula('=B2*$E$2', 0, 3)).toBe('=B5*$E$2');
    expect(shiftFormula('=$B2+B$2', 2, 2)).toBe('=$B4+D$2');
    expect(shiftFormula('=SUM(B2:B5)', 1, 0)).toBe('=SUM(C2:C5)');
  });

  it('leaves text and function names alone', () => {
    expect(shiftFormula('=IF(B2>10,"B2 is big",LOG10(B2))', 0, 1)).toBe('=IF(B3>10,"B2 is big",LOG10(B3))');
    expect(shiftFormula('12', 1, 1)).toBe('12');
    expect(shiftFormula('B2', 1, 1)).toBe('B2');
  });

  it('gives #REF! when a reference would leave the sheet', () => {
    expect(shiftFormula('=B2+1', -2, 0)).toBe('=#REF!+1');
    expect(shiftFormula('=SUM(B1:B3)', 0, -1)).toBe('=SUM(#REF!)');
  });
});

describe('selecting a range', () => {
  it('selects the block a drag covers, keeping the starting cell active', () => {
    const c = make();
    c.drag(a1('B2'), a1('C4'));
    expect(selected(c)).toBe('B2:C4');
    expect(c.getState().selection).toEqual(a1('B2'));
    c.drag(a1('C4'), a1('B2'));
    expect(selected(c)).toBe('B2:C4');
    expect(c.getState().selection).toEqual(a1('C4'));
  });

  it('a tap goes back to one cell, and a tap on a selected block does not start typing', () => {
    const c = make();
    c.selectRange('B2:B5');
    c.tapCell(a1('B2'));
    expect(c.getState().editing).toBeNull();
    expect(selected(c)).toBe('B2');
    c.tapCell(a1('B2'));
    expect(c.getState().editing).not.toBeNull();
  });

  it('while typing a formula, a drag points the formula at the block', () => {
    const c = make('B6');
    c.tapCell(a1('B6'));
    keys(c, 'SUM');
    c.drag(a1('B2'), a1('B4'));
    expect(c.getState().editing?.text).toBe('=SUM(B2:B4');
    // Dragging further replaces it rather than adding a second range.
    c.drag(a1('B2'), a1('B5'));
    expect(c.getState().editing?.text).toBe('=SUM(B2:B5');
    keys(c, 'enter');
    expect(value(c, 'B6')).toBe(17);
  });

  it('select all covers the whole sheet', () => {
    const c = make('B2');
    c.runShortcut('selectAll');
    expect(selected(c)).toBe('A1:E7');
  });
});

describe('fill handle', () => {
  it('fills a formula down, moving its references', () => {
    const c = make();
    enter(c, 'D2', '=B2*C2');
    expect(c.fillTo(a1('D5'))).toBe(true);
    expect([raw(c, 'D3'), raw(c, 'D4'), raw(c, 'D5')]).toEqual(['=B3*C3', '=B4*C4', '=B5*C5']);
    expect([value(c, 'D2'), value(c, 'D5')]).toEqual([20, 300]);
    expect(selected(c)).toBe('D2:D5');
  });

  it('keeps a $ reference fixed, which is what $ is for', () => {
    const c = make();
    enter(c, 'D2', '=B2*$E$2');
    c.fill('D2:D5');
    expect(raw(c, 'D5')).toBe('=B5*$E$2');
    expect(value(c, 'D5')).toBeCloseTo(0.2);
    // Without the $ the same fill points at empty cells.
    enter(c, 'D2', '=B2*E2');
    c.fill('D2:D5');
    expect(value(c, 'D5')).toBe(0);
  });

  it('fills across, upwards, and repeats a block of two', () => {
    const c = make();
    enter(c, 'B6', '=SUM(B2:B5)');
    c.fillTo(a1('C6'));
    expect(raw(c, 'C6')).toBe('=SUM(C2:C5)');
    c.selectRange('B2:B3');
    c.fillTo(a1('B7'));
    expect([value(c, 'B4'), value(c, 'B5'), value(c, 'B6'), value(c, 'B7')]).toEqual([10, 4, 10, 4]);
    c.tapCell(a1('C5'));
    c.fillTo(a1('C3'));
    expect([value(c, 'C3'), value(c, 'C4')]).toEqual([150, 150]);
  });

  it('copies the format along with the contents', () => {
    const c = make('C2');
    c.runTool('currency');
    c.fill('C2:C4');
    expect(c.sheet.getDisplay(a1('C4'))).toBe('$2.00');
  });

  it('does nothing when dropped inside the selection, or while typing', () => {
    const c = make('B2');
    expect(c.fillTo(a1('B2'))).toBe(false);
    keys(c, '=');
    expect(c.fillTo(a1('B5'))).toBe(false);
  });
});

describe('AutoSum', () => {
  it('proposes the numbers above and waits for Enter', () => {
    const c = make('B6');
    c.runTool('autosum');
    expect(c.getState().editing?.text).toBe('=SUM(B2:B5');
    expect(value(c, 'B6')).toBeNull();
    keys(c, 'enter');
    expect(raw(c, 'B6')).toBe('=SUM(B2:B5)');
    expect(value(c, 'B6')).toBe(17);
  });

  it('looks to the left when there is nothing above', () => {
    const c = make('D3');
    c.runTool('autosum');
    expect(c.getState().editing?.text).toBe('=SUM(B3:C3');
  });

  it('lets the proposed range be replaced by tapping or dragging', () => {
    const c = make('B6');
    c.runTool('autosum');
    c.drag(a1('B2'), a1('B3'));
    expect(c.getState().editing?.text).toBe('=SUM(B2:B3');
  });

  it('opens an empty SUM when there are no numbers nearby', () => {
    const c = make('A7');
    c.runTool('autosum');
    expect(c.getState().editing?.text).toBe('=SUM(');
  });
});

describe('formats', () => {
  it('turns bold on for the whole selection, and off again', () => {
    const c = make();
    c.selectRange('A1:E1');
    c.runTool('bold');
    expect(c.sheet.getFormat(a1('C1')).bold).toBe(true);
    c.runTool('bold');
    expect(c.sheet.getFormat(a1('C1')).bold).toBeFalsy();
  });

  it('shows numbers as money or as a percentage without changing the number', () => {
    const c = make();
    c.selectRange('C2:C5');
    c.runTool('currency');
    expect(c.sheet.getDisplay(a1('C5'))).toBe('$150.00');
    expect(value(c, 'C5')).toBe(150);
    c.tapCell(a1('E2'));
    c.runTool('percent');
    expect(c.sheet.getDisplay(a1('E2'))).toBe('10%');
    c.runTool('percent');
    expect(c.sheet.getDisplay(a1('E2'))).toBe('0.1');
  });
});

describe('sort', () => {
  const column = (c: SheetController, col: string) => [2, 3, 4, 5].map((row) => value(c, `${col}${row}`));

  it('sorts the table by the selected column and keeps the heading on top', () => {
    const c = make('A3');
    expect(c.sort(false)).toBe(true);
    expect(value(c, 'A1')).toBe('Item');
    expect(column(c, 'A')).toEqual(['Book', 'Desk', 'Lamp', 'Pen']);
    expect(column(c, 'B')).toEqual([4, 2, 1, 10]);
  });

  it('sorts numbers largest first, moving whole rows', () => {
    const c = make('C2');
    c.runTool('sortDesc');
    expect(column(c, 'C')).toEqual([150, 30, 5, 2]);
    expect(column(c, 'A')).toEqual(['Desk', 'Lamp', 'Book', 'Pen']);
  });

  it('keeps each row formula pointing at its own row', () => {
    const c = make();
    enter(c, 'D2', '=B2*C2');
    c.fill('D2:D5');
    c.tapCell(a1('D3'));
    c.runTool('sortDesc');
    expect(column(c, 'D')).toEqual([300, 30, 20, 20]);
    expect(raw(c, 'D2')).toBe('=B2*C2');
    expect(column(c, 'A')).toEqual(['Desk', 'Lamp', 'Pen', 'Book']);
  });

  it('puts empty cells last whichever way it sorts', () => {
    const c = make('E2');
    c.runTool('sortAsc');
    expect(column(c, 'E')).toEqual([0.1, null, null, null]);
    c.runTool('sortDesc');
    expect(column(c, 'E')).toEqual([0.1, null, null, null]);
  });

  it('leaves a totals row alone when the lesson says where the table ends', () => {
    const withTotal: SheetSpec = { ...spec, cells: { A6: 'Total', B6: '=SUM(B2:B5)' }, table: 'A1:E5' };
    const c = make('B2', withTotal);
    c.runTool('sortAsc');
    expect(column(c, 'B')).toEqual([1, 2, 4, 10]);
    expect(value(c, 'A6')).toBe('Total');
    expect(value(c, 'B6')).toBe(17);
  });
});

describe('undo', () => {
  it('takes back typing, fills, formats and sorts, one step at a time', () => {
    const c = make();
    expect(c.getState().canUndo).toBe(false);
    enter(c, 'D2', '=B2*C2');
    c.fill('D2:D5');
    c.runTool('bold');
    c.tapCell(a1('B2'));
    c.runTool('sortAsc');
    expect(c.getState().canUndo).toBe(true);

    c.runTool('undo');
    expect(value(c, 'A2')).toBe('Pen');
    c.runShortcut('undo');
    expect(c.sheet.getFormat(a1('D3')).bold).toBeFalsy();
    c.undo();
    expect(raw(c, 'D3')).toBe('');
    expect(selected(c)).toBe('D2');
    c.undo();
    expect(raw(c, 'D2')).toBe('');
    expect(c.getState().canUndo).toBe(false);
    expect(c.undo()).toBe(false);
  });

  it('while typing, it just stops the typing', () => {
    const c = make('B2');
    keys(c, '9');
    expect(c.undo()).toBe(true);
    expect(c.getState().editing).toBeNull();
    expect(value(c, 'B2')).toBe(10);
  });
});

describe('copy, cut and paste', () => {
  it('copies a formula, moving its references to the new place', () => {
    const c = make();
    enter(c, 'D2', '=B2*C2');
    c.runShortcut('copy');
    expect(c.getState().clipboard).toEqual({ range: range('D2'), cut: false });
    c.tapCell(a1('D4'));
    expect(c.paste()).toBe(true);
    expect(raw(c, 'D4')).toBe('=B4*C4');
    expect(raw(c, 'D2')).toBe('=B2*C2');
    // The copy can be dropped again somewhere else.
    c.tapCell(a1('D5'));
    c.runShortcut('paste');
    expect(value(c, 'D5')).toBe(300);
  });

  it('cut moves the cells and can only be dropped once', () => {
    const c = make();
    c.selectRange('A4:C4');
    c.runShortcut('cut');
    c.tapCell(a1('A6'));
    c.runShortcut('paste');
    expect([value(c, 'A6'), value(c, 'B6'), value(c, 'C6')]).toEqual(['Lamp', 1, 30]);
    expect(value(c, 'A4')).toBeNull();
    expect(c.getState().clipboard).toBeNull();
    expect(selected(c)).toBe('A6:C6');
    expect(c.paste()).toBe(false);
  });

  it('typing something calls the copy off, as in Excel', () => {
    const c = make('B2');
    c.copy();
    c.tapCell(a1('B3'));
    c.tapCell(a1('B3'));
    keys(c, '7', 'enter');
    expect(c.getState().clipboard).toBeNull();
  });

  it('paste with nothing copied does nothing', () => {
    expect(make('B2').paste()).toBe(false);
  });
});

describe('ready-made pieces above the keys', () => {
  it('a function name brings its = and its bracket', () => {
    const c = make('B6');
    c.pressChip('AVERAGE');
    c.drag(a1('B2'), a1('B5'));
    keys(c, 'enter');
    expect(raw(c, 'B6')).toBe('=AVERAGE(B2:B5)');
    expect(value(c, 'B6')).toBe(4.25);
  });

  it('words and signs go in as they are, and come out in one tap', () => {
    const c = make('D2');
    c.pressChip('IF');
    c.tapCell(a1('B2'));
    c.pressChip('>');
    keys(c, '5', ',');
    c.pressChip('"Lots"');
    keys(c, ',');
    c.pressChip('"Few"');
    expect(c.getState().editing?.text).toBe('=IF(B2>5,"Lots","Few"');
    keys(c, 'backspace');
    expect(c.getState().editing?.text).toBe('=IF(B2>5,"Lots",');
    c.pressChip('"Few"');
    keys(c, 'enter');
    expect(value(c, 'D2')).toBe('Lots');
  });
});

describe('locking a reference with $', () => {
  it('cycles the reference just put in, the way F4 does', () => {
    const c = make('D2');
    keys(c, '=');
    c.tapCell(a1('B2'));
    keys(c, '*');
    c.tapCell(a1('E2'));
    keys(c, '$');
    expect(c.getState().editing?.text).toBe('=B2*$E$2');
    keys(c, '$');
    expect(c.getState().editing?.text).toBe('=B2*E$2');
    keys(c, '$');
    expect(c.getState().editing?.text).toBe('=B2*$E2');
    keys(c, '$');
    expect(c.getState().editing?.text).toBe('=B2*E2');
  });

  it('is an ordinary character anywhere else', () => {
    const c = make('C2');
    keys(c, '$', '4', '.', '5', '0', 'enter');
    expect(c.sheet.getDisplay(a1('C2'))).toBe('$4.50');
    expect(nextLock('B2')).toBe('$B$2');
    expect(nextLock('nonsense')).toBe('nonsense');
  });

  it('a locked reference comes out with one press of delete', () => {
    const c = make('D2');
    keys(c, '=');
    c.tapCell(a1('E2'));
    keys(c, '$', 'backspace');
    expect(c.getState().editing?.text).toBe('=');
  });
});

describe('copy and paste from the toolbar', () => {
  it('does the same as the shortcuts', () => {
    const c = make('B2');
    c.runTool('copy');
    c.tapCell(a1('B6'));
    c.runTool('paste');
    expect(value(c, 'B6')).toBe(10);
    c.tapCell(a1('C2'));
    c.runTool('cut');
    c.tapCell(a1('C6'));
    c.runTool('paste');
    expect([value(c, 'C2'), value(c, 'C6')]).toEqual([null, 2]);
  });
});

describe('capture and restore with formats and ranges', () => {
  it('keeps bold, number formats and the selected block', () => {
    const c = make();
    c.selectRange('C2:C5');
    c.runTool('currency');
    c.selectRange('A1:E1');
    c.runTool('bold');
    const saved = JSON.parse(JSON.stringify(c.capture()));
    expect(saved.range).toBe('A1:E1');

    const again = make();
    again.restore(saved);
    expect(again.sheet.getDisplay(a1('C5'))).toBe('$150.00');
    expect(again.sheet.getFormat(a1('B1')).bold).toBe(true);
    expect(selected(again)).toBe('A1:E1');
    expect(again.getState().canUndo).toBe(false);
  });
});
