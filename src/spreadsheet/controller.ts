import {
  cellsInRange,
  checkFormula,
  closeBrackets,
  FUNCTIONS,
  inRange,
  isFormulaText,
  normalizeRange,
  parseA1,
  parseRange,
  range as rangeOf,
  sameCell,
  sameRange,
  Sheet,
  shiftFormula,
  singleCell,
  toA1,
  rangeToA1,
  a1,
  type CellAddr,
  type CellData,
  type CellFormat,
  type RangeAddr,
  type SheetSnapshot,
  type SheetSpec,
} from '@/engine';

export const DIGIT_KEYS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
export const SYMBOL_KEYS = ['.', '=', '+', '-', '*', '/', '(', ')', ':', ',', '$'] as const;
export const FUNCTION_KEYS = ['SUM'] as const;

export type KeyId =
  | (typeof DIGIT_KEYS)[number]
  | (typeof SYMBOL_KEYS)[number]
  | (typeof FUNCTION_KEYS)[number]
  | 'backspace'
  | 'enter';

/** The buttons a task can put above the keyboard. `fill` is the handle on the selection's corner. */
export const TOOL_IDS = ['undo', 'autosum', 'bold', 'currency', 'percent', 'sortAsc', 'sortDesc', 'copy', 'cut', 'paste', 'fill'] as const;
export type ToolId = (typeof TOOL_IDS)[number];

/** Things a keyboard shortcut can do. */
export const SHORTCUT_IDS = [
  'selectAll',
  'copy',
  'cut',
  'paste',
  'undo',
  'bold',
  'selectColumn',
  'selectRow',
  'moveLeft',
  'moveUp',
  'moveDown',
  'moveRight',
  'extendLeft',
  'extendUp',
  'extendDown',
  'extendRight',
] as const;
export type ShortcutId = (typeof SHORTCUT_IDS)[number];

export interface EditState {
  /** What is in the formula bar right now. */
  text: string;
  /**
   * The reference most recently put in by tapping a cell. Tapping a different cell
   * swaps it, the way pointing at cells works in Excel.
   */
  pointed: { start: number; end: number } | null;
  /** Why the last Enter was refused, in plain English. */
  error: string | null;
}

export interface SheetViewState {
  /** Goes up on every change to the sheet's contents. */
  version: number;
  /** The active cell: the one the formula bar shows and typing goes into. */
  selection: CellAddr;
  /** Everything that is selected. One cell most of the time. */
  range: RangeAddr;
  editing: EditState | null;
  /** What has been copied or cut and not yet dropped, shown with a moving dashed outline. */
  clipboard: { range: RangeAddr; cut: boolean } | null;
  canUndo: boolean;
}

/**
 * A sheet as the learner left it, small enough to save: only the cells that differ from
 * the sheet the exercise opened with, so saved work still fits if the lesson's data is edited.
 */
export interface SheetCapture {
  /** Cell address to exactly what was typed there. */
  cells: Record<string, string>;
  selection: string;
  /** What is half typed in the formula bar, if anything. */
  editing: string | null;
  /** The selected range, when it is more than the one cell. */
  range?: string;
  /** Cells whose bold or number format the learner changed. */
  formats?: Record<string, CellFormat>;
}

const POINTABLE_AFTER = '=+-*/^&(,:<>';
const TRAILING_REF = /\$?[A-Z]{1,3}\$?[1-9][0-9]*$/;
const TRAILING_FUNCTION = /[A-Z][A-Z0-9.]*\($/;
const TRAILING_TEXT = /"[^"]*"$/;
const UNDO_LIMIT = 50;

interface Remembered {
  cells: SheetSnapshot;
  selection: CellAddr;
  range: RangeAddr;
}

const sameFormat = (a: CellFormat, b: CellFormat): boolean =>
  !!a.bold === !!b.bold && (a.numFmt ?? 'general') === (b.numFmt ?? 'general');

