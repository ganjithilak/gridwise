import type { GameData, GameLevelRecord } from '@/progress/saved';
import { holdLabel, keyLabel, type Computer, type HoldKey, type PressKey } from '@/spreadsheet/shortcuts';

/**
 * Speed Trial: a task is named, and the learner presses the keyboard shortcut for it,
 * against the clock. Shortcuts are learned by recall and repetition, so this is the one
 * place in the app with a timer. It is a game on the Practice tab, never part of a lesson.
 */

export interface GameShortcut {
  id: string;
  /** Held down first. `mod` is Ctrl on Windows and Cmd on a Mac. */
  hold: readonly HoldKey[];
  key: PressKey;
  /** The task as it is put to the player. */
  task: string;
}

export const GAME_SHORTCUTS: readonly GameShortcut[] = [
  { id: 'copy', hold: ['mod'], key: 'C', task: 'Copy the selected cells' },
  { id: 'paste', hold: ['mod'], key: 'V', task: 'Paste what you copied' },
  { id: 'undo', hold: ['mod'], key: 'Z', task: 'Undo your last step' },
  { id: 'cut', hold: ['mod'], key: 'X', task: 'Cut the selected cells' },
  { id: 'selectAll', hold: ['mod'], key: 'A', task: 'Select the whole sheet' },
  { id: 'bold', hold: ['mod'], key: 'B', task: 'Make the selection bold' },
  { id: 'redo', hold: ['mod'], key: 'Y', task: 'Redo what you just undid' },
  { id: 'selectColumn', hold: ['ctrl'], key: 'Space', task: 'Select the whole column' },
  { id: 'selectRow', hold: ['shift'], key: 'Space', task: 'Select the whole row' },
  { id: 'extendDown', hold: ['shift'], key: 'Down', task: 'Stretch the selection down' },
  { id: 'extendUp', hold: ['shift'], key: 'Up', task: 'Stretch the selection up' },
  { id: 'extendRight', hold: ['shift'], key: 'Right', task: 'Stretch the selection right' },
  { id: 'extendLeft', hold: ['shift'], key: 'Left', task: 'Stretch the selection left' },
];

export interface GameLevel {
  id: string;
  title: string;
  /** The shortcuts this level adds to the ones before it. */
  adds: readonly string[];
}

/** Each level brings in a few more shortcuts and keeps asking for the earlier ones. */
export const GAME_LEVELS: readonly GameLevel[] = [
  { id: 'trial.1', title: 'Copy, paste, undo', adds: ['copy', 'paste', 'undo'] },
  { id: 'trial.2', title: 'Cut, select all, bold', adds: ['cut', 'selectAll', 'bold'] },
  { id: 'trial.3', title: 'Rows, columns and redo', adds: ['selectColumn', 'selectRow', 'redo'] },
  { id: 'trial.4', title: 'Stretch with Shift', adds: ['extendDown', 'extendUp', 'extendRight', 'extendLeft'] },
];

/** How many tasks one go at a level has. */
export const ROUND_LENGTH = 8;
/** Seconds a task may take, on average, for a go to count as quick. */
export const QUICK_SECONDS = 2.5;
/** Right first time this often, and a shortcut no longer gets a hint. */
export const KNOWN_AFTER = 5;
/** Right first time this often, and only the first key is hinted. */
export const HALF_KNOWN_AFTER = 2;

export const shortcutById = (id: string): GameShortcut => GAME_SHORTCUTS.find((s) => s.id === id) as GameShortcut;

/** Every shortcut in play at a level: its own and all the earlier levels'. */
export function shortcutsAt(levelIndex: number): string[] {
  return GAME_LEVELS.slice(0, levelIndex + 1).flatMap((level) => level.adds);
}

/** A level opens once the one before it has been finished. */
export function levelOpen(game: GameData, levelIndex: number): boolean {
  return levelIndex === 0 || game.levels[GAME_LEVELS[levelIndex - 1].id] !== undefined;
}

/** A small repeatable shuffle, so the same go can be replayed in a test. */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let state = (seed * 2654435761 + 97) >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** True if the item at `at` is the same as the one before or after it. */
const clashes = (list: readonly string[], at: number): boolean =>
  (at > 0 && list[at] === list[at - 1]) || (at < list.length - 1 && list[at] === list[at + 1]);

/**
 * The tasks for one go at a level. The level's new shortcuts come up most (twice each
 * where there is room); at least two places go to earlier ones, so they are not
 * forgotten. The same shortcut is never asked twice running.
 */
