import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { setFeedbackEnabled } from '@/lib/feedback';
import { useProgress } from '@/progress/store';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const c = useTheme();
  // One switch in Profile turns sound and vibration on or off everywhere.
  const feedback = useProgress((s) => s.profile.feedback);
  useEffect(() => setFeedbackEnabled(feedback), [feedback]);
  // The clock and battery at the top have to stay readable on whichever look is chosen.
  const look = useProgress((s) => s.profile.look);

  return (
    <>
      <StatusBar style={look === 'dark' ? 'light' : look === 'light' ? 'dark' : 'auto'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: 'fade',
          animationDuration: 180,
        }}
      />
    </>
  );
}