const mod = (n: number, by: number): number => ((n % by) + by) % by;

/** The next way of locking a reference with $, in the order Excel's F4 key goes through them. */
export function nextLock(ref: string): string {
  const m = /^(\$?)([A-Z]{1,3})(\$?)([1-9][0-9]*)$/.exec(ref);
  if (!m) return ref;
  const col = m[1] === '$';
  const row = m[3] === '$';
  const [nextCol, nextRow] = !col && !row ? [true, true] : col && row ? [false, true] : !col && row ? [true, false] : [false, false];
  return `${nextCol ? '$' : ''}${m[2]}${nextRow ? '$' : ''}${m[4]}`;
}

/**
 * Where a fill ends up when the handle on `src` is dragged to `target`: `src` stretched
 * down, up or across, whichever way the finger went furthest. Null if it never left `src`.
 */
export function fillArea(src: RangeAddr, target: CellAddr): RangeAddr | null {
  if (inRange(target, src)) return null;
  const below = target.row - src.end.row;
  const above = src.start.row - target.row;
  const right = target.col - src.end.col;
  const left = src.start.col - target.col;
  if (Math.max(below, above) >= Math.max(right, left)) {
    return {
      start: { col: src.start.col, row: Math.min(src.start.row, target.row) },
      end: { col: src.end.col, row: Math.max(src.end.row, target.row) },
    };
  }
  return {
    start: { col: Math.min(src.start.col, target.col), row: src.start.row },
    end: { col: Math.max(src.end.col, target.col), row: src.end.row },
  };
}

/**
 * Everything the learner can do to a sheet, as plain methods with no React in sight.
 * The grid, formula bar and keyboard call these; so does the demo player when it shows
 * how something is done, which is why a demo always behaves exactly like the real thing.
 */
export class SheetController {
  sheet: Sheet;
  private state: SheetViewState;
  private listeners = new Set<() => void>();
  /** The sheet this one started from, which is what `capture` and `restore` measure against. */
  private spec: SheetSpec;
  private select: string;
  private history: Remembered[] = [];
  /**
   * Things done since the learner's turn began, oldest first: "combo:copy" for a shortcut,
   * "undo" for a step taken back. Some tasks are about the doing, not the end result.
   */
  private done: string[] = [];

  constructor(spec: SheetSpec, select = 'A1') {
    this.spec = spec;
    this.select = select;
    this.sheet = Sheet.fromSpec(spec);
    this.state = this.fresh(0, a1(select));
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): SheetViewState => this.state;

  /** Throws the current sheet away and starts again from `spec`. */
  reset(spec: SheetSpec, select = 'A1'): void {
    this.spec = spec;
    this.select = select;
    this.sheet = Sheet.fromSpec(spec);
    this.history = [];
    this.done = [];
    this.set(this.fresh(this.state.version + 1, a1(select)));
  }

  /** Everything needed to put the sheet back exactly as it is now, half-typed formula included. */
  capture(): SheetCapture {
    const start = Sheet.fromSpec(this.spec);
    const cells: Record<string, string> = {};
    const formats: Record<string, CellFormat> = {};
    for (let row = 0; row < this.sheet.rows; row++) {
      for (let col = 0; col < this.sheet.cols; col++) {
        const addr = { col, row };
        const raw = this.sheet.getRaw(addr);
        if (raw !== start.getRaw(addr)) cells[toA1(addr)] = raw;
        if (!sameFormat(this.sheet.getFormat(addr), start.getFormat(addr))) formats[toA1(addr)] = this.sheet.getFormat(addr);
      }
    }
    const { selection, range, editing } = this.state;
    const out: SheetCapture = { cells, selection: toA1(selection), editing: editing?.text ?? null };
    if (!sameRange(range, singleCell(selection))) out.range = rangeToA1(range);
    if (Object.keys(formats).length > 0) out.formats = formats;
    return out;
  }

