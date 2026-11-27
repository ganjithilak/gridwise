import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Mascot, type Expression } from '@/components/Mascot';
import { useRefinedUI } from '@/components/Panel';
import { radius, useTheme } from '@/theme';
import { GoldButton } from '@/world/ui/Gold';

export type Tone = 'task' | 'say' | 'hint' | 'bad' | 'good';

interface Props {
  mood: Expression;
  tone: Tone;
  text: string;
  /** Fixed, so the grid below never jumps when the message changes. */
  height: number;
  lines: number;
  onPress?: () => void;
  /** The button on the right: "Next" while the app is demonstrating. */
  action?: { label: string; onPress: () => void };
}

/** The one place the app talks: the task, a caption, a hint, or what went wrong. Cell sits beside it. */
export function MessageCard({ mood, tone, text, height, lines, onPress, action }: Props) {
  const c = useTheme();
  const refined = useRefinedUI();
  const colours = {
    // In the world (Refined) the task card carries the panels' fine gold edge.
    task: { bg: c.surface, fg: c.ink, edge: refined ? 'rgba(242, 193, 78, 0.42)' : c.line },
    say: { bg: c.accentSoft, fg: c.ink, edge: c.accentSoft },
    hint: { bg: c.hintSoft, fg: c.hint, edge: c.hintSoft },
    bad: { bg: c.badSoft, fg: c.bad, edge: c.badSoft },
    good: { bg: c.accentSoft, fg: c.accent, edge: c.accentSoft },
  }[tone];

  // On a small phone the card has two lines, and fewer letters fit beside the Next button.
  // A long sentence would be cut off there, so it gets a smaller face and a third line
  // instead: the card stays the same height, and every word can be read.
  const { width } = useWindowDimensions();
  // The card's own width once it is on screen: beside the sheet it is far narrower than
  // the window. Until then, the width it has on a phone held upright.
  const [measured, setMeasured] = useState<number | null>(null);
  const cardWidth = measured ?? Math.min(width, COLUMN.max) - COLUMN.padding;
  const room = cardWidth - COLUMN.inside - (action ? ACTION_WIDTH : 0);
  const fits = Math.floor(room / LETTER) * lines * WRAP_SLACK;
  const tight = lines === 2 && text.length > fits;

  return (
    <View
      style={[styles.card, refined && styles.round, { height, backgroundColor: colours.bg, borderColor: colours.edge }]}
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.width);
        setMeasured((now) => (now === next ? now : next));
      }}
    >
      <Pressable
        testID="message-card"
        accessibilityRole="text"
        accessibilityLabel={text}
        disabled={!onPress}
        onPress={onPress}
        style={styles.main}
      >
        <Mascot expression={mood} size={34} />
        <Text
          testID="message-text"
          numberOfLines={tight ? 3 : lines}
          style={[styles.text, tight && styles.tight, { color: colours.fg, fontWeight: tone === 'task' ? '600' : '500' }]}
        >
          {text}
        </Text>
      </Pressable>
      {action && refined ? (
        // The farm's own button: a small gold pill, as Continue is on the farm.
        <GoldButton testID="message-action" label={action.label} onPress={action.onPress} small arrow={false} style={styles.gold} />
      ) : action ? (
        <Pressable
          testID="message-action"
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: c.accent, borderColor: c.accentDeep, borderBottomWidth: pressed ? 1 : 3, marginTop: pressed ? 2 : 0 },
          ]}
        >
          <Text style={[styles.actionText, { color: c.onAccent }]}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * For working out whether a sentence fits, without measuring the words on screen.
 * Upright, the lesson column is at most 480 pt wide with 24 of padding. Inside the card,
 * beside the words, go its edge and padding (20), Cell (34) and the gap beside it (12).
 */
const COLUMN = { max: 480, padding: 24, inside: 66 };
/** The Next button and the space after it. */
const ACTION_WIDTH = 80;
/** A letter at the normal size is about this wide. Counted wide on purpose. */
const LETTER = 7.6;
/** Lines break between words, so a line is never quite full. */
const WRAP_SLACK = 0.92;

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  round: { borderRadius: 14 },
  gold: { minWidth: 72, marginRight: 8, paddingHorizontal: 16 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 10, paddingRight: 8, alignSelf: 'stretch' },
  text: { flex: 1, fontSize: 15, lineHeight: 20 },
  // Three lines of this are 51 pt, inside the 54 pt card that two normal lines sit in.
  tight: { fontSize: 13, lineHeight: 17 },
  action: {
    minWidth: 72,
    height: 40,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    userSelect: 'none',
  },
  actionText: { fontSize: 15, fontWeight: '800' },
});
