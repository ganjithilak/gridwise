import { Pressable, StyleSheet, Text, View } from 'react-native';

import { keyLabel, keyName, type Computer, type PressKey } from '@/spreadsheet/shortcuts';
import { radius, useTheme } from '@/theme';

import type { RealKey } from './speedTrial';

interface Props {
  computer: Computer;
  /** The keys in play at this level. The rest of the keyboard is there, but dim. */
  lit: { holds: readonly RealKey[]; keys: readonly PressKey[] };
  /** Ctrl, Cmd or Shift, held down. On a phone a tap holds one until the next key is pressed. */
  held: readonly RealKey[];
  /** The keys to point out for the task in hand. Fewer of them as the shortcut is learned. */
  hint: { holds: readonly RealKey[]; key: PressKey | null };
  onHold: (key: RealKey) => void;
  onKey: (key: PressKey) => void;
  keyHeight?: number;
}

const ROWS: readonly (readonly string[])[] = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Up'],
];

const isHold = (key: string): key is RealKey => key === 'Ctrl' || key === 'Cmd' || key === 'Shift';

/**
 * A keyboard laid out like a real one, so the shortcut keys are learned where they really
 * sit: Z, X, C and V in a row at the bottom left, beside Ctrl. Keys that belong to a
 * shortcut met so far are lit, and more light up level by level. The keys for the task in
 * hand glow as a hint until the shortcut is known.
 */
export function GameKeyboard({ computer, lit, held, hint, onHold, onKey, keyHeight = 42 }: Props) {
  const c = useTheme();
  // A Mac has both keys: Cmd for most shortcuts, Ctrl for a few.
  const bottom = computer === 'mac' ? ['Ctrl', 'Cmd', 'Space', 'Left', 'Down', 'Right'] : ['Ctrl', 'Space', 'Left', 'Down', 'Right'];

  const key = (id: string) => {
    const hold = isHold(id);
    const inPlay = hold ? lit.holds.includes(id) : lit.keys.includes(id);
    const down = hold && held.includes(id);
    const hinted = hold ? hint.holds.includes(id) : hint.key === id;
    const wide = hold ? 1.6 : id === 'Space' ? 3.2 : 1;
    const label = hold ? id : keyLabel(id);
    return (
      <Pressable
        key={id}
        testID={`gkey-${id}`}
        accessibilityRole="button"
        accessibilityLabel={hold ? (down ? `${id}, held down` : id) : keyName(id)}
        accessibilityState={{ disabled: !inPlay, selected: down }}
        disabled={!inPlay}
        onPress={() => (hold ? onHold(id) : onKey(id))}
        style={({ pressed }) => [
          styles.key,
          {
            flex: wide,
            height: keyHeight,
            backgroundColor: down ? c.accent : hinted ? c.accentSoft : inPlay ? c.surface : 'transparent',
            borderColor: down ? c.accentDeep : hinted ? c.accent : inPlay ? c.outline : c.line,
            borderWidth: hinted && !down ? 2 : 1,
            borderBottomWidth: !inPlay ? 1 : pressed || down ? 1.5 : 4,
            marginTop: inPlay && (pressed || down) ? 2.5 : 0,
            opacity: inPlay ? 1 : 0.4,
          },
        ]}
      >
        <Text style={[label.length > 1 ? styles.word : styles.letter, { color: down ? c.onAccent : hinted ? c.accent : inPlay ? c.ink : c.inkFaint }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.board} testID="game-keyboard">
      {[...ROWS, bottom].map((row, i) => (
        <View key={row.join('')} style={[styles.row, i === 1 && styles.inset]}>
          {row.map(key)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { gap: 5 },
  row: { flexDirection: 'row', gap: 4 },
  // The middle row of a real keyboard sits half a key in.
  inset: { paddingHorizontal: 14 },
  key: { minWidth: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, userSelect: 'none' },
  letter: { fontSize: 15, fontWeight: '700' },
  word: { fontSize: 12, fontWeight: '800' },
});
