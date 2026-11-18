/** @jest-environment node */
import { defaultCourse } from '@/content';
import { addDays, dayKey, daysBetween, freezeClock, shiftClock, weekOf } from '@/lib/clock';
import type { SkillResult, Summary } from '@/lessons/session';
import { LIMITS } from '@/lessons/types';

import { applyFinish, REVIEW_ID, XP_PER_PRACTICE } from '../finish';
import { practiceIdFor, practiceRound, skillsToPractise } from '../mastery';
import { buildPath, nextUp, unitBadge, type UnitNode } from '../path';
import { resolvePlayable, reviewSession, usesShortcuts } from '../playable';
import { emptyProgress, type Level, type ProgressData } from '../saved';
import { dueSkills, INTERVALS, review } from '../srs';
import { learnedToday, NO_STREAK, streakAtRisk, streakToday } from '../streak';

const course = defaultCourse;
const [intro, unit1, unit2, unit3] = course.units;
const MON = '2026-11-16';

const good: SkillResult = { firstTry: 2, missed: 0, shown: false };
const slipped: SkillResult = { firstTry: 1, missed: 1, shown: false };
const shown: SkillResult = { firstTry: 0, missed: 1, shown: true };

function summary(skills: Record<string, SkillResult>): Summary {
  const scored = Object.values(skills).reduce((n, s) => n + s.firstTry + s.missed, 0);
  const firstTry = Object.values(skills).reduce((n, s) => n + s.firstTry, 0);
  return {
    scored,
    firstTry,
    seconds: 120,
    weakSkills: Object.keys(skills).filter((skill) => skills[skill].shown),
    bestCombo: firstTry,
    xp: 10 + 2 * firstTry,
    skills,
    missedSkills: Object.keys(skills).filter((skill) => skills[skill].missed > 0),
    missed: [],
  };
}

const started = (level: Level = 'some'): ProgressData => ({ ...emptyProgress(), profile: { ...emptyProgress().profile, level } });
const finish = (data: ProgressData, id: string, s: Summary, today = MON) => applyFinish(data, course, { id, summary: s, now: 1_000, today });
const states = (path: UnitNode[], unitId: string) => path.find((n) => n.unit.id === unitId)!.lessons.map((l) => l.state);

describe('calendar days', () => {
  afterEach(() => freezeClock(null));

  it('counts days by the local calendar, across month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-11-14', '2026-11-16')).toBe(2);
    expect(daysBetween('2026-11-16', '2026-11-14')).toBe(-2);
  });

  it('knows which Monday starts a week', () => {
    expect(weekOf('2026-11-16')).toBe('2026-11-16');
    expect(weekOf('2026-11-18')).toBe('2026-11-16');
    expect(weekOf('2026-11-22')).toBe('2026-11-16');
    expect(weekOf('2026-11-23')).toBe('2026-11-23');
  });

  it('turns over at local midnight, and follows the test clock', () => {
    freezeClock(new Date(2026, 10, 14, 23, 59).getTime());
    expect(dayKey()).toBe('2026-11-14');
    shiftClock(2 * 60_000);
    expect(dayKey()).toBe('2026-11-15');
  });
});

describe('streak', () => {
  it('starts at one and grows by a day at a time', () => {
    let s = learnedToday(NO_STREAK, MON);
    expect(s).toMatchObject({ count: 1, lastDay: MON, best: 1 });
    s = learnedToday(s, addDays(MON, 1));
    s = learnedToday(s, addDays(MON, 2));
    expect(s).toMatchObject({ count: 3, best: 3 });
  });

  it('a second lesson on the same day changes nothing', () => {
    const once = learnedToday(NO_STREAK, MON);
    expect(learnedToday(once, MON)).toBe(once);
  });

  it('forgives one missed day a week without being asked', () => {
    let s = learnedToday(learnedToday(NO_STREAK, MON), addDays(MON, 1));
    // Wednesday is missed.
    expect(streakToday(s, addDays(MON, 3))).toBe(2);
    s = learnedToday(s, addDays(MON, 3));
    expect(s).toMatchObject({ count: 3, freezeWeek: MON });
    // Friday is missed too, in the same week: the freeze is used up.
    expect(streakToday(s, addDays(MON, 5))).toBe(0);
    s = learnedToday(s, addDays(MON, 5));
    expect(s).toMatchObject({ count: 1, best: 3 });
  });

  it('gives the freeze back the following week', () => {
    let s = learnedToday(learnedToday(NO_STREAK, addDays(MON, 3)), addDays(MON, 5));
    expect(s).toMatchObject({ count: 2, freezeWeek: MON });
    s = learnedToday(s, addDays(MON, 6));
    // Next Monday is missed; Tuesday is a new week with a fresh freeze.
    s = learnedToday(s, addDays(MON, 8));
    expect(s).toMatchObject({ count: 4, freezeWeek: addDays(MON, 7) });
  });

  it('two missed days in a row always start again', () => {
    const s = learnedToday(NO_STREAK, MON);
    expect(streakToday(s, addDays(MON, 3))).toBe(0);
    expect(learnedToday(s, addDays(MON, 3)).count).toBe(1);
  });

  it('says when today still needs a lesson to keep it going', () => {
    const s = learnedToday(NO_STREAK, MON);
    expect(streakAtRisk(s, MON)).toBe(false);
    expect(streakAtRisk(s, addDays(MON, 1))).toBe(true);
    expect(streakAtRisk(s, addDays(MON, 4))).toBe(false);
    expect(streakAtRisk(NO_STREAK, MON)).toBe(false);
  });
});

