import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { radius, useTheme } from '@/theme';
import { usePrefs } from '@/world/prefs';
import { GOLD, tagStyle } from '@/world/ui/Gold';

/**
 * The world's interface language, for every screen beside the farm (Stage 7): cards edged
 * in a thin line of gold with a soft golden glow and a highlight along the top, as the
 * farm's glass panels are, and section labels in the farm's spaced gold capitals.
 *
 * The card stays solid (the palette's own surface) rather than see-through: on working
 * screens text and spreadsheets must stay crisp. Classic Farm keeps its plain cards.
 */
export const useRefinedUI = (): boolean => usePrefs((s) => s.theme) === 'refined';

/** The gold edge, quieter than the farm's so a screen of cards does not shout. */
const EDGE = 'rgba(242, 193, 78, 0.42)';
const EDGE_STRONG = GOLD.edge;

interface PanelProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** The one thing on screen that matters most: a stronger edge and glow. */
  glow?: boolean;
  /** Makes the card a button: it presses in like the world's buttons. */
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'summary';
  /** Dashed: something not open yet. */
  dashed?: boolean;
}

export function Panel({ children, style, glow, onPress, disabled, testID, accessibilityLabel, accessibilityRole, dashed }: PanelProps) {
  const c = useTheme();
  const refined = useRefinedUI();
  const face: ViewStyle = refined
    ? {
        backgroundColor: c.surface,
        borderColor: glow ? EDGE_STRONG : EDGE,
        borderWidth: 1,
        borderRadius: 16,
        shadowColor: GOLD.glow,
        shadowOpacity: glow ? 0.45 : 0.16,
        shadowRadius: glow ? 14 : 8,
        shadowOffset: { width: 0, height: 0 },
        elevation: glow ? 6 : 2,
      }
    : { backgroundColor: c.surface, borderColor: glow ? c.accent : c.line, borderWidth: 1, borderRadius: radius.lg };
  const sheen = refined ? <View pointerEvents="none" style={styles.sheen} /> : null;
  if (!onPress) {
    return (
      <View testID={testID} accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} style={[face, dashed && styles.dashed, style]}>
        {sheen}
        {children}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [face, dashed && styles.dashed, { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: disabled ? 0.6 : 1 }, styles.press, style]}
    >
      {sheen}
      {children}
    </Pressable>
  );
}

/** A section heading in spaced capitals: gold in the world, quiet grey in Classic Farm. */
export function SectionLabel({ children, style, testID }: { children: string; style?: StyleProp<TextStyle>; testID?: string }) {
  const c = useTheme();
  const refined = useRefinedUI();
  const lightLook = c.bg.toUpperCase() === '#F6F4EF';
  return (
    <Text testID={testID} style={[refined ? [tagStyle, { color: lightLook ? GOLD.tagOnLight : GOLD.tag }] : { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: c.inkSoft }, style]}>
      {children.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  sheen: { position: 'absolute', top: 0, left: 16, right: 16, height: 1, backgroundColor: 'rgba(255, 230, 160, 0.38)' },
  dashed: { borderStyle: 'dashed' },
  press: { userSelect: 'none' },
});
