import { a1, cellsInRange, range as rangeOf, toA1 } from '@/engine';
import type { GameData, GameLevelRecord } from '@/progress/saved';

/**
 * Grid Master: a snake-style game played on the sheet itself. The snake is a selection
 * crawling through the cells; it is steered with Shift and the arrow keys, the keys that
 * stretch a selection in a real spreadsheet. The card names a cell to collect ("Collect
 * G3"), and every collectable looks the same, so the only way to find the right one is to
 * read the cell references. A wrong one makes the snake longer; shrink squares make it
 * shorter. With every named cell collected, the centre opens, and arriving there short
 * earns a bonus round: one more shortcut, pressed in time.
 *
 * This file is the rules only, with no drawing, so every level can be proved winnable.
 */

export type Dir = 'up' | 'down' | 'left' | 'right';
export const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];
const STEP: Record<Dir, { col: number; row: number }> = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
};
export const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** The shortcut asked for in the bonus round: real spreadsheet shortcuts, the same on Windows and Mac. */
export type BonusKey = 'selectRow' | 'selectColumn';

export interface GridLevel {
  id: string;
  title: string;
  /** One line on the list of levels. */
  about: string;
  /** Said on the card before the first move. */
  note: string;
  cols: number;
  rows: number;
  /** Where the snake starts, head first. It sets off in the direction it is facing, once steered. */
  start: string[];
  /** The cells to collect, named on the card one at a time. */
  targets: string[];
  /** Collectables that look just like the target. Taking one makes the snake a cell longer. */
  decoys: string[];
  /** Taking one makes the snake a cell shorter. */
  shrinks: string[];
  /** Blocked cells, as cells or ranges ("C4:C6"). */
  walls: string[];
  /** A switch: reaching it clears these blocked cells. */
  gate?: { at: string; opens: string[] };
  /** Pairs of cells: going into one comes out of the other, still heading the same way. */
  portals?: [string, string][];
  /** Where the level ends. It stays shut until every named cell is collected. */
  centre: string;
  /** How long the snake takes to move one cell, in thousandths of a second. */
  stepMs: number;
  bonus: BonusKey;
}

/** World 1, "The Grid": cell references, rows and columns, and steering with Shift + arrows. */
export const GRID_LEVELS: readonly GridLevel[] = [
  {
    id: 'grid.1',
    title: 'Find the cell',
    about: 'Read the cell references to find the right cell.',
    note: 'Hold Shift and press an arrow to set off. Only collect the cell the card names.',
    cols: 9,
    rows: 9,
    start: ['C2', 'B2', 'A2'],
    targets: ['G3', 'C7', 'H8'],
    decoys: ['F6', 'B4', 'H2'],
    shrinks: ['A9', 'I1', 'E8'],
    walls: [],
    centre: 'E5',
    stepMs: 600,
    bonus: 'selectRow',
  },
  {
    id: 'grid.2',
    title: 'Round the blocks',
    about: 'Blocked cells, and wrong cells right next to the right ones.',
    note: 'Blocked cells stop the snake. Steer round them.',
    cols: 9,
    rows: 9,
    start: ['C9', 'B9', 'A9'],
    targets: ['B2', 'H8', 'E7'],
    decoys: ['C2', 'H7', 'D7'],
    shrinks: ['A5', 'I5', 'E1'],
    walls: ['D3:F3', 'C4:C6', 'G4:G6'],
    centre: 'E5',
    stepMs: 540,
    bonus: 'selectColumn',
  },
  {
    id: 'grid.3',
    title: 'Through the portal',
    about: 'Column C is a wall. A portal takes you to the cell written on it.',
    note: 'Column C is blocked. Go into B5 and you come out at G2.',
    cols: 9,
    rows: 9,
    start: ['A7', 'A8', 'A9'],
    targets: ['B2', 'G7', 'E8'],
    decoys: ['A2', 'F7', 'E9'],
    shrinks: ['A4', 'H5', 'F9'],
    walls: ['C1:C9'],
    portals: [['B5', 'G2']],
    centre: 'E5',
    stepMs: 500,
    bonus: 'selectRow',
  },
  {
    id: 'grid.4',
    title: 'Open the gate',
    about: 'The centre is walled in. Find the switch that opens it.',
    note: 'The centre is walled in. The switch at I9 opens a way in.',
    cols: 9,
    rows: 9,
    start: ['C1', 'B1', 'A1'],
    targets: ['A3', 'H2', 'C8'],
    decoys: ['A4', 'H3', 'B8'],
    shrinks: ['E1', 'A9', 'I5'],
    walls: ['D4:F4', 'D6:F6', 'D5', 'F5'],
    gate: { at: 'I9', opens: ['F5'] },
    centre: 'E5',
    stepMs: 460,
    bonus: 'selectColumn',
  },
];