describe('review schedule', () => {
  it('moves a skill up a box each time it is right first time, and reviews it less often', () => {
    let s = review(undefined, good, MON);
    expect(s).toEqual({ box: 2, due: addDays(MON, INTERVALS[1]), weak: false });
    s = review(s, good, s.due);
    expect(s.box).toBe(3);
    for (let i = 0; i < 6; i++) s = review(s, good, s.due);
    expect(s.box).toBe(INTERVALS.length);
    expect(daysBetween(MON, s.due)).toBeGreaterThan(16);
  });

  it('keeps a skill that was missed on the practice list, and sends a shown one back to the start', () => {
    const known = review(review(undefined, good, MON), good, MON);
    expect(review(known, slipped, MON)).toMatchObject({ box: 3, weak: true });
    expect(review(known, shown, MON)).toMatchObject({ box: 1, weak: true, due: addDays(MON, 1) });
    expect(review(undefined, slipped, MON)).toMatchObject({ box: 1, weak: true });
  });

  it('offers weak skills first, then the most overdue', () => {
    const skills = {
      fresh: { box: 3, due: addDays(MON, 4), weak: false },
      overdue: { box: 2, due: addDays(MON, -5), weak: false },
      dueToday: { box: 2, due: MON, weak: false },
      weak: { box: 1, due: addDays(MON, 1), weak: true },
    };
    expect(dueSkills(skills, MON)).toEqual(['weak', 'overdue', 'dueToday']);
    expect(dueSkills({}, MON)).toEqual([]);
  });
});

describe('practising what was missed', () => {
  const lesson = unit1.lessons[0];
  const [first, second] = lesson.newSkills;

  it('lets one slip go, and asks for practice after more', () => {
    expect(skillsToPractise(summary({ [first]: good, [second]: good }))).toEqual([]);
    expect(skillsToPractise(summary({ [first]: slipped, [second]: good }))).toEqual([]);
    expect(LIMITS.missesBeforePractice).toBe(1);
    expect(skillsToPractise(summary({ [first]: slipped, [second]: slipped }))).toEqual([first, second]);
    expect(skillsToPractise(summary({ [first]: { firstTry: 0, missed: 2, shown: true }, [second]: good }))).toEqual([first]);
  });

  it('builds a short round from the practice pool, on the missed skills only', () => {
    const round = practiceRound(lesson, [second])!;
    expect(round.id).toBe(practiceIdFor(lesson.id));
    expect(round.exercises.length).toBeGreaterThan(0);
    expect(round.exercises.length).toBeLessThanOrEqual(LIMITS.practiceRound);
    expect(round.exercises.every((e) => e.skill === second)).toBe(true);
    // Different exercises from the lesson's own, so the numbers are new.
    expect(round.exercises.some((e) => lesson.exercises.includes(e))).toBe(false);
    expect(practiceRound(lesson, [])).toBeNull();
    expect(practiceRound(lesson, ['xl.no.such.skill'])).toBeNull();
  });

  it('holds the next lesson back until the round is done, then opens it', () => {
    let data = started();
    const bad = finish(data, lesson.id, summary({ [first]: slipped, [second]: slipped }));
    data = bad.data;
    expect(bad.toPractise).toEqual([first, second]);
    expect(states(buildPath(course, data), unit1.id).slice(0, 2)).toEqual(['practice', 'locked']);
    expect(nextUp(buildPath(course, data))).toMatchObject({ state: 'practice' });
    expect(resolvePlayable(course, practiceIdFor(lesson.id), data, MON)).toMatchObject({ kind: 'practice' });

    // However the round goes, nobody is left stuck.
    const after = finish(data, practiceIdFor(lesson.id), summary({ [first]: slipped, [second]: good }));
    expect(after.data.toPractise).toEqual({});
    // A practice round earns less than a lesson: 5, plus 2 for each of the 3 right first time.
    expect(after.xp).toBe(XP_PER_PRACTICE + 2 * 3);
    expect(states(buildPath(course, after.data), unit1.id).slice(0, 2)).toEqual(['done', 'open']);
    // What is still shaky stays on the Practice list.
    expect(after.data.skills[first].weak).toBe(true);
  });

  it('a clean lesson opens the next one straight away', () => {
    const { data, toPractise } = finish(started(), lesson.id, summary({ [first]: good, [second]: good }));
    expect(toPractise).toEqual([]);
    expect(states(buildPath(course, data), unit1.id).slice(0, 2)).toEqual(['done', 'open']);
  });
});

