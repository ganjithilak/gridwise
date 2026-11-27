import { defaultCourse } from '@/content';
import { parseRange } from '@/engine';
import { emptyProgress, NO_GAME, type ProgressData } from '@/progress/saved';

import { gameStatuses } from '../catalogue';
import { huntFeedback, huntRound, type HuntTask } from '../cellHunt';
import { shows } from '../farmSheets';
import { errorRound, fixMiss } from '../findTheError';
import { buildRound, diagnose, diagnoseChoice } from '../formulaBuilder';
import { availablePairs, buildBoards, categoryCounts } from '../matchPairs';
import { predictRound } from '../predict';
import { accuracyOf, recordPlay, starsForAccuracy, tierFor } from '../records';
import { courseOrder, newestTaught, taughtSkills } from '../taught';

const order = courseOrder(defaultCourse);
const all = new Set(order);
/** What a learner has been taught after each lesson, in course order. */
const stages = order.map((_, i) => new Set(order.slice(0, i + 1)));
const SEEDS = 40;

const finishedAll = (ids: string[]): ProgressData => {
  const data = emptyProgress();
  for (const id of ids) data.finished[id] = { finishedAt: 1, times: 1, bestFirstTry: 1, scored: 1 };
  return data;
};

describe('what counts as taught', () => {
  it('is nothing for a brand new learner, and a lesson’s skills once it is finished', () => {
    expect(taughtSkills(defaultCourse, emptyProgress()).size).toBe(0);
    const grid = defaultCourse.units[0].lessons[1];
    expect([...taughtSkills(defaultCourse, finishedAll([grid.id]))]).toEqual(grid.newSkills);
  });

  it('includes the Start here unit for someone who has used a spreadsheet', () => {
    const data = emptyProgress();
    data.profile = { ...data.profile, level: 'some' };
    expect(taughtSkills(defaultCourse, data).has('xl.cell.address')).toBe(true);
    expect(taughtSkills(defaultCourse, data).has('xl.sum.range')).toBe(false);
  });

  it('puts the newest first', () => {
    expect(newestTaught(defaultCourse, stages[3], 2)).toEqual([order[3], order[2]]);
  });
});

describe('every game asks only about what has been taught, at every point in the course', () => {
  it.each(stages.map((taught, i) => [order[i], taught] as const))('after %s', (_skill, taught) => {
    const newest = newestTaught(defaultCourse, taught, 3);
    for (let seed = 1; seed <= 6; seed++) {
      for (const p of availablePairs(taught, 'win', seed)) expect(taught.has(p.skill)).toBe(true);
      for (const t of huntRound(taught, 3, seed)) expect(taught.has(t.skill)).toBe(true);
      for (const ch of buildRound(taught, newest, 3, seed)) expect(taught.has(ch.skill)).toBe(true);
      for (const p of errorRound(taught, newest, seed)) expect(taught.has(p.skill)).toBe(true);
      for (const q of predictRound(taught, newest, seed)) expect(taught.has(q.skill)).toBe(true);
    }
  });
});

describe('Match Pairs', () => {
  it('never puts two tiles that look the same on one board', () => {
    const pairs = availablePairs(all, 'mac', 3);
    for (let seed = 0; seed < SEEDS; seed++) {
      for (const board of buildBoards(pairs, 'mixed', 3, [], seed)) {
        const faces = board.flatMap((p) => [p.left, p.right]).map((f) => JSON.stringify(f));
        expect(new Set(faces).size).toBe(faces.length);
        expect(board).toHaveLength(6);
      }
    }
  });

  it('grows from four pairs to six as the game is played well', () => {
    const pairs = availablePairs(all, 'win', 1);
    expect(buildBoards(pairs, 'functions', 1, [], 1)[0]).toHaveLength(4);
    expect(buildBoards(pairs, 'functions', 3, [], 1)[0]).toHaveLength(6);
  });

  it('opens a category only once it is taught, and names shortcuts for the computer', () => {
    const early = categoryCounts(availablePairs(stages[1], 'win', 1));
    expect(early.terms).toBeGreaterThan(0);
    expect(early.functions).toBe(0);
    const mac = availablePairs(all, 'mac', 1).find((p) => p.id === 'key.copy');
    expect(mac?.left).toEqual({ text: 'Cmd + C', code: true });
  });
});

