import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { radius, useTheme } from '@/theme';

interface Action {
  label: string;
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
}

interface Props {
  /** Leave out for the plain "one button" state. */
  title?: string;
  message?: string;
  tone?: 'good' | 'bad' | 'plain';
  /**
   * One basic fact to fill the space while there is nothing else to say. It gives way
   * to the result of a check: a `title` always wins.
   */
  tip?: string;
  /** A toolbar or key caps for this task. It sits on top and leaves less room for words. */
  top?: ReactNode;
  /** The one obvious thing to do next. */
  primary: Action;
  secondary?: Action;
  /** Shown beside the title of a right answer: what it earned, such as "+2 XP". */
  badge?: string;
}

/**
 * The bottom of the exercise screen whenever the keyboard is closed. It always ends in
 * one main button, and it sits in the space the keyboard uses, so it never covers the grid.
 */
export function FeedbackSheet({ title, message, tone = 'plain', tip, top, primary, secondary, badge }: Props) {
  const c = useTheme();
  const colours = {
    good: { bg: c.goodSoft, fg: c.good },
    bad: { bg: c.badSoft, fg: c.bad },
    plain: { bg: c.surface, fg: c.ink },
  }[tone];
  const tight = top !== undefined && top !== null;

  return (
    <View style={[styles.sheet, tight && styles.tightSheet]}>
      {top}
      {title ? (
        <View
          style={[styles.note, tight && styles.tightNote, { backgroundColor: colours.bg }, tone === 'good' && { borderWidth: 1.5, borderColor: c.good }]}
          testID={`feedback-${tone}`}
        >
          <View style={styles.titleRow}>
            <Text style={[tight ? styles.tightTitle : styles.title, styles.titleWords, { color: colours.fg }]} numberOfLines={1}>
              {title}
            </Text>
            {badge ? (
              <Text style={[styles.badge, { color: colours.fg }]} testID="feedback-badge">
                {badge}
              </Text>
            ) : null}
          </View>
          {message ? (
            <Text style={[tight ? styles.tightMessage : styles.message, { color: c.ink }]} numberOfLines={tight ? 2 : 4}>
              {message}
            </Text>
          ) : null}
        </View>
      ) : tip ? (
        // Quieter than a result, so it reads as an aside and not as feedback on their work.
        <View
          style={[styles.note, styles.tip, tight && styles.tightNote, { borderColor: c.outline }]}
          testID="tip"
          accessibilityLabel={`Tip: ${tip}`}
        >
          {tight ? null : <Text style={[styles.tipLabel, { color: c.accent }]}>QUICK TIP</Text>}
          <Text style={[tight ? styles.tightMessage : styles.message, { color: c.inkSoft }]} numberOfLines={tight ? 2 : 3}>
            {tight ? <Text style={[styles.tipLabel, { color: c.accent }]}>TIP  </Text> : null}
            {tip}
          </Text>
        </View>
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={styles.buttons}>
        {secondary ? (
          <Button kind="secondary" label={secondary.label} onPress={secondary.onPress} testID={secondary.testID} style={styles.side} />
        ) : null}
        <Button label={primary.label} onPress={primary.onPress} testID={primary.testID} disabled={primary.disabled} style={styles.main} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, justifyContent: 'flex-end', gap: 10 },
  tightSheet: { gap: 7 },
  spacer: { flex: 1 },
  note: { flex: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', gap: 4 },
  tightNote: { paddingHorizontal: 12, paddingVertical: 5, gap: 1 },
  tip: { borderWidth: 1.5, borderStyle: 'dashed' },
  tipLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleWords: { flex: 1 },
  badge: { fontSize: 14, fontWeight: '800' },
  title: { fontSize: 17, fontWeight: '800' },
  tightTitle: { fontSize: 15, fontWeight: '800' },
  message: { fontSize: 15, lineHeight: 20 },
  tightMessage: { fontSize: 14, lineHeight: 18 },
  buttons: { flexDirection: 'row', gap: 10 },
  side: { flex: 1 },
  main: { flex: 2 },
});
