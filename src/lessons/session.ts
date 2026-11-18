import type { KeyId } from '@/spreadsheet/controller';

import { isScored, type Exercise } from './types';

/**
 * Anything that can be played from first exercise to last: a lesson, a unit test, or a
 * practice round put together on the spot.
 */
export interface Playable {
  id: string;
  exercises: Exercise[];
  hideKeys?: KeyId[];
}

/** "Show me" is offered once the learner has checked a wrong answer this many times. */
export const SHOW_ME_AFTER = 2;
export const MAX_HINTS = 3;

export interface Attempt {
  wrongChecks: number;
  hintsShown: number;
  solutionShown: boolean;
}

export interface QueueItem {
  exercise: Exercise;
  /** True when this is the exercise coming back after "Show me". It never comes back twice. */
  isRetry: boolean;
}

export interface ExerciseResult {
  firstTry: boolean;
  wrongChecks: number;
  hintsShown: number;
  solutionShown: boolean;
}

export interface Session {
  lessonId: string;
  /** What is left. The first item is the one on screen. */
  queue: QueueItem[];
  /** What has been finished, oldest first, so the learner can look back at it. */
  done: QueueItem[];
  completed: number;
  /** Grows by one each time an exercise is brought back. */
  total: number;
  attempt: Attempt;
  /** How each exercise went the first time it was shown. */
  results: Record<string, ExerciseResult>;
  /** Skills that needed "Show me". These go to Practice. */
  weakSkills: string[];
  /** Scored exercises in a row solved first time, and the best run this lesson. */
  combo: number;
  bestCombo: number;
  startedAt: number;
  finishedAt: number | null;
}

export const freshAttempt = (): Attempt => ({ wrongChecks: 0, hintsShown: 0, solutionShown: false });

/** Names one showing of an exercise. The same exercise coming back after "Show me" gets its own. */
export const itemKey = (item: { exercise: { id: string }; isRetry: boolean }): string =>
  `${item.exercise.id}:${item.isRetry ? 'retry' : 'first'}`;

export function startSession(lesson: Playable, now: number): Session {
  return {
    lessonId: lesson.id,
    queue: lesson.exercises.map((exercise) => ({ exercise, isRetry: false })),
    done: [],
    completed: 0,
    total: lesson.exercises.length,
    attempt: freshAttempt(),
    results: {},
    weakSkills: [],
    combo: 0,
    bestCombo: 0,
    startedAt: now,
    finishedAt: null,
  };
}

export const currentItem = (s: Session): QueueItem | null => s.queue[0] ?? null;
export const isFinished = (s: Session): boolean => s.queue.length === 0;
export const progressOf = (s: Session): number => (s.total === 0 ? 1 : s.completed / s.total);
export const canShowMe = (s: Session): boolean =>
  s.attempt.wrongChecks >= SHOW_ME_AFTER && !s.attempt.solutionShown;

/**
 * A wrong check is remembered, but costs nothing: the learner stays on the exercise with
 * their work in place. "soft" (right answer, wrong way) and "pass" change nothing here.
 */
export function recordCheck(s: Session, status: 'pass' | 'soft' | 'fail'): Session {
  if (status !== 'fail') return s;
  return { ...s, attempt: { ...s.attempt, wrongChecks: s.attempt.wrongChecks + 1 } };
}

export function revealHint(s: Session): Session {
  if (s.attempt.hintsShown >= MAX_HINTS) return s;
  return { ...s, attempt: { ...s.attempt, hintsShown: s.attempt.hintsShown + 1 } };
}

/** The learner asked to be shown the worked solution. */
export function showSolution(s: Session): Session {
  const item = currentItem(s);
  if (!item || s.attempt.solutionShown) return s;
  const skill = item.exercise.skill;
  const weak = isScored(item.exercise) && !s.weakSkills.includes(skill);
  return {
    ...s,
    attempt: { ...s.attempt, solutionShown: true },
    weakSkills: weak ? [...s.weakSkills, skill] : s.weakSkills,
  };
}

/** Moves to the next exercise. An exercise that needed "Show me" comes back once, at the end. */
export function advance(s: Session, now: number): Session {
  const item = currentItem(s);
  if (!item) return s;
  const { attempt } = s;
  const firstTry = attempt.wrongChecks === 0 && attempt.hintsShown === 0 && !attempt.solutionShown;
  const results = item.isRetry
    ? s.results
    : {
        ...s.results,
        [item.exercise.id]: {
          firstTry,
          wrongChecks: attempt.wrongChecks,
          hintsShown: attempt.hintsShown,
          solutionShown: attempt.solutionShown,
        },
      };
  const comesBack = attempt.solutionShown && !item.isRetry && isScored(item.exercise);
  const rest = s.queue.slice(1);
  const queue = comesBack ? [...rest, { exercise: item.exercise, isRetry: true }] : rest;
  // Demos are practice, so they neither build nor break a run.
  const combo = !isScored(item.exercise) ? s.combo : firstTry ? s.combo + 1 : 0;
  return {
    ...s,
    queue,
    done: [...s.done, item],
    results,
    combo,
    bestCombo: Math.max(s.bestCombo, combo),
    completed: s.completed + 1,
    total: s.total + (comesBack ? 1 : 0),
    attempt: freshAttempt(),
    finishedAt: queue.length === 0 ? now : null,
  };
}

export interface SkillResult {
  /** Scored exercises on this skill solved first time, and not. */
  firstTry: number;
  missed: number;
  /** "Show me" was needed for at least one of them. */
  shown: boolean;
}

export interface Summary {
  /** Exercises that count towards the score (demos don't). */
  scored: number;
  firstTry: number;
  seconds: number;
  weakSkills: string[];
  bestCombo: number;
  xp: number;
  /** How each skill went, for review scheduling. */
  skills: Record<string, SkillResult>;
  /** Skills with at least one exercise that was not right first time. */
  missedSkills: string[];
  /** The scored exercises that were not right first time, in the order they were met. */
  missed: string[];
}

export const XP_PER_LESSON = 10;
export const XP_PER_FIRST_TRY = 2;

export function summarize(s: Session, lesson: Playable, now: number): Summary {
  // Only what this run actually met. An exercise added to the lesson while a learner was
  // part-way through it has no result, and must not be held against them as a miss.
  const scored = lesson.exercises.filter((exercise) => isScored(exercise) && s.results[exercise.id] !== undefined);
  const skills: Record<string, SkillResult> = {};
  const missed: string[] = [];
  let firstTry = 0;
  for (const exercise of scored) {
    const result = s.results[exercise.id];
    const entry = (skills[exercise.skill] ??= { firstTry: 0, missed: 0, shown: false });
    if (result?.firstTry) {
      entry.firstTry++;
      firstTry++;
    } else {
      entry.missed++;
      missed.push(exercise.id);
    }
    if (result?.solutionShown) entry.shown = true;
  }
  return {
    scored: scored.length,
    firstTry,
    seconds: Math.max(0, Math.round(((s.finishedAt ?? now) - s.startedAt) / 1000)),
    weakSkills: s.weakSkills,
    bestCombo: s.bestCombo,
    xp: XP_PER_LESSON + XP_PER_FIRST_TRY * firstTry,
    skills,
    missedSkills: Object.keys(skills).filter((skill) => skills[skill].missed > 0),
    missed,
  };
}
