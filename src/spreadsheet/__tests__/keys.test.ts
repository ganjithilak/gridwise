/** @jest-environment node */
import { a1, rangeToA1, toA1, type SheetSpec } from '@/engine';

import { SheetController, SHORTCUT_IDS } from '../controller';
import { capSetFor, comboLabel, comboText, needsComputer, shortcutFor, SHORTCUTS } from '../shortcuts';

const spec: SheetSpec = {
  cols: 3,
  rows: 5,
  grid: [
    ['Item', 'Cost', 'Stock'],
    ['Milk', 2, 12],
    ['Bread', 3, 8],
    ['Eggs', 4, 30],
    ['Tea', 5, 6],
  ],
};

const make = (select = 'A1') => new SheetController(spec, select);
const selected = (c: SheetController) => rangeToA1(c.getState().range);
const active = (c: SheetController) => toA1(c.getState().selection);

describe('whole rows and columns', () => {
  it('selects the column of the active cell, top to bottom, and keeps the active cell', () => {
    const c = make('B3');
    c.runShortcut('selectColumn');
    expect(selected(c)).toBe('B1:B5');
    expect(active(c)).toBe('B3');
  });

  it('selects the row of the active cell, side to side', () => {
    const c = make('B3');
    c.runShortcut('selectRow');
    expect(selected(c)).toBe('A3:C3');
    expect(active(c)).toBe('B3');
  });

  it('does nothing while a cell is being typed in, and is not counted as used', () => {
    const c = make('B3');
    c.startEdit();
    expect(c.runShortcut('selectColumn')).toBe(false);
    expect(selected(c)).toBe('B3');
    expect(c.actions()).not.toContain('combo:selectColumn');
  });

  it('lets Undo stop the typing, as in Excel, and counts it', () => {
    const c = make('B3');
    c.startEdit();
    c.pressKey('7');
    expect(c.runShortcut('undo')).toBe(true);
    expect(c.getState().editing).toBeNull();
    expect(c.sheet.getRaw(a1('B3'))).toBe('3');
    expect(c.actions()).toContain('combo:undo');
  });
});

describe('arrow keys', () => {
  it('move the active cell one cell, and stop at the edge of the sheet', () => {
    const c = make('A1');
    c.runShortcut('moveDown');
    c.runShortcut('moveRight');
    expect(active(c)).toBe('B2');
    expect(selected(c)).toBe('B2');
    c.runShortcut('moveUp');
    c.runShortcut('moveUp');
    expect(active(c)).toBe('B1');
    c.runShortcut('moveLeft');
    c.runShortcut('moveLeft');
    expect(active(c)).toBe('A1');
  });

  it('let go of a selected block', () => {
    const c = make();
    c.selectRange('B2:C4');
    c.runShortcut('moveDown');
    expect(selected(c)).toBe('B3');
  });

  it('stretch the selection with Shift, from the active cell', () => {
    const c = make('B2');
    c.runShortcut('extendDown');
    c.runShortcut('extendDown');
    expect(selected(c)).toBe('B2:B4');
    expect(active(c)).toBe('B2');
    c.runShortcut('extendRight');
    expect(selected(c)).toBe('B2:C4');
  });

  it('shrink it back again, and carry on through to the other side', () => {
    const c = make('B3');
    c.runShortcut('extendDown');
    expect(selected(c)).toBe('B3:B4');
    c.runShortcut('extendUp');
    expect(selected(c)).toBe('B3');
    c.runShortcut('extendUp');
    expect(selected(c)).toBe('B2:B3');
    expect(active(c)).toBe('B3');
  });

  it('stop stretching at the edge of the sheet', () => {
    const c = make('C4');
    c.runShortcut('extendDown');
    c.runShortcut('extendDown');
    c.runShortcut('extendRight');
    expect(selected(c)).toBe('C4:C5');
  });

  it('are remembered as things the learner did', () => {
    const c = make('B2');
    c.runShortcut('extendDown');
    expect(c.actions()).toContain('combo:extendDown');
    expect(c.sheet.getRaw(a1('B2'))).toBe('2');
  });
});

describe('what the shortcuts are called', () => {
  it('has an entry for every shortcut the sheet can run', () => {
    expect(Object.keys(SHORTCUTS).sort()).toEqual([...SHORTCUT_IDS].sort());
  });

  it('names the keys for each kind of computer', () => {
    expect(comboLabel('copy', 'win')).toBe('Ctrl + C');
    expect(comboLabel('copy', 'mac')).toBe('Cmd + C');
    // Excel uses the Ctrl key for this one on a Mac as well.
    expect(comboLabel('selectColumn', 'mac')).toBe('Ctrl + Space');
    expect(comboLabel('selectRow', 'win')).toBe('Shift + Space');
    expect(comboLabel('extendDown', 'win')).toBe('Shift + ↓');
    expect(comboLabel('moveLeft', 'win')).toBe('←');
    expect(comboText('undo')).toBe('{mod} + Z');
    expect(comboText('selectColumn')).toBe('Ctrl + Space');
  });

  it('finds the shortcut for a key and what is held with it', () => {
    expect(shortcutFor('c', ['mod'])).toBe('copy');
    expect(shortcutFor('Space', ['ctrl'])).toBe('selectColumn');
    expect(shortcutFor('Space', ['shift'])).toBe('selectRow');
    expect(shortcutFor('Down', ['shift'])).toBe('extendDown');
    expect(shortcutFor('Down', [])).toBe('moveDown');
    expect(shortcutFor('Space', [])).toBeNull();
    expect(shortcutFor('C', [])).toBeNull();
  });

  it('only asks which computer for shortcuts that differ between them', () => {
    expect(needsComputer('paste')).toBe(true);
    expect(needsComputer('selectRow')).toBe(false);
    expect(needsComputer('moveUp')).toBe(false);
  });

  it('picks the strip of keys a task needs', () => {
    expect(capSetFor(['copy', 'paste'])).toBe('letters');
    expect(capSetFor(['selectColumn'])).toBe('moving');
    expect(capSetFor(['moveDown', 'extendRight'])).toBe('moving');
    expect(capSetFor([])).toBe('moving');
  });
});
