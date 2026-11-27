import { Redirect, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Confetti } from '@/components/Confetti';
import { Mascot } from '@/components/Mascot';
import { Panel, SectionLabel } from '@/components/Panel';
import { defaultCourse, skillName } from '@/content';
import { LIMITS } from '@/lessons/types';
import { useLastResult } from '@/progress/lastResult';
import { lessonIdOf, practiceIdFor } from '@/progress/mastery';
import { buildPath, nextUp, STREAK_BADGES, streakBadge, unitBadge } from '@/progress/path';
import { dataOf, useProgress } from '@/progress/store';
import { radius, space, type as typography, useTheme } from '@/theme';
import { ScreenSky } from '@/world/ui/ScreenSky';
import { useLessonNav } from '@/world/transition/nav';

const clock = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

function badgeName(id: string): string {
  const unit = defaultCourse.units.find((u) => unitBadge(u.id) === id);
  if (unit) return `Unit finished: ${unit.title}`;
  const days = STREAK_BADGES.find((d) => streakBadge(d) === id);
  return days ? `${days} days in a row` : id;
}

/**
 * How it went, what the lesson taught, anything worth another look, and the one thing to
 * do next. If too much was missed, that one thing is a short practice round on exactly
 * those skills, before the next lesson opens.
 */
export default function LessonCompleteScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { backToWorld } = useLessonNav();
  const result = useLastResult((s) => s.result);
  const store = useProgress();

  // Opened directly, or after a reload: everything was saved already, so just go home.
  if (!result) return <Redirect href="/" />;

  const { summary, kind } = result;
  const flawless = summary.scored > 0 && summary.firstTry === summary.scored;
  const needsPractice = kind === 'lesson' && result.toPractise.length > 0;
  const next = nextUp(buildPath(defaultCourse, dataOf(store)));
  const open = (id: string) => router.replace({ pathname: '/lesson/[lessonId]', params: { lessonId: id } });

  let title: string;
  let line: string;
  let mood: 'cheering' | 'happy' | 'thinking' = 'cheering';
  if (kind === 'test') {
    title = result.passedTest ? 'Passed!' : 'Not this time';
    line = result.passedTest
      ? 'You know this unit. It is marked as done.'
      : `You need ${LIMITS.checkpointPassMark} of ${summary.scored} right first time to skip the unit. The lessons will get you there.`;
    mood = result.passedTest ? 'cheering' : 'thinking';
  } else if (kind === 'practice') {
    title = 'Practice done!';
    line = 'That is what the next lesson builds on. It is open now.';
  } else if (kind === 'review') {
    title = 'Practice done!';
    line = 'Those skills are fresh again.';
  } else if (needsPractice) {
    title = 'Lesson done';
    line = 'A few of those were tricky. A short practice round will make them stick.';
    mood = 'happy';
  } else {
    title = flawless ? 'Flawless!' : 'Lesson done!';
    line = `You finished “${result.title}”.`;
  }

  const stats = [
    { label: 'First try', value: `${summary.firstTry} of ${summary.scored}` },
    { label: 'Time', value: clock(summary.seconds) },
    { label: 'In a row', value: `${result.streak} ${result.streak === 1 ? 'day' : 'days'}` },
    { label: 'XP', value: `+${result.xp}` },
  ];

  // One main button: whatever makes most sense next.
  let main: { label: string; onPress: () => void; testID: string };
  if (needsPractice) {
    main = { label: 'Practise now', onPress: () => open(practiceIdFor(lessonIdOf(result.id))), testID: 'practise-now' };
  } else if (next && kind !== 'review') {
    const label = next.state === 'practice' ? 'Practise now' : 'Next lesson';
    const id = next.state === 'practice' ? practiceIdFor(next.lesson.id) : next.lesson.id;
    main = { label, onPress: () => open(id), testID: 'next-lesson' };
  } else {
    main = { label: 'Done', onPress: () => backToWorld(), testID: 'done' };
  }
  const celebrate = !needsPractice && !(kind === 'test' && !result.passedTest);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }]}>
      <ScreenSky />
      <View style={styles.column}>
        {/* Everything to read scrolls; the button for what comes next stays put underneath. */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Mascot expression={mood} size={64} />
            <Text style={[typography.title, { color: c.ink }]} testID="complete-title">
              {title}
            </Text>
            <Text style={[typography.body, styles.centre, { color: c.inkSoft }]}>{line}</Text>
          </View>

          <View style={styles.stats}>
            {stats.map((stat) => (
              <Panel key={stat.label} style={styles.stat}>
                <Text style={[styles.statValue, { color: stat.label === 'XP' ? c.hint : c.ink }]}>{stat.value}</Text>
                <Text style={[typography.label, styles.centre, { color: c.inkSoft }]}>{stat.label.toUpperCase()}</Text>
              </Panel>
            ))}
          </View>

          {needsPractice ? (
            <View style={[styles.note, { backgroundColor: c.hintSoft }]} testID="to-practise">
              <Text style={[typography.small, { color: c.hint, fontWeight: '700' }]}>To practise</Text>
              <Text style={[typography.small, { color: c.ink }]}>{result.toPractise.map(skillName).join(', ')}</Text>
            </View>
          ) : null}

          {result.newBadges.length > 0 ? (
            <View style={[styles.note, { backgroundColor: c.sparkSoft }]} testID="new-badges">
              <Text style={[typography.small, { color: c.hint, fontWeight: '700' }]}>New badge</Text>
              <Text style={[typography.small, { color: c.ink }]}>{result.newBadges.map(badgeName).join(', ')}</Text>
            </View>
          ) : null}

          {result.recap.length > 0 ? (
            <Panel style={styles.card} testID="recap">
              <SectionLabel>What you learned</SectionLabel>
              {result.recap.map((point) => (
                <View key={point} style={styles.point}>
                  <View style={[styles.bullet, { backgroundColor: c.accent }]} />
                  <Text style={[typography.small, styles.words, { color: c.ink }]}>{point}</Text>
                </View>
              ))}
            </Panel>
          ) : null}

          {result.review.length > 0 ? (
            <Panel style={styles.card} testID="review">
              <SectionLabel>Worth another look</SectionLabel>
              {result.review.map((item) => (
                <View key={item.id} style={styles.item}>
                  <Text style={[typography.small, { color: c.inkSoft }]}>{item.prompt}</Text>
                  <Text style={[typography.small, { color: c.ink, fontWeight: '600' }]}>{item.explain}</Text>
                </View>
              ))}
            </Panel>
          ) : null}
        </ScrollView>

        <Button testID={main.testID} label={main.label} onPress={main.onPress} />
        {main.testID !== 'done' ? <Button testID="done" kind="quiet" label="Back to the start screen" onPress={() => backToWorld()} /> : null}
      </View>
      {celebrate ? <Confetti /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 480, paddingHorizontal: space.lg, gap: space.md },
  scroll: { flex: 1 },
  // Kept compact so that on a small phone the top of the next card shows: a cue that there is more to scroll to.
  content: { gap: space.md, paddingBottom: space.sm },
  hero: { alignItems: 'center', gap: space.xs },
  centre: { textAlign: 'center' },
  // One row of four, so there is room underneath for what was learned.
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, paddingVertical: space.sm, paddingHorizontal: 2, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800' },
  note: { borderRadius: radius.md, padding: space.md, gap: 2 },
  card: { padding: space.md, gap: space.sm },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  words: { flex: 1 },
  item: { gap: 2 },
});
