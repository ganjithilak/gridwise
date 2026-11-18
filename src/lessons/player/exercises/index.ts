import { createElement, type ComponentType } from 'react';

import type { Exercise, ExerciseType, PickExercise as PickKind, SheetExercise } from '../../types';
import { GridExercise } from '../GridExercise';
import { PickExercise } from '../PickExercise';
import type { ExerciseViewProps } from './types';

export type { ExerciseViewProps } from './types';

/** Everything done on the live sheet. A demo is the same screen with a demonstration played first. */
function OnSheet(props: ExerciseViewProps<SheetExercise>) {
  const watch = props.exercise.type === 'demo' ? props.exercise.script : undefined;
  return createElement(GridExercise, { ...props, watch });
}

/** A question with options: an idea, or "what will this formula show?". */
function Pick(props: ExerciseViewProps<PickKind>) {
  return createElement(PickExercise, props);
}

/**
 * One renderer per exercise type. A new type is added by writing its component and
 * listing it here; nothing else changes.
 */
export const RENDERERS: Record<ExerciseType, ComponentType<ExerciseViewProps<never>>> = {
  'grid-task': OnSheet,
  demo: OnSheet,
  'fix-formula': OnSheet,
  'shortcut-press': OnSheet,
  'formula-build': OnSheet,
  'predict-output': Pick,
  choice: Pick,
};

export function rendererFor(exercise: Exercise): ComponentType<ExerciseViewProps> {
  return RENDERERS[exercise.type] as unknown as ComponentType<ExerciseViewProps>;
}

/** Draws an exercise with whichever renderer its type calls for. */
export function ExerciseView(props: ExerciseViewProps) {
  return createElement(rendererFor(props.exercise), props);
}
