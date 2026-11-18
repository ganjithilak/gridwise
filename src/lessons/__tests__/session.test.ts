/** @jest-environment node */
import { addItUp } from '@/content/excel/unit-01-first-formulas/lesson-01-add-it-up';

import {
  advance,
  canShowMe,
  currentItem,
  isFinished,
  itemKey,
  progressOf,
  recordCheck,
  revealHint,
  showSolution,
  startSession,
  summarize,
  type Session,
} from '../session';

const start = () => startSession(addItUp, 1_000);
const pass = (s: Session, at = 2_000) => advance(recordCheck(s, 'pass'), at);

describe('lesson session', () => {
  it('walks through the lesson in order', () => {
    let s = start();
    expect(currentItem(s)?.exercise.id).toBe('xl.u1.l1.e1');
    expect(progressOf(s)).toBe(0);
    s = pass(s);
    expect(currentItem(s)?.exercise.id).toBe('xl.u1.l1.e2');
    for (let i = 0; i < 5; i++) s = pass(s);
    expect(isFinished(s)).toBe(true);
    expect(progressOf(s)).toBe(1);
    expect(s.finishedAt).toBe(2_000);
  });

  it('a wrong check costs nothing: same exercise, as many tries as you like', () => {
    let s = pass(start());
    const before = currentItem(s);
    for (let i = 0; i < 5; i++) s = recordCheck(s, 'fail');
    expect(currentItem(s)).toBe(before);
    expect(s.attempt.wrongChecks).toBe(5);
    expect(s.queue).toHaveLength(5);
  });

  it('offers "Show me" only after two wrong checks', () => {
    let s = pass(start());
    expect(canShowMe(s)).toBe(false);
    s = recordCheck(s, 'fail');
    expect(canShowMe(s)).toBe(false);
    s = recordCheck(s, 'soft');
    expect(canShowMe(s)).toBe(false);
    s = recordCheck(s, 'fail');
    expect(canShowMe(s)).toBe(true);
    s = showSolution(s);
    expect(canShowMe(s)).toBe(false);
  });

  it('brings a shown exercise back once at the end, and never a second time', () => {
    let s = pass(start()); // demo done, now on e2
    s = recordCheck(recordCheck(s, 'fail'), 'fail');
    s = advance(showSolution(s), 3_000);
    expect(s.weakSkills).toEqual(['xl.formula.arithmetic']);
    expect(s.total).toBe(7);
    expect(s.queue[s.queue.length - 1]).toMatchObject({ isRetry: true });
    expect(s.queue[s.queue.length - 1].exercise.id).toBe('xl.u1.l1.e2');

    for (let i = 0; i < 4; i++) s = pass(s);
    expect(currentItem(s)).toMatchObject({ isRetry: true });
    // Needs showing again on the retry: the lesson still finishes.
    s = recordCheck(recordCheck(s, 'fail'), 'fail');
    s = advance(showSolution(s), 9_000);
    expect(isFinished(s)).toBe(true);
    expect(s.total).toBe(7);
    expect(s.weakSkills).toEqual(['xl.formula.arithmetic']);
  });

  it('never brings a demo back or marks its skill weak', () => {
    let s = start();
    s = recordCheck(recordCheck(s, 'fail'), 'fail');
    s = advance(showSolution(s), 2_000);
    expect(s.total).toBe(6);
    expect(s.weakSkills).toEqual([]);
  });

  it('counts first-try answers: no wrong checks, no hints, not shown', () => {
    let s = pass(start()); // e1 demo
    s = pass(s); // e2 clean
    s = pass(recordCheck(s, 'fail')); // e3 one wrong check
    s = pass(s); // e4 demo
    s = pass(revealHint(s)); // e5 used a hint
    s = pass(recordCheck(s, 'soft'), 61_000); // e6 "now use SUM" is not a miss
    const summary = summarize(s, addItUp, 99_000);
    expect(summary).toMatchObject({ scored: 4, firstTry: 2, seconds: 60, weakSkills: [] });
    expect(summary.xp).toBe(14);
    // The two that were not right first time, for the "worth another look" list.
    expect(summary.missed).toEqual(['xl.u1.l1.e3', 'xl.u1.l1.e5']);
  });

  it('does not count an exercise the run never met, such as one added to the lesson part-way through', () => {
    let s = start();
    for (let i = 0; i < 6; i++) s = pass(s);
    const grown = { ...addItUp, exercises: [...addItUp.exercises, { ...addItUp.exercises[1], id: 'added.later' }] };
    expect(summarize(s, grown, 99_000)).toMatchObject({ scored: 4, firstTry: 4, missed: [], missedSkills: [] });
  });

  it('keeps a combo of first-try answers, which demos neither build nor break', () => {
    let s = pass(start()); // demo
    expect(s.combo).toBe(0);
    s = pass(s); // e2
    s = pass(s); // e3
    expect(s.combo).toBe(2);
    s = pass(s); // e4 demo
    expect(s.combo).toBe(2);
    s = pass(recordCheck(s, 'fail')); // e5 missed
    expect(s.combo).toBe(0);
    expect(s.bestCombo).toBe(2);
  });

  it('remembers what has been finished, in order, so the learner can look back', () => {
    let s = start();
    expect(s.done).toEqual([]);
    s = pass(pass(s));
    expect(s.done.map(itemKey)).toEqual(['xl.u1.l1.e1:first', 'xl.u1.l1.e2:first']);
    // What is still to do and what is done always add up to the whole lesson.
    expect(s.done.length + s.queue.length).toBe(s.total);
    expect(s.done.length).toBe(s.completed);
  });

  it('keeps an exercise that comes back apart from its first showing', () => {
    let s = pass(start());
    s = recordCheck(recordCheck(s, 'fail'), 'fail');
    s = advance(showSolution(s), 3_000);
    for (let i = 0; i < 5; i++) s = pass(s);
    expect(s.done.map(itemKey)).toContain('xl.u1.l1.e2:first');
    expect(s.done.map(itemKey)[s.done.length - 1]).toBe('xl.u1.l1.e2:retry');
    expect(s.done.length).toBe(s.total);
  });

  it('shows at most three hints', () => {
    let s = start();
    for (let i = 0; i < 5; i++) s = revealHint(s);
    expect(s.attempt.hintsShown).toBe(3);
  });
});
