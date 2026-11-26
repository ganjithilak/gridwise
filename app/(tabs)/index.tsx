import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { dataOf, useHydrated, useProgress } from '@/progress/store';
import { useTheme } from '@/theme';
import { World } from '@/world/World';

/**
 * Home: the world (Creative Direction V2). The farm in the middle, the roots below it, Cell's
 * sky above, Games to the left and Profile to the right. See `docs/creative-direction-v2.md`.
 */
export default function HomeScreen() {
  const c = useTheme();
  const hydrated = useHydrated();
  const store = useProgress();
  const data = dataOf(store);

  // Saved progress is read in the first moment after launch; nothing is decided before then.
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  // First launch: one question, then straight into a lesson.
  if (data.profile.level === null) return <Redirect href="/welcome" />;
  return <World />;
}
