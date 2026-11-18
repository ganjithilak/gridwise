import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { play } from './sound';

export type Buzz = 'key' | 'correct' | 'wrong' | 'complete';

let enabled = true;

/** One switch, in Profile, for sound and vibration together. */
export function setFeedbackEnabled(on: boolean): void {
  enabled = on;
}

/**
 * What the app does, besides what it shows, when something happens: a short sound for a
 * right answer, a wrong one and a finished lesson, and on a phone a small vibration too.
 * Keys only vibrate: a sound on every key press would be noise.
 */
export function buzz(kind: Buzz): void {
  if (!enabled) return;
  if (kind !== 'key') play(kind);
  if (Platform.OS === 'web') return;
  const done = (p: Promise<void>) => {
    p.catch(() => {
      // A phone without a haptic engine is not an error.
    });
  };
  switch (kind) {
    case 'key':
      done(Haptics.selectionAsync());
      break;
    case 'correct':
      done(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      break;
    case 'wrong':
      done(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
      break;
    case 'complete':
      done(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      break;
  }
}
