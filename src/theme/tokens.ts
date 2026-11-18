import { Platform } from 'react-native';

export interface Palette {
  /** Page background. */
  bg: string;
  /** Cards, cells, keyboard keys. */
  surface: string;
  /** Slightly recessed surface: grid headers, pressed states. */
  sunken: string;
  /** Hairlines and grid lines. */
  line: string;
  /** Stronger divider / control outline. */
  outline: string;
  /** Primary text. */
  ink: string;
  /** Secondary text. */
  inkSoft: string;
  /** Tertiary text, placeholders. */
  inkFaint: string;
  /**
   * The brand colour, and the colour of "correct": selection, primary buttons, the mascot.
   * Deliberately not green.
   */
  accent: string;
  accentDeep: string;
  accentSoft: string;
  onAccent: string;
  /** Celebration: combo, confetti, XP. */
  spark: string;
  sparkSoft: string;
  /** "Correct!": the banner that says an answer is right. */
  good: string;
  goodSoft: string;
  /** "Not quite". Warm, never alarming. */
  bad: string;
  badSoft: string;
  hint: string;
  hintSoft: string;
  /** Colours for cell references while a formula is being typed. */
  refs: readonly string[];
}

export const light: Palette = {
  bg: '#F6F4EF',
  surface: '#FFFFFF',
  sunken: '#ECE9E1',
  line: '#DEDAD0',
  outline: '#BDB8AB',
  ink: '#1B1F3B',
  inkSoft: '#565B78',
  inkFaint: '#8E92A8',
  accent: '#2F5BEA',
  accentDeep: '#1E3FB8',
  accentSoft: '#E3EAFF',
  onAccent: '#FFFFFF',
  spark: '#F2A900',
  sparkSoft: '#FFF1CC',
  good: '#177A47',
  goodSoft: '#DDF5E7',
  bad: '#C8402F',
  badSoft: '#FCE6E1',
  hint: '#8A5A00',
  hintSoft: '#FFF1CC',
  refs: ['#2F5BEA', '#C2410C', '#7C3AED', '#B0126F'],
};

/**
 * The app's own look, from the sample theme (16 Nov 2026): deep navy, close to black,
 * with panels a shade lighter, thin blue edges and one bright electric blue.
 */
export const dark: Palette = {
  bg: '#070B15',
  surface: '#0E1628',
  sunken: '#0A101D',
  line: '#1C2945',
  outline: '#30426B',
  ink: '#F3F6FF',
  inkSoft: '#A9B6D6',
  inkFaint: '#6D7B9E',
  accent: '#5A93FF',
  accentDeep: '#2F68E0',
  accentSoft: '#11254F',
  onAccent: '#041029',
  spark: '#FFC83D',
  sparkSoft: '#3A2F10',
  good: '#3DDC84',
  goodSoft: '#0C2B1C',
  bad: '#FF8A75',
  badSoft: '#3B1F1B',
  hint: '#F2C14E',
  hintSoft: '#352B12',
  refs: ['#5A93FF', '#FB923C', '#B794F6', '#F472B6'],
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

export const type = {
  title: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  heading: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  small: { fontSize: 14, fontWeight: '400', lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '700', lineHeight: 16, letterSpacing: 0.6 },
} as const;

/** Formulas are always shown in a fixed-width face. */
export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, Menlo, Consolas, "Courier New", monospace',
}) as string;

/** No transition in the app may run longer than this (product rule 4 allows 300). */
export const MOTION_MS = 220;

/** Rule 9: touch targets are 44 pt where the screen allows and never below 40. */
export const TOUCH = { ideal: 44, min: 40 } as const;