/** Every cell a list of cells and ranges covers, as "B2". */
export const cellsOf = (list: readonly string[]): string[] =>
  list.flatMap((entry) => (entry.includes(':') ? cellsInRange(rangeOf(entry)).map(toA1) : [toA1(a1(entry))]));

export type Status = 'ready' | 'running' | 'stopped' | 'bonus' | 'done';

export type GridEvent =
  | { kind: 'right'; cell: string; next: string | null }
  | { kind: 'wrong'; cell: string; wanted: string }
  | { kind: 'shrink'; cell: string }
  | { kind: 'gate'; cell: string; opened: string[] }
  | { kind: 'portal'; from: string; to: string }
  | { kind: 'edge' }
  | { kind: 'wall'; cell: string }
  | { kind: 'locked'; cell: string }
  | { kind: 'self' }
  | { kind: 'blocked' }
  | { kind: 'paused' }
  | { kind: 'centre'; short: boolean };

export interface GridState {
  level: number;
  /** The cells the snake covers, head first, as "B2". */
  snake: string[];
  /** The way it last moved. */
  dir: Dir;
  /** A turn asked for, taken on the next move. */
  queued: Dir | null;
  status: Status;
  /** How many named cells are collected. The one asked for now is `targets[found]`. */
  found: number;
  /** Decoys, shrink squares and the switch that have been taken. */
  used: string[];
  /** Blocked cells as they are now: a switch can clear some. */
  walls: string[];
  /** Cells still to grow by. */
  grow: number;
  crashes: number;
  wrong: number;
  /** Reached the centre shorter than two cells. */
  short: boolean;
  /** Pressed the bonus shortcut in time. */
  bonus: boolean;
  /** What just happened, for the card to say. */
  event: GridEvent | null;
}

export function startState(levelIndex: number): GridState {
  const level = GRID_LEVELS[levelIndex];
  const head = a1(level.start[0]);
  const neck = a1(level.start[1]);
  const facing = DIRS.find((d) => neck.col + STEP[d].col === head.col && neck.row + STEP[d].row === head.row) ?? 'right';
  return {
    level: levelIndex,
    snake: [...level.start],
    dir: facing,
    queued: null,
    status: 'ready',
    found: 0,
    used: [],
    walls: cellsOf(level.walls),
    grow: 0,
    crashes: 0,
    wrong: 0,
    short: false,
    bonus: false,
    event: null,
  };
}

/** The other end of a portal, if this cell is one. */
function partnerOf(level: GridLevel, cell: string): string | null {
  for (const [a, b] of level.portals ?? []) {
    if (cell === a) return b;
    if (cell === b) return a;
  }
  return null;
}

type Look =
  | { kind: 'free'; cell: string; via: string | null }
  | { kind: 'edge' }
  | { kind: 'wall'; cell: string }
  | { kind: 'locked'; cell: string }
  | { kind: 'self'; cell: string };

/** What is one cell along from the head, going this way: where the snake would end up, or what stops it. */
function look(level: GridLevel, s: GridState, dir: Dir): Look {
  const head = a1(s.snake[0]);
  const to = { col: head.col + STEP[dir].col, row: head.row + STEP[dir].row };
  if (to.col < 0 || to.row < 0 || to.col >= level.cols || to.row >= level.rows) return { kind: 'edge' };
  let cell = toA1(to);
  let via: string | null = null;
  const partner = partnerOf(level, cell);
  if (partner) {
    via = cell;
    cell = partner;
  }
  if (s.walls.includes(cell)) return { kind: 'wall', cell };
  if (cell === level.centre && s.found < level.targets.length) return { kind: 'locked', cell };
  // The tail moves out of the way as the head moves in, unless the snake is about to grow.
  const body = s.grow > 0 ? s.snake : s.snake.slice(0, -1);
  if (body.includes(cell)) return { kind: 'self', cell };
  return { kind: 'free', cell, via };
}

