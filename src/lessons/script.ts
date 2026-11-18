import { a1 } from '@/engine';
import type { SheetController } from '@/spreadsheet/controller';

import type { ScriptStep } from './types';

/** Performs one scripted step exactly as a learner's tap, drag or key press would. */
export function applyStep(controller: SheetController, step: ScriptStep): void {
  if ('tap' in step) controller.tapCell(a1(step.tap));
  else if ('key' in step) controller.pressKey(step.key);
  else if ('chip' in step) controller.pressChip(step.chip);
  else if ('drag' in step) controller.selectRange(step.drag);
  else if ('fill' in step) controller.fill(step.fill);
  else if ('tool' in step) controller.runTool(step.tool);
  else controller.runShortcut(step.combo);
}

export function applyScript(controller: SheetController, steps: readonly ScriptStep[]): void {
  for (const step of steps) applyStep(controller, step);
}

/** The cell or block a step points at on the grid, if it points at one. */
export function stepTarget(step: ScriptStep): string | null {
  if ('tap' in step) return step.tap;
  if ('drag' in step) return step.drag;
  if ('fill' in step) return step.fill;
  return null;
}

/**
 * The key, chip, toolbar button or shortcut a step presses, named so that whichever
 * part of the screen owns it can light it up: "7", "chip:AVERAGE", "tool:autosum", "combo:copy".
 */
export function stepPress(step: ScriptStep): string | null {
  if ('key' in step) return step.key;
  if ('chip' in step) return `chip:${step.chip}`;
  if ('tool' in step) return `tool:${step.tool}`;
  if ('combo' in step) return `combo:${step.combo}`;
  return null;
}
