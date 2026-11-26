import { Pressable, StyleSheet, Text, View } from 'react-native';

import { STAGE_INFO } from '@/progress/path';

import type { RootPick } from './RootMap';
import { display, GlassPanel, GOLD, GoldButton, GoldLink, tagStyle } from './ui/Gold';

interface Props {
  pick: RootPick;
  /** Opens the lesson (or its practice round, or the unit test) that was picked. */
  onOpen: () => void;
  onRestart: (lessonId: string) => void;
  onClose: () => void;
  bottom: number;
}

/**
 * What a tap on the roots opens: everything the old Learn list said about a lesson (where it
 * stands, its best score) and the same actions (start, continue, practice round, start
 * again, or the unit test that skips the unit).
 */
export function LessonCard({ pick, onOpen, onRestart, onClose, bottom }: Props) {
  const { unit } = pick;
  const place = unit.unit.intro ? 'START HERE' : unit.unit.optional ? 'SIDE ROOT' : `UNIT ${unit.number}`;
  const tag = `${STAGE_INFO[unit.unit.stage].name.toUpperCase()} · ${place}`;

  let title: string;
  let body: string;
  let action: { label: string; testID: string; disabled?: boolean };
  let restart: string | null = null;

  if (pick.kind === 'test') {
    title = `Know “${unit.unit.title}” already?`;
    body = 'Pass the unit test and every lesson in this root counts as done.';
    action = { label: 'Take the test', testID: 'card-test' };
  } else {
    const item = pick.node;
    title = item.lesson.title;
    if (item.state === 'practice') body = 'A short practice round on the tricky bits comes first.';
    else if (item.inProgress) body = 'Carry on where you left off.';
    else if (item.state === 'done' && item.record) body = `Best: ${item.record.bestFirstTry} of ${item.record.scored} right first time.`;
    else if (item.state === 'done') body = 'Skipped, as you already know it. Open it any time.';
    else if (item.state === 'locked') body = 'Grow the roots before this one to reach it.';
    else body = item.lesson.summary;

    let label = 'Start';
    if (item.state === 'practice') label = 'Practise the tricky bits';
    else if (item.inProgress) label = 'Continue';
    else if (item.state === 'done') label = 'Do it again';
    else if (item.state === 'locked') label = 'Not open yet';
    action = { label, testID: 'start-lesson', disabled: item.state === 'locked' };
    if (item.inProgress && item.state !== 'practice') restart = item.lesson.id;
  }

  return (
    <GlassPanel glow style={[styles.card, { bottom }]} testID="lesson-card">
      <View style={styles.head}>
        <View style={styles.words}>
          <Text style={[styles.tag, tagStyle]}>{tag}</Text>
          <Text style={[styles.title, display]} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
      <Text style={styles.body}>{body}</Text>
      <GoldButton testID={action.testID} label={action.label} disabled={action.disabled} onPress={onOpen} arrow={!action.disabled} />
      {restart ? <GoldLink testID="start-again" tone="dark" label="Start this lesson again" onPress={() => onRestart(restart!)} /> : null}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignSelf: 'center',
    maxWidth: 460,
    marginHorizontal: 'auto',
    backgroundColor: 'rgba(30, 18, 6, 0.8)',
    borderRadius: 22,
    padding: 16,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  words: { flex: 1, gap: 2 },
  tag: { color: GOLD.tag },
  title: { color: GOLD.onDark, fontSize: 22, lineHeight: 27 },
  body: { color: GOLD.onDarkSoft, fontSize: 15, lineHeight: 21 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GOLD.edge, backgroundColor: 'rgba(255,230,160,0.12)' },
  closeText: { color: GOLD.onDark, fontSize: 14, fontWeight: '800' },
});
