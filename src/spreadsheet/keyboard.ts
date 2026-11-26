import { DIGIT_KEYS, SYMBOL_KEYS, type KeyId, type SheetController, type ShortcutId } from './controller';
import { modifierKey, shortcutFor, type Computer, type HoldKey, type PressKey } from './shortcuts';

/**
 * One way into the sheet for every keyboard: the learner's real keys on the web, and (in
 * time) the on-screen keyboard. A key press is read once into a `SheetKey`, then
 * `applySheetKey` carries it out on the controller. Nothing here knows about React.
 */

/** The parts of a browser key event that matter here. */
export interface KeyPress {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

export type SheetKey =
  /** A shortcut the sheet knows, pressed with exactly the right keys for this computer. */
  | { kind: 'shortcut'; id: ShortcutId }
  /** A shortcut's key with the other computer's modifier: Ctrl + Z on a Mac, say. */
  | { kind: 'wrongModifier'; id: ShortcutId; used: string; wanted: string }
  /** A key that types or edits: digits, symbols, Backspace, Enter. */
  | { kind: 'type'; key: KeyId }
  | { kind: 'escape' };

const TYPED = new Set<string>([...DIGIT_KEYS, ...SYMBOL_KEYS]);

/** The name the shortcut table uses for a key: "Space", "Down", "Z". Null for anything else. */
export function pressKeyOf(key: string): PressKey | null {
  if (key === ' ' || key === 'Spacebar') return 'Space';
  if (key.startsWith('Arrow')) return key.slice(5);
  return key.length === 1 ? key.toUpperCase() : null;
}

/**
 * The shortcut for a key and the keys held with it, read the way this computer reads them.
 * On Windows the Ctrl key is both `mod` and `ctrl`. On a Mac, Cmd is `mod` and Ctrl is
 * its own key (Excel there uses it for Ctrl + Space).
 */
function shortcutHeld(key: PressKey, e: KeyPress, computer: Computer): ShortcutId | null {
  const shift: HoldKey[] = e.shiftKey ? ['shift'] : [];
  if (computer === 'mac') {
    const held: HoldKey[] = [...shift, ...(e.metaKey ? (['mod'] as const) : []), ...(e.ctrlKey ? (['ctrl'] as const) : [])];
    return shortcutFor(key, held);
  }
  // The Windows key belongs to the system, not to the spreadsheet.
  if (e.metaKey) return null;
  if (!e.ctrlKey) return shortcutFor(key, shift);
  return shortcutFor(key, [...shift, 'mod']) ?? shortcutFor(key, [...shift, 'ctrl']);
}

/** Reads a key press into what it means for the sheet, or null if it means nothing to it. */
export function readKey(e: KeyPress, computer: Computer): SheetKey | null {
  if (e.altKey) return null;
  const key = pressKeyOf(e.key);
  if (key) {
    const id = shortcutHeld(key, e, computer);
    if (id) return { kind: 'shortcut', id };
    // The same key with the other computer's modifier: worth a word, not an action.
    const swapped = computer === 'mac' ? e.ctrlKey && !e.metaKey : e.metaKey && !e.ctrlKey;
    if (swapped) {
      const other = shortcutFor(key, [...(e.shiftKey ? (['shift'] as const) : []), 'mod']);
      if (other) return { kind: 'wrongModifier', id: other, used: computer === 'mac' ? 'Ctrl' : 'Windows', wanted: modifierKey(computer) };
    }
  }
  if (e.ctrlKey || e.metaKey) return null;
  if (e.key === 'Escape') return { kind: 'escape' };
  if (e.key === 'Enter') return { kind: 'type', key: 'enter' };
  if (e.key === 'Backspace') return { kind: 'type', key: 'backspace' };
  if (TYPED.has(e.key)) return { kind: 'type', key: e.key as KeyId };
  return null;
}

export type KeyResult =
  /** Nothing happened, so the key is left for whatever else wants it (a focused button, say). */
  | { claimed: false }
  | { claimed: true; shortcut?: ShortcutId; note?: 'finishTyping' | { wrongModifier: ShortcutId; used: string; wanted: string } };

/**
 * Carries out a key on the sheet. `hidden` are keys the lesson keeps off its keyboard
 * (no formulas before formulas are taught), so they do nothing on a real keyboard either.
 */
export function applySheetKey(controller: SheetController, key: SheetKey, hidden: readonly KeyId[] = []): KeyResult {
  const editing = controller.getState().editing !== null;
  switch (key.kind) {
    case 'shortcut':
      // While typing in a cell only Undo works (it stops the typing, as in Excel).
      return controller.runShortcut(key.id) ? { claimed: true, shortcut: key.id } : { claimed: true, note: 'finishTyping' };
    case 'wrongModifier':
      return { claimed: true, note: { wrongModifier: key.id, used: key.used, wanted: key.wanted } };
    case 'escape':
      if (!editing) return { claimed: false };
      controller.cancel();
      return { claimed: true };
    case 'type':
      // Enter with nothing being typed belongs to whatever has the focus.
      if (key.key === 'enter' && !editing) return { claimed: false };
      if (hidden.includes(key.key)) return { claimed: false };
      controller.pressKey(key.key);
      return { claimed: true };
  }
}

/** True for a place where the browser's own typing should win: a text box. */
function isTextField(target: unknown): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true);
}

/**
 * Listens for key presses on `target` (the window) before anything inside it sees them.
 *
 * This matters on the web: every cell and key cap is a button, and a focused button takes
 * Space and Enter for itself and stops them going any further. Listening on the way down
 * means Shift + Space reaches the sheet even when a cell was just clicked. A key the
 * sheet uses is stopped there, so the focused button is not pressed as well.
 */
export function listenForKeys(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  handle: (e: KeyPress) => boolean,
): () => void {
  const onKeyDown = (event: Event) => {
    const e = event as unknown as KeyPress & Event;
    if (isTextField(e.target)) return;
    if (!handle(e)) return;
    e.preventDefault();
    e.stopPropagation();
  };
  target.addEventListener('keydown', onKeyDown, true);
  return () => target.removeEventListener('keydown', onKeyDown, true);
}
