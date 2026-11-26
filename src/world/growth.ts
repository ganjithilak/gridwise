import type { Stage } from '@/lessons/types';
import type { UnitNode } from '@/progress/path';

/** Creative Direction V2, section 5: the stages every species grows through. */
export const GROWTH_STAGES = ['Seed', 'Germination', 'Roots', 'Seedling', 'Trunk', 'Branches', 'Flowers', 'Fruit'] as const;
export const LAST_STAGE = GROWTH_STAGES.length - 1;

export interface UnitSummary {
  stage: Stage;
  optional: boolean;
  complete: boolean;
  /** Lessons passed (or skipped as known). */
  passed: number;
}

export interface Growth {
  /** 0 (Seed) to 7 (Fruit). */
  stage: number;
  /** Every fruit lesson is done. */
  ripe: boolean;
}

/**
 * How far the plant has grown. It follows learning, never time in the app: each stage is a
 * milestone on the main path. Side units never hold the plant back.
 */
export function growthFrom(units: UnitSummary[]): Growth {
  const main = units.filter((u) => !u.optional);
  const of = (stage: Stage) => main.filter((u) => u.stage === stage);
  const complete = (stage: Stage) => of(stage).length > 0 && of(stage).every((u) => u.complete);
  const passed = (stage: Stage) => of(stage).reduce((n, u) => n + u.passed, 0);
  const ripe = complete('fruit');

  let stage = 0;
  if (main.some((u) => u.passed > 0)) stage = 1;
  if (complete('roots')) stage = 2;
  if (stage >= 2 && passed('trunk') >= 2) stage = 3;
  if (complete('trunk')) stage = Math.max(stage, 4);
  if (stage >= 4 && passed('branches') >= 2) stage = 5;
  if (complete('branches')) stage = Math.max(stage, 6);
  if (stage >= 6 && passed('fruit') >= 1) stage = 7;
  if (ripe) stage = 7;
  return { stage, ripe };
}

export const growthOf = (path: UnitNode[]): Growth =>
  growthFrom(
    path.map((node) => ({
      stage: node.unit.stage,
      optional: !!node.unit.optional,
      complete: node.complete,
      passed: node.lessons.filter((l) => l.state === 'done').length,
    })),
  );
