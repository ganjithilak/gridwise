import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { keyLabel, keyName, type Computer, type PressKey } from '@/spreadsheet/shortcuts';
import { radius, useTheme } from '@/theme';

import type { RealKey } from './speedTrial';

interface Props {
  computer: Computer;
  /** Ctrl, Cmd or Shift, held down. On a phone a tap holds one until the next key is pressed. */
  held: readonly RealKey[];
  /** The keys to point out for the task in hand. Fewer of them as the shortcut is learned. */
  hint: { holds: readonly RealKey[]; key: PressKey | null };
  /** Keys just pressed wrongly, shown briefly in the "not quite" colour. */
  wrong?: readonly string[];
  onHold: (key: RealKey) => void;
  onKey: (key: PressKey) => void;
  keyHeight?: number;
  disabled?: boolean;
}

/** A key as drawn: what it does when pressed, what is printed on it, how wide it is. */
interface KeyDef {
  id: string;
  /** A held key (it toggles), a pressed key (it answers), or a key the game has no use for. */
  role: { hold: RealKey } | { press: PressKey } | 'inert';
  label: string;
  /** A second, smaller line: "command" under ⌘. */
  sub?: string;
  w?: number;
}

const press = (k: string, w?: number): KeyDef => ({ id: k, role: { press: k }, label: keyLabel(k), w });
const hold = (id: string, k: RealKey, label: string, w: number, sub?: string): KeyDef => ({ id, role: { hold: k }, label, sub, w });
const inert = (id: string, label: string, w = 1, sub?: string): KeyDef => ({ id, role: 'inert', label, sub, w });
const letters = (s: string) => s.split('').map((k) => press(k));

function layout(computer: Computer): KeyDef[][] {
  const fn: KeyDef[] = [press('Esc', 1.3), ...['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'].map((k) => press(k))];
  const top = [press('Tab', 1.5), ...letters('QWERTYUIOP')];
  const home = [inert('Caps', computer === 'mac' ? '⇪' : 'Caps', 1.8), ...letters('ASDFGHJKL'), press('Enter', 1.8)];
  const lower = [hold('Shift', 'Shift', 'Shift', 1.7), ...letters('ZXCVBNM'), hold('ShiftR', 'Shift', '⇧', 1.1)];
  const bottom =
    computer === 'mac'
      ? [
          inert('fn', 'fn'),
          hold('Ctrl', 'Ctrl', '⌃', 1.1, 'ctrl'),
          inert('Opt', '⌥', 1.1, 'opt'),
          hold('Cmd', 'Cmd', '⌘', 1.4, 'cmd'),
          press('Space', 3.8),
          hold('CmdR', 'Cmd', '⌘', 1.4, 'cmd'),
        ]
      : [hold('Ctrl', 'Ctrl', 'Ctrl', 1.4), inert('Win', '⊞'), inert('Alt', 'Alt'), press('Space', 4), inert('AltR', 'Alt'), hold('CtrlR', 'Ctrl', 'Ctrl', 1.4)];
  return [fn, top, home, lower, bottom];
}

/**
 * A desktop keyboard, Windows or Mac, so shortcut keys are learned where they really sit:
 * Esc and the F keys along the top, Z X C V along the bottom left beside Shift and Ctrl,
 * the arrows in their inverted T, full size so they are easy to hit with a thumb. Every key can be pressed (a wrong one is explained);
 * the keys for the task in hand glow as a hint until the shortcut is known.
 */
