import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { defaultCourse } from '@/content';
import { dayKey, now } from '@/lib/clock';
import { LessonPlayer } from '@/lessons/player/LessonPlayer';
import type { Summary } from '@/lessons/session';
import { useLastResult } from '@/progress/lastResult';
import { resolvePlayable, usesShortcuts, type Resolved } from '@/progress/playable';
import { dataOf, useHydrated, useProgress } from '@/progress/store';
import { streakToday } from '@/progress/streak';
import { forComputer, type Computer } from '@/spreadsheet/shortcuts';
import { radius, space, type as typography, useTheme } from '@/theme';
import { ScreenSky } from '@/world/ui/ScreenSky';
import { useLessonNav } from '@/world/transition/nav';

export default function LessonScreen() {
  const c = useTheme();
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  // Saved progress has to be read before the lesson opens, or it would start from step one.
  const hydrated = useHydrated();

  if (!hydrated) return <View style={[styles.waiting, { backgroundColor: c.bg }]} />;
  return <Opened id={String(lessonId)} onGone={() => router.replace('/')} />;
}

/** Works out what the link stands for, once, and opens it. */
function Opened({ id, onGone }: { id: string; onGone: () => void }) {
  const c = useTheme();
  // Read once as it opens: after that the player is what writes progress.
  const [found] = useState<Resolved | null>(() => resolvePlayable(defaultCourse, id, dataOf(useProgress.getState()), dayKey()));
  const computer = useProgress((s) => s.profile.computer);

  if (!found) {
    return (
      <View style={[styles.missing, { backgroundColor: c.bg }]}>
        <Text style={[typography.heading, { color: c.ink }]}>There is nothing to open here.</Text>
        <Button label="Back to start" onPress={onGone} />
      </View>
    );
  }
  // Ctrl or Cmd is only asked about when it first matters: a lesson with a shortcut in it.
  if (computer === null && usesShortcuts(found.playable)) return <WhichComputer />;
  return <Play found={found} computer={computer ?? 'win'} />;
}

function WhichComputer() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const setComputer = useProgress((s) => s.setComputer);
  const options: { computer: Computer; title: string; detail: string }[] = [
    { computer: 'win', title: 'Windows', detail: 'Shortcuts use the Ctrl key' },
    { computer: 'mac', title: 'Mac', detail: 'Shortcuts use the Cmd key' },
  ];
  return (
    <View style={[styles.asking, { backgroundColor: c.bg, paddingTop: insets.top + space.xxl }]}>
      <ScreenSky />
      <View style={styles.column}>
        <View style={styles.hero}>
          <Mascot expression="thinking" size={72} />
          <Text style={[typography.title, styles.centre, { color: c.ink }]}>Which computer do you use?</Text>
          <Text style={[typography.body, styles.centre, { color: c.inkSoft }]}>
            This lesson has keyboard shortcuts, and the keys are named differently on each.
          </Text>
        </View>
        {options.map((option) => (
          <Pressable
            key={option.computer}
            testID={`computer-${option.computer}`}
            accessibilityRole="button"
            accessibilityLabel={`${option.title}. ${option.detail}`}
            onPress={() => setComputer(option.computer)}
            style={({ pressed }) => [
              styles.answer,
              { backgroundColor: c.surface, borderColor: c.outline, borderBottomWidth: pressed ? 1 : 4, marginTop: pressed ? 3 : 0 },
            ]}
          >
            <Text style={[typography.heading, { color: c.ink }]}>{option.title}</Text>
            <Text style={[typography.small, { color: c.inkSoft }]}>{option.detail}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** The lesson itself, opened where it was left if it was left part-way through. */
function Play({ found, computer }: { found: Resolved; computer: Computer }) {
  const router = useRouter();
  const saveRun = useProgress((s) => s.saveRun);
  const finish = useProgress((s) => s.finish);
  const setResult = useLastResult((s) => s.set);
  const sheetSide = useProgress((s) => s.profile.sheetSide);
  const setSheetSide = useProgress((s) => s.setSheetSide);
  const { playable } = found;
  const [resume] = useState(() => useProgress.getState().runs[playable.id] ?? null);

  const onFinish = useCallback(
    (summary: Summary) => {
      const today = dayKey();
      const result = finish(defaultCourse, { id: playable.id, summary, now: now(), today });
      const say = (text: string) => forComputer(text, computer);
      setResult({
        id: playable.id,
        kind: found.kind,
        title: found.title,
        summary,
        xp: result.xp,
        streak: streakToday(result.data.streak, today),
        toPractise: result.toPractise,
        passedTest: result.passedTest,
        newBadges: result.newBadges,
        recap: found.kind === 'lesson' ? (found.lesson?.recap ?? []) : [],
        review: summary.missed.flatMap((id) => {
          const exercise = playable.exercises.find((e) => e.id === id);
          return exercise ? [{ id, prompt: say(exercise.prompt), explain: say(exercise.explain) }] : [];
        }),
      });
      router.replace('/lesson/complete');
    },
    [router, playable, found.kind, found.title, found.lesson, computer, finish, setResult],
  );

  const { backToWorld } = useLessonNav();
  // Leaving runs the lesson transition backwards, out to the world.
  const onQuit = useCallback(() => backToWorld(), [backToWorld]);

  return (
    <LessonPlayer
      lesson={playable}
      computer={computer}
      resume={resume}
      onSave={saveRun}
      onFinish={onFinish}
      onQuit={onQuit}
      sheetSide={sheetSide}
      onSheetSide={setSheetSide}
    />
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, padding: space.xl },
  waiting: { flex: 1 },
  asking: { flex: 1, alignItems: 'center' },
  column: { width: '100%', maxWidth: 480, paddingHorizontal: space.lg, gap: space.lg },
  hero: { alignItems: 'center', gap: space.md, marginBottom: space.md },
  centre: { textAlign: 'center' },
  answer: { borderWidth: 1, borderRadius: radius.lg, paddingVertical: space.lg, paddingHorizontal: space.lg, gap: 2, userSelect: 'none' },
});
