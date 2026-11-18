import type { Playable, Summary } from '@/lessons/session';
import { isScored, LIMITS, type Exercise, type Lesson } from '@/lessons/types';

/** What a practice round's ID looks like, so it can be told apart from the lesson it belongs to. */
export const PRACTICE_SUFFIX = '~practice';
export const practiceIdFor = (lessonId: string): string => `${lessonId}${PRACTICE_SUFFIX}`;
export const lessonIdOf = (playableId: string): string =>
  playableId.endsWith(PRACTICE_SUFFIX) ? playableId.slice(0, -PRACTICE_SUFFIX.length) : playableId;
export const isPracticeId = (playableId: string): boolean => playableId.endsWith(PRACTICE_SUFFIX);

/**
 * The skills to practise before moving on, or none if the lesson went well enough.
 * One slip is normal and passes. More than that means the idea hasn't landed yet, and
 * the next lesson would be built on sand.
 */
export function skillsToPractise(summary: Summary): string[] {
  const misses = summary.scored - summary.firstTry;
  return misses > LIMITS.missesBeforePractice ? summary.missedSkills : [];
}

/**
 * A short round on the skills that were missed, taken from the lesson's practice pool so
 * the numbers are new. One exercise per skill first, then more until the round is full.
 */
export function practiceRound(lesson: Lesson, skills: readonly string[]): Playable | null {
  const pool = (lesson.practice ?? []).filter((exercise) => isScored(exercise));
  const wanted = pool.filter((exercise) => skills.includes(exercise.skill));
  const picked: Exercise[] = [];
  for (const skill of skills) {
    const first = wanted.find((exercise) => exercise.skill === skill && !picked.includes(exercise));
    if (first && picked.length < LIMITS.practiceRound) picked.push(first);
  }
  for (const exercise of wanted) {
    if (picked.length >= LIMITS.practiceRound) break;
    if (!picked.includes(exercise)) picked.push(exercise);
  }
  if (picked.length === 0) return null;
  // Keep the order they were written in: easier ones come first.
  picked.sort((a, b) => pool.indexOf(a) - pool.indexOf(b));
  return { id: practiceIdFor(lesson.id), exercises: picked, hideKeys: lesson.hideKeys };
}
