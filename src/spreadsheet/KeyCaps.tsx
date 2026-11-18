import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { buzz } from '@/lib/feedback';
import { radius, useTheme } from '@/theme';

import type { ShortcutId } from './controller';
import {
  ARROWS,
  CAP_LETTERS,
  holdLabel,
  keyLabel,
  keyName,
  shortcutFor,
  SHORTCUTS,
  type CapSet,
  type Computer,
  type HoldKey,
  type PressKey,
} from './shortcuts';

interface Props {
  computer: Computer;
  /** Which keys to show: the letters with Ctrl or Cmd, or the keys for getting around. */
  set?: CapSet;
  onCombo: (id: ShortcutId) => void;
  /** Called when a key that needs another held first is pressed alone, so the lesson can say so. */
  onLoose?: (key: PressKey) => void;
  /** Demo: the shortcut the app is pressing right now, as "combo:selectAll". */
  flash?: string | null;
  locked?: boolean;
  height?: number;
  /**
   * Keys already held down when the strip appears. A game played by thumb on a phone
   * starts with Shift held, so the first tap on an arrow does something.
   */
  startHeld?: readonly HoldKey[];
  /** Lights a key up to point it out, as "Shift". Used when the wrong key was pressed. */
  pointAt?: HoldKey | null;
}

/** The keys that are held, and the keys that are pressed, on each strip. */
const STRIPS: Record<CapSet, { hold: readonly HoldKey[]; press: readonly PressKey[] }> = {
  letters: { hold: ['mod'], press: CAP_LETTERS },
  moving: { hold: ['ctrl', 'shift'], press: ['Space', ...ARROWS] },
};

/** What a real keyboard calls the same keys. */
const fromEvent = (key: string): PressKey | null => {
  if (key === ' ' || key === 'Spacebar') return 'Space';
  if (key.startsWith('Arrow')) return key.slice(5);
  return key.length === 1 ? key.toUpperCase() : null;
};

/**
 * A strip of keyboard keys to press in combination: a key such as Ctrl or Shift first,
 * which stays held, then another. On a phone this teaches what a shortcut is; with a real
 * keyboard on the web the real keys work too.
 */
export function KeyCaps({ computer, set = 'letters', onCombo, onLoose, flash, locked = false, height = 44, startHeld = [], pointAt = null }: Props) {
  const c = useTheme();
  const [held, setHeld] = useState<readonly HoldKey[]>(startHeld);
  const strip = STRIPS[set];
  const flashing = flash?.startsWith('combo:') ? SHORTCUTS[flash.slice(6) as ShortcutId] : null;

  // A real keyboard, where there is one. The browser keeps a few combinations for itself
  // (such as Ctrl+W), which is why none of those are taught here.
  useEffect(() => {
    if (Platform.OS !== 'web' || locked) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) return;
      const key = fromEvent(e.key);
      if (!key) return;
      // Ctrl on a Mac is its own key; Cmd there does what Ctrl does on Windows.
      const down: HoldKey[] = [];
      if (e.shiftKey) down.push('shift');
      const id =
        (e.ctrlKey || e.metaKey ? shortcutFor(key, [...down, 'mod']) : null) ??
        (e.ctrlKey ? shortcutFor(key, [...down, 'ctrl']) : null) ??
        (!e.ctrlKey && !e.metaKey ? shortcutFor(key, down) : null);
      if (!id) return;
      // Only the keys on this strip: a lesson about arrows should not also copy and paste.
      if (!strip.press.includes(SHORTCUTS[id].key)) return;
      e.preventDefault();
      onCombo(id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [locked, onCombo, strip]);

  const toggle = (key: HoldKey) => {
    buzz('key');
    setHeld((now) => (now.includes(key) ? now.filter((k) => k !== key) : [...now, key]));
  };

  const press = (key: PressKey) => {
    buzz('key');
    const id = shortcutFor(key, held);
    if (!id) {
      onLoose?.(key);
      return;
    }
    // An arrow is often pressed several times in a row, so what is held stays held for it.
    if (!(ARROWS as readonly string[]).includes(key)) setHeld([]);
    onCombo(id);
  };

  const cap = (label: string, active: boolean, flex: number, onPress: () => void, spoken: string, id: string, pointed = false) => (
    <Pressable
      key={id}
      testID={`cap-${id}`}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityState={{ selected: active }}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cap,
        {
          flex,
          height,
          backgroundColor: active ? c.accent : pointed ? c.hintSoft : c.surface,
          borderColor: active ? c.accentDeep : pointed ? c.hint : c.outline,
          borderWidth: pointed && !active ? 2 : 1,
          borderBottomWidth: pressed || active ? 1.5 : 4,
          marginTop: pressed || active ? 2.5 : 0,
        },
      ]}
    >
      <Text style={[label.length > 1 ? styles.word : styles.letter, { color: active ? c.onAccent : c.ink }]}>{label}</Text>
    </Pressable>
  );

  const heldNames = held.map((key) => holdLabel(key, computer)).join(' and ');

  return (
    <View style={styles.strip} testID="key-caps">
      {strip.hold.map((key) => {
        const label = holdLabel(key, computer);
        const down = held.includes(key) || (flashing?.hold.includes(key) ?? false);
        return cap(
          label,
          down,
          1.5,
          () => toggle(key),
          held.includes(key) ? `${label}, held down` : `${label}. Press it first, then another key.`,
          label,
          pointAt === key,
        );
      })}
      {strip.press.map((key) =>
        cap(
          keyLabel(key),
          flashing?.key === key,
          key === 'Space' ? 2 : 1,
          () => press(key),
          held.length > 0 ? `${heldNames} and ${keyName(key)}` : keyName(key),
          key,
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', gap: 5 },
  cap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    userSelect: 'none',
  },
  letter: { fontSize: 17, fontWeight: '700' },
  word: { fontSize: 14, fontWeight: '800' },
});
