import type { ShortcutId } from './controller';

/** Which kind of computer the learner uses. It decides whether shortcuts say Ctrl or Cmd. */
export type Computer = 'win' | 'mac';

/**
 * A key that is held down while another is pressed. `mod` is Ctrl on Windows and Cmd on
 * a Mac; `ctrl` is the Ctrl key on both (Excel on a Mac uses it for a few shortcuts).
 */
export type HoldKey = 'mod' | 'ctrl' | 'shift';

/** The key pressed last: a letter, the space bar or an arrow. */
export type PressKey = string;

export const ARROWS = ['Left', 'Up', 'Down', 'Right'] as const;
export type Arrow = (typeof ARROWS)[number];

interface Shortcut {
  /** Held down first. Empty for a key that is pressed alone, such as an arrow. */
  hold: readonly HoldKey[];
  /** Pressed last: "A", "Space", "Down". */
  key: PressKey;
  /** What it does, in a couple of words. */
  does: string;
}

/** Every shortcut the app teaches. */
export const SHORTCUTS: Record<ShortcutId, Shortcut> = {
  selectAll: { hold: ['mod'], key: 'A', does: 'Select everything' },
  copy: { hold: ['mod'], key: 'C', does: 'Copy' },
  cut: { hold: ['mod'], key: 'X', does: 'Cut' },
  paste: { hold: ['mod'], key: 'V', does: 'Paste' },
  undo: { hold: ['mod'], key: 'Z', does: 'Undo' },
  bold: { hold: ['mod'], key: 'B', does: 'Bold' },
  selectColumn: { hold: ['ctrl'], key: 'Space', does: 'Select the whole column' },
  selectRow: { hold: ['shift'], key: 'Space', does: 'Select the whole row' },
  moveLeft: { hold: [], key: 'Left', does: 'Move one cell left' },
  moveUp: { hold: [], key: 'Up', does: 'Move one cell up' },
  moveDown: { hold: [], key: 'Down', does: 'Move one cell down' },
  moveRight: { hold: [], key: 'Right', does: 'Move one cell right' },
  extendLeft: { hold: ['shift'], key: 'Left', does: 'Stretch the selection left' },
  extendUp: { hold: ['shift'], key: 'Up', does: 'Stretch the selection up' },
  extendDown: { hold: ['shift'], key: 'Down', does: 'Stretch the selection down' },
  extendRight: { hold: ['shift'], key: 'Right', does: 'Stretch the selection right' },
};

/** The letters on the key caps strip, in the order they sit on a real keyboard's bottom rows. */
export const CAP_LETTERS = ['A', 'Z', 'X', 'C', 'V', 'B'] as const;

export const modifierKey = (computer: Computer): string => (computer === 'mac' ? 'Cmd' : 'Ctrl');

/** What is printed on a held key: "Ctrl", "Cmd", "Shift". */
export const holdLabel = (key: HoldKey, computer: Computer): string =>
  key === 'shift' ? 'Shift' : key === 'ctrl' ? 'Ctrl' : modifierKey(computer);

const ARROW_SIGNS: Record<Arrow, string> = { Left: '←', Up: '↑', Down: '↓', Right: '→' };
const isArrow = (key: PressKey): key is Arrow => (ARROWS as readonly string[]).includes(key);

/** What is printed on a pressed key: "A", "Space", "↓". */
export const keyLabel = (key: PressKey): string => (isArrow(key) ? ARROW_SIGNS[key] : key);

/** How a pressed key is said aloud: "A", "Space", "Down arrow". */
export const keyName = (key: PressKey): string => (isArrow(key) ? `${key} arrow` : key);

/** "Ctrl + A", "Cmd + A", "Shift + Space", "Shift + ↓". */
export const comboLabel = (id: ShortcutId, computer: Computer): string =>
  [...SHORTCUTS[id].hold.map((key) => holdLabel(key, computer)), keyLabel(SHORTCUTS[id].key)].join(' + ');

/**
 * The same, for text that is written before the computer is known: Ctrl-or-Cmd is left as
 * {mod}, for `forComputer` to fill in.
 */
export const comboText = (id: ShortcutId): string =>
  [...SHORTCUTS[id].hold.map((key) => (key === 'mod' ? '{mod}' : holdLabel(key, 'win'))), keyLabel(SHORTCUTS[id].key)].join(' + ');

/** The shortcut for a key pressed with exactly these keys held. Null if there is none. */
export function shortcutFor(key: PressKey, held: readonly HoldKey[]): ShortcutId | null {
  const wanted = key.length === 1 ? key.toUpperCase() : key;
  const found = (Object.keys(SHORTCUTS) as ShortcutId[]).find((id) => {
    const shortcut = SHORTCUTS[id];
    return shortcut.key === wanted && shortcut.hold.length === held.length && shortcut.hold.every((h) => held.includes(h));
  });
  return found ?? null;
}

/** True if the shortcut depends on the computer: Ctrl on one, Cmd on the other. */
export const needsComputer = (id: ShortcutId): boolean => SHORTCUTS[id].hold.includes('mod');

/**
 * Which strip of key caps a set of shortcuts needs: the letters (with Ctrl or Cmd), or
 * the keys for getting around (Ctrl, Shift, Space and the arrows).
 */
export type CapSet = 'letters' | 'moving';
export const capSetFor = (ids: readonly ShortcutId[]): CapSet =>
  ids.some((id) => SHORTCUTS[id].key.length === 1) ? 'letters' : 'moving';

/**
 * Words in a prompt or hint that depend on the computer. Lessons write {mod} and the
 * learner sees Ctrl or Cmd.
 */
export const forComputer = (text: string, computer: Computer): string => text.replace(/\{mod\}/g, modifierKey(computer));
