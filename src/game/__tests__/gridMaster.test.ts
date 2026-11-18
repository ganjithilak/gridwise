/** @jest-environment node */
import { a1, toA1 } from '@/engine';
import { NO_GAME } from '@/progress/saved';

import {
  cellsOf,
  DIRS,
  finishBonus,
  GRID_LEVELS,
  gridLevelOpen,
  itemsOf,
  messageFor,
  OPPOSITE,
  pause,
  recordGrid,
  spell,
  starsOf,
  startState,
  steer,
  step,
  taskFor,
  type Dir,
  type GridLevel,
  type GridState,
} from '../gridMaster';

const MOVE: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** Where moving one cell this way from `cell` lands, portals included. Null if off the sheet. */
function next(level: GridLevel, cell: string, dir: Dir): string | null {
  const at = a1(cell);
  const to = { col: at.col + MOVE[dir][0], row: at.row + MOVE[dir][1] };
  if (to.col < 0 || to.row < 0 || to.col >= level.cols || to.row >= level.rows) return null;
  const name = toA1(to);
  for (const [x, y] of level.portals ?? []) {
    if (name === x) return y;
    if (name === y) return x;
  }
  return name;
}

/**
 * The first move on a shortest way from the head to `goal`, keeping clear of `avoid`.
 * `back` is the way the snake cannot turn, as it would double back on itself.
 */
function firstMove(level: GridLevel, from: string, goal: string, avoid: Set<string>, back: Dir | null): Dir | null {
  const seen = new Set([from]);
  const queue: { cell: string; first: Dir | null }[] = [{ cell: from, first: null }];
  while (queue.length > 0) {
    const { cell, first } = queue.shift()!;
    for (const dir of DIRS) {
      if (first === null && dir === back) continue;
      const to = next(level, cell, dir);
      if (!to || seen.has(to) || (avoid.has(to) && to !== goal)) continue;
      if (to === goal) return first ?? dir;
      seen.add(to);
      queue.push({ cell: to, first: first ?? dir });
    }
  }
  return null;
}

/**
 * Plays a level the careful way: shrink squares first, then each named cell, the switch
 * if there is one, then the centre. Never touches a wrong cell. Returns where it ended.
 */
function autopilot(levelIndex: number): GridState {
  const level = GRID_LEVELS[levelIndex];
  let s = startState(levelIndex);
  for (let moves = 0; moves < 600 && (s.status === 'ready' || s.status === 'running'); moves++) {
    const shrink = s.snake.length > 1 ? level.shrinks.find((c) => !s.used.includes(c)) : undefined;
    const wanted = level.targets[s.found];
    const gate = level.gate && !s.used.includes(level.gate.at) ? level.gate.at : undefined;
    const goal = shrink ?? wanted ?? gate ?? level.centre;
    const avoid = new Set([
      ...s.walls,
      ...level.decoys.filter((c) => !s.used.includes(c)),
      ...s.snake.slice(0, -1),
      ...(s.found < level.targets.length ? [level.centre] : []),
    ]);
    const back = s.status === 'running' && s.snake.length > 1 ? OPPOSITE[s.dir] : null;
    const dir = firstMove(level, s.snake[0], goal, avoid, back);
    if (!dir) throw new Error(`${level.id}: no way from ${s.snake[0]} to ${goal}`);
    s = steer(s, dir);
    s = step(s);
  }
  return s;
}

const state = (patch: Partial<GridState>, level = 0): GridState => ({ ...startState(level), ...patch });

describe('the levels', () => {
  it.each(GRID_LEVELS.map((level) => [level.id, level] as const))('%s is laid out sensibly', (_id, level) => {
    const special = [
      ...level.start,
      ...level.targets,
      ...level.decoys,
      ...level.shrinks,
      ...cellsOf(level.walls),
      level.centre,
      ...(level.gate ? [level.gate.at] : []),
      ...(level.portals ?? []).flat(),
    ];
    // Every special cell is on the sheet, and no two share a cell.
    for (const cell of special) {
      const at = a1(cell);
      expect(at.col).toBeLessThan(level.cols);
      expect(at.row).toBeLessThan(level.rows);
    }
    expect(special.filter((cell, i) => special.indexOf(cell) !== i)).toEqual([]);
    // What a switch opens really is blocked to begin with.
    if (level.gate) for (const cell of cellsOf(level.gate.opens)) expect(cellsOf(level.walls)).toContain(cell);
    // The snake starts in one piece.
    for (let i = 1; i < level.start.length; i++) {
      const a = a1(level.start[i - 1]);
      const b = a1(level.start[i]);
      expect(Math.abs(a.col - b.col) + Math.abs(a.row - b.row)).toBe(1);
    }
    // Enough shrink squares to arrive short even after one wrong cell.
    expect(level.shrinks.length).toBeGreaterThanOrEqual(level.start.length);
  });

  it.each(GRID_LEVELS.map((level, i) => [level.id, i] as const))('%s can be won with every star', (_id, index) => {
    const end = autopilot(index);
    expect(end.status).toBe('bonus');
    expect(end).toMatchObject({ short: true, crashes: 0, wrong: 0, found: GRID_LEVELS[index].targets.length });
    expect(starsOf(finishBonus(end, true))).toBe(3);
  });

  it('get quicker as they go on', () => {
    const speeds = GRID_LEVELS.map((level) => level.stepMs);
    expect([...speeds].sort((a, b) => b - a)).toEqual(speeds);
  });
});