describe('Cell Hunt', () => {
  const tasks = Array.from({ length: SEEDS }, (_, s) => huntRound(all, 3, s)).flat();

  it('keeps every target on its sheet, and never repeats one in a go', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      const round = huntRound(all, 3, seed);
      expect(new Set(round.map((t) => t.target)).size).toBe(round.length);
    }
    for (const t of tasks) {
      const r = parseRange(t.target);
      expect(r).not.toBeNull();
      expect(r!.end.col).toBeLessThan(t.sheet.cols);
      expect(r!.end.row).toBeLessThan(t.sheet.rows);
      if (t.options) expect(t.options).toContain(t.target);
      // The sheet always opens on one cell.
      expect(t.from).toMatch(/^[A-Z]+\d+$/);
      // A task never starts already answered.
      if (t.kind !== 'name') expect(t.target.split(':')[0]).not.toBe(t.from);
    }
  });

  it('says which part of a wrong cell was right', () => {
    const task: HuntTask = { kind: 'cell', skill: 'xl.cell.address', sheet: { cols: 5, rows: 6 }, target: 'C4', from: 'A1', ask: '' };
    expect(huntFeedback(task, parseRange('C2')!)).toMatch(/^You’re in the correct column\. Check the row number/);
    expect(huntFeedback(task, parseRange('B4')!)).toMatch(/^You’re in the correct row\. Check the column letter/);
    expect(huntFeedback({ ...task, kind: 'range', target: 'B2:D4' }, parseRange('B2:D3')!)).toBe('It starts at the right cell. It should end at D4, not D3.');
  });

  it('only asks to use the arrows, or rows and columns, once they are taught', () => {
    const roots2 = new Set(['xl.spreadsheet.purpose', 'xl.cell.address']);
    expect(huntRound(roots2, 3, 1).every((t) => t.kind === 'cell')).toBe(true);
  });
});

describe('Formula Builder', () => {
  it('always gives the pieces the answer needs, and the engine accepts it', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      for (const ch of buildRound(all, [], 3, seed)) {
        if (ch.kind === 'choose') {
          expect(ch.options).toContain(ch.answer);
          for (const o of ch.options!.filter((x) => x !== ch.answer)) expect(diagnoseChoice(ch, o)).not.toBeNull();
          continue;
        }
        expect(diagnose(ch, ch.answer)).toBeNull();
        let rest = ch.answer;
        const pieces = [...ch.tokens];
        while (rest.length > 0) {
          const t = pieces.filter((p) => rest.startsWith(p)).sort((a, b) => b.length - a.length)[0];
          expect(t).toBeDefined();
          rest = rest.slice(t.length);
          pieces.splice(pieces.indexOf(t), 1);
        }
      }
    }
  });

  it('explains what is wrong with a built formula', () => {
    const sum = buildRound(new Set(['xl.sum.range']), [], 1, 4)[0];
    expect(diagnose(sum, 'SUM(B2:B6)')).toBe('A formula starts with =. Put it first.');
    expect(diagnose(sum, '=AVERAGE(B2:B6)')).toBe('AVERAGE gives the typical value. This needs SUM.');
    // The same number from the wrong cells is still wrong: SUM skips the day names in A.
    expect(diagnose(sum, '=SUM(A2:B6)')).toMatch(/^That happens to show \d+ here, but it uses A2:B6\./);
    expect(diagnose(sum, '=SUM(B2:B5)')).toMatch(/^That uses B2:B5, which shows \d+\. Check which cells/);
    const locked = buildRound(new Set(['xl.absolute']), [], 1, 4)[0];
    expect(diagnose(locked, '=B2*E1')).toMatch(/Lock it: \$E\$1/);
  });

  it('adds spare pieces as it gets harder', () => {
    const easy = buildRound(new Set(['xl.sum.range']), [], 1, 2)[0];
    const hard = buildRound(new Set(['xl.sum.range']), [], 2, 2)[0];
    expect(hard.tokens.length).toBeGreaterThan(easy.tokens.length);
  });
});

