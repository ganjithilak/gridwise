/** @jest-environment node */
import { addItUp } from '@/content/excel/unit-01-first-formulas/lesson-01-add-it-up';
import {
  advance,
  currentItem,
  itemKey,
  recordCheck,
  revealHint,
  showSolution,
  startSession,
  summarize,
  type Session,
  type Summary,
} from '@/lessons/session';
import type { ExerciseSnapshot } from '@/lessons/snapshot';

import { DEFAULT_PROFILE, emptyProgress, fromSaved, migrate, NO_GAME, recordFinish, toSaved, type Run, type SavedRun } from '../saved';

const pass = (s: Session, at: number) => advance(recordCheck(s, 'pass'), at);

/** Part-way through: demo and e2 done, e3 shown and requeued, now on the second demo with a hint used. */
function midLesson(): Run {
  let s = startSession(addItUp, 1_000);
  s = pass(s, 2_000);
  s = pass(s, 3_000);
  s = recordCheck(recordCheck(s, 'fail'), 'fail');
  s = advance(showSolution(s), 4_000);
  s = revealHint(s);
  const here: ExerciseSnapshot = {
    phase: 'do',
    stop: 0,
    work: { phase: 'do', sheet: { cells: { C7: '=SUM(C2:C6)' }, selection: 'D7', editing: '=SUM(' } },
  };
  return { session: s, snapshots: { [itemKey(currentItem(s)!)]: here } };
}

/** What actually reaches the device: JSON, with nothing but plain data in it. */
const throughStorage = <T,>(saved: T): T => JSON.parse(JSON.stringify(saved));

describe('saving a lesson that is in progress', () => {
  it('reopens at the same exercise with everything the learner had', () => {
    const run = midLesson();
    const back = fromSaved(throughStorage(toSaved(run, 61_000)), addItUp, 500_000);
    expect(back).not.toBeNull();
    const s = back!.session;
    expect(currentItem(s)?.exercise.id).toBe('xl.u1.l1.e4');
    expect(s.queue.map(itemKey)).toEqual(run.session.queue.map(itemKey));
    expect(s.done.map(itemKey)).toEqual(['xl.u1.l1.e1:first', 'xl.u1.l1.e2:first', 'xl.u1.l1.e3:first']);
    expect(s.queue[s.queue.length - 1]).toMatchObject({ isRetry: true });
    expect(s.attempt).toEqual({ wrongChecks: 0, hintsShown: 1, solutionShown: false });
    expect(s.results).toEqual(run.session.results);
    expect(s.weakSkills).toEqual(['xl.formula.arithmetic']);
    expect(s).toMatchObject({ completed: 3, total: 7, combo: 0, bestCombo: 1 });
    expect(back!.snapshots).toEqual(run.snapshots);
  });

  it('hands back the real exercises, not copies of them', () => {
    const back = fromSaved(throughStorage(toSaved(midLesson(), 61_000)), addItUp, 500_000)!;
    expect(currentItem(back.session)?.exercise).toBe(addItUp.exercises[3]);
  });

  it('does not count time spent away from the lesson', () => {
    const saved = throughStorage(toSaved(midLesson(), 61_000)); // a minute in
    const back = fromSaved(saved, addItUp, 9_000_000)!; // reopened hours later
    let s = back.session;
    while (currentItem(s)) s = pass(s, 9_030_000); // and finished 30 seconds after that
    expect(summarize(s, addItUp, 9_030_000).seconds).toBe(90);
  });

  it('can be finished after reopening, and the lesson still scores correctly', () => {
    let s = fromSaved(throughStorage(toSaved(midLesson(), 61_000)), addItUp, 70_000)!.session;
    while (currentItem(s)) s = pass(s, 80_000);
    // e2 was first try; e3 needed "Show me"; e5 and e6 were clean after reopening.
    expect(summarize(s, addItUp, 80_000)).toMatchObject({ scored: 4, firstTry: 3, weakSkills: ['xl.formula.arithmetic'] });
  });

  it('starts the lesson afresh when the save no longer fits it', () => {
    const saved = throughStorage(toSaved(midLesson(), 61_000));
    const removed = { ...saved, queue: [{ id: 'xl.u1.l1.gone', isRetry: false }, ...saved.queue] };
    expect(fromSaved(removed, addItUp, 70_000)).toBeNull();
    expect(fromSaved({ ...saved, lessonId: 'xl.u1.l2' }, addItUp, 70_000)).toBeNull();
    expect(fromSaved({ ...saved, queue: [] }, addItUp, 70_000)).toBeNull();
  });

  it('never throws on a damaged save', () => {
    const damaged = [null, 'nonsense', 42, {}, { lessonId: addItUp.id }, { lessonId: addItUp.id, queue: 'x', done: [] }];
    for (const bad of damaged) {
      expect(() => fromSaved(bad as unknown as SavedRun, addItUp, 1)).not.toThrow();
      expect(fromSaved(bad as unknown as SavedRun, addItUp, 1)).toBeNull();
    }
  });

  it('repairs counters that are missing rather than refusing the save', () => {
    const saved = throughStorage(toSaved(midLesson(), 61_000)) as unknown as Record<string, unknown>;
    delete saved.attempt;
    delete saved.combo;
    delete saved.snapshots;
    const back = fromSaved(saved as unknown as SavedRun, addItUp, 70_000)!;
    expect(back.session.attempt).toEqual({ wrongChecks: 0, hintsShown: 0, solutionShown: false });
    expect(back.session.combo).toBe(0);
    expect(back.snapshots).toEqual({});
  });
});

