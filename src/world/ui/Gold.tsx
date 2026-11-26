import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * The world's interface style (Creative Direction V2 refinements): translucent glass that
 * lets the scene show through, thin polished gold edges with a soft golden glow, a
 * dimensional gold button, and a display face for titles. Reused by every world screen.
 */
export const GOLD = {
  edge: '#F2C14E',
  edgeBright: '#FFE08A',
  deep: '#9A5F07',
  glow: '#FFB800',
  ink: '#3A2104',
  /** Dark glass: over soil, or for the bar. */
  glassDark: 'rgba(36, 22, 8, 0.58)',
  /** Light glass: over sky and grass. */
  glassLight: 'rgba(255, 250, 236, 0.72)',
  onDark: '#FFF4DC',
  onDarkSoft: '#F1D9A8',
  onLight: '#2B2118',
  onLightSoft: '#6E5C4B',
  tag: '#FFC93C',
  tagOnLight: '#A86A00',
} as const;

/**
 * Titles: a serif in italic, for a storybook feel that stays very legible. System faces
 * only (Georgia on iPhone and the web, the system serif on Android), so nothing is
 * downloaded and there is no licence to manage. A licensed display font can replace it here.
 */
export const DISPLAY = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
}) as string;

export const display: TextStyle = { fontFamily: DISPLAY, fontStyle: 'italic', fontWeight: '700' };
export const tagStyle: TextStyle = { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4 };

const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as object) : {};

interface PanelProps {
  children?: ReactNode;
  tone?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
  /** A stronger golden glow, for the one thing that matters most on screen. */
  glow?: boolean;
  testID?: string;
  pointerEvents?: 'box-none' | 'none' | 'auto' | 'box-only';
}

/** Translucent glass with a thin gold edge and a highlight along its top. */
export function GlassPanel({ children, tone = 'dark', style, glow, testID, pointerEvents }: PanelProps) {
  return (
    <View
      testID={testID}
      pointerEvents={pointerEvents}
      style={[styles.panel, webBlur, { backgroundColor: tone === 'dark' ? GOLD.glassDark : GOLD.glassLight }, glow ? styles.glow : styles.softGlow, style]}
    >
      <View pointerEvents="none" style={[styles.sheen, { backgroundColor: tone === 'dark' ? 'rgba(255,230,160,0.35)' : 'rgba(255,255,255,0.9)' }]} />
      {children}
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Shows a small ▸ after the label. */
  arrow?: boolean;
  small?: boolean;
}

/** The primary action: polished, dimensional gold, with a reflection across its top. */
export function GoldButton({ label, onPress, testID, disabled, style, arrow = true, small }: ButtonProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [down, setDown] = useState(false);
  const h = small ? 38 : 46;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[styles.button, { minHeight: h, opacity: disabled ? 0.5 : 1, transform: [{ scale: down ? 0.97 : 1 }] }, !disabled && styles.buttonGlow, style]}
    >
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id="goldFace" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={down ? '#F7C548' : '#FFE68E'} />
              <Stop offset="0.45" stopColor="#F9C33A" />
              <Stop offset="1" stopColor="#D98A0C" />
            </LinearGradient>
            <LinearGradient id="goldEdge" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFF3C4" />
              <Stop offset="1" stopColor={GOLD.deep} />
            </LinearGradient>
          </Defs>
          <Rect x={0.75} y={0.75} width={size.w - 1.5} height={size.h - 1.5} rx={(size.h - 1.5) / 2} fill="url(#goldFace)" stroke="url(#goldEdge)" strokeWidth={1.5} />
          {/* The reflection: a soft white band across the upper half. */}
          <Ellipse cx={size.w / 2} cy={size.h * 0.28} rx={size.w * 0.42} ry={size.h * 0.2} fill="#FFFFFF" opacity={down ? 0.2 : 0.42} />
          <Rect x={size.h * 0.4} y={size.h - 4} width={size.w - size.h * 0.8} height={1.2} rx={0.6} fill="#FFF0B0" opacity={0.6} />
        </Svg>
      ) : null}
      <Text style={[styles.buttonText, small && styles.buttonTextSmall]} numberOfLines={1}>
        {label}
        {arrow ? '  ▸' : ''}
      </Text>
    </Pressable>
  );
}

/** A quiet text action that sits under a GoldButton. */
export function GoldLink({ label, onPress, testID, tone = 'light' }: { label: string; onPress: () => void; testID?: string; tone?: 'dark' | 'light' }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={styles.link}>
      <Text style={[styles.linkText, { color: tone === 'dark' ? GOLD.tag : GOLD.tagOnLight }]}>{label}</Text>
    </Pressable>
  );
}

/** A small glass pill: hints and side tabs on the farm. */
export function GoldChip({ label, onPress, style, testID, accessibilityLabel }: { label: string; onPress?: () => void; style?: StyleProp<ViewStyle>; testID?: string; accessibilityLabel?: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} hitSlop={6} style={[styles.chip, webBlur, style]}>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1.2, borderColor: GOLD.edge, borderRadius: 18, overflow: 'hidden' },
  sheen: { position: 'absolute', top: 0, left: 14, right: 14, height: 1 },
  softGlow: { shadowColor: GOLD.glow, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  glow: { shadowColor: GOLD.glow, shadowOpacity: 0.7, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  button: { borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  buttonGlow: { shadowColor: GOLD.glow, shadowOpacity: 0.65, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 6 },
  buttonText: { color: GOLD.ink, fontSize: 17, fontWeight: '900', letterSpacing: 0.3, textShadowColor: 'rgba(255,248,210,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 },
  buttonTextSmall: { fontSize: 15 },
  link: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontSize: 15, fontWeight: '800' },
  chip: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 250, 236, 0.62)',
    borderWidth: 1,
    borderColor: GOLD.edge,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: GOLD.glow,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  chipText: { color: GOLD.onLight, fontSize: 12.5, fontWeight: '800' },
});
