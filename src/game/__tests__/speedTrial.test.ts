/** @jest-environment node */
import { NO_GAME, type GameData } from '@/progress/saved';

import {
  answerLabel,
  clockTime,
  GAME_LEVELS,
  GAME_SHORTCUTS,
  hintFor,
  isRight,
  keysAt,
  levelOpen,
  recordRound,
  ROUND_LENGTH,
  roundFor,
  shortcutById,
  shortcutsAt,
  starsFor,
} from '../speedTrial';

describe('the levels', () => {
  it('bring in every shortcut exactly once', () => {
    const added = GAME_LEVELS.flatMap((level) => level.adds);
    expect([...added].sort()).toEqual(GAME_SHORTCUTS.map((s) => s.id).sort());
    expect(new Set(added).size).toBe(added.length);
  });

  it('keep the earlier shortcuts in play', () => {
    expect(shortcutsAt(0)).toEqual(['copy', 'paste', 'undo']);
    expect(shortcutsAt(1)).toEqual(['copy', 'paste', 'undo', 'cut', 'selectAll', 'bold']);
    expect(shortcutsAt(GAME_LEVELS.length - 1)).toHaveLength(GAME_SHORTCUTS.length);
  });

  it('open one at a time, as the one before is finished', () => {
    expect(levelOpen(NO_GAME, 0)).toBe(true);
    expect(levelOpen(NO_GAME, 1)).toBe(false);
    const played = recordRound(NO_GAME, 0, { ms: 30_000, misses: 4, firstTry: [] }).game;
    expect(levelOpen(played, 1)).toBe(true);
    expect(levelOpen(played, 2)).toBe(false);
  });
});

describe('a go at a level', () => {
  it.each(GAME_LEVELS.map((level, i) => [level.title, i] as const))('%s: has eight tasks from the shortcuts in play', (_title, index) => {
    for (let seed = 0; seed < 25; seed++) {
      const round = roundFor(index, seed);
      expect(round).toHaveLength(ROUND_LENGTH);
      const inPlay = shortcutsAt(index);
      expect(round.filter((id) => !inPlay.includes(id))).toEqual([]);
      // Each shortcut the level is about comes up, so nobody finishes it without meeting them.
      for (const id of GAME_LEVELS[index].adds) expect(round).toContain(id);
    }
  });

  it('never asks for the same shortcut twice running', () => {
    for (let index = 0; index < GAME_LEVELS.length; index++) {
      for (let seed = 0; seed < 50; seed++) {
        const round = roundFor(index, seed);
        expect(round.filter((id, i) => i > 0 && id === round[i - 1])).toEqual([]);
      }
    }
  });

  it('is the same for the same seed, and changes from one go to the next', () => {
    expect(roundFor(1, 7)).toEqual(roundFor(1, 7));
    const goes = new Set(Array.from({ length: 10 }, (_, seed) => roundFor(1, seed).join()));
    expect(goes.size).toBeGreaterThan(3);
  });
});

describe('pressing an answer', () => {
  const copy = shortcutById('copy');
  const column = shortcutById('selectColumn');
  const stretch = shortcutById('extendDown');

  it('wants Ctrl on Windows and Cmd on a Mac for the letter shortcuts', () => {
    expect(answerLabel(copy, 'win')).toBe('Ctrl + C');
    expect(answerLabel(copy, 'mac')).toBe('Cmd + C');
    expect(isRight(copy, 'win', ['Ctrl'], 'c')).toBe(true);
    expect(isRight(copy, 'mac', ['Ctrl'], 'C')).toBe(false);
    expect(isRight(copy, 'mac', ['Cmd'], 'C')).toBe(true);
  });

  it('wants the Ctrl key itself for a whole column, on both', () => {
    expect(answerLabel(column, 'mac')).toBe('Ctrl + Space');
    expect(isRight(column, 'mac', ['Ctrl'], 'Space')).toBe(true);
    expect(isRight(column, 'mac', ['Cmd'], 'Space')).toBe(false);
  });

  it('turns down a wrong key, a missing key and an extra key', () => {
    expect(isRight(copy, 'win', ['Ctrl'], 'V')).toBe(false);
    expect(isRight(copy, 'win', [], 'C')).toBe(false);
    expect(isRight(copy, 'win', ['Ctrl', 'Shift'], 'C')).toBe(false);
    expect(isRight(stretch, 'win', ['Shift'], 'Down')).toBe(true);
    expect(isRight(stretch, 'win', ['Shift'], 'Up')).toBe(false);
  });
});

