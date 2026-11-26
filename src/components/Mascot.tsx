import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import type { ProfileColour } from '@/progress/saved';
import { useProgress } from '@/progress/store';
import { MOTION_MS, useTheme } from '@/theme';

export type Expression = 'neutral' | 'happy' | 'thinking' | 'cheering' | 'oops';

/**
 * The colours Cell can be. Blue is the app's own accent, which changes with light and
 * dark mode; the others are fixed, and dark enough for a white face in both.
 */
export const CELL_COLOURS: Record<ProfileColour, { body: string; edge: string; name: string } | null> = {
  blue: null,
  green: { body: '#1F9D6B', edge: '#147A51', name: 'Green' },
  orange: { body: '#E8590C', edge: '#B8440A', name: 'Orange' },
  pink: { body: '#D6336C', edge: '#A61E4D', name: 'Pink' },
  purple: { body: '#7C3AED', edge: '#5B21B6', name: 'Purple' },
};

/** Cell's original blue and rim (`assets/icon.png`). */
export const CELL_BLUE = { body: '#2F5BEA', edge: '#1E3FB8', name: 'Blue' };

interface Props {
  expression?: Expression;
  size?: number;
}

/**
 * "Cell": a single spreadsheet cell with a face, complete with the little selection
 * handle on its corner. Drawn entirely from Views, so it needs no image files and stays
 * sharp at any size. It reacts in place with one quick bounce and never moves around.
 */
export function Mascot({ expression = 'neutral', size = 40 }: Props) {
  const theme = useTheme();
  // The learner chooses their Cell's colour on the Profile screen. Blue is the app's own.
  const colour = useProgress((s) => s.profile.colour);
  // Blue is Cell's own colour from the original icon; it no longer borrows the theme accent,
  // so Cell stays Cell on every look.
  const own = CELL_COLOURS[colour] ?? CELL_BLUE;
  const c = own ? { ...theme, accent: own.body, accentDeep: own.edge, onAccent: '#FFFFFF' } : theme;
  const bounce = useState(() => new Animated.Value(1))[0];
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    bounce.setValue(0.86);
    Animated.timing(bounce, {
      toValue: 1,
      duration: MOTION_MS,
      easing: Easing.out(Easing.back(3)),
      useNativeDriver: true,
    }).start();
  }, [expression, bounce]);

  const u = size / 40; // every measurement below is in 40ths of the body
  const face = c.onAccent;
  const eyeW = 5 * u;
  const eyeGap = 9 * u;

  const eye = (side: 'left' | 'right') => {
    const base = { width: eyeW, marginHorizontal: eyeGap / 2 };
    switch (expression) {
      case 'happy':
      case 'cheering':
        // Closed, smiling eyes: an upward arc.
        return (
          <View
            key={side}
            style={[
              base,
              {
                width: 7 * u,
                height: 5 * u,
                borderTopWidth: 2 * u,
                borderLeftWidth: 2 * u,
                borderRightWidth: 2 * u,
                borderColor: face,
                borderTopLeftRadius: 4 * u,
                borderTopRightRadius: 4 * u,
                marginHorizontal: eyeGap / 2 - u,
              },
            ]}
          />
        );
      case 'oops':
        return (
          <View
            key={side}
            style={[base, { width: 7 * u, height: 7 * u, borderRadius: 4 * u, borderWidth: 2 * u, borderColor: face, marginHorizontal: eyeGap / 2 - u }]}
          />
        );
      case 'thinking':
        // Looking up and to the side.
        return (
          <View
            key={side}
            style={[base, { height: 6 * u, borderRadius: 3 * u, backgroundColor: face, transform: [{ translateX: 2 * u }, { translateY: -2 * u }] }]}
          />
        );
      default:
        return <View key={side} style={[base, { height: 6 * u, borderRadius: 3 * u, backgroundColor: face }]} />;
    }
  };

  const mouth = () => {
    switch (expression) {
      case 'happy':
        return (
          <View
            style={{
              width: 12 * u,
              height: 6 * u,
              backgroundColor: face,
              borderBottomLeftRadius: 6 * u,
              borderBottomRightRadius: 6 * u,
            }}
          />
        );
      case 'cheering':
        return (
          <View
            style={{
              width: 16 * u,
              height: 9 * u,
              backgroundColor: face,
              borderBottomLeftRadius: 9 * u,
              borderBottomRightRadius: 9 * u,
              borderTopLeftRadius: 2 * u,
              borderTopRightRadius: 2 * u,
            }}
          />
        );
      case 'oops':
        return <View style={{ width: 6 * u, height: 6 * u, borderRadius: 3 * u, backgroundColor: face }} />;
      case 'thinking':
        return (
          <View
            style={{ width: 8 * u, height: 2.5 * u, borderRadius: 2 * u, backgroundColor: face, transform: [{ translateX: 3 * u }] }}
          />
        );
      default:
        return (
          <View
            style={{
              width: 10 * u,
              height: 4 * u,
              borderBottomWidth: 2 * u,
              borderColor: face,
              borderBottomLeftRadius: 5 * u,
              borderBottomRightRadius: 5 * u,
            }}
          />
        );
    }
  };

  const tilt = expression === 'oops' ? '-6deg' : expression === 'cheering' ? '4deg' : '0deg';

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Cell the mascot, ${expression}`}
      style={{ width: size, height: size, transform: [{ scale: bounce }, { rotate: tilt }] }}
    >
      <View
        style={[
          styles.body,
          { borderRadius: 10 * u, backgroundColor: c.accent, borderColor: c.accentDeep, borderWidth: 1.5 * u },
        ]}
      >
        <View style={[styles.row, { marginTop: 2 * u }]}>{[eye('left'), eye('right')]}</View>
        <View style={{ height: 4 * u }} />
        {mouth()}
      </View>
      {/* The selection handle every spreadsheet cell has on its corner. */}
      <View
        style={{
          position: 'absolute',
          right: -2 * u,
          bottom: -2 * u,
          width: 9 * u,
          height: 9 * u,
          borderRadius: 2 * u,
          backgroundColor: expression === 'cheering' ? c.spark : c.accentDeep,
          borderWidth: 1.5 * u,
          borderColor: c.bg,
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
