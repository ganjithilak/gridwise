import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { useTheme } from '@/theme';

const PIECES = 28;
const DURATION_MS = 900;

/** A repeatable stand-in for randomness, so the burst looks the same every time. */
const scatter = (i: number, salt: number): number => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * One short burst for finishing a lesson. It is over in under a second, a tap ends it
 * sooner, and it is never shown between exercises.
 */
export function Confetti() {
  const c = useTheme();
  const { width, height } = useWindowDimensions();
  const t = useState(() => new Animated.Value(0))[0];
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const run = Animated.timing(t, {
      toValue: 1,
      duration: DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    run.start(({ finished }) => {
      if (finished) setGone(true);
    });
    return () => run.stop();
  }, [t]);

  if (gone) return null;
  const colours = [c.accent, c.spark, ...c.refs];

  return (
    <Pressable
      testID="confetti"
      accessibilityLabel="Skip the celebration"
      onPress={() => setGone(true)}
      style={StyleSheet.absoluteFill}
    >
      {Array.from({ length: PIECES }, (_, i) => {
        const size = 6 + scatter(i, 1) * 7;
        const fall = height * (0.3 + scatter(i, 2) * 0.45);
        const drift = (scatter(i, 3) - 0.5) * 90;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: scatter(i, 4) * (width - size),
              top: -size,
              width: size,
              height: size * (0.5 + scatter(i, 5) * 0.8),
              borderRadius: scatter(i, 6) > 0.6 ? size : 2,
              backgroundColor: colours[i % colours.length],
              opacity: t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, fall] }) },
                { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
                { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(scatter(i, 7) - 0.5) * 720}deg`] }) },
              ],
            }}
          />
        );
      })}
    </Pressable>
  );
}
