import type { GameData } from '@/progress/saved';
import { holdLabel, keyLabel, type Computer, type HoldKey, type PressKey } from '@/spreadsheet/shortcuts';

import { rng, sample, shuffle } from './random';

/**
 * Speed Trial: an action is named and the learner presses its keys (execution), or keys are
 * shown and the learner names the action (recognition). Keys are learned by recall and
 * repetition, so this is the one game with an optional clock. It never tests a key the
 * course has not taught: each level opens when the lessons behind it are finished.
 *
 * Levels follow the course: entering data, selecting rows and columns, getting around,
 * extending a selection, then the shortcuts of the side unit "Getting Around Faster".
 */

// Skill ids, as in src/content/excel/course.ts.
const TYPE = 'xl.cell.type';
const COLUMN = 'xl.select.column';
const ROW = 'xl.select.row';
const MOVE = 'xl.keys.move';
const EXTEND = 'xl.select.extend';
const ALL = 'xl.select.all';
const COPY = 'xl.copy';
const CUT = 'xl.cut';
const UNDO = 'xl.undo';
const BOLD = 'xl.bold';

export interface GameShortcut {
  id: string;
  /** Held down first. `mod` is Ctrl on Windows and Cmd on a Mac. Empty for a key on its own. */
  hold: readonly HoldKey[];
  key: PressKey;
  /** The task as it is put to the player: "Copy the selected cells". */
  task: string;
  /** What it does, for recognition and feedback: "copies the selection". */
  does: string;
  /** A memory aid for the key, said after a wrong key: "C for Copy". */
  cue: string;
  skill: string;
}

export const GAME_SHORTCUTS: readonly GameShortcut[] = [
  { id: 'confirm', hold: [], key: 'Enter', task: 'Confirm what you typed', does: 'confirms an entry', cue: 'Enter confirms', skill: TYPE },
  { id: 'cancel', hold: [], key: 'Esc', task: 'Cancel what you are typing', does: 'cancels an entry', cue: 'Esc, top left, escapes', skill: TYPE },
  { id: 'edit', hold: [], key: 'F2', task: 'Edit the active cell', does: 'opens the cell for editing', cue: 'F2 edits', skill: TYPE },
  { id: 'selectColumn', hold: ['ctrl'], key: 'Space', task: 'Select the whole column', does: 'selects the whole column', cue: 'Ctrl for columns', skill: COLUMN },
  { id: 'selectRow', hold: ['shift'], key: 'Space', task: 'Select the whole row', does: 'selects the whole row', cue: 'Shift for rows', skill: ROW },
  { id: 'moveDown', hold: [], key: 'Down', task: 'Move one cell down', does: 'moves one cell down', cue: 'the arrow points the way', skill: MOVE },
  { id: 'moveUp', hold: [], key: 'Up', task: 'Move one cell up', does: 'moves one cell up', cue: 'the arrow points the way', skill: MOVE },
  { id: 'moveRight', hold: [], key: 'Right', task: 'Move one cell right', does: 'moves one cell right', cue: 'the arrow points the way', skill: MOVE },
  { id: 'moveLeft', hold: [], key: 'Left', task: 'Move one cell left', does: 'moves one cell left', cue: 'the arrow points the way', skill: MOVE },
  { id: 'extendDown', hold: ['shift'], key: 'Down', task: 'Extend the selection down', does: 'extends the selection down', cue: 'Shift extends, the arrow points', skill: EXTEND },
  { id: 'extendUp', hold: ['shift'], key: 'Up', task: 'Extend the selection up', does: 'extends the selection up', cue: 'Shift extends, the arrow points', skill: EXTEND },
  { id: 'extendRight', hold: ['shift'], key: 'Right', task: 'Extend the selection right', does: 'extends the selection right', cue: 'Shift extends, the arrow points', skill: EXTEND },
  { id: 'extendLeft', hold: ['shift'], key: 'Left', task: 'Extend the selection left', does: 'extends the selection left', cue: 'Shift extends, the arrow points', skill: EXTEND },
  { id: 'selectAll', hold: ['mod'], key: 'A', task: 'Select the whole sheet', does: 'selects everything', cue: 'A for All', skill: ALL },
  { id: 'copy', hold: ['mod'], key: 'C', task: 'Copy the selected cells', does: 'copies the selection', cue: 'C for Copy', skill: COPY },
  { id: 'cut', hold: ['mod'], key: 'X', task: 'Cut the selected cells', does: 'cuts the selection', cue: 'X, like a pair of scissors', skill: CUT },
  { id: 'paste', hold: ['mod'], key: 'V', task: 'Paste what you copied', does: 'pastes', cue: 'V sits beside C', skill: COPY },
  { id: 'undo', hold: ['mod'], key: 'Z', task: 'Undo your last step', does: 'undoes the last step', cue: 'Z, at the start of the bottom row', skill: UNDO },
  { id: 'bold', hold: ['mod'], key: 'B', task: 'Make the selection bold', does: 'makes the selection bold', cue: 'B for Bold', skill: BOLD },
];