describe('finished lessons', () => {
  const summary: Summary = { scored: 4, firstTry: 3, seconds: 90, weakSkills: [], bestCombo: 3, xp: 16, skills: {}, missedSkills: [], missed: [] };

  it('records the first finish', () => {
    expect(recordFinish(undefined, summary, 5_000)).toEqual({ finishedAt: 5_000, times: 1, bestFirstTry: 3, scored: 4 });
  });

  it('keeps the best score when the lesson is done again', () => {
    const first = recordFinish(undefined, summary, 5_000);
    const worse = recordFinish(first, { ...summary, firstTry: 1 }, 6_000);
    expect(worse).toEqual({ finishedAt: 6_000, times: 2, bestFirstTry: 3, scored: 4 });
    expect(recordFinish(worse, { ...summary, firstTry: 4 }, 7_000).bestFirstTry).toBe(4);
  });
});

describe('migrating saved data', () => {
  it('carries a version 1 save forward without losing anything', () => {
    // Version 1 knew only about lessons in progress and lessons finished.
    const v1 = {
      runs: { [addItUp.id]: toSaved(midLesson(), 61_000) },
      finished: { 'xl.u1.l0': { finishedAt: 1, times: 1, bestFirstTry: 2, scored: 4 } },
    };
    const now = migrate(throughStorage(v1), 1);
    expect(now.runs).toEqual(throughStorage(v1.runs));
    expect(now.finished).toEqual(v1.finished);
    // And the run can still be reopened.
    expect(fromSaved(now.runs[addItUp.id], addItUp, 70_000)?.session.queue[0].exercise.id).toBe('xl.u1.l1.e4');
    // Everything version 2 added starts empty.
    expect(now).toMatchObject({ xp: 0, days: {}, skills: {}, toPractise: {}, passed: {}, badges: [] });
    expect(now.streak).toEqual({ count: 0, lastDay: null, freezeWeek: null, best: 0 });
    expect(now.profile).toEqual(DEFAULT_PROFILE);
    expect(now.game).toEqual(NO_GAME);
  });

  // What a save looked like before the profile had a name and the game existed.
  const v2 = {
    runs: {},
    finished: {},
    xp: 46,
    days: { '2026-11-14': 18 },
    streak: { count: 3, lastDay: '2026-11-14', freezeWeek: '2026-11-09', best: 5 },
    badges: ['unit:xl.u1'],
    profile: { level: 'some', computer: 'mac', feedback: false, dailyGoal: 30 },
    skills: { 'xl.sum.range': { box: 3, due: '2026-11-18', weak: false } },
    toPractise: { 'xl.u1.l2': ['xl.average'] },
    passed: { 'xl.u1.test': 5 },
  };

  it('carries a version 2 save forward: everything kept, and no tour for someone already using the app', () => {
    expect(migrate(throughStorage(v2), 2)).toEqual({
      ...v2,
      profile: { ...v2.profile, name: '', colour: 'blue', sheetSide: 'right', tourSeen: true, look: 'dark' },
      game: NO_GAME,
    });
  });

  it('offers the tour to someone who has not started yet', () => {
    const untouched = { ...v2, profile: { ...v2.profile, level: null } };
    expect(migrate(throughStorage(untouched), 2).profile.tourSeen).toBe(false);
  });

  it('keeps a version 3 save exactly as it is', () => {
    const v3 = {
      ...v2,
      profile: { ...v2.profile, name: 'Sam', colour: 'green', sheetSide: 'left', tourSeen: true, look: 'light' },
      game: { levels: { 'trial.1': { bestMs: 14_200, bestStars: 3, plays: 4 } }, known: { copy: 6, paste: 2 } },
    };
    expect(migrate(throughStorage(v3), 3)).toEqual(v3);
  });

  it('repairs damaged game results and profile choices', () => {
    const damaged = {
      ...v2,
      profile: { ...v2.profile, name: 'A name that is far too long to fit on a line', colour: 'gold', sheetSide: 'top', tourSeen: 'yes', look: 'neon' },
      game: { levels: { a: 'x', b: { bestMs: 0 }, c: { bestMs: 900, bestStars: 9, plays: 0 } }, known: { copy: -3, cut: 'lots', undo: 2 } },
    };
    const fixed = migrate(damaged, 3);
    expect(fixed.profile).toMatchObject({ name: 'A name that is far t', colour: 'blue', sheetSide: 'right', tourSeen: true, look: 'dark' });
    expect(fixed.game).toEqual({ levels: { c: { bestMs: 900, bestStars: 3, plays: 1 } }, known: { copy: 0, cut: 0, undo: 2 } });
  });

  it('turns anything unreadable into an empty, usable store', () => {
    for (const bad of [undefined, null, 'x', 7, [], { runs: [], finished: 'no', streak: 4, profile: 'x', xp: 'lots' }]) {
      expect(migrate(bad, 0)).toEqual(emptyProgress());
    }
  });

  it('repairs single damaged fields and keeps the rest', () => {
    const damaged = { ...emptyProgress(), xp: -5, profile: { level: 'expert', computer: 'linux', feedback: 'yes', dailyGoal: 0 }, badges: [1, 'unit:a'] };
    const fixed = migrate(damaged, 2);
    expect(fixed.xp).toBe(0);
    expect(fixed.profile).toEqual(DEFAULT_PROFILE);
    expect(fixed.badges).toEqual(['unit:a']);
  });
});
