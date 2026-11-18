import { useColorScheme } from 'react-native';

import { useProgress } from '@/progress/store';

import { dark, light, type Palette } from './tokens';

export * from './tokens';

/**
 * The colours to draw with. The app's own look is the dark navy one; the learner can
 * switch to the light one, or have it follow their phone, on the Profile screen.
 */
export function useTheme(): Palette {
  const look = useProgress((s) => s.profile.look);
  const phone = useColorScheme();
  if (look === 'light') return light;
  if (look === 'auto') return phone === 'dark' ? dark : light;
  return dark;
}