  /** Puts back what `capture` took. Anything that no longer fits the sheet is quietly left out. */
  restore(capture: SheetCapture): void {
    const sheet = Sheet.fromSpec(this.spec);
    for (const [key, raw] of Object.entries(capture.cells)) {
      const addr = parseA1(key);
      if (addr && sheet.inBounds(addr) && typeof raw === 'string') sheet.setRaw(addr, raw);
    }
    for (const [key, format] of Object.entries(capture.formats ?? {})) {
      const addr = parseA1(key);
      if (addr && sheet.inBounds(addr) && format && typeof format === 'object') sheet.replaceFormat(addr, format);
    }
    const wanted = parseA1(capture.selection);
    const selection = wanted && sheet.inBounds(wanted) ? wanted : a1(this.select);
    const area = typeof capture.range === 'string' ? parseRange(capture.range) : null;
    const range = area && sheet.inBounds(area.end) && inRange(selection, area) ? area : singleCell(selection);
    this.sheet = sheet;
    this.history = [];
    this.set({
      ...this.fresh(this.state.version + 1, selection),
      range,
      editing: typeof capture.editing === 'string' ? { text: capture.editing, pointed: null, error: null } : null,
    });
  }

  /** A tap on a cell: select it, start typing in it, or point a formula at it. */
  tapCell(addr: CellAddr): void {
    if (!this.sheet.inBounds(addr)) return;
    const { editing, selection, range } = this.state;
    if (!editing) {
      const alone = sameRange(range, singleCell(selection));
      if (sameCell(addr, selection) && alone) this.startEdit();
      else this.set({ ...this.state, selection: addr, range: singleCell(addr) });
      return;
    }
    if (sameCell(addr, selection)) return;
    if (this.canPoint(editing)) {
      this.point(editing, toA1(addr));
      return;
    }
    if (this.commit()) this.set({ ...this.state, selection: addr, range: singleCell(addr) });
  }

  /**
   * A finger dragged from one cell to another. With nothing being typed it selects the
   * block between them; in the middle of a formula it points the formula at that block.
   */
  drag(from: CellAddr, to: CellAddr): void {
    if (!this.sheet.inBounds(from) || !this.sheet.inBounds(to)) return;
    const { editing, selection } = this.state;
    const area = normalizeRange(from, to);
    if (!editing) {
      if (sameCell(from, selection) && sameRange(area, this.state.range)) return;
      this.set({ ...this.state, selection: from, range: area });
      return;
    }
    if (inRange(selection, area) || !this.canPoint(editing)) return;
    this.point(editing, rangeToA1(area));
  }

  /** Selects a block by name ("B2:B6"), as a drag across it would. */
  selectRange(text: string): void {
    const area = rangeOf(text);
    this.drag(area.start, area.end);
  }

  selectAll(): void {
    if (this.state.editing) return;
    const all = { start: { col: 0, row: 0 }, end: { col: this.sheet.cols - 1, row: this.sheet.rows - 1 } };
    this.set({ ...this.state, range: all });
  }

  /** Selects the whole column the active cell is in, top to bottom. */
  selectColumn(): void {
    if (this.state.editing) return;
    const { col } = this.state.selection;
    this.set({ ...this.state, range: { start: { col, row: 0 }, end: { col, row: this.sheet.rows - 1 } } });
  }

  /** Selects the whole row the active cell is in, side to side. */
  selectRow(): void {
    if (this.state.editing) return;
    const { row } = this.state.selection;
    this.set({ ...this.state, range: { start: { col: 0, row }, end: { col: this.sheet.cols - 1, row } } });
  }

  /** An arrow key: the active cell moves one cell over, and only it is selected. */
  move(dCol: number, dRow: number): void {
    if (this.state.editing) return;
    const { selection } = this.state;
    const to = { col: selection.col + dCol, row: selection.row + dRow };
    if (!this.sheet.inBounds(to)) return;
    this.set({ ...this.state, selection: to, range: singleCell(to) });
  }

