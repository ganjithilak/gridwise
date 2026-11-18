import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { MOTION_MS, radius, useTheme } from '@/theme';

/** How far through the lesson the learner is, from 0 to 1. */
export function ProgressBar({ value }: { value: number }) {
  const c = useTheme();
  const width = useState(() => new Animated.Value(value))[0];

  useEffect(() => {
    Animated.timing(width, { toValue: value, duration: MOTION_MS, useNativeDriver: false }).start();
  }, [value, width]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={[styles.track, { backgroundColor: c.sunken }]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: c.accent,
            width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