export interface GameLevel {
  id: string;
  title: string;
  /** The shortcuts this level adds to the ones before it. */
  adds: readonly string[];
}

/** In the order the course teaches them. A level's shortcuts are tested only once all are taught. */
export const GAME_LEVELS: readonly GameLevel[] = [
  { id: 'trial.entry', title: 'Entering data', adds: ['confirm', 'cancel', 'edit'] },
  { id: 'trial.rowcol', title: 'Rows and columns', adds: ['selectColumn', 'selectRow'] },
  { id: 'trial.move', title: 'Getting around', adds: ['moveDown', 'moveUp', 'moveRight', 'moveLeft'] },
  { id: 'trial.extend', title: 'Extending a selection', adds: ['extendDown', 'extendUp', 'extendRight', 'extendLeft'] },
  { id: 'trial.all', title: 'Select everything', adds: ['selectAll'] },
  { id: 'trial.clip', title: 'Copy, cut and paste', adds: ['copy', 'cut', 'paste'] },
  { id: 'trial.undo', title: 'Undo and bold', adds: ['undo', 'bold'] },
];

/** How many tasks one go at a level has. */
export const ROUND_LENGTH = 8;
/** Right first time this often, and a shortcut no longer gets a hint. */
export const KNOWN_AFTER = 5;
/** Right first time this often, and only the first key is hinted. */
export const HALF_KNOWN_AFTER = 2;

export const shortcutById = (id: string): GameShortcut => GAME_SHORTCUTS.find((s) => s.id === id) as GameShortcut;

/** The skills a level needs taught before it opens. */
export const levelSkills = (levelIndex: number): string[] => [...new Set(GAME_LEVELS[levelIndex].adds.map((id) => shortcutById(id).skill))];

/** A level opens once every lesson behind its shortcuts is finished. */
export const levelOpen = (taught: ReadonlySet<string>, levelIndex: number): boolean => levelSkills(levelIndex).every((s) => taught.has(s));

/** Every shortcut in play at a level: its own, and those of the open levels before it. */
export function shortcutsAt(levelIndex: number, taught?: ReadonlySet<string>): string[] {
  return GAME_LEVELS.slice(0, levelIndex + 1)
    .filter((_, i) => i === levelIndex || !taught || levelOpen(taught, i))
    .flatMap((level) => level.adds);
}

/** True if the item at `at` is the same as the one before or after it. */
const clashes = (list: readonly { id: string }[], at: number): boolean =>
  (at > 0 && list[at].id === list[at - 1].id) || (at < list.length - 1 && list[at].id === list[at + 1].id);

/** One task in a go: press the keys for an action, or name the action for the keys shown. */
export interface TrialTask {
  id: string;
  kind: 'press' | 'name';
  /** For `name`: the actions to choose from, the right one among them. */
  options?: string[];
}

/**
 * The tasks for one go at a level. The level's new shortcuts come up most (twice each where
 * there is room); at least two places go to earlier ones, so they are not forgotten. The
 * same shortcut is never asked twice running. Two tasks in a go ask the other way round:
 * the keys are shown and the action is named, which is how a shortcut is recognised.
 */
export function roundFor(levelIndex: number, seed: number, taught?: ReadonlySet<string>): TrialTask[] {
  const r = rng(seed);
  const fresh = GAME_LEVELS[levelIndex].adds;
  const earlier = shortcutsAt(levelIndex, taught).filter((id) => !fresh.includes(id));
  const kept = earlier.length > 0 ? 2 : 0;
  const picks: string[] = [...fresh];
  for (let i = 0; i < fresh.length && picks.length < ROUND_LENGTH - kept; i++) picks.push(fresh[i]);
  const pool = earlier.length > 0 ? shuffle(r, earlier) : [...fresh];
  for (let i = 0; picks.length < ROUND_LENGTH; i++) picks.push(pool[i % pool.length]);
  const order = shuffle(r, picks).map((id): TrialTask => ({ id, kind: 'press' }));
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < order.length; i++) {
      if (order[i].id !== order[i - 1].id) continue;
      for (let j = 0; j < order.length; j++) {
        if (j === i || j === i - 1) continue;
        [order[i], order[j]] = [order[j], order[i]];
        if (!clashes(order, i) && !clashes(order, j)) break;
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
  }
  // Recognition: the third and sixth tasks, when there are enough actions to choose between.
  const inPlay = [...new Set([...fresh, ...earlier])];
  if (inPlay.length >= 3) {
    for (const at of [2, 5]) {
      const task = order[at];
      const others = sample(r, inPlay.filter((id) => id !== task.id && shortcutById(id).does !== shortcutById(task.id).does), 2);
      order[at] = { ...task, kind: 'name', options: shuffle(r, [task.id, ...others]).map((id) => shortcutById(id).does) };
    }
  }
  return order;
}