  /**
   * Shift and an arrow key: the active cell stays put and the far edge of the selection
   * moves one cell, so the block grows (or shrinks back) from where it started.
   */
  extend(dCol: number, dRow: number): void {
    if (this.state.editing) return;
    const { selection, range } = this.state;
    // The edge that moves is the one away from the active cell.
    const far = {
      col: selection.col === range.start.col ? range.end.col : range.start.col,
      row: selection.row === range.start.row ? range.end.row : range.start.row,
    };
    const to = { col: far.col + dCol, row: far.row + dRow };
    if (!this.sheet.inBounds(to)) return;
    this.set({ ...this.state, range: normalizeRange(selection, to) });
  }

  /** Begins typing in the selected cell, keeping what is already there. */
  startEdit(): void {
    if (this.state.editing) return;
    const { selection } = this.state;
    this.set({
      ...this.state,
      range: singleCell(selection),
      editing: { text: this.sheet.getRaw(selection), pointed: null, error: null },
    });
  }

  pressKey(key: KeyId): void {
    if (key === 'enter') {
      if (this.state.editing) this.commit();
      return;
    }
    // Typing with a cell selected replaces what was in it, as in Excel.
    const editing = this.state.editing ?? { text: '', pointed: null, error: null };
    let text = editing.text;
    if (key === 'backspace') {
      const chunk = TRAILING_REF.exec(text) ?? TRAILING_FUNCTION.exec(text) ?? TRAILING_TEXT.exec(text);
      // References, function names and ready-made words go in as one tap, so they come out as one tap.
      text = text.slice(0, text.length - (chunk ? chunk[0].length : 1));
    } else if ((FUNCTION_KEYS as readonly string[]).includes(key)) {
      text += `${text === '' ? '=' : ''}${key}(`;
    } else if (key === '$' && isFormulaText(text) && TRAILING_REF.test(text)) {
      // On a reference just put in, $ locks it, the way F4 does on a keyboard:
      // B2, $B$2, B$2, $B2, and back to B2.
      const ref = (TRAILING_REF.exec(text) as RegExpExecArray)[0];
      text = text.slice(0, text.length - ref.length) + nextLock(ref);
    } else {
      text += key;
    }
    this.type(text);
  }

  /**
   * A ready-made piece from the row above the keys: a function name (which brings its
   * opening bracket, and the = if the cell is empty) or a word or sign such as "Hit" or >.
   */
  pressChip(chip: string): void {
    const text = this.state.editing?.text ?? '';
    const isFunction = chip.toUpperCase() in FUNCTIONS;
    this.type(isFunction ? `${text}${text === '' ? '=' : ''}${chip.toUpperCase()}(` : text + chip);
  }

  /** Enter. Returns false, and stays in the cell, if the formula can't be accepted. */
  commit(): boolean {
    const { editing, selection } = this.state;
    if (!editing) return true;
    let text = editing.text;
    if (isFormulaText(text)) {
      text = closeBrackets(text);
      const check = checkFormula(text);
      if (!check.ok) {
        this.set({ ...this.state, editing: { ...editing, text, pointed: null, error: check.message } });
        return false;
      }
    }
    this.remember();
    this.sheet.setRaw(selection, text);
    this.changed({ range: singleCell(selection), editing: null });
    return true;
  }

  /** Escape: stop typing and leave the cell as it was. */
  cancel(): void {
    if (this.state.editing) this.set({ ...this.state, editing: null });
  }

  // ---- beyond typing: fill, AutoSum, formats, sort, undo, copy and paste -----------------