export function GameKeyboard({ computer, held, hint, wrong = [], onHold, onKey, keyHeight = 40, disabled = false }: Props) {
  const c = useTheme();
  const rows = layout(computer);

  const [inner, setInner] = useState(0);
  // The arrows are as wide as a letter key, in an inverted T beside the bottom two rows.
  const arrowW = inner > 0 ? (inner - 10 * GAP) / 11.5 : 0;

  const keyView = (k: KeyDef, height: number, width?: number) => {
    const isHold = typeof k.role === 'object' && 'hold' in k.role;
    const real = typeof k.role === 'object' && 'hold' in k.role ? k.role.hold : null;
    const pressKey = typeof k.role === 'object' && 'press' in k.role ? k.role.press : null;
    const down = real !== null && held.includes(real);
    // Only the left-hand copy of a held key glows, so the hint points at one place.
    const hinted = real !== null ? hint.holds.includes(real) && !k.id.endsWith('R') : pressKey !== null && hint.key === pressKey;
    const isWrong = wrong.includes(k.id) || (pressKey !== null && wrong.includes(pressKey));
    const bg = down ? c.accent : isWrong ? c.badSoft : hinted ? c.accentSoft : k.role === 'inert' ? c.sunken : c.surface;
    const edge = down ? c.accentDeep : isWrong ? c.bad : hinted ? c.accent : c.outline;
    const ink = down ? c.onAccent : isWrong ? c.bad : hinted ? c.accent : k.role === 'inert' ? c.inkFaint : c.ink;
    return (
      <Pressable
        key={k.id}
        testID={`gkey-${k.id}`}
        accessibilityRole="button"
        accessibilityLabel={isHold ? (down ? `${real}, held down` : String(real)) : pressKey ? keyName(pressKey) : k.sub ?? k.label}
        accessibilityState={{ selected: down, disabled: disabled || k.role === 'inert' }}
        disabled={disabled || k.role === 'inert'}
        onPress={() => (real ? onHold(real) : pressKey ? onKey(pressKey) : undefined)}
        style={({ pressed }) => [
          styles.key,
          {
            ...(width !== undefined ? { width } : { flex: k.w ?? 1 }),
            height,
            backgroundColor: bg,
            borderColor: edge,
            borderWidth: hinted && !down ? 2 : 1,
            borderBottomWidth: pressed || down ? 1.5 : 3,
            marginTop: pressed || down ? 1.5 : 0,
          },
        ]}
      >
        <Text style={[k.label.length > 1 ? styles.word : styles.letter, { color: ink }]} numberOfLines={1}>
          {k.label}
        </Text>
        {k.sub ? (
          <Text style={[styles.sub, { color: ink }]} numberOfLines={1}>
            {k.sub}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  const arrow = (dir: 'Left' | 'Up' | 'Down' | 'Right', height: number) => keyView(press(dir), height, arrowW);
  const block = (children: React.ReactNode, height: number) => <View style={[styles.block, { width: 3 * arrowW + 2 * GAP, height }]}>{children}</View>;

  return (
    <View
      style={[styles.board, { backgroundColor: c.sunken, borderColor: c.line }]}
      testID="game-keyboard"
      onLayout={(e) => setInner(e.nativeEvent.layout.width - 2 * PAD - 2)}
    >
      {rows.map((row, i) => {
        const height = i === 0 ? Math.round(keyHeight * 0.7) : keyHeight;
        const last = i >= rows.length - 2;
        return (
          <View key={i} style={styles.row}>
            <View style={styles.row1}>{row.map((k) => keyView(k, height))}</View>
            {last && arrowW > 0
              ? block(
                  i === rows.length - 2 ? (
                    <>
                      <View style={{ width: arrowW }} />
                      {arrow('Up', height)}
                      <View style={{ width: arrowW }} />
                    </>
                  ) : (
                    <>
                      {arrow('Left', height)}
                      {arrow('Down', height)}
                      {arrow('Right', height)}
                    </>
                  ),
                  height,
                )
              : null}
          </View>
        );
      })}
    </View>
  );
}

const GAP = 3;
const PAD = 5;

const styles = StyleSheet.create({
  board: { gap: 4, padding: PAD, borderRadius: radius.md, borderWidth: 1 },
  row: { flexDirection: 'row', gap: GAP },
  row1: { flex: 1, flexDirection: 'row', gap: GAP },
  block: { flexDirection: 'row', gap: GAP },
  key: { minWidth: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 5, userSelect: 'none', paddingHorizontal: 1 },
  letter: { fontSize: 14, fontWeight: '700' },
  word: { fontSize: 10.5, fontWeight: '800' },
  sub: { fontSize: 9, fontWeight: '700', marginTop: -1 },
});
