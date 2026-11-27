/**
 * What the lesson transition needs to borrow from the screens on either side of it, without
 * either side knowing about the other:
 *
 * - The World lends its camera and its sky, so the ride up to the sky is the real world
 *   moving, not a picture of it.
 * - The lesson's Grid reports where its sheet sits on screen, so the sky's grid can land on
 *   exactly those rows and columns.
 *
 * Plain module state, read once per frame by the transition: nothing here re-renders anything.
 */

import type { Pt } from '../geometry';

import type { PlacedDome, SheetTarget } from './morph';

export interface WorldStage {
  /** The camera's top edge, in the World painting's own coordinates (0 is the top of the sky). */
  cameraTop(): number;
  setCameraTop(y: number): void;
  /** Where the camera rests for the place the learner is at (farm or roots). */
  homeTop(): number;
  /** The World's sky grid on screen, with the camera's top edge at `top`. */
  dome(top: number): PlacedDome;
  /** Where the painting's (0, 0) is on screen when the camera's top is at 0. */
  origin(): Pt;
  /** The sky's two top colours, for the moment the transition covers the World. */
  sky: readonly [string, string];
  /** Shows or hides Cell's panel in the sky (0..1), so the sky is clear when the grid lifts off it. */
  setSkyPanel(opacity: number): void;
  /** True when the farm and roots are what the learner sees (not Games or Profile). */
  showingCentre(): boolean;
  /** Screen height, for keeping the beam in view. */
  height: number;
  /** Where the camera rests over the farm's sky while the grid lifts off it. */
  liftTop: number;
}

let world: WorldStage | null = null;

export function registerWorldStage(stage: WorldStage): () => void {
  world = stage;
  return () => {
    if (world === stage) world = null;
  };
}

export const worldStage = (): WorldStage | null => world;

let landing: { owner: object; target: SheetTarget; at: number } | null = null;

/** The Grid on screen reports its sheet here whenever it is laid out. */
export function reportSheet(owner: object, target: SheetTarget): void {
  landing = { owner, target, at: Date.now() };
}

/** A Grid going away takes its report with it. */
export function clearSheet(owner: object): void {
  if (landing?.owner === owner) landing = null;
}

/** The sheet on screen now, if any; `since` ignores reports older than that time. */
export function currentSheet(since = 0): SheetTarget | null {
  return landing && landing.at >= since ? landing.target : null;
}

if (__DEV__ && typeof window !== 'undefined') {
  (window as unknown as { gridwiseSheet?: () => SheetTarget | null }).gridwiseSheet = () => currentSheet();
}