describe('moving', () => {
  it('waits for the first steer, then moves one cell at a time, the tail following', () => {
    let s = startState(0);
    expect(step(s)).toBe(s);
    s = steer(s, 'down');
    expect(s.status).toBe('running');
    s = step(s);
    expect(s.snake).toEqual(['C3', 'C2', 'B2']);
    s = step(s);
    expect(s.snake).toEqual(['C4', 'C3', 'C2']);
  });

  it('takes a turn on the next move, and ignores doubling straight back', () => {
    let s = steer(startState(0), 'right');
    s = steer(s, 'left');
    expect(s.queued).toBeNull();
    s = step(steer(s, 'down'));
    expect(s.snake[0]).toBe('C3');
    expect(s.dir).toBe('down');
  });

  it('will not set off into its own body', () => {
    const s = steer(startState(0), 'left');
    expect(s.status).toBe('ready');
    expect(s.event).toEqual({ kind: 'blocked' });
  });

  it('can move into the cell its tail is leaving', () => {
    let s = state({ snake: ['B2', 'B3', 'C3', 'C2'], dir: 'up', status: 'running' });
    s = step(steer(s, 'right'));
    expect(s.status).toBe('running');
    expect(s.snake[0]).toBe('C2');
  });
});

describe('bumping into things', () => {
  it('stops at the edge of the sheet, counts it, and carries on when steered a free way', () => {
    let s = state({ snake: ['I2', 'H2', 'G2'], dir: 'right', status: 'running' });
    s = step(s);
    expect(s).toMatchObject({ status: 'stopped', crashes: 1, event: { kind: 'edge' } });
    expect(s.snake).toEqual(['I2', 'H2', 'G2']);
    // Back into the body is no way out.
    expect(steer(s, 'left').status).toBe('stopped');
    s = steer(s, 'down');
    expect(s.status).toBe('running');
    expect(step(s).snake[0]).toBe('I3');
  });

  it('stops at a blocked cell, and at itself', () => {
    const walled = step(state({ snake: ['C3', 'C2'], dir: 'down', status: 'running' }, 1));
    expect(walled.event).toEqual({ kind: 'wall', cell: 'C4' });
    const wall = step(state({ snake: ['B4', 'A4'], dir: 'right', status: 'running' }, 1));
    expect(wall.event).toEqual({ kind: 'wall', cell: 'C4' });
    const self = step(state({ snake: ['C3', 'D3', 'D4', 'C4', 'B4'], dir: 'down', status: 'running' }));
    expect(self).toMatchObject({ status: 'stopped', event: { kind: 'self' } });
  });

  it('keeps the centre shut until every named cell is collected', () => {
    const shut = step(state({ snake: ['E4', 'E3'], dir: 'down', status: 'running' }));
    expect(shut.event).toEqual({ kind: 'locked', cell: 'E5' });
    const open = step(state({ snake: ['E4', 'E3'], dir: 'down', status: 'running', found: 3 }));
    expect(open.event).toEqual({ kind: 'centre', short: false });
    expect(open.status).toBe('done');
  });

  it('cuts the snake back to its head when it is boxed in on every side', () => {
    // Facing the edge in a corner, with its own body filling the other two sides.
    const s = step(state({ snake: ['A1', 'B1', 'B2', 'A2', 'A3'], dir: 'up', status: 'running' }));
    expect(s.status).toBe('stopped');
    expect(s.snake).toEqual(['A1']);
  });

  it('keeps a message up until something else happens, and drops a bump once moving again', () => {
    let s = step(state({ snake: ['F3', 'E3', 'D3'], dir: 'right', status: 'running' }));
    expect(s.event?.kind).toBe('right');
    s = step(step(s));
    expect(s.event?.kind).toBe('right');
    const bumped = step(state({ snake: ['I2', 'H2', 'G2'], dir: 'right', status: 'running' }));
    expect(steer(bumped, 'down').event).toBeNull();
  });

  it('pauses without counting a bump', () => {
    const s = pause(state({ status: 'running' }));
    expect(s).toMatchObject({ status: 'stopped', crashes: 0, event: { kind: 'paused' } });
  });
});

