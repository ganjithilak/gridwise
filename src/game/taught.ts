import type { Course } from '@/lessons/types';
import { unitSkipped } from '@/progress/path';
import type { ProgressData } from '@/progress/saved';

/**
 * What the learner has been taught, which is all a game may ask about (the brief: games
 * test only taught skills). A skill counts once a lesson that introduces it is finished,
 * or its unit was skipped: by passing the unit test, or, for the Start here unit, by
 * saying they have used a spreadsheet before.
 */
export function taughtSkills(course: Course, data: ProgressData): Set<string> {
  const out = new Set<string>();
  for (const unit of course.units) {
    const skipped = unitSkipped(unit, data);
    for (const lesson of unit.lessons) {
      if (skipped || data.finished[lesson.id] !== undefined) lesson.newSkills.forEach((s) => out.add(s));
    }
  }
  return out;
}

/** Skills in the order the course teaches them: main path first, then the side units. */
export function courseOrder(course: Course): string[] {
  const main = course.units.filter((u) => !u.optional);
  const side = course.units.filter((u) => u.optional);
  return [...main, ...side].flatMap((u) => u.lessons.flatMap((l) => l.newSkills));
}

/** The lesson that teaches a skill, for "Opens after Cells and References". */
export function lessonTeaching(course: Course, skill: string): string | null {
  for (const unit of course.units) for (const lesson of unit.lessons) if (lesson.newSkills.includes(skill)) return lesson.title;
  return null;
}

/**
 * The most recently taught skills, newest first, by the order the course teaches them.
 * Rounds lean on these, so a game reinforces what was just learned.
 */
export function newestTaught(course: Course, taught: ReadonlySet<string>, n: number): string[] {
  return courseOrder(course)
    .filter((s) => taught.has(s))
    .reverse()
    .slice(0, n);
}