describe('the keyboard', () => {
  it('lights more keys as the levels go up', () => {
    expect(keysAt(0, 'win')).toEqual({ holds: ['Ctrl'], keys: ['C', 'V', 'Z'] });
    expect(keysAt(0, 'mac').holds).toEqual(['Cmd']);
    const last = keysAt(GAME_LEVELS.length - 1, 'mac');
    expect(last.holds.sort()).toEqual(['Cmd', 'Ctrl', 'Shift']);
    expect(last.keys).toEqual(expect.arrayContaining(['Space', 'Down', 'Y', 'A']));
  });

  it('hints less as a shortcut is known better, and helps again after a miss', () => {
    const game = (known: number): GameData => ({ levels: {}, known: { copy: known } });
    expect(hintFor(game(0), 'copy', false)).toBe('full');
    expect(hintFor(game(1), 'copy', false)).toBe('full');
    expect(hintFor(game(2), 'copy', false)).toBe('first');
    expect(hintFor(game(4), 'copy', false)).toBe('first');
    expect(hintFor(game(5), 'copy', false)).toBe('none');
    expect(hintFor(game(9), 'copy', true)).toBe('full');
    expect(hintFor(NO_GAME, 'paste', false)).toBe('full');
  });
});

describe('scoring', () => {
  it('gives three stars for clean and quick, two for nearly clean, one for finishing', () => {
    expect(starsFor({ ms: 15_000, misses: 0, firstTry: [] })).toBe(3);
    expect(starsFor({ ms: 20_000, misses: 0, firstTry: [] })).toBe(3);
    expect(starsFor({ ms: 20_001, misses: 0, firstTry: [] })).toBe(2);
    expect(starsFor({ ms: 9_000, misses: 2, firstTry: [] })).toBe(2);
    expect(starsFor({ ms: 9_000, misses: 3, firstTry: [] })).toBe(1);
  });

  it('keeps the best time and stars, and counts the goes', () => {
    const first = recordRound(NO_GAME, 0, { ms: 30_000, misses: 3, firstTry: ['copy', 'copy', 'paste'] });
    expect(first).toMatchObject({ stars: 1, newBest: false, opened: GAME_LEVELS[1] });
    expect(first.game.levels['trial.1']).toEqual({ bestMs: 30_000, bestStars: 1, plays: 1 });
    expect(first.game.known).toEqual({ copy: 2, paste: 1 });

    const better = recordRound(first.game, 0, { ms: 12_000, misses: 0, firstTry: ['copy'] });
    expect(better).toMatchObject({ stars: 3, newBest: true, opened: null });
    expect(better.game.levels['trial.1']).toEqual({ bestMs: 12_000, bestStars: 3, plays: 2 });
    expect(better.game.known.copy).toBe(3);

    const worse = recordRound(better.game, 0, { ms: 40_000, misses: 5, firstTry: [] });
    expect(worse.newBest).toBe(false);
    expect(worse.game.levels['trial.1']).toEqual({ bestMs: 12_000, bestStars: 3, plays: 3 });
  });

  it('opens nothing after the last level', () => {
    const last = GAME_LEVELS.length - 1;
    expect(recordRound(NO_GAME, last, { ms: 1, misses: 0, firstTry: [] }).opened).toBeNull();
  });

  it('shows a time in minutes, seconds and tenths', () => {
    expect(clockTime(0)).toBe('0:00.0');
    expect(clockTime(12_449)).toBe('0:12.4');
    expect(clockTime(83_950)).toBe('1:23.9');
  });
});