/** Bumped into something: the snake stops and waits for a new direction. */
function stop(level: GridLevel, s: GridState, event: GridEvent): GridState {
  const stopped: GridState = { ...s, status: 'stopped', queued: null, crashes: s.crashes + 1, event };
  // Boxed in on every side by its own body: cut back to the head, so there is always a way on.
  if (!DIRS.some((d) => look(level, stopped, d).kind === 'free')) return { ...stopped, snake: [s.snake[0]], grow: 0 };
  return stopped;
}

/** One move along. Called on a timer while the snake is running. */
export function step(s: GridState): GridState {
  if (s.status !== 'running') return s;
  const level = GRID_LEVELS[s.level];
  const dir = s.queued ?? s.dir;
  const seen = look(level, s, dir);
  if (seen.kind === 'edge') return stop(level, s, { kind: 'edge' });
  if (seen.kind === 'wall') return stop(level, s, { kind: 'wall', cell: seen.cell });
  if (seen.kind === 'locked') return stop(level, s, { kind: 'locked', cell: seen.cell });
  if (seen.kind === 'self') return stop(level, s, { kind: 'self' });

  const cell = seen.cell;
  let snake = [cell, ...s.snake];
  let grow = s.grow;
  if (grow > 0) grow--;
  else snake.pop();

  let { found, wrong, used, walls } = s;
  // A plain move says nothing new, so the last message stays up long enough to be read.
  let event: GridEvent | null = seen.via ? { kind: 'portal', from: seen.via, to: cell } : s.event;
  const wanted = level.targets[found] ?? null;
  if (cell === wanted) {
    found++;
    event = { kind: 'right', cell, next: level.targets[found] ?? null };
  } else if (level.decoys.includes(cell) && !used.includes(cell)) {
    used = [...used, cell];
    wrong++;
    grow++;
    event = { kind: 'wrong', cell, wanted: wanted ?? level.centre };
  } else if (level.shrinks.includes(cell) && !used.includes(cell)) {
    used = [...used, cell];
    if (grow > 0) grow--;
    else if (snake.length > 1) snake = snake.slice(0, -1);
    event = { kind: 'shrink', cell };
  } else if (level.gate && cell === level.gate.at && !used.includes(cell)) {
    used = [...used, cell];
    const opened = cellsOf(level.gate.opens);
    walls = walls.filter((w) => !opened.includes(w));
    event = { kind: 'gate', cell, opened };
  }

  let status: Status = 'running';
  let short = s.short;
  if (cell === level.centre) {
    short = snake.length + grow < 2;
    status = short ? 'bonus' : 'done';
    event = { kind: 'centre', short };
  }
  return { ...s, snake, dir, queued: null, grow, found, wrong, used, walls, status, short, event };
}

/** Shift and an arrow: set off, turn, or carry on after a bump. */
export function steer(s: GridState, dir: Dir): GridState {
  const level = GRID_LEVELS[s.level];
  if (s.status === 'ready' || s.status === 'stopped') {
    if (look(level, s, dir).kind !== 'free') return { ...s, event: { kind: 'blocked' } };
    // Moving again: whatever stopped the snake no longer applies.
    return { ...s, status: 'running', dir, queued: null, event: null };
  }
  if (s.status !== 'running') return s;
  // Doubling straight back would run into its own neck.
  if (s.snake.length > 1 && dir === OPPOSITE[s.dir]) return s;
  return { ...s, queued: dir };
}

/** The app went into the background: the snake waits, with no bump counted. */
export function pause(s: GridState): GridState {
  return s.status === 'running' ? { ...s, status: 'stopped', queued: null, event: { kind: 'paused' } } : s;
}

/** The bonus round ended: with the right shortcut in time, or not. */
export function finishBonus(s: GridState, pressed: boolean): GridState {
  return s.status === 'bonus' ? { ...s, status: 'done', bonus: pressed } : s;
}

/** One star for reaching the centre, one for arriving short, one for the bonus. */
export const starsOf = (s: GridState): 1 | 2 | 3 => (1 + (s.short ? 1 : 0) + (s.bonus ? 1 : 0)) as 1 | 2 | 3;

/** What the card asks for now. */
export function taskFor(s: GridState): string {
  const level = GRID_LEVELS[s.level];
  if (s.found < level.targets.length) return `Collect ${level.targets[s.found]}`;
  if (level.gate && !s.used.includes(level.gate.at)) return `Take the switch at ${level.gate.at}`;
  return `Into the centre: ${level.centre}`;
}

