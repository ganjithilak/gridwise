/** @jest-environment node */
import { a1, rangeToA1, type SheetSpec } from '@/engine';

import { SheetController } from '../controller';
import { applySheetKey, listenForKeys, readKey, type KeyPress } from '../keyboard';

const spec: SheetSpec = {
  cols: 3,
  rows: 5,
  grid: [
    ['Product', 'Stock (kg)', 'Price per kg'],
    ['Carrots', 115, 3],
    ['Potatoes', 110, 2.75],
    ['Tomatoes', 80, 6],
    ['Apples', 100, 4],
  ],
};

const make = (select = 'A1') => new SheetController(spec, select);
const selected = (c: SheetController) => rangeToA1(c.getState().range);

/** A key press as the browser reports it. */
const press = (key: string, held: Partial<Omit<KeyPress, 'key'>> = {}): KeyPress => ({
  key,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...held,
});

describe('reading a key press for each kind of computer', () => {
  it('uses Cmd for the letter shortcuts on a Mac, and Ctrl on Windows', () => {
    expect(readKey(press('z', { metaKey: true }), 'mac')).toEqual({ kind: 'shortcut', id: 'undo' });
    expect(readKey(press('z', { ctrlKey: true }), 'win')).toEqual({ kind: 'shortcut', id: 'undo' });
    for (const [key, id] of [['a', 'selectAll'], ['c', 'copy'], ['x', 'cut'], ['v', 'paste'], ['b', 'bold']] as const) {
      expect(readKey(press(key, { metaKey: true }), 'mac')).toEqual({ kind: 'shortcut', id });
      expect(readKey(press(key, { ctrlKey: true }), 'win')).toEqual({ kind: 'shortcut', id });
    }
  });

  it('says so when the other computer’s modifier is used, without doing it', () => {
    expect(readKey(press('z', { ctrlKey: true }), 'mac')).toEqual({ kind: 'wrongModifier', id: 'undo', used: 'Ctrl', wanted: 'Cmd' });
    expect(readKey(press('c', { metaKey: true }), 'win')).toEqual({ kind: 'wrongModifier', id: 'copy', used: 'Windows', wanted: 'Ctrl' });
  });

  it('reads Shift + Space and Ctrl + Space the same on both computers', () => {
    for (const computer of ['mac', 'win'] as const) {
      expect(readKey(press(' ', { shiftKey: true }), computer)).toEqual({ kind: 'shortcut', id: 'selectRow' });
      expect(readKey(press(' ', { ctrlKey: true }), computer)).toEqual({ kind: 'shortcut', id: 'selectColumn' });
      // Older browsers call the space bar "Spacebar".
      expect(readKey(press('Spacebar', { shiftKey: true }), computer)).toEqual({ kind: 'shortcut', id: 'selectRow' });
    }
  });

  it('does not take Cmd + Space on a Mac for a column: that is the system’s', () => {
    expect(readKey(press(' ', { metaKey: true }), 'mac')).toBeNull();
  });

  it('reads arrows to move, and Shift + arrows to stretch', () => {
    expect(readKey(press('ArrowDown'), 'mac')).toEqual({ kind: 'shortcut', id: 'moveDown' });
    expect(readKey(press('ArrowLeft'), 'win')).toEqual({ kind: 'shortcut', id: 'moveLeft' });
    expect(readKey(press('ArrowRight', { shiftKey: true }), 'mac')).toEqual({ kind: 'shortcut', id: 'extendRight' });
    expect(readKey(press('ArrowUp', { shiftKey: true }), 'win')).toEqual({ kind: 'shortcut', id: 'extendUp' });
  });

  it('needs exactly the right keys: an extra one, or Alt, is not the shortcut', () => {
    expect(readKey(press('z', { metaKey: true, shiftKey: true }), 'mac')).toBeNull();
    expect(readKey(press('z', { ctrlKey: true, shiftKey: true }), 'win')).toBeNull();
    expect(readKey(press('z', { metaKey: true, altKey: true }), 'mac')).toBeNull();
    expect(readKey(press('ArrowDown', { metaKey: true }), 'mac')).toBeNull();
  });

  it('reads typing keys, Shift symbols included, and leaves other keys alone', () => {
    expect(readKey(press('7'), 'mac')).toEqual({ kind: 'type', key: '7' });
    expect(readKey(press('$', { shiftKey: true }), 'win')).toEqual({ kind: 'type', key: '$' });
    expect(readKey(press('Enter'), 'mac')).toEqual({ kind: 'type', key: 'enter' });
    expect(readKey(press('Backspace'), 'win')).toEqual({ kind: 'type', key: 'backspace' });
    expect(readKey(press('Escape'), 'mac')).toEqual({ kind: 'escape' });
    // A plain space, a letter on its own and Tab are not the sheet's.
    expect(readKey(press(' '), 'mac')).toBeNull();
    expect(readKey(press('q'), 'win')).toBeNull();
    expect(readKey(press('Tab'), 'mac')).toBeNull();
  });
});

