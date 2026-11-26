import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { defaultCourse } from '@/content';
import type { Level } from '@/progress/saved';
import { useProgress } from '@/progress/store';
import { radius, space, type as typography, useTheme } from '@/theme';
import { ScreenSky } from '@/world/ui/ScreenSky';

const intro = defaultCourse.units.find((unit) => unit.intro);
const firstReal = defaultCourse.units.find((unit) => !unit.intro && !unit.optional);

/** How every lesson goes: the three steps, in the order they come. */
const STEPS: { name: string; lead: string; rest: string }[] = [
  { name: '1', lead: 'Teach.', rest: ' Watch a short step, shown on a real sheet.' },
  { name: '2', lead: 'Lesson.', rest: ' Practise it yourself, straight away.' },
  { name: '3', lead: 'Apply.', rest: ' Use it on a practical, real-life task.' },
];

const ANSWERS: { level: Level; title: string; detail: string; opens: string | undefined }[] = [
  { level: 'new', title: 'Never', detail: 'Start with what a cell is', opens: intro?.lessons[0]?.id },
  { level: 'some', title: 'A little', detail: 'Go straight to formulas', opens: firstReal?.lessons[0]?.id },
  { level: 'test', title: 'Quite a lot: test me', detail: 'Eight questions, and skip what you know', opens: firstReal?.checkpoint?.id },
];

/**
 * The first screens. First what the app is and how its lessons work, with a tour of it
 * that can be taken or skipped. Then the one question the app asks before it starts;
 * each answer goes straight into a lesson, with no sign-up and no settings.
 */
export default function WelcomeScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setLevel = useProgress((s) => s.setLevel);
  const tourSeen = useProgress((s) => s.profile.tourSeen);
  const setTourSeen = useProgress((s) => s.setTourSeen);

  const choose = (answer: (typeof ANSWERS)[number]) => {
    setLevel(answer.level);
    // Home goes underneath, so leaving the lesson lands there and not back on this question.
    router.replace('/');
    if (answer.opens) router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: answer.opens } });
  };

  const steps = (
    <View style={[styles.steps, { backgroundColor: c.surface, borderColor: c.line }]} testID="how-it-works">
      {STEPS.map((step) => (
        <View key={step.lead} style={styles.step}>
          <View style={[styles.number, { backgroundColor: c.accentSoft }]}>
            <Text style={[styles.numberText, { color: c.accent }]}>{step.name}</Text>
          </View>
          <Text style={[typography.small, styles.words, { color: c.inkSoft }]}>
            <Text style={{ color: c.ink, fontWeight: '700' }}>{step.lead}</Text>
            {step.rest}
          </Text>
        </View>
      ))}
    </View>
  );

  if (!tourSeen) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <ScreenSky />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.column, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.lg }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Mascot expression="happy" size={72} />
            <Text style={[typography.title, styles.centre, { color: c.ink }]}>Welcome to Gridwise</Text>
            <Text style={[typography.body, styles.centre, { color: c.inkSoft }]}>
              Gridwise teaches you spreadsheets in short lessons. You do every step yourself, in a real working sheet.
            </Text>
          </View>
          <Text style={[typography.label, { color: c.inkSoft }]}>HOW THE LEARNING WORKS</Text>
          {steps}
          <View style={styles.answers}>
            <Button testID="tour-start" label="Show me around" onPress={() => router.push('/tour')} />
            <Button testID="tour-skip" kind="quiet" label="Skip the tour" onPress={setTourSeen} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScreenSky />
      {/* It fits a small phone without scrolling; scrolling is only the safety net for a browser's bars. */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.column, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Mascot expression="happy" size={56} />
          <Text style={[typography.title, styles.centre, { color: c.ink }]}>One question first</Text>
        </View>

        <Text style={[typography.heading, styles.centre, { color: c.ink }]}>Have you used a spreadsheet before?</Text>
        <View style={styles.answers}>
          {ANSWERS.map((answer) => (
            <Pressable
              key={answer.level}
              testID={`level-${answer.level}`}
              accessibilityRole="button"
              accessibilityLabel={`${answer.title}. ${answer.detail}`}
              onPress={() => choose(answer)}
              style={({ pressed }) => [
                styles.answer,
                { backgroundColor: c.surface, borderColor: c.outline, borderBottomWidth: pressed ? 1 : 4, marginTop: pressed ? 3 : 0 },
              ]}
            >
              <Text style={[typography.heading, { color: c.ink }]}>{answer.title}</Text>
              <Text style={[typography.small, { color: c.inkSoft }]}>{answer.detail}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  scroll: { flex: 1, width: '100%' },
  column: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: space.lg, gap: space.lg },
  hero: { alignItems: 'center', gap: space.sm },
  centre: { textAlign: 'center' },
  steps: { borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  number: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 13, fontWeight: '800' },
  words: { flex: 1 },
  answers: { gap: space.md },
  answer: { borderWidth: 1, borderRadius: radius.lg, paddingVertical: space.md, paddingHorizontal: space.lg, gap: 2, userSelect: 'none' },
});