  /**
   * Dragging the handle on the corner of the selection to `target`: the selected cells
   * are repeated down, up or across to reach it. Formulas move their references with
   * them, except the parts pinned with $.
   */
  fillTo(target: CellAddr): boolean {
    if (this.state.editing || !this.sheet.inBounds(target)) return false;
    const src = this.state.range;
    const dest = fillArea(src, target);
    if (!dest) return false;

    const cols = src.end.col - src.start.col + 1;
    const rows = src.end.row - src.start.row + 1;
    this.remember();
    for (const addr of cellsInRange(dest)) {
      if (inRange(addr, src)) continue;
      const from = {
        col: src.start.col + mod(addr.col - src.start.col, cols),
        row: src.start.row + mod(addr.row - src.start.row, rows),
      };
      this.sheet.setRaw(addr, shiftFormula(this.sheet.getRaw(from), addr.col - from.col, addr.row - from.row));
      this.sheet.replaceFormat(addr, this.sheet.getFormat(from));
    }
    this.changed({ range: dest });
    return true;
  }

  /** Fills the selection out to cover the named block ("D2:D6"), as dragging the handle would. */
  fill(text: string): boolean {
    const area = rangeOf(text);
    const src = this.state.range;
    const far = sameCell(area.start, src.start) ? area.end : area.start;
    return this.fillTo(far);
  }

  /**
   * The AutoSum button: proposes =SUM( over the run of numbers above the cell, or to its
   * left if there are none above. The range stays open to be changed by tapping; Enter accepts it.
   */
  autoSum(): void {
    if (this.state.editing) return;
    const { selection } = this.state;
    const isNumber = (addr: CellAddr) => this.sheet.inBounds(addr) && typeof this.sheet.getValue(addr) === 'number';
    let top = selection.row;
    while (isNumber({ col: selection.col, row: top - 1 })) top--;
    let first = selection.col;
    while (isNumber({ col: first - 1, row: selection.row })) first--;

    let area: string | null = null;
    if (top < selection.row) area = `${toA1({ col: selection.col, row: top })}:${toA1({ col: selection.col, row: selection.row - 1 })}`;
    else if (first < selection.col) area = `${toA1({ col: first, row: selection.row })}:${toA1({ col: selection.col - 1, row: selection.row })}`;
    const text = `=SUM(${area ?? ''}`;
    this.set({
      ...this.state,
      range: singleCell(selection),
      editing: { text, pointed: area ? { start: 5, end: text.length } : null, error: null },
    });
  }

  toggleBold(): void {
    if (this.state.editing) return;
    const cells = cellsInRange(this.state.range);
    const allBold = cells.every((addr) => this.sheet.getFormat(addr).bold);
    this.remember();
    for (const addr of cells) this.sheet.replaceFormat(addr, { ...this.sheet.getFormat(addr), bold: !allBold });
    this.changed({});
  }

  /** Shows the selected numbers as money or as a percentage. Pressing it again turns it off. */
  toggleNumFmt(fmt: 'currency' | 'percent'): void {
    if (this.state.editing) return;
    const cells = cellsInRange(this.state.range);
    const allSet = cells.every((addr) => this.sheet.getFormat(addr).numFmt === fmt);
    this.remember();
    for (const addr of cells) {
      this.sheet.replaceFormat(addr, { ...this.sheet.getFormat(addr), numFmt: allSet ? 'general' : fmt });
    }
    this.changed({});
  }

  /** Sorts the table by the column of the selected cell. Its heading row stays where it is. */
  sort(descending: boolean): boolean {
    if (this.state.editing) return false;
    const { selection } = this.state;
    const pinned = this.spec.table ? rangeOf(this.spec.table) : null;
    const table = pinned && inRange(selection, pinned) ? pinned : this.regionAround(selection);
    const hasHeading = pinned !== null || this.looksLikeHeading(table);
    const body: RangeAddr = { start: { col: table.start.col, row: table.start.row + (hasHeading ? 1 : 0) }, end: table.end };
    if (body.end.row <= body.start.row) return false;
    this.remember();
    this.sheet.sortRows(body, selection.col, descending);
    this.changed({});
    return true;
  }

