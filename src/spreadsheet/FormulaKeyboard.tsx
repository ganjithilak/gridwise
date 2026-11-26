import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { buzz } from '@/lib/feedback';
import { radius, useTheme } from '@/theme';

import type { KeyId } from './controller';

interface Props {
  onKey: (key: KeyId) => void;
  /** Keys the lesson hasn't taught yet. Their places stay empty so nothing ever moves. */
  hidden?: readonly KeyId[];
  /**
   * Ready-made pieces for this task, shown in a row above the keys: function names
   * (AVERAGE), words ("Hit") and signs (>) that the keypad has no key for.
   */
  chips?: readonly string[];
  onChip?: (chip: string) => void;
  /** Demo: the key the app is pressing right now. A chip is named "chip:AVERAGE". */
  flashKey?: string | null;
  locked?: boolean;
  keyHeight?: number;
}

/** Every key keeps the same place in every lesson, so fingers learn where things are. */
const LAYOUT: KeyId[][] = [
  ['7', '8', '9', '(', ')', 'backspace'],
  ['4', '5', '6', '+', '-', ':'],
  ['1', '2', '3', '*', '/', ','],
  ['0', '.', '=', '$', 'SUM', 'enter'],
];

export const KEY_GAP = 5;

const LABELS: Partial<Record<KeyId, string>> = {
  backspace: Platform.OS === 'android' ? 'DEL' : '⌫',
  enter: 'Enter',
};

const SPOKEN: Partial<Record<KeyId, string>> = {
  backspace: 'Delete',
  enter: 'Enter',
  '=': 'equals',
  '+': 'plus',
  '-': 'minus',
  '*': 'times',
  '/': 'divide',
  '(': 'open bracket',
  ')': 'close bracket',
  ':': 'colon',
  ',': 'comma',
  '.': 'point',
  $: 'dollar',
};

const isDigit = (key: KeyId) => key.length === 1 && key >= '0' && key <= '9';

const SPOKEN_CHIPS: Record<string, string> = {
  '>': 'greater than',
  '<': 'less than',
  '>=': 'at least',
  '<=': 'at most',
  '<>': 'not equal to',
  '&': 'joined to',
};

/** The keypad for typing formulas. It replaces the phone's own keyboard. */
export function FormulaKeyboard({ onKey, hidden = [], chips, onChip, flashKey, locked = false, keyHeight = 44 }: Props) {
  const c = useTheme();
  return (
    <View style={styles.board} testID="formula-keyboard">
      {chips && chips.length > 0 ? (
        <View style={styles.row}>
          {chips.map((chip) => {
            const flashing = flashKey === `chip:${chip}`;
            return (
              <Pressable
                key={chip}
                testID={`chip-${chip}`}
                accessibilityRole="button"
                accessibilityLabel={SPOKEN_CHIPS[chip] ?? chip.replace(/"/g, '')}
                disabled={locked}
                onPress={() => {
                  buzz('key');
                  onChip?.(chip);
                }}
                style={({ pressed }) => [
                  styles.key,
                  {
                    // Longer names get a little more room, so nothing has to shrink to fit.
                    flex: Math.max(2, chip.length),
                    height: keyHeight,
                    backgroundColor: flashing ? c.spark : c.accentSoft,
                    borderColor: flashing ? c.spark : c.outline,
                    borderBottomWidth: pressed || flashing ? 1 : 2.5,
                    marginTop: pressed || flashing ? 1.5 : 0,
                  },
                ]}
              >
                <Text numberOfLines={1} style={[styles.chipLabel, { color: flashing ? c.ink : c.accent }]}>
                  {chip}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {LAYOUT.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((key) => {
            // A key not taught yet keeps its place as a faint outline: the board never moves,
            // and it reads as keys still to come rather than a gap.
            if (hidden.includes(key)) {
              return <View key={key} style={[styles.key, styles.later, { height: keyHeight, borderColor: c.line }]} accessibilityElementsHidden />;
            }
            const flashing = flashKey === key;
            const kind = key === 'enter' ? 'enter' : key === 'SUM' || key === '=' ? 'special' : isDigit(key) || key === '.' ? 'digit' : 'symbol';
            const bg = { enter: c.accent, special: c.accentSoft, digit: c.surface, symbol: c.sunken }[kind];
            const fg = { enter: c.onAccent, special: c.accent, digit: c.ink, symbol: c.ink }[kind];
            const edge = kind === 'enter' ? c.accentDeep : c.outline;
            return (
              <Pressable
                key={key}
                testID={`key-${key}`}
                accessibilityRole="button"
                accessibilityLabel={SPOKEN[key] ?? key}
                disabled={locked}
                onPress={() => {
                  buzz('key');
                  onKey(key);
                }}
                style={({ pressed }) => [
                  styles.key,
                  {
                    height: keyHeight,
                    backgroundColor: flashing ? c.spark : bg,
                    borderColor: flashing ? c.spark : edge,
                    borderBottomWidth: pressed || flashing ? 1 : 2.5,
                    marginTop: pressed || flashing ? 1.5 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.label,
                    { color: flashing ? c.ink : fg },
                    (key === 'SUM' || key === 'enter' || LABELS[key] === 'DEL') && styles.wordLabel,
                  ]}
                >
                  {LABELS[key] ?? key}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** How tall the keyboard is for a given key height, so screens can reserve the space. */
export function keyboardHeight(keyHeight: number, withChips = false): number {
  const rows = LAYOUT.length + (withChips ? 1 : 0);
  return rows * keyHeight + (rows - 1) * KEY_GAP;
}

const styles = StyleSheet.create({
  board: { gap: KEY_GAP },
  later: { borderWidth: 1, borderStyle: 'dashed', opacity: 0.5 },
  row: { flexDirection: 'row', gap: KEY_GAP },
  key: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    userSelect: 'none',
  },
  label: { fontSize: 20, fontWeight: '600' },
  wordLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  chipLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2, paddingHorizontal: 2 },
});
