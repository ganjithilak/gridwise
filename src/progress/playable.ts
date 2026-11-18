import type { Playable } from '@/lessons/session';
import { isGrid, isScored, type Course, type Exercise, type Lesson, type Unit } from '@/lessons/types';

import { needsComputer } from '@/spreadsheet/shortcuts';

import { REVIEW_ID } from './finish';
import { isPracticeId, lessonIdOf, practiceIdFor, practiceRound } from './mastery';
import type { ProgressData, SavedRun } from './saved';
import { dueSkills } from './srs';

export type PlayKind = 'lesson' | 'practice' | 'test' | 'review';

/** Something that can be opened in the lesson player, and what to call it. */
export interface Resolved {
  playable: Playable;
  kind: PlayKind;
  title: string;
  /** The lesson this is, or belongs to. */
  lesson?: Lesson;
  unit?: Unit;
}

/** How many exercises a review session from the Practice tab has, at most. */
export const REVIEW_SIZE = 5;

const lessonsOf = (course: Course): { lesson: Lesson; unit: Unit }[] =>
  course.units.flatMap((unit) => unit.lessons.map((lesson) => ({ lesson, unit })));

/** Rebuilds a round from the exercises a saved run names, so it reopens exactly as it was left. */
function fromRun(id: string, run: SavedRun, pool: Exercise[], hideKeys: Playable['hideKeys']): Playable | null {
  const ids = [...run.done, ...run.queue].filter((item) => !item.isRetry).map((item) => item.id);
  const exercises = ids.map((exerciseId) => pool.find((exercise) => exercise.id === exerciseId));
  if (exercises.length === 0 || exercises.some((exercise) => !exercise)) return null;
  return { id, exercises: exercises as Exercise[], hideKeys };
}

/**
 * A review session for the Practice tab: one exercise for each skill that is weak or
 * due, weakest first. Exercises come from practice pools first, so the numbers are not
 * the ones the lesson used. Only skills from lessons the learner has done are offered.
 */
export function reviewSession(course: Course, data: ProgressData, today: string): Playable | null {
  const due = dueSkills(data.skills, today);
  if (due.length === 0) return null;
  const done = lessonsOf(course).filter(({ lesson }) => data.finished[lesson.id] !== undefined);
  const picked: Exercise[] = [];
  // Each time round, a skill gets a different exercise from the ones it has.
  const turn = Object.keys(data.days).length + data.xp;
  for (const skill of due) {
    if (picked.length >= REVIEW_SIZE) break;
    const pool = done.flatMap(({ lesson }) => [...(lesson.practice ?? []), ...lesson.exercises.filter(isScored)]);
    const options = pool.filter((exercise) => exercise.skill === skill && !picked.includes(exercise));
    if (options.length > 0) picked.push(options[turn % options.length]);
  }
  if (picked.length === 0) return null;
  return { id: REVIEW_ID, exercises: picked };
}

/** Finds whatever an ID in a lesson link stands for. Null if there is nothing to play. */
export function resolvePlayable(course: Course, id: string, data: ProgressData, today: string): Resolved | null {
  const all = lessonsOf(course);

  const asLesson = all.find(({ lesson }) => lesson.id === id);
  if (asLesson) return { playable: asLesson.lesson, kind: 'lesson', title: asLesson.lesson.title, ...asLesson };

  const tested = course.units.find((unit) => unit.checkpoint?.id === id);
  if (tested?.checkpoint) return { playable: tested.checkpoint, kind: 'test', title: tested.checkpoint.title, unit: tested };

  if (isPracticeId(id)) {
    const owner = all.find(({ lesson }) => lesson.id === lessonIdOf(id));
    if (!owner) return null;
    const run = data.runs[id];
    const playable =
      (run ? fromRun(id, run, owner.lesson.practice ?? [], owner.lesson.hideKeys) : null) ??
      practiceRound(owner.lesson, data.toPractise[owner.lesson.id] ?? []);
    return playable ? { playable, kind: 'practice', title: `Practice: ${owner.lesson.title}`, ...owner } : null;
  }

  if (id === REVIEW_ID) {
    const pool = all.flatMap(({ lesson }) => [...(lesson.practice ?? []), ...lesson.exercises]);
    const run = data.runs[id];
    const playable = (run ? fromRun(id, run, pool, undefined) : null) ?? reviewSession(course, data, today);
    return playable ? { playable, kind: 'review', title: 'Practice' } : null;
  }
  return null;
}

/**
 * True if any exercise involves a shortcut that is Ctrl on one computer and Cmd on the
 * other, which is when the kind of computer has to be known. Arrows, Shift and Space are
 * the same on both.
 */
export function usesShortcuts(playable: Playable): boolean {
  return playable.exercises.some(
    (exercise) =>
      isGrid(exercise) &&
      [
        ...[...exercise.solution, ...(exercise.type === 'demo' ? exercise.script : [])].flatMap((step) => ('combo' in step ? [step.combo] : [])),
        ...exercise.checks.flatMap((check) => (check.type === 'usedShortcut' ? [check.id] : [])),
      ].some(needsComputer),
  );
}

export { practiceIdFor };
