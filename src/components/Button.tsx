import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, useTheme } from '@/theme';

interface Props {
  label: string;
  onPress: () => void;
  /** `primary` is the one obvious thing to do on the screen. Use it once. */
  kind?: 'primary' | 'secondary' | 'quiet';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({ label, onPress, kind = 'primary', disabled, style, testID }: Props) {
  const c = useTheme();
  const colours = {
    primary: { bg: c.accent, edge: c.accentDeep, text: c.onAccent },
    secondary: { bg: c.surface, edge: c.outline, text: c.ink },
    quiet: { bg: 'transparent', edge: 'transparent', text: c.accent },
  }[kind];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colours.bg,
          borderColor: colours.edge,
          borderBottomWidth: kind === 'quiet' ? 0 : pressed ? 1 : 3,
          borderWidth: kind === 'quiet' ? 0 : 1,
          marginTop: kind !== 'quiet' && pressed ? 2 : 0,
          opacity: disabled ? 0.45 : 1,
        },
        // The primary button carries the world's soft golden glow.
        kind === 'primary' && !disabled ? { shadowColor: c.accent, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 4 } : null,
        style,
      ]}
    >
      {kind === 'primary' ? <View pointerEvents="none" style={styles.sheen} /> : null}
      <Text style={[styles.label, { color: colours.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  },
  label: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  /** A reflection across the top half, as on the world's gold buttons. */
  sheen: { position: 'absolute', top: 3, left: 10, right: 10, height: '38%', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' },
});
