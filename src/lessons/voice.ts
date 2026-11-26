/**
 * Cell's voice in feedback: a patient tutor, not a marking machine and not a cheerleader
 * (docs/editorial-standards.md). The title only acknowledges; the explanation underneath
 * carries the learning. Lines vary so nothing sounds canned, but each exercise always gets
 * the same line for the same situation, so going back to it never changes what Cell said.
 */

import type { Attempt } from './session';

/** Right first time, with no help. */
const FIRST_TRY = ['Correct', 'That’s right', 'Exactly', 'Spot on', 'Yes, that’s it', 'Precisely'] as const;
/** Right after a hint or a wrong check: acknowledge the persistence, never the struggle. */
const WORKED_FOR = ['That’s it', 'There it is', 'Got it now', 'That’s the one', 'Correct'] as const;
/** A check that did not pass. The message underneath says exactly what to look at. */
const NOT_YET = ['Not quite', 'Not yet', 'Have another look', 'Check that again'] as const;
/** The answer was right but not the way the task asked for. */
export const RIGHT_RESULT = 'Right result, different method';

/** The same number for the same text: picks a line without any randomness. */
function seed(text: string): number {
  let sum = 0;
  for (const ch of text) sum = (sum * 31 + ch.charCodeAt(0)) >>> 0;
  return sum;
}

const pick = <T>(lines: readonly T[], key: string): T => lines[seed(key) % lines.length];

/** The title over a correct answer. A lesson's own `praise` wins when the task needs its own words. */
export function praiseFor(exerciseId: string, attempt: Pick<Attempt, 'wrongChecks' | 'hintsShown'>, own?: string): string {
  if (own) return own;
  const helped = attempt.wrongChecks > 0 || attempt.hintsShown > 0;
  return pick(helped ? WORKED_FOR : FIRST_TRY, exerciseId);
}

/**
 * The title over a check that did not pass. It changes with each try, so a second miss
 * does not read as the same stamp twice. It never claims "nearly": the message underneath
 * says what is right and what to check.
 */
export function notYetFor(exerciseId: string, wrongChecks: number): string {
  return pick(NOT_YET, `${exerciseId}:${wrongChecks}`);
}

/** After "Show me" has played the worked solution. */
export function shownFor(willComeBack: boolean): { title: string; message: string } {
  return {
    title: 'That’s the method.',
    message: willComeBack ? 'You’ll try this one again at the end of the lesson.' : 'Try the next one your own way.',
  };
}
