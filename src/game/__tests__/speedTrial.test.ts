import { defaultCourse } from '@/content';
import { NO_GAME } from '@/progress/saved';

import {
  answerLabel,
  explainMiss,
  fromKeyName,
  GAME_LEVELS,
  GAME_SHORTCUTS,
  hintFor,
  isRight,
  levelOpen,
  ROUND_LENGTH,
  roundFor,
  shortcutById,
  shortcutsAt,
} from '../speedTrial';
import { courseOrder } from '../taught';

const all = new Set(courseOrder(defaultCourse));
const ids = (seed: number, level = 0) => roundFor(level, seed, all).map((t) => t.id);

describe('the levels', () => {
  it('bring in every shortcut exactly once', () => {
    const added = GAME_LEVELS.flatMap((l) => l.adds);
    expect(new Set(added).size).toBe(added.length);
    expect([...added].sort()).toEqual(GAME_SHORTCUTS.map((s) => s.id).sort());
  });

  it('test only skills the course teaches, and no redo (it is never taught)', () => {
    for (const s of GAME_SHORTCUTS) expect(all.has(s.skill)).toBe(true);
    expect(GAME_SHORTCUTS.find((s) => s.id === 'redo')).toBeUndefined();
  });

  it('open as the lessons behind them are finished, not before', () => {
    expect(levelOpen(new Set(), 0)).toBe(false);
    expect(levelOpen(new Set(['xl.cell.type']), 0)).toBe(true);
    expect(levelOpen(new Set(['xl.select.column']), 1)).toBe(false);
    expect(levelOpen(new Set(['xl.select.column', 'xl.select.row']), 1)).toBe(true);
    // Copy, cut and paste waits for both the copy and the cut lessons.
    expect(levelOpen(new Set(['xl.copy']), 5)).toBe(false);
  });

  it('keep only earlier levels that are open in play', () => {
    const taught = new Set(['xl.cell.type', 'xl.keys.move']);
    expect(shortcutsAt(2, taught)).toEqual(['confirm', 'cancel', 'edit', 'moveDown', 'moveUp', 'moveRight', 'moveLeft']);
  });
});

describe('a go at a level', () => {
  it('has eight tasks, with the new shortcuts most and two earlier ones', () => {
    const tasks = ids(3, 2);
    expect(tasks).toHaveLength(ROUND_LENGTH);
    expect(tasks.filter((id) => GAME_LEVELS[2].adds.includes(id)).length).toBeGreaterThanOrEqual(ROUND_LENGTH - 2);
  });

  it('never asks for the same shortcut twice running', () => {
    for (let seed = 0; seed < 50; seed++) {
      const tasks = ids(seed, 3);
      for (let i = 1; i < tasks.length; i++) expect(tasks[i]).not.toBe(tasks[i - 1]);
    }
  });

  it('asks two tasks the other way round: keys shown, the action named', () => {
    const round = roundFor(2, 7, all);
    const named = round.filter((t) => t.kind === 'name');
    expect(named).toHaveLength(2);
    for (const t of named) {
      expect(t.options).toHaveLength(3);
      expect(t.options).toContain(shortcutById(t.id).does);
    }
  });

  it('is the same for the same seed', () => {
    expect(roundFor(1, 9, all)).toEqual(roundFor(1, 9, all));
  });
});

describe('pressing an answer', () => {
  const copy = shortcutById('copy');
  it('wants Ctrl on Windows and Cmd on a Mac for the letter shortcuts', () => {
    expect(isRight(copy, 'win', ['Ctrl'], 'C')).toBe(true);
    expect(isRight(copy, 'mac', ['Cmd'], 'c')).toBe(true);
    expect(isRight(copy, 'mac', ['Ctrl'], 'C')).toBe(false);
    expect(answerLabel(copy, 'mac')).toBe('Cmd + C');
  });

  it('wants the Ctrl key itself for a whole column, on both', () => {
    expect(isRight(shortcutById('selectColumn'), 'mac', ['Ctrl'], 'Space')).toBe(true);
  });

  it('takes a key on its own for the entry and arrow keys', () => {
    expect(isRight(shortcutById('confirm'), 'win', [], 'Enter')).toBe(true);
    expect(isRight(shortcutById('moveDown'), 'win', ['Shift'], 'Down')).toBe(false);
    expect(fromKeyName('Escape')).toBe('Esc');
    expect(fromKeyName('F2')).toBe('F2');
    expect(fromKeyName('ArrowLeft')).toBe('Left');
  });
});

describe('explaining a wrong press', () => {
  const paste = shortcutById('paste');
  it('says what the keys pressed really do', () => {
    expect(explainMiss(paste, 'win', ['Ctrl'], 'C')).toBe('Ctrl + C copies the selection. To paste what you copied: Ctrl + V.');
  });
  it('says which part was right', () => {
    expect(explainMiss(paste, 'win', [], 'V')).toBe('Right key. Hold Ctrl first: Ctrl + V.');
    expect(explainMiss(paste, 'win', ['Ctrl'], 'B')).toMatch(/^Ctrl \+ B makes the selection bold/);
    expect(explainMiss(paste, 'win', ['Ctrl'], 'Q')).toBe('Ctrl is right. The key is V: V sits beside C.');
    expect(explainMiss(shortcutById('selectRow'), 'win', ['Ctrl'], 'Space')).toMatch(/^Ctrl \+ Space selects the whole column/);
  });
  it('says a key on its own needs nothing held', () => {
    expect(explainMiss(shortcutById('moveDown'), 'win', ['Ctrl'], 'Down')).toBe('↓ on its own, with nothing held.');
  });
});

describe('hints', () => {
  it('fade as a shortcut is known, and come back after a miss', () => {
    expect(hintFor(NO_GAME, 'copy', false)).toBe('full');
    expect(hintFor({ ...NO_GAME, known: { copy: 2 } }, 'copy', false)).toBe('first');
    expect(hintFor({ ...NO_GAME, known: { copy: 5 } }, 'copy', false)).toBe('none');
    expect(hintFor({ ...NO_GAME, known: { copy: 5 } }, 'copy', true)).toBe('full');
  });
});