  undo(): boolean {
    if (this.state.editing) {
      this.cancel();
      return true;
    }
    const last = this.history.pop();
    if (!last) return false;
    this.done.push('undo');
    this.sheet.restore(last.cells);
    this.set({
      version: this.state.version + 1,
      selection: last.selection,
      range: last.range,
      editing: null,
      clipboard: null,
      canUndo: this.history.length > 0,
    });
    return true;
  }

  copy(): void {
    if (!this.state.editing) this.set({ ...this.state, clipboard: { range: this.state.range, cut: false } });
  }

  cut(): void {
    if (!this.state.editing) this.set({ ...this.state, clipboard: { range: this.state.range, cut: true } });
  }

  /**
   * Drops what was copied or cut with its top-left corner on the selected cell. A copied
   * formula moves its references with it; a cut one keeps pointing where it did.
   */
  paste(): boolean {
    const clip = this.state.clipboard;
    if (!clip || this.state.editing) return false;
    const { selection } = this.state;
    const dCol = selection.col - clip.range.start.col;
    const dRow = selection.row - clip.range.start.row;
    const picked: { addr: CellAddr; data: CellData }[] = cellsInRange(clip.range).map((addr) => ({
      addr,
      data: { raw: this.sheet.getRaw(addr), format: this.sheet.getFormat(addr) },
    }));
    this.remember();
    if (clip.cut) {
      for (const { addr } of picked) {
        this.sheet.setRaw(addr, '');
        this.sheet.replaceFormat(addr, {});
      }
    }
    let end = selection;
    for (const { addr, data } of picked) {
      const to = { col: addr.col + dCol, row: addr.row + dRow };
      if (!this.sheet.inBounds(to)) continue;
      this.sheet.setRaw(to, clip.cut ? data.raw : shiftFormula(data.raw, dCol, dRow));
      this.sheet.replaceFormat(to, data.format ?? {});
      end = { col: Math.max(end.col, to.col), row: Math.max(end.row, to.row) };
    }
    this.changed({ range: { start: selection, end }, clipboard: clip.cut ? null : clip });
    return true;
  }

  /** A button on the toolbar. */
  runTool(tool: ToolId): void {
    if (tool === 'undo') this.undo();
    else if (tool === 'autosum') this.autoSum();
    else if (tool === 'bold') this.toggleBold();
    else if (tool === 'currency' || tool === 'percent') this.toggleNumFmt(tool);
    else if (tool === 'sortAsc') this.sort(false);
    else if (tool === 'sortDesc') this.sort(true);
    else if (tool === 'copy') this.copy();
    else if (tool === 'cut') this.cut();
    else if (tool === 'paste') this.paste();
  }

  /** A keyboard shortcut, from the key caps on screen or a real keyboard. */
  /**
   * Runs a shortcut. Returns false, and leaves no record, when it can't work right now:
   * while a cell is being typed in, only Undo does anything (it stops the typing). So a
   * lesson's "use the keys" check only passes for a press that really did something.
   */
  runShortcut(id: ShortcutId): boolean {
    if (this.state.editing && id !== 'undo') return false;
    this.done.push(`combo:${id}`);
    if (id === 'selectAll') this.selectAll();
    else if (id === 'copy') this.copy();
    else if (id === 'cut') this.cut();
    else if (id === 'paste') this.paste();
    else if (id === 'undo') this.undo();
    else if (id === 'bold') this.toggleBold();
    else if (id === 'selectColumn') this.selectColumn();
    else if (id === 'selectRow') this.selectRow();
    else if (id === 'moveLeft') this.move(-1, 0);
    else if (id === 'moveUp') this.move(0, -1);
    else if (id === 'moveDown') this.move(0, 1);
    else if (id === 'moveRight') this.move(1, 0);
    else if (id === 'extendLeft') this.extend(-1, 0);
    else if (id === 'extendUp') this.extend(0, -1);
    else if (id === 'extendDown') this.extend(0, 1);
    else if (id === 'extendRight') this.extend(1, 0);
    return true;
  }

