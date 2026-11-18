/** @jest-environment node */
import { a1, type SheetSpec } from '@/engine';

import { SheetController, type KeyId } from '../controller';

const spec: SheetSpec = {
  cols: 4,
  rows: 7,
  grid: [
    ['Day', 'Sales', 'Costs', 'Profit'],
    ['Mon', 120, 80],
    ['Tue', 95, 60],
    ['Wed', 140, 90],
  ],
};

const make = (select = 'D2') => new SheetController(spec, select);
const keys = (c: SheetController, ...ks: KeyId[]) => ks.forEach((k) => c.pressKey(k));
const text = (c: SheetController) => c.getState().editing?.text;

describe('SheetController', () => {
  it('selects on the first tap and starts typing on the second', () => {
    const c = make('A1');
    c.tapCell(a1('D2'));
    expect(c.getState().selection).toEqual(a1('D2'));
    expect(c.getState().editing).toBeNull();
    c.tapCell(a1('D2'));
    expect(text(c)).toBe('');
  });

  it('builds a formula by tapping cells', () => {
    const c = make();
    c.tapCell(a1('D2'));
    keys(c, '=');
    c.tapCell(a1('B2'));
    keys(c, '-');
    c.tapCell(a1('C2'));
    expect(text(c)).toBe('=B2-C2');
    keys(c, 'enter');
    expect(c.getState().editing).toBeNull();
    expect(c.sheet.getValue(a1('D2'))).toBe(40);
    expect(c.getState().selection).toEqual(a1('D2'));
  });

  it('swaps the reference when another cell is tapped straight after', () => {
    const c = make();
    keys(c, '=');
    c.tapCell(a1('B2'));
    c.tapCell(a1('B3'));
    expect(text(c)).toBe('=B3');
    keys(c, '+');
    c.tapCell(a1('B4'));
    c.tapCell(a1('C4'));
    expect(text(c)).toBe('=B3+C4');
  });

  it('builds a range with the colon key and closes the bracket on Enter', () => {
    const c = make('B6');
    keys(c, 'SUM');
    expect(text(c)).toBe('=SUM(');
    c.tapCell(a1('B2'));
    keys(c, ':');
    c.tapCell(a1('B4'));
    expect(text(c)).toBe('=SUM(B2:B4');
    keys(c, 'enter');
    expect(c.sheet.getRaw(a1('B6'))).toBe('=SUM(B2:B4)');
    expect(c.sheet.getValue(a1('B6'))).toBe(355);
  });

  it('adds SUM( to a formula already under way', () => {
    const c = make('B6');
    keys(c, '=', '1', '+', 'SUM');
    expect(text(c)).toBe('=1+SUM(');
  });

  it('removes a whole reference or function name with one backspace', () => {
    const c = make('B6');
    keys(c, 'SUM');
    c.tapCell(a1('B2'));
    keys(c, 'backspace');
    expect(text(c)).toBe('=SUM(');
    keys(c, 'backspace');
    expect(text(c)).toBe('=');
    keys(c, '1', '2', 'backspace');
    expect(text(c)).toBe('=1');
  });

  it('refuses a broken formula, says why, and keeps the work', () => {
    const c = make();
    keys(c, '=');
    c.tapCell(a1('B2'));
    keys(c, '+', 'enter');
    const editing = c.getState().editing;
    expect(editing?.text).toBe('=B2+');
    expect(editing?.error).toMatch(/stops too soon/);
    expect(c.sheet.getRaw(a1('D2'))).toBe('');
    c.tapCell(a1('C2'));
    keys(c, 'enter');
    expect(c.sheet.getValue(a1('D2'))).toBe(200);
  });

  it('typing over a selected cell replaces its contents', () => {
    const c = make('B2');
    keys(c, '5', '0', 'enter');
    expect(c.sheet.getValue(a1('B2'))).toBe(50);
  });

  it('tapping away from a finished value commits it and moves the selection', () => {
    const c = make('B2');
    keys(c, '7');
    c.tapCell(a1('C2'));
    expect(c.sheet.getValue(a1('B2'))).toBe(7);
    expect(c.getState().selection).toEqual(a1('C2'));
    expect(c.getState().editing).toBeNull();
  });

  it('ignores a tap on the cell being edited, so it cannot point at itself', () => {
    const c = make();
    keys(c, '=');
    c.tapCell(a1('D2'));
    expect(text(c)).toBe('=');
  });

  it('cancel leaves the cell untouched', () => {
    const c = make('B2');
    keys(c, '9');
    c.cancel();
    expect(c.getState().editing).toBeNull();
    expect(c.sheet.getValue(a1('B2'))).toBe(120);
  });

  it('tells listeners about every change and can be reset', () => {
    const c = make();
    let calls = 0;
    const stop = c.subscribe(() => calls++);
    keys(c, '=', '1', 'enter');
    expect(calls).toBe(3);
    const before = c.getState().version;
    c.reset(spec, 'A1');
    expect(c.getState().version).toBeGreaterThan(before);
    expect(c.sheet.getRaw(a1('D2'))).toBe('');
    stop();
  });

  describe('capture and restore', () => {
    /** A finished formula in D2, a changed number in B3, and a formula half typed in D3. */
    function worked() {
      const c = make();
      c.tapCell(a1('D2'));
      keys(c, '=');
      c.tapCell(a1('B2'));
      keys(c, '-');
      c.tapCell(a1('C2'));
      keys(c, 'enter');
      c.tapCell(a1('B3'));
      keys(c, '7', '0', 'enter');
      c.tapCell(a1('D3'));
      keys(c, '=');
      c.tapCell(a1('B3'));
      keys(c, '-');
      return c;
    }

    it('captures only what the learner changed, as plain data', () => {
      const capture = worked().capture();
      expect(capture).toEqual({ cells: { D2: '=B2-C2', B3: '70' }, selection: 'D3', editing: '=B3-' });
      expect(JSON.parse(JSON.stringify(capture))).toEqual(capture);
    });

    it('puts a sheet back exactly, half-typed formula included', () => {
      const saved = JSON.parse(JSON.stringify(worked().capture()));
      const c = make('A1');
      c.restore(saved);
      expect(c.sheet.getValue(a1('D2'))).toBe(40);
      expect(c.sheet.getValue(a1('B3'))).toBe(70);
      expect(c.sheet.getValue(a1('B4'))).toBe(140);
      expect(c.getState().selection).toEqual(a1('D3'));
      expect(text(c)).toBe('=B3-');
      // The learner carries straight on from where they stopped.
      c.tapCell(a1('C3'));
      keys(c, 'enter');
      expect(c.sheet.getValue(a1('D3'))).toBe(10);
    });

    it('restoring replaces whatever was there, and tells listeners', () => {
      const c = worked();
      const before = c.getState().version;
      c.restore({ cells: { D4: '=B4-C4' }, selection: 'D4', editing: null });
      expect(c.getState().version).toBeGreaterThan(before);
      expect(c.sheet.getRaw(a1('D2'))).toBe('');
      expect(c.sheet.getValue(a1('B3'))).toBe(95);
      expect(c.sheet.getValue(a1('D4'))).toBe(50);
      expect(c.getState().editing).toBeNull();
    });

    it('a cell the learner emptied stays empty', () => {
      const c = make('B2');
      keys(c, 'backspace', 'enter');
      const capture = c.capture();
      expect(capture.cells).toEqual({ B2: '' });
      const again = make();
      again.restore(capture);
      expect(again.sheet.getRaw(a1('B2'))).toBe('');
    });

    it('leaves out anything that no longer fits the sheet', () => {
      const c = make('D2');
      c.restore({ cells: { Z99: '5', nonsense: '1', D2: '=B2' }, selection: 'Q40', editing: null });
      expect(c.sheet.getValue(a1('D2'))).toBe(120);
      expect(c.getState().selection).toEqual(a1('D2'));
    });

    it('measures from the sheet it was last reset to', () => {
      const c = make();
      c.reset({ ...spec, cells: { D2: '=B2-C2' } }, 'D3');
      expect(c.capture()).toEqual({ cells: {}, selection: 'D3', editing: null });
    });
  });
});