/** A key on a real keyboard: "Ctrl", "Cmd", "Shift". Ctrl and `mod` are the same key on Windows. */
export type RealKey = 'Ctrl' | 'Cmd' | 'Shift';
export const realKey = (hold: HoldKey, computer: Computer): RealKey => holdLabel(hold, computer) as RealKey;

/** The keys to hold for a shortcut on this kind of computer. */
export const holdsFor = (shortcut: GameShortcut, computer: Computer): RealKey[] => shortcut.hold.map((h) => realKey(h, computer));

/** "Ctrl + C", "Cmd + C", "Shift + ↓", "F2". */
export const answerLabel = (shortcut: GameShortcut, computer: Computer): string =>
  [...holdsFor(shortcut, computer), keyLabel(shortcut.key)].join(' + ');

const sameKey = (a: PressKey, b: PressKey) => (a.length === 1 ? a.toUpperCase() : a) === b;

/** True if exactly the right keys are held as the right key is pressed. */
export function isRight(shortcut: GameShortcut, computer: Computer, held: readonly RealKey[], key: PressKey): boolean {
  const wanted = holdsFor(shortcut, computer);
  return sameKey(key, shortcut.key) && wanted.length === held.length && wanted.every((k) => held.includes(k));
}

/** The shortcut these keys make, among those the game knows. */
export function shortcutPressed(computer: Computer, held: readonly RealKey[], key: PressKey): GameShortcut | null {
  return GAME_SHORTCUTS.find((s) => isRight(s, computer, held, key)) ?? null;
}

const list = (keys: readonly string[]) => keys.join(' + ');
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * What to say after a wrong press, so it teaches rather than just marks: what the keys
 * pressed really do, which part was right, and a cue for the key that was wanted.
 */
export function explainMiss(task: GameShortcut, computer: Computer, held: readonly RealKey[], key: PressKey): string {
  const answer = answerLabel(task, computer);
  const wanted = holdsFor(task, computer);
  const pressedLabel = list([...held, keyLabel(key.length === 1 ? key.toUpperCase() : key)]);
  const other = shortcutPressed(computer, held, key);
  if (other && other.id !== task.id) return `${pressedLabel} ${other.does}. To ${task.task.charAt(0).toLowerCase()}${task.task.slice(1)}: ${answer}.`;
  if (sameKey(key, task.key)) {
    const missing = wanted.filter((k) => !held.includes(k));
    const extra = held.filter((k) => !wanted.includes(k));
    if (missing.length > 0 && extra.length === 0) return `Right key. Hold ${list(missing)} first: ${answer}.`;
    if (wanted.length === 0) return `${keyLabel(task.key)} on its own, with nothing held.`;
    return `Right key, wrong one held: ${capital(task.cue)}. ${answer}.`;
  }
  if (wanted.length > 0 && wanted.length === held.length && wanted.every((k) => held.includes(k))) {
    return `${list(wanted)} is right. The key is ${keyLabel(task.key)}: ${task.cue}.`;
  }
  return `Not that one. ${capital(task.cue)}: ${answer}.`;
}

/** How much help a task gets: both keys lit, just the first, or none. A miss always brings both back. */
export type Hint = 'full' | 'first' | 'none';
export function hintFor(game: GameData, shortcutId: string, missed: boolean): Hint {
  if (missed) return 'full';
  const known = game.known[shortcutId] ?? 0;
  return known >= KNOWN_AFTER ? 'none' : known >= HALF_KNOWN_AFTER ? 'first' : 'full';
}

/** What a real keyboard event is in the game's own names. Null for a key the game has no use for. */
export function fromKeyName(key: string): PressKey | null {
  if (key === ' ' || key === 'Spacebar') return 'Space';
  if (key === 'Escape' || key === 'Esc') return 'Esc';
  if (key === 'Enter' || key === 'Tab') return key;
  if (/^F([1-9]|1[0-2])$/.test(key)) return key;
  if (key.startsWith('Arrow')) return key.slice(5);
  return /^[a-zA-Z]$/.test(key) ? key.toUpperCase() : null;
}