describe('carrying a key out on the sheet', () => {
  it('selects the row with Shift + Space, and the lesson sees it was the keys', () => {
    const c = make('A4');
    const result = applySheetKey(c, { kind: 'shortcut', id: 'selectRow' });
    expect(result).toEqual({ claimed: true, shortcut: 'selectRow' });
    expect(selected(c)).toBe('A4:C4');
    expect(c.actions()).toContain('combo:selectRow');
  });

  it('undoes a typed change with Cmd + Z', () => {
    const c = make('B2');
    c.startEdit();
    c.pressKey('backspace');
    c.pressKey('backspace');
    c.pressKey('backspace');
    c.pressKey('9');
    c.pressKey('enter');
    expect(c.sheet.getRaw(a1('B2'))).toBe('9');
    const read = readKey(press('z', { metaKey: true }), 'mac');
    expect(read).not.toBeNull();
    expect(applySheetKey(c, read!)).toEqual({ claimed: true, shortcut: 'undo' });
    expect(c.sheet.getRaw(a1('B2'))).toBe('115');
  });

  it('copies and pastes with the keys', () => {
    const c = make('B2');
    applySheetKey(c, { kind: 'shortcut', id: 'copy' });
    c.tapCell(a1('C5'));
    applySheetKey(c, { kind: 'shortcut', id: 'paste' });
    expect(c.sheet.getRaw(a1('C5'))).toBe('115');
  });

  it('asks for Enter first when a shortcut is pressed while typing, and does not count it', () => {
    const c = make('B3');
    c.startEdit();
    expect(applySheetKey(c, { kind: 'shortcut', id: 'selectRow' })).toEqual({ claimed: true, note: 'finishTyping' });
    expect(c.actions()).not.toContain('combo:selectRow');
    expect(c.getState().editing).not.toBeNull();
  });

  it('passes on the wrong modifier as a note, and changes nothing', () => {
    const c = make('B2');
    const read = readKey(press('z', { ctrlKey: true }), 'mac');
    expect(applySheetKey(c, read!)).toEqual({ claimed: true, note: { wrongModifier: 'undo', used: 'Ctrl', wanted: 'Cmd' } });
    expect(c.actions()).toEqual([]);
  });

  it('types into the cell, but leaves keys the lesson has hidden', () => {
    const c = make('B2');
    expect(applySheetKey(c, { kind: 'type', key: '4' })).toEqual({ claimed: true });
    expect(c.getState().editing?.text).toBe('4');
    expect(applySheetKey(c, { kind: 'type', key: '=' }, ['='])).toEqual({ claimed: false });
    expect(c.getState().editing?.text).toBe('4');
  });

  it('leaves Enter and Escape to a focused button when nothing is being typed', () => {
    const c = make('B2');
    expect(applySheetKey(c, { kind: 'type', key: 'enter' })).toEqual({ claimed: false });
    expect(applySheetKey(c, { kind: 'escape' })).toEqual({ claimed: false });
    c.startEdit();
    expect(applySheetKey(c, { kind: 'type', key: 'enter' })).toEqual({ claimed: true });
    expect(c.getState().editing).toBeNull();
  });
});

describe('listening on the way down', () => {
  /** A key event from the browser, aimed at a cell that has the focus. */
  const keydown = (key: string, held: Partial<Omit<KeyPress, 'key'>> = {}, target: object = { tagName: 'DIV' }) => {
    const event = Object.assign(new Event('keydown', { cancelable: true, bubbles: true }), press(key, held));
    Object.defineProperty(event, 'target', { value: target });
    return event;
  };

  it('listens before the focused cell does, and stops a key the sheet used', () => {
    const page = new EventTarget();
    const added: unknown[] = [];
    const spy = { addEventListener: (...args: unknown[]) => added.push(args[2]), removeEventListener: () => {} };
    listenForKeys(spy, () => true);
    // `true` is the capture phase: the window hears it before the cell under it.
    expect(added).toEqual([true]);

    const stop = listenForKeys(page, (e) => e.key === ' ' && e.shiftKey);
    const used = keydown(' ', { shiftKey: true });
    page.dispatchEvent(used);
    expect(used.defaultPrevented).toBe(true);
    expect(used.cancelBubble).toBe(true);
    stop();
  });

  it('lets a key the sheet did not use carry on to the focused button', () => {
    const page = new EventTarget();
    const stop = listenForKeys(page, () => false);
    const plain = keydown(' ');
    page.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBe(false);
    expect(plain.cancelBubble).toBe(false);
    stop();
  });

  it('never takes keys from a text box', () => {
    const page = new EventTarget();
    let heard = 0;
    const stop = listenForKeys(page, () => {
      heard += 1;
      return true;
    });
    page.dispatchEvent(keydown('7', {}, { tagName: 'INPUT' }));
    page.dispatchEvent(keydown('7', {}, { tagName: 'DIV', isContentEditable: true }));
    expect(heard).toBe(0);
    stop();
  });
});
