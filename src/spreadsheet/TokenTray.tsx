import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { buzz } from '@/lib/feedback';
import { radius, useTheme } from '@/theme';

interface Props {
  /** The pieces to build with, in the order to show them. Each goes in exactly as written. */
  tokens: readonly string[];
  onToken: (token: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  /** Demo: the piece the app is pressing right now, as "chip:SUM(" or the key "enter". */
  flash?: string | null;
  locked?: boolean;
  keyHeight?: number;
}

/** Pieces of a formula to tap into place, for tasks where the formula is built and not typed. */
export function TokenTray({ tokens, onToken, onBackspace, onEnter, flash, locked = false, keyHeight = 44 }: Props) {
  const c = useTheme();
  return (
    <View style={styles.tray} testID="token-tray">
      <View style={styles.pieces}>
        {tokens.map((token, i) => {
          const flashing = flash === `chip:${token}`;
          return (
            <Pressable
              key={`${token}-${i}`}
              testID={`token-${token}`}
              accessibilityRole="button"
              accessibilityLabel={`Add ${token}`}
              disabled={locked}
              onPress={() => {
                buzz('key');
                onToken(token);
              }}
              style={({ pressed }) => [
                styles.piece,
                {
                  height: keyHeight,
                  backgroundColor: flashing ? c.spark : c.surface,
                  borderColor: flashing ? c.spark : c.outline,
                  borderBottomWidth: pressed || flashing ? 1 : 2.5,
                  marginTop: pressed || flashing ? 1.5 : 0,
                },
              ]}
            >
              <Text style={[styles.pieceText, { color: c.ink }]}>{token}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.row}>
        <Pressable
          testID="token-backspace"
          accessibilityRole="button"
          accessibilityLabel="Delete"
          disabled={locked}
          onPress={() => {
            buzz('key');
            onBackspace();
          }}
          style={[styles.key, { height: keyHeight, backgroundColor: c.sunken, borderColor: c.outline }]}
        >
          <Text style={[styles.word, { color: c.ink }]}>{Platform.OS === 'android' ? 'DEL' : '⌫'}</Text>
        </Pressable>
        <Pressable
          testID="token-enter"
          accessibilityRole="button"
          accessibilityLabel="Enter"
          disabled={locked}
          onPress={() => {
            buzz('key');
            onEnter();
          }}
          style={[
            styles.key,
            styles.enter,
            {
              height: keyHeight,
              backgroundColor: flash === 'enter' ? c.spark : c.accent,
              borderColor: flash === 'enter' ? c.spark : c.accentDeep,
            },
          ]}
        >
          <Text style={[styles.word, { color: flash === 'enter' ? c.ink : c.onAccent }]}>Enter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: { flex: 1, justifyContent: 'flex-end', gap: 5 },
  pieces: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  piece: {
    minWidth: 46,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    userSelect: 'none',
  },
  pieceText: { fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 5 },
  key: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderBottomWidth: 2.5, userSelect: 'none' },
  enter: { flex: 2 },
  word: { fontSize: 15, fontWeight: '800' },
});