export function roundFor(levelIndex: number, seed: number): string[] {
  const fresh = GAME_LEVELS[levelIndex].adds;
  const earlier = shortcutsAt(levelIndex - 1);
  const kept = earlier.length > 0 ? 2 : 0;
  const picks: string[] = [...fresh];
  for (let i = 0; i < fresh.length && picks.length < ROUND_LENGTH - kept; i++) picks.push(fresh[i]);
  const pool = earlier.length > 0 ? shuffled(earlier, seed) : [...fresh];
  for (let i = 0; picks.length < ROUND_LENGTH; i++) picks.push(pool[i % pool.length]);
  const order = shuffled(picks, seed + 1);
  // Pull apart any two of the same that landed side by side, by swapping one of them
  // with something elsewhere that fits in both places.
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < order.length; i++) {
      if (order[i] !== order[i - 1]) continue;
      for (let j = 0; j < order.length; j++) {
        if (j === i || j === i - 1) continue;
        [order[i], order[j]] = [order[j], order[i]];
        if (!clashes(order, i) && !clashes(order, j)) break;
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
  }
  return order;
}

/** A key on a real keyboard: "Ctrl", "Cmd", "Shift". Ctrl and `mod` are the same key on Windows. */
export type RealKey = 'Ctrl' | 'Cmd' | 'Shift';
export const realKey = (hold: HoldKey, computer: Computer): RealKey => holdLabel(hold, computer) as RealKey;

/** The keys to hold for a shortcut on this kind of computer. */
export const holdsFor = (shortcut: GameShortcut, computer: Computer): RealKey[] => shortcut.hold.map((h) => realKey(h, computer));

/** "Ctrl + C", "Cmd + C", "Shift + ↓". */
export const answerLabel = (shortcut: GameShortcut, computer: Computer): string =>
  [...holdsFor(shortcut, computer), keyLabel(shortcut.key)].join(' + ');

/** True if exactly the right keys are held as the right key is pressed. */
export function isRight(shortcut: GameShortcut, computer: Computer, held: readonly RealKey[], key: PressKey): boolean {
  const wanted = holdsFor(shortcut, computer);
  const pressed = key.length === 1 ? key.toUpperCase() : key;
  return pressed === shortcut.key && wanted.length === held.length && wanted.every((k) => held.includes(k));
}

/** How much help a task gets: both keys lit, just the first, or none. A miss always brings both back. */
export type Hint = 'full' | 'first' | 'none';
export function hintFor(game: GameData, shortcutId: string, missed: boolean): Hint {
  if (missed) return 'full';
  const known = game.known[shortcutId] ?? 0;
  return known >= KNOWN_AFTER ? 'none' : known >= HALF_KNOWN_AFTER ? 'first' : 'full';
}

/** The keys that are in play at a level: lit on the keyboard, where the rest stay dim. */
export function keysAt(levelIndex: number, computer: Computer): { holds: RealKey[]; keys: PressKey[] } {
  const shortcuts = shortcutsAt(levelIndex).map(shortcutById);
  return {
    holds: [...new Set(shortcuts.flatMap((s) => holdsFor(s, computer)))],
    keys: [...new Set(shortcuts.map((s) => s.key))],
  };
}

export interface RoundResult {
  /** From the first task appearing to the last being answered. */
  ms: number;
  /** Wrong presses along the way. */
  misses: number;
  /** The shortcuts that were answered right first time, once for each time. */
  firstTry: string[];
}

/** Three stars for a clean, quick go; two for a nearly clean one; one for finishing. */
export function starsFor(result: RoundResult): 1 | 2 | 3 {
  if (result.misses === 0 && result.ms <= ROUND_LENGTH * QUICK_SECONDS * 1000) return 3;
  return result.misses <= 2 ? 2 : 1;
}

/** XP for a go: a little for playing, more for playing well. */
export const xpFor = (stars: number): number => stars * 2;

export interface RoundOutcome {
  game: GameData;
  stars: 1 | 2 | 3;
  /** Quicker than every go before it. Not said of the very first go. */
  newBest: boolean;
  /** This go finished the level for the first time, which opens the next one. */
  opened: GameLevel | null;
}

/** What a finished go changes: the level's record, and how well each shortcut is known. */
export function recordRound(game: GameData, levelIndex: number, result: RoundResult): RoundOutcome {
  const level = GAME_LEVELS[levelIndex];
  const before: GameLevelRecord | undefined = game.levels[level.id];
  const stars = starsFor(result);
  const known = { ...game.known };
  for (const id of result.firstTry) known[id] = (known[id] ?? 0) + 1;
  const record: GameLevelRecord = {
    bestMs: before ? Math.min(before.bestMs, result.ms) : result.ms,
    bestStars: Math.max(before?.bestStars ?? 0, stars),
    plays: (before?.plays ?? 0) + 1,
  };
  return {
    game: { levels: { ...game.levels, [level.id]: record }, known },
    stars,
    newBest: before !== undefined && result.ms < before.bestMs,
    opened: before === undefined ? (GAME_LEVELS[levelIndex + 1] ?? null) : null,
  };
}

/** "0:12.4": minutes, seconds and tenths. */
export function clockTime(ms: number): string {
  const tenths = Math.floor(Math.max(0, ms) / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths % 10}`;
}