describe('Find the Error', () => {
  it('offers three different corrections, and only the right one fixes it', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      for (const p of errorRound(all, [], seed)) {
        expect(new Set(p.fixes).size).toBe(3);
        expect(p.fixes).toContain(p.right);
        expect(p.wrong.length).toBeGreaterThan(0);
        for (const w of p.fixes.filter((f) => f !== p.right)) {
          // A wrong correction either shows a different result, or is explained.
          const differs = shows(p.sheet, p.fixCell, w) !== shows(p.sheet, p.fixCell, p.right);
          expect(differs || p.missWhy?.[w] !== undefined).toBe(true);
          expect(fixMiss(p, w).length).toBeGreaterThan(10);
        }
      }
    }
  });
});

describe('Predict the Result', () => {
  it('has three different options, and the right one is what the engine shows', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      for (const q of predictRound(all, [], seed)) {
        expect(new Set(q.options).size).toBe(3);
        expect(q.options).toContain(q.right);
        expect(shows(q.sheet, q.cell, q.formula)).toBe(q.right);
      }
    }
  });
});

describe('scoring', () => {
  it('gives stars for accuracy only', () => {
    expect(starsForAccuracy(100)).toBe(3);
    expect(starsForAccuracy(75)).toBe(2);
    expect(starsForAccuracy(74)).toBe(1);
    expect(accuracyOf({ asked: 8, firstTry: 6 })).toBe(75);
  });

  it('keeps the best accuracy and timed best, and says which is new', () => {
    const one = recordPlay(NO_GAME, 'hunt', { ms: 9000, asked: 8, firstTry: 6 });
    expect(one).toMatchObject({ stars: 2, accuracy: 75, newBest: null, first: true });
    const two = recordPlay(one.game, 'hunt', { ms: 12000, asked: 8, firstTry: 8 });
    expect(two.newBest).toBe('accuracy');
    const three = recordPlay(two.game, 'hunt', { ms: 7000, asked: 8, firstTry: 8, timed: true });
    expect(three.record).toMatchObject({ bestAccuracy: 100, bestTimedMs: 7000, plays: 3, bestStars: 3 });
    const four = recordPlay(three.game, 'hunt', { ms: 6000, asked: 8, firstTry: 8, timed: true });
    expect(four.newBest).toBe('time');
  });

  it('gets harder with play', () => {
    expect(tierFor(undefined)).toBe(1);
    expect(tierFor({ bestMs: 1, bestStars: 1, plays: 2 })).toBe(2);
    expect(tierFor({ bestMs: 1, bestStars: 2, plays: 6 })).toBe(3);
  });
});

describe('the Games screen', () => {
  it('has nothing open for a brand new learner, and says which lesson opens each game', () => {
    const statuses = gameStatuses(defaultCourse, emptyProgress());
    expect(statuses.every((s) => !s.open)).toBe(true);
    expect(statuses.find((s) => s.entry.id === 'hunt')?.opensAfter).toBe(`Opens after ${defaultCourse.units[0].lessons[1].title}`);
  });

  it('opens the formula games with the first formulas lesson', () => {
    const roots = defaultCourse.units[0].lessons.map((l) => l.id);
    const before = gameStatuses(defaultCourse, finishedAll(roots));
    expect(before.find((s) => s.entry.id === 'builder')?.open).toBe(false);
    expect(before.find((s) => s.entry.id === 'trial')?.open).toBe(true);
    const after = gameStatuses(defaultCourse, finishedAll([...roots, defaultCourse.units[1].lessons[0].id]));
    expect(after.find((s) => s.entry.id === 'builder')?.open).toBe(true);
    expect(after.find((s) => s.entry.id === 'predict')?.open).toBe(true);
  });
});
