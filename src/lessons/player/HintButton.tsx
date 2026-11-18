import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, useTheme } from '@/theme';

import { MAX_HINTS } from '../session';

interface Props {
  shown: number;
  onPress: () => void;
}

/** Hints are free and come one at a time: a nudge, then the shape, then the answer. */
export function HintButton({ shown, onPress }: Props) {
  const c = useTheme();
  const used = shown >= MAX_HINTS;
  const label = shown === 0 ? 'Hint' : `Hint ${Math.min(shown + 1, MAX_HINTS)}/${MAX_HINTS}`;
  return (
    <Pressable
      testID="hint-button"
      accessibilityRole="button"
      accessibilityLabel={used ? 'No more hints' : shown === 0 ? 'Show a hint' : 'Show the next hint'}
      disabled={used}
      onPress={onPress}
      style={[styles.pill, { backgroundColor: c.hintSoft, opacity: used ? 0.45 : 1 }]}
    >
      <Text style={[styles.text, { color: c.hint }]}>{used ? 'Hints 3/3' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { height: 32, minWidth: 56, paddingHorizontal: 12, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 13, fontWeight: '800', userSelect: 'none' },
});