describe('collecting', () => {
  it('takes the named cell and moves on to the next name', () => {
    const s = step(state({ snake: ['F3', 'E3', 'D3'], dir: 'right', status: 'running' }));
    expect(s).toMatchObject({ found: 1, event: { kind: 'right', cell: 'G3', next: 'C7' } });
    expect(s.snake).toHaveLength(3);
    expect(taskFor(s)).toBe('Collect C7');
  });

  it('grows the snake for a wrong cell, and does not count it', () => {
    let s = step(state({ snake: ['F5', 'F4', 'F3'], dir: 'down', status: 'running' }));
    expect(s).toMatchObject({ found: 0, wrong: 1, grow: 1, event: { kind: 'wrong', cell: 'F6', wanted: 'G3' } });
    s = step(s);
    expect(s.snake).toEqual(['F7', 'F6', 'F5', 'F4']);
    expect(itemsOf(s).F6).toBeUndefined();
  });

  it('shrinks the snake on a shrink square, once, and never below one cell', () => {
    let s = step(state({ snake: ['E7', 'E6', 'D6'], dir: 'down', status: 'running' }));
    expect(s.snake).toEqual(['E8', 'E7']);
    expect(s.event).toEqual({ kind: 'shrink', cell: 'E8' });
    s = step(steer(s, 'right'));
    expect(s.snake).toHaveLength(2);
    const alone = step(state({ snake: ['A8'], dir: 'down', status: 'running' }));
    expect(alone.snake).toEqual(['A9']);
  });

  it('opens blocked cells with a switch', () => {
    const s = step(state({ snake: ['I8', 'I7', 'I6'], dir: 'down', status: 'running' }, 3));
    expect(s.event).toEqual({ kind: 'gate', cell: 'I9', opened: ['F5'] });
    expect(s.walls).not.toContain('F5');
    expect(itemsOf(s).F5).toBeUndefined();
  });

  it('sends the snake through a portal, still going the same way', () => {
    const s = step(state({ snake: ['B4', 'B3', 'B2'], dir: 'down', status: 'running' }, 2));
    expect(s.snake[0]).toBe('G2');
    expect(s.event).toEqual({ kind: 'portal', from: 'B5', to: 'G2' });
    expect(step(s).snake[0]).toBe('G3');
  });

  it('draws the named cell and the wrong ones exactly alike', () => {
    const items = itemsOf(startState(0));
    expect(items.G3).toEqual(items.F6);
    expect(items.C7).toBeUndefined();
    expect(items.E5).toEqual({ kind: 'centre', open: false });
  });
});

describe('the end of a level', () => {
  const arriving = (length: number): GridState => {
    const body = ['E4', 'E3', 'E2', 'E1'].slice(0, length);
    return state({ snake: body, dir: 'down', status: 'running', found: 3 });
  };

  it('offers the bonus only to a snake that arrives shorter than two cells', () => {
    expect(step(arriving(1)).status).toBe('bonus');
    expect(step(arriving(2)).status).toBe('done');
  });

  it('gives a star for arriving, one for arriving short and one for the bonus', () => {
    expect(starsOf(step(arriving(2)))).toBe(1);
    expect(starsOf(finishBonus(step(arriving(1)), false))).toBe(2);
    expect(starsOf(finishBonus(step(arriving(1)), true))).toBe(3);
  });

  it('asks for the switch before the centre when there is one', () => {
    expect(taskFor(state({ found: 3 }, 3))).toBe('Take the switch at I9');
    expect(taskFor(state({ found: 3, used: ['I9'] }, 3))).toBe('Into the centre: E5');
  });
});

describe('what the card says', () => {
  it('spells out a cell reference', () => {
    expect(spell('G3')).toBe('G3: column G, row 3.');
    expect(spell('A10')).toBe('A10: column A, row 10.');
  });

  it('starts with the level note, and says what each thing did', () => {
    expect(messageFor(startState(0))).toBe(GRID_LEVELS[0].note);
    expect(messageFor(state({ event: { kind: 'wrong', cell: 'F6', wanted: 'G3' } }))).toContain('That was F6, not G3');
    expect(messageFor(state({ event: { kind: 'edge' } }))).toContain('Shift + an arrow');
  });
});

describe('saved results', () => {
  it('opens each level once the one before is finished', () => {
    expect(gridLevelOpen(NO_GAME, 0)).toBe(true);
    expect(gridLevelOpen(NO_GAME, 1)).toBe(false);
    const first = recordGrid(NO_GAME, 0, { ms: 40_000, stars: 1 });
    expect(first.opened?.id).toBe('grid.2');
    expect(gridLevelOpen(first.game, 1)).toBe(true);
  });

  it('keeps the best time and stars, and counts the goes', () => {
    const first = recordGrid(NO_GAME, 0, { ms: 40_000, stars: 1 });
    const better = recordGrid(first.game, 0, { ms: 30_000, stars: 3 });
    expect(better).toMatchObject({ newBest: true, opened: null });
    const worse = recordGrid(better.game, 0, { ms: 50_000, stars: 2 });
    expect(worse.newBest).toBe(false);
    expect(worse.game.levels['grid.1']).toEqual({ bestMs: 30_000, bestStars: 3, plays: 3 });
  });

  it('keeps Speed Trial results apart', () => {
    const withTrial = { ...NO_GAME, levels: { 'trial.1': { bestMs: 9_000, bestStars: 3, plays: 2 } } };
    expect(recordGrid(withTrial, 0, { ms: 1, stars: 1 }).game.levels['trial.1']).toEqual(withTrial.levels['trial.1']);
  });
});