  /** What has been done so far, for tasks that are about the doing and not just the result. */
  actions(): readonly string[] {
    return this.done;
  }

  /** Starts the record afresh, as the learner's own turn begins. */
  forgetActions(): void {
    this.done = [];
  }

  // ---- inside ------------------------------------------------------------------------

  private fresh(version: number, selection: CellAddr): SheetViewState {
    return { version, selection, range: singleCell(selection), editing: null, clipboard: null, canUndo: false };
  }

  private type(text: string): void {
    const { selection } = this.state;
    this.set({ ...this.state, range: singleCell(selection), editing: { text, pointed: null, error: null } });
  }

  /** Keeps the sheet as it is now, so the next change can be undone. */
  private remember(): void {
    this.history.push({ cells: this.sheet.snapshot(), selection: this.state.selection, range: this.state.range });
    if (this.history.length > UNDO_LIMIT) this.history.shift();
  }

  /** The sheet's contents changed: bump the version. Copying is called off unless told otherwise. */
  private changed(patch: Partial<SheetViewState>): void {
    this.set({ ...this.state, clipboard: null, ...patch, version: this.state.version + 1, canUndo: this.history.length > 0 });
  }

  /** The block of filled cells that touches `addr`: what Excel calls the current region. */
  private regionAround(addr: CellAddr): RangeAddr {
    const filled = (col: number, row: number) => this.sheet.inBounds({ col, row }) && this.sheet.getRaw({ col, row }) !== '';
    const area = { start: { ...addr }, end: { ...addr } };
    let grew = true;
    while (grew) {
      grew = false;
      const anyInRow = (row: number) => {
        for (let col = area.start.col - 1; col <= area.end.col + 1; col++) if (filled(col, row)) return true;
        return false;
      };
      const anyInCol = (col: number) => {
        for (let row = area.start.row - 1; row <= area.end.row + 1; row++) if (filled(col, row)) return true;
        return false;
      };
      if (area.start.row > 0 && anyInRow(area.start.row - 1)) {
        area.start.row--;
        grew = true;
      }
      if (area.end.row < this.sheet.rows - 1 && anyInRow(area.end.row + 1)) {
        area.end.row++;
        grew = true;
      }
      if (area.start.col > 0 && anyInCol(area.start.col - 1)) {
        area.start.col--;
        grew = true;
      }
      if (area.end.col < this.sheet.cols - 1 && anyInCol(area.end.col + 1)) {
        area.end.col++;
        grew = true;
      }
    }
    return area;
  }

  /** A first row of words above a row with at least one number in it. */
  private looksLikeHeading(table: RangeAddr): boolean {
    if (table.end.row === table.start.row) return false;
    let numberBelow = false;
    for (let col = table.start.col; col <= table.end.col; col++) {
      if (typeof this.sheet.getValue({ col, row: table.start.row }) !== 'string') return false;
      if (typeof this.sheet.getValue({ col, row: table.start.row + 1 }) === 'number') numberBelow = true;
    }
    return numberBelow;
  }

  private canPoint(editing: EditState): boolean {
    const { text, pointed } = editing;
    if (!isFormulaText(text)) return false;
    if (pointed && pointed.end === text.length) return true;
    return POINTABLE_AFTER.includes(text[text.length - 1]);
  }

  private point(editing: EditState, ref: string): void {
    const replacing = editing.pointed && editing.pointed.end === editing.text.length;
    const base = replacing ? editing.text.slice(0, editing.pointed!.start) : editing.text;
    this.set({
      ...this.state,
      editing: { text: base + ref, pointed: { start: base.length, end: base.length + ref.length }, error: null },
    });
  }

  private set(next: SheetViewState): void {
    this.state = next;
    for (const listener of this.listeners) listener();
  }
}
