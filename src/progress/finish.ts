import type { Summary } from '@/lessons/session';
import type { Course } from '@/lessons/types';

import { isPracticeId, lessonIdOf, skillsToPractise } from './mastery';
import { badgesFor } from './path';
import { recordFinish, type ProgressData } from './saved';
import { review } from './srs';
import { learnedToday } from './streak';

/** XP for finishing a practice round or a review session. Less than a lesson: it is shorter. */
export const XP_PER_PRACTICE = 5;
/** The ID the Practice tab's review sessions are saved under. */
export const REVIEW_ID = 'review';

export interface Finished {
  /** A lesson ID, a unit test ID, a practice round's ID, or `REVIEW_ID`. */
  id: string;
  summary: Summary;
  now: number;
  today: string;
}

export interface FinishResult {
  data: ProgressData;
  /** XP actually awarded. */
  xp: number;
  /** For a lesson: the skills that need a practice round before the next lesson opens. */
  toPractise: string[];
  /** For a unit test: whether it was passed. */
  passedTest: boolean | null;
  /** Badges earned by this finish. */
  newBadges: string[];
}

function removeKey<T>(all: Record<string, T>, key: string): Record<string, T> {
  const rest = { ...all };
  delete rest[key];
  return rest;
}

/**
 * Everything that changes when something is finished: XP, the day's total, the streak,
 * the review schedule, which lessons are open, and badges. One place, so a lesson, a
 * unit test and a practice round can never disagree about the rules.
 */
export function applyFinish(data: ProgressData, course: Course, event: Finished): FinishResult {
  const { id, summary, now, today } = event;
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const checkpoint = course.units.map((unit) => unit.checkpoint).find((c) => c?.id === id);
  const lesson = lessons.find((l) => l.id === id);
  const practiceOf = isPracticeId(id) ? lessons.find((l) => l.id === lessonIdOf(id)) : undefined;
  const short = !lesson && !checkpoint;
  const xp = short ? XP_PER_PRACTICE + (summary.xp - 10) : summary.xp;

  const skills = { ...data.skills };
  for (const [skill, result] of Object.entries(summary.skills)) skills[skill] = review(skills[skill], result, today);

  let next: ProgressData = {
    ...data,
    runs: removeKey(data.runs, id),
    skills,
    xp: data.xp + xp,
    days: { ...data.days, [today]: (data.days[today] ?? 0) + xp },
    streak: learnedToday(data.streak, today),
  };

  let toPractise: string[] = [];
  let passedTest: boolean | null = null;
  if (lesson) {
    // Only ask for a practice round if the lesson has something to practise those skills with.
    const pool = new Set((lesson.practice ?? []).map((exercise) => exercise.skill));
    toPractise = skillsToPractise(summary).filter((skill) => pool.has(skill));
    next = {
      ...next,
      finished: { ...next.finished, [id]: recordFinish(next.finished[id], summary, now) },
      toPractise: toPractise.length > 0 ? { ...next.toPractise, [id]: toPractise } : removeKey(next.toPractise, id),
    };
  } else if (practiceOf) {
    // The round is done. However it went, the next lesson opens: nobody is ever stuck.
    // Anything still shaky stays on the Practice list through the review schedule.
    next = { ...next, toPractise: removeKey(next.toPractise, practiceOf.id) };
  } else if (checkpoint) {
    passedTest = summary.firstTry >= checkpoint.passMark;
    if (passedTest) next = { ...next, passed: { ...next.passed, [id]: now } };
  }

  const badges = badgesFor(course, next);
  const newBadges = badges.filter((badge) => !data.badges.includes(badge));
  return { data: { ...next, badges }, xp, toPractise, passedTest, newBadges };
}
