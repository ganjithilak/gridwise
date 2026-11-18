import type { SheetCapture } from '@/spreadsheet/controller';

/** Where the learner is within one exercise. */
export type Phase = 'watch' | 'watched' | 'do' | 'showing' | 'shown' | 'correct';

/** The phases in which the sheet on screen is the one the learner has been working in. */
export type TurnPhase = 'do' | 'correct' | 'shown';

export const isTurn = (phase: Phase): phase is TurnPhase =>
  phase === 'do' || phase === 'correct' || phase === 'shown';

/** The learner's own sheet, and the phase to go back to with it. */
export interface Work {
  phase: TurnPhase;
  sheet: SheetCapture;
}

/**
 * Where one exercise was left: enough to reopen it at the same place with nothing lost.
 * It is plain data, so it can be saved on the device as well as kept while the learner
 * looks back at an earlier step.
 */
export interface ExerciseSnapshot {
  phase: Phase;
  /** The step of the demonstration on screen, while one is playing. */
  stop: number;
  /**
   * The learner's sheet. While they look back at the demonstration, this is their turn
   * set aside, waiting to be put back.
   */
  work: Work | null;
  /** In a question with options: the ones chosen so far. */
  picked?: number[];
}

export const sameSnapshot = (a: ExerciseSnapshot | undefined, b: ExerciseSnapshot | undefined): boolean =>
  JSON.stringify(a) === JSON.stringify(b);
