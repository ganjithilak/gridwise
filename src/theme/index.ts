import { useColorScheme } from 'react-native';

import { useProgress } from '@/progress/store';

import { usePrefs } from '@/world/prefs';

import { dark, dusk, light, type Palette } from './tokens';

export * from './tokens';

/**
 * The colours to draw with. The app's own look is the dark one (dusk, or navy for Classic Farm); the learner can
 * switch to the light one, or have it follow their phone, on the Profile screen.
 */
export function useTheme(): Palette {
  const look = useProgress((s) => s.profile.look);
  const phone = useColorScheme();
  // The app's own (dark) look follows the world theme: dusk for Refined, navy for Classic Farm.
  const own = usePrefs((s) => s.theme) === 'classic' ? dark : dusk;
  if (look === 'light') return light;
  if (look === 'auto') return phone === 'dark' ? own : light;
  return own;
}
