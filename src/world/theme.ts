import type { ComponentType } from 'react';

import { FarmBackdrop, FarmForeground } from './env/Farm';
import { usePrefs, type WorldThemeId } from './prefs';
import { RefinedFarmBackdrop } from './refined/Farmland';
import { RefinedFarmForeground } from './refined/Foreground';
import { RefinedCloudShape, RefinedSkyBackdrop } from './refined/Sky';
import { CloudShape, SkyBackdrop } from './Scenery';

/**
 * A world theme: the art that differs between looks. Everything else (the camera, the roots,
 * the lessons, the ambient event clock, the gold interface, the app's logic) is shared, so a
 * new theme is a new set of drawings, never a copy of the app.
 *
 * Components that only change a little between themes (Cell, the plant, the scarecrow, the
 * birds) take a `refined` flag instead of being duplicated.
 */
export interface WorldArt {
  id: WorldThemeId;
  name: string;
  about: string;
  /** Painted shading without outlines, for characters that share one component. */
  refined: boolean;
  SkyBackdrop: ComponentType<{ width: number; height: number; skyPanel: number; horizon: number }>;
  CloudShape: ComponentType<{ w: number }>;
  FarmBackdrop: ComponentType<{ width: number; ground: number }>;
  FarmForeground: ComponentType<{ width: number; ground: number; lip: number }>;
}

export const WORLD_ART: Record<WorldThemeId, WorldArt> = {
  refined: {
    id: 'refined',
    name: 'Refined',
    about: 'Natural light and colour, farmland in perspective, painted without outlines.',
    refined: true,
    SkyBackdrop: RefinedSkyBackdrop,
    CloudShape: RefinedCloudShape,
    FarmBackdrop: RefinedFarmBackdrop,
    FarmForeground: RefinedFarmForeground,
  },
  classic: {
    id: 'classic',
    name: 'Classic Farm',
    about: 'The first prototype: bright, outlined, cartoon cel style.',
    refined: false,
    SkyBackdrop,
    CloudShape,
    FarmBackdrop,
    FarmForeground,
  },
};

export const useWorldArt = (): WorldArt => WORLD_ART[usePrefs((s) => s.theme)];
