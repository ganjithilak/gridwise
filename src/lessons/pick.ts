import { a1, formatScalar, Sheet } from '@/engine';

import type { PickExercise } from './types';

const same = (a: string, b: string): boolean => a.trim().toUpperCase() === b.trim().toUpperCase();

/** What a formula shows when it sits in `cell` of the exercise's sheet, as the learner would read it. */
export function shownBy(exercise: Extract<PickExercise, { type: 'predict-output' }>): string {
  const sheet = Sheet.fromSpec(exercise.sheet);
  const cell = a1(exercise.cell);
  return formatScalar(sheet.preview(cell, exercise.formula), sheet.getFormat(cell).numFmt);
}

/**
 * The positions of the right options. For "what will this show" the engine works the
 * answer out, so a lesson can never mark the wrong option as correct by mistake.
 */
export function correctOptions(exercise: PickExercise): number[] {
  if (exercise.type === 'choice') return [...exercise.correct].sort((x, y) => x - y);
  const answer = shownBy(exercise);
  return exercise.options.map((option, i) => (same(option, answer) ? i : -1)).filter((i) => i >= 0);
}

/** True if exactly the right options are chosen: none missing, none extra. */
export function isRightPick(exercise: PickExercise, picked: readonly number[]): boolean {
  const wanted = correctOptions(exercise);
  const mine = [...new Set(picked)].sort((x, y) => x - y);
  return mine.length === wanted.length && mine.every((value, i) => value === wanted[i]);
}

/** More than one right option means the learner may choose several. */
export const picksSeveral = (exercise: PickExercise): boolean => correctOptions(exercise).length > 1;