describe('the path through the course', () => {
  it('starts a beginner on the intro, with everything after it closed', () => {
    const path = buildPath(course, started('new'));
    expect(states(path, intro.id)).toEqual(['open', ...intro.lessons.slice(1).map(() => 'locked')]);
    expect(states(path, unit1.id).every((s) => s === 'locked')).toBe(true);
    expect(nextUp(path)?.lesson.id).toBe(intro.lessons[0].id);
  });

  it('skips the intro for someone who has used a spreadsheet, but leaves it open to try', () => {
    const path = buildPath(course, started('some'));
    expect(path[0]).toMatchObject({ skipped: true, complete: true, number: null });
    expect(states(path, intro.id)).toEqual(intro.lessons.map(() => 'done'));
    expect(states(path, unit1.id)[0]).toBe('open');
    expect(nextUp(path)?.lesson.id).toBe(unit1.lessons[0].id);
    // The intro and the side unit have no number; the projects are the third unit on the main path.
    expect(path.map((n) => n.number)).toEqual([null, 1, 2, null, 3]);
  });

  it('never lets the side unit block the main path, or be blocked by it', () => {
    const path = buildPath(course, started('new'));
    expect(states(path, unit3.id)).toEqual(['open', 'locked', 'locked', 'locked']);
    const done = finish(started('new'), unit3.lessons[0].id, summary({ [unit3.lessons[0].newSkills[0]]: good })).data;
    expect(states(buildPath(course, done), unit3.id).slice(0, 2)).toEqual(['done', 'open']);
    // The main path still points at the intro.
    expect(nextUp(buildPath(course, done))?.lesson.id).toBe(intro.lessons[0].id);
  });

  it('opens unit 2 only when every lesson of unit 1 is passed', () => {
    let data = started();
    for (const lesson of unit1.lessons.slice(0, -1)) data = finish(data, lesson.id, summary({ [lesson.newSkills[0]]: good })).data;
    expect(states(buildPath(course, data), unit2.id)[0]).toBe('locked');
    const last = unit1.lessons[unit1.lessons.length - 1];
    const result = finish(data, last.id, summary({ [last.newSkills[0]]: good }));
    expect(states(buildPath(course, result.data), unit2.id)[0]).toBe('open');
    expect(result.newBadges).toEqual([unitBadge(unit1.id)]);
  });

  it('passing a unit test skips the unit; failing it changes nothing', () => {
    const test = unit1.checkpoint!;
    const all = (firstTry: number): Summary => ({ ...summary({}), scored: 8, firstTry, xp: 10 + 2 * firstTry });

    const failed = finish(started(), test.id, all(LIMITS.checkpointPassMark - 1));
    expect(failed.passedTest).toBe(false);
    expect(states(buildPath(course, failed.data), unit2.id)[0]).toBe('locked');
    expect(failed.data.xp).toBeGreaterThan(0);

    const passed = finish(started(), test.id, all(LIMITS.checkpointPassMark));
    expect(passed.passedTest).toBe(true);
    const path = buildPath(course, passed.data);
    expect(path[1]).toMatchObject({ skipped: true, complete: true, testOut: null });
    expect(states(path, unit2.id)[0]).toBe('open');
    expect(passed.newBadges).toContain(unitBadge(unit1.id));
  });

  it('gives no badge for skipping the intro by saying "I have used one"', () => {
    const { data } = finish(started('some'), unit1.lessons[0].id, summary({ [unit1.lessons[0].newSkills[0]]: good }));
    expect(data.badges).not.toContain(unitBadge(intro.id));
  });
});