/** "G3: column G, row 3." */
export function spell(cell: string): string {
  return `${cell}: column ${cell.replace(/[0-9]/g, '')}, row ${cell.replace(/[A-Z]/g, '')}.`;
}

/** What the card says about what just happened. Null when there is nothing to add. */
export function messageFor(s: GridState): string | null {
  const level = GRID_LEVELS[s.level];
  const e = s.event;
  if (!e) return s.status === 'ready' ? level.note : null;
  switch (e.kind) {
    case 'right':
      return e.next ? `Yes! ${spell(e.cell)}` : `Yes! ${spell(e.cell)} That is every named cell.`;
    case 'wrong':
      return `That was ${e.cell}, not ${e.wanted}. Wrong cell, so the snake grew.`;
    case 'shrink':
      return 'A shrink square: one cell shorter.';
    case 'gate':
      return `The switch opened ${e.opened.join(', ')}.`;
    case 'portal':
      return `The portal at ${e.from} took you to ${e.to}.`;
    case 'edge':
      return 'Bump! The sheet ends there. Pick a new way with Shift + an arrow.';
    case 'wall':
      return `Bump! ${e.cell} is blocked. Pick a new way with Shift + an arrow.`;
    case 'locked':
      return `${level.centre} opens once every named cell is collected.`;
    case 'self':
      return 'Bump! You ran into yourself. Pick a new way with Shift + an arrow.';
    case 'blocked':
      return 'That way is blocked. Try another arrow.';
    case 'paused':
      return 'Paused. Shift + an arrow carries on.';
    case 'centre':
      return e.short ? 'In the centre, and short!' : 'In the centre!';
  }
}

/** What sits in each cell, for drawing. Targets and decoys are drawn alike on purpose. */
export type Item =
  | { kind: 'collect' }
  | { kind: 'shrink' }
  | { kind: 'switch' }
  | { kind: 'portal'; to: string }
  | { kind: 'centre'; open: boolean }
  | { kind: 'wall' };

export function itemsOf(s: GridState): Record<string, Item> {
  const level = GRID_LEVELS[s.level];
  const items: Record<string, Item> = {};
  for (const cell of s.walls) items[cell] = { kind: 'wall' };
  for (const cell of level.decoys) if (!s.used.includes(cell)) items[cell] = { kind: 'collect' };
  const wanted = level.targets[s.found];
  if (wanted) items[wanted] = { kind: 'collect' };
  for (const cell of level.shrinks) if (!s.used.includes(cell)) items[cell] = { kind: 'shrink' };
  if (level.gate && !s.used.includes(level.gate.at)) items[level.gate.at] = { kind: 'switch' };
  for (const [a, b] of level.portals ?? []) {
    items[a] = { kind: 'portal', to: b };
    items[b] = { kind: 'portal', to: a };
  }
  items[level.centre] = { kind: 'centre', open: s.found >= level.targets.length };
  return items;
}

// ---- saved results ----------------------------------------------------------------------

/** A level opens once the one before it has been finished. */
export const gridLevelOpen = (game: GameData, levelIndex: number): boolean =>
  levelIndex === 0 || game.levels[GRID_LEVELS[levelIndex - 1].id] !== undefined;

export const gridXp = (stars: number): number => stars * 2;

export interface GridOutcome {
  game: GameData;
  /** Quicker than every go before it. Not said of the very first go. */
  newBest: boolean;
  /** This go finished the level for the first time, which opens the next one. */
  opened: GridLevel | null;
}

/** What a finished go changes: the level's best time and stars, and how often it has been played. */
export function recordGrid(game: GameData, levelIndex: number, result: { ms: number; stars: number }): GridOutcome {
  const level = GRID_LEVELS[levelIndex];
  const before: GameLevelRecord | undefined = game.levels[level.id];
  const record: GameLevelRecord = {
    bestMs: before ? Math.min(before.bestMs, result.ms) : result.ms,
    bestStars: Math.max(before?.bestStars ?? 0, result.stars),
    plays: (before?.plays ?? 0) + 1,
  };
  return {
    game: { ...game, levels: { ...game.levels, [level.id]: record } },
    newBest: before !== undefined && result.ms < before.bestMs,
    opened: before === undefined ? (GRID_LEVELS[levelIndex + 1] ?? null) : null,
  };
}
