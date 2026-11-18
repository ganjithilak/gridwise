import type { Side } from '@/progress/saved';
import type { KeyId } from '@/spreadsheet/controller';
import type { Computer } from '@/spreadsheet/shortcuts';

import type { CheckOutcome } from '../../checks';
import type { Attempt } from '../../session';
import type { ExerciseSnapshot } from '../../snapshot';
import type { Exercise } from '../../types';
import type { Metrics, Phase, StepNav } from '../GridExercise';

/** What every exercise renderer is given, whatever kind of exercise it draws. */
export interface ExerciseViewProps<E extends Exercise = Exercise> {
  exercise: E;
  hideKeys?: readonly KeyId[];
  /** Whether shortcuts are shown with Ctrl or with Cmd. */
  computer?: Computer;
  attempt: Attempt;
  willComeBack: boolean;
  metrics: Metrics;
  /** Where this exercise was left, if it has been open before. */
  saved?: ExerciseSnapshot;
  /** An earlier, finished exercise being looked at again. */
  review?: boolean;
  onCheck: (status: CheckOutcome['status']) => void;
  onShowMe: () => void;
  onContinue: () => void;
  onPhase?: (phase: Phase) => void;
  onSkipChange?: (skip: (() => void) | null) => void;
  onNavChange?: (nav: StepNav) => void;
  onSnapshot?: (snapshot: ExerciseSnapshot, leaving: boolean) => void;
  /** In the split layout: the lesson side was swiped across, so the sheet goes to this side. */
  onSheetSide?: (side: Side) => void;
}