describe('finishing something', () => {
  const lesson = unit1.lessons[0];
  const clean = summary({ [lesson.newSkills[0]]: good, [lesson.newSkills[1]]: good });

  it('adds XP to the total and to the day, and keeps the streak going', () => {
    let { data } = finish(started(), lesson.id, clean, MON);
    expect(data).toMatchObject({ xp: 18, days: { [MON]: 18 } });
    expect(data.streak).toMatchObject({ count: 1, lastDay: MON });
    data = finish(data, lesson.id, clean, addDays(MON, 1)).data;
    expect(data.xp).toBe(36);
    expect(data.days).toEqual({ [MON]: 18, [addDays(MON, 1)]: 18 });
    expect(data.streak.count).toBe(2);
    expect(data.finished[lesson.id]).toMatchObject({ times: 2, bestFirstTry: 4 });
  });

  it('awards the streak badges when they are reached', () => {
    let data = started();
    let earned: string[] = [];
    for (let day = 0; day < 7; day++) {
      const result = finish(data, lesson.id, clean, addDays(MON, day));
      data = result.data;
      earned = result.newBadges;
    }
    expect(earned).toEqual(['streak:7']);
    expect(data.badges).toContain('streak:7');
  });

  it('never loses a badge once earned', () => {
    const data = { ...started(), badges: ['streak:7'] };
    expect(finish(data, lesson.id, clean).data.badges).toContain('streak:7');
  });
});

describe('the Practice tab', () => {
  const lesson = unit1.lessons[0];
  const [first, second] = lesson.newSkills;

  it('has nothing to offer before anything has been missed or come due', () => {
    expect(reviewSession(course, started(), MON)).toBeNull();
    const { data } = finish(started(), lesson.id, summary({ [first]: good, [second]: good }), MON);
    expect(reviewSession(course, data, MON)).toBeNull();
    expect(resolvePlayable(course, REVIEW_ID, data, MON)).toBeNull();
  });

  it('offers a skill once it is due again, using exercises with different numbers', () => {
    const { data } = finish(started(), lesson.id, summary({ [first]: good, [second]: good }), MON);
    const later = addDays(MON, INTERVALS[1]);
    const session = reviewSession(course, data, later)!;
    expect(session.id).toBe(REVIEW_ID);
    expect(session.exercises.map((e) => e.skill).sort()).toEqual([first, second].sort());
    expect(session.exercises.every((e) => e.type !== 'demo')).toBe(true);
  });

  it('offers a missed skill straight away, and clears it once practised cleanly', () => {
    let { data } = finish(started(), lesson.id, summary({ [first]: slipped, [second]: good }), MON);
    const session = reviewSession(course, data, MON)!;
    expect(session.exercises.map((e) => e.skill)).toEqual([first]);
    data = finish(data, REVIEW_ID, summary({ [first]: { firstTry: 1, missed: 0, shown: false } }), MON).data;
    expect(data.skills[first].weak).toBe(false);
    expect(reviewSession(course, data, MON)).toBeNull();
    // A review session is not a lesson: it does not count as one being finished.
    expect(Object.keys(data.finished)).toEqual([lesson.id]);
  });

  it('only draws on lessons the learner has actually done', () => {
    const data = { ...started(), skills: { 'xl.if': { box: 1, due: MON, weak: true } } };
    expect(reviewSession(course, data, MON)).toBeNull();
  });
});

describe('opening things by ID', () => {
  it('finds lessons, unit tests and practice rounds, and nothing else', () => {
    const data = started();
    expect(resolvePlayable(course, unit1.lessons[1].id, data, MON)).toMatchObject({ kind: 'lesson', title: unit1.lessons[1].title });
    expect(resolvePlayable(course, unit2.checkpoint!.id, data, MON)).toMatchObject({ kind: 'test' });
    expect(resolvePlayable(course, 'xl.no.such.lesson', data, MON)).toBeNull();
    // No practice round exists for a lesson that went well.
    expect(resolvePlayable(course, practiceIdFor(unit1.lessons[0].id), data, MON)).toBeNull();
  });

  it('knows which lessons need to ask about Ctrl or Cmd', () => {
    expect(usesShortcuts(unit1.lessons[0])).toBe(false);
    expect(usesShortcuts(unit3.lessons[0])).toBe(true);
    expect(usesShortcuts(unit3.checkpoint!)).toBe(true);
  });
});
