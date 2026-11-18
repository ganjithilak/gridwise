import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { LevelBar } from '@/components/LevelBar';
import { Plant } from '@/components/Plant';
import { StatsRow } from '@/components/StatsRow';
import { defaultCourse } from '@/content';
import { dayKey } from '@/lib/clock';
import { practiceIdFor } from '@/progress/mastery';
import { buildPath, grownTo, nextUp, STAGE_INFO, stagesOf, type LessonNode, type StageNode, type UnitNode } from '@/progress/path';
import { dataOf, useHydrated, useProgress } from '@/progress/store';
import { streakAtRisk, streakToday } from '@/progress/streak';
import { radius, space, type as typography, useTheme } from '@/theme';

/** Learn: the path through the course, and one button that goes to whatever is next. */
export default function LearnScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hydrated = useHydrated();
  const store = useProgress();
  const data = dataOf(store);
  const today = dayKey();

  // Saved progress is read in the first moment after launch; nothing is decided before then.
  if (!hydrated) return <View style={[styles.screen, { backgroundColor: c.bg }]} />;
  // First launch: one question, then straight into a lesson.
  if (data.profile.level === null) return <Redirect href="/welcome" />;

  const path = buildPath(defaultCourse, data);
  const stages = stagesOf(path);
  const next = nextUp(path);
  const open = (id: string) => router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: id } });
  const openLesson = (node: LessonNode) => open(node.state === 'practice' ? practiceIdFor(node.lesson.id) : node.lesson.id);

  let mainLabel = 'Start';
  if (next?.state === 'practice') mainLabel = 'Practise the tricky bits';
  else if (next?.inProgress) mainLabel = 'Continue';

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top + space.md }]}>
      <View style={styles.column}>
        <LevelBar name={data.profile.name} xp={data.xp} />
        <StatsRow
          streak={streakToday(data.streak, today)}
          atRisk={streakAtRisk(data.streak, today)}
          xp={data.xp}
          todayXp={data.days[today] ?? 0}
          goal={data.profile.dailyGoal}
        />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.path} showsVerticalScrollIndicator={false}>
          <Growth stages={stages} />
          {path.map((node) => (
            <UnitBlock key={node.unit.id} node={node} nextId={next?.lesson.id ?? null} onLesson={openLesson} onTest={open} />
          ))}
        </ScrollView>

        {next ? (
          <View style={styles.foot}>
            <Text numberOfLines={1} style={[typography.small, styles.centre, { color: c.inkSoft }]}>
              Next: {next.lesson.title}
            </Text>
            <Button testID="start-lesson" label={mainLabel} onPress={() => openLesson(next)} />
            {next.inProgress && next.state !== 'practice' ? (
              <Button
                testID="start-again"
                kind="quiet"
                label="Start this lesson again"
                onPress={() => {
                  store.clearRun(next.lesson.id);
                  openLesson(next);
                }}
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.foot}>
            <Text style={[typography.small, styles.centre, { color: c.inkSoft }]}>
              You have finished every lesson. Practice keeps it fresh.
            </Text>
            <Button testID="go-practice" label="Go to Practice" onPress={() => router.replace('/practice')} />
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Roots to fruits: the whole course as one plant, grown as far as the learner has got.
 * Strong roots first, then the trunk, then branches, and fruit at the end.
 */
function Growth({ stages }: { stages: StageNode[] }) {
  const c = useTheme();
  const current = stages.find((s) => s.current);
  const allDone = stages.every((s) => s.done);
  return (
    <View style={[styles.growth, { backgroundColor: c.surface, borderColor: c.line }]} testID="growth">
      <Plant grown={grownTo(stages)} ripe={allDone} size={58} />
      <View style={styles.growthWords}>
        <Text style={[typography.label, { color: c.inkSoft }]}>ROOTS TO FRUITS</Text>
        <View style={styles.stages}>
          {stages.map((s) => (
            <View
              key={s.stage}
              testID={`stage-${s.stage}`}
              accessibilityLabel={`${STAGE_INFO[s.stage].name}: ${s.done ? 'done' : s.current ? 'growing now' : 'still to come'}`}
              style={[
                styles.stage,
                { backgroundColor: s.done ? c.accent : s.current ? c.accentSoft : 'transparent', borderColor: s.done || s.current ? c.accent : c.outline },
              ]}
            >
              <Text style={[styles.stageText, { color: s.done ? c.onAccent : s.current ? c.accent : c.inkSoft }]}>{STAGE_INFO[s.stage].name}</Text>
            </View>
          ))}
        </View>
        <Text style={[typography.small, { color: c.inkSoft }]} numberOfLines={2}>
          {allDone ? 'Your plant is in fruit. Practice keeps it that way.' : current ? STAGE_INFO[current.stage].about : ''}
        </Text>
      </View>
    </View>
  );
}

interface UnitBlockProps {
  node: UnitNode;
  nextId: string | null;
  onLesson: (lesson: LessonNode) => void;
  onTest: (checkpointId: string) => void;
}

/** One unit on the path: its heading, its lessons in order, and the test that can skip it. */
function UnitBlock({ node, nextId, onLesson, onTest }: UnitBlockProps) {
  const c = useTheme();
  const { unit } = node;
  const place = unit.intro ? 'START HERE' : unit.optional ? 'SIDE UNIT' : `UNIT ${node.number}`;
  const tag = `${STAGE_INFO[unit.stage].name.toUpperCase()} · ${place}`;

  return (
    <View style={[styles.unit, { backgroundColor: c.surface, borderColor: c.line }]} testID={`unit-${unit.id}`}>
      <View style={styles.unitHead}>
        <View style={styles.unitWords}>
          <Text style={[typography.label, { color: c.accent }]}>
            {tag}
            {node.complete ? ' · DONE' : ''}
          </Text>
          <Text style={[typography.heading, { color: c.ink }]}>{unit.title}</Text>
          <Text style={[typography.small, { color: c.inkSoft }]}>
            {node.skipped && unit.intro ? 'Skipped, as you have used a spreadsheet before. Open any lesson to try it.' : unit.summary}
          </Text>
        </View>
        {/* Which part of the plant this unit is. */}
        <Plant only={unit.stage} size={38} />
      </View>

      {node.lessons.map((item, i) => {
        const locked = item.state === 'locked';
        const isNext = item.lesson.id === nextId;
        const done = item.state === 'done';
        let status: string;
        if (item.state === 'practice') status = 'A short practice round first';
        else if (item.inProgress) status = 'Carry on where you left off';
        else if (done && item.record) status = `Best: ${item.record.bestFirstTry} of ${item.record.scored} first try`;
        else if (done) status = 'Skipped';
        else if (locked) status = 'Finish the one before to open this';
        else status = item.lesson.summary;
        return (
          <Pressable
            key={item.lesson.id}
            testID={`lesson-${item.lesson.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${item.lesson.title}. ${status}`}
            accessibilityState={{ disabled: locked }}
            disabled={locked}
            onPress={() => onLesson(item)}
            style={[styles.lesson, { opacity: locked ? 0.45 : 1 }]}
          >
            <View style={styles.rail}>
              <View style={[styles.line, { backgroundColor: i === 0 ? 'transparent' : c.line }]} />
              <View
                style={[
                  styles.node,
                  {
                    borderColor: done || isNext ? c.accent : item.state === 'practice' ? c.spark : c.outline,
                    backgroundColor: done ? c.accent : isNext ? c.accentSoft : item.state === 'practice' ? c.sparkSoft : c.surface,
                  },
                ]}
              >
                {done ? <View style={[styles.tick, { borderColor: c.onAccent }]} /> : null}
              </View>
              <View style={[styles.line, { backgroundColor: i === node.lessons.length - 1 ? 'transparent' : c.line }]} />
            </View>
            <View style={styles.lessonWords}>
              <Text style={[typography.bodyStrong, { color: c.ink }]} numberOfLines={1}>
                {item.lesson.title}
              </Text>
              <Text style={[typography.small, { color: item.state === 'practice' ? c.hint : c.inkSoft }]} numberOfLines={2}>
                {status}
              </Text>
            </View>
          </Pressable>
        );
      })}

      {node.testOut ? (
        <Pressable
          testID={`test-${node.testOut.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Know this already? Take the test to skip ${unit.title}.`}
          onPress={() => onTest(node.testOut!.id)}
          style={[styles.testOut, { borderColor: c.line }]}
        >
          <Text style={[typography.small, { color: c.accent, fontWeight: '700' }]}>Know this already? Take the test to skip ahead</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 480, paddingHorizontal: space.lg, gap: space.md },
  growth: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderRadius: radius.lg, padding: space.md },
  growthWords: { flex: 1, gap: 6 },
  stages: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  stage: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  stageText: { fontSize: 12, fontWeight: '700' },
  scroll: { flex: 1 },
  path: { gap: space.md, paddingBottom: space.md },
  centre: { textAlign: 'center' },
  foot: { gap: 6, paddingBottom: space.sm },
  unit: { borderWidth: 1, borderRadius: radius.lg, paddingVertical: space.md, paddingHorizontal: space.md },
  unitHead: { flexDirection: 'row', gap: space.md, paddingBottom: space.sm },
  unitWords: { flex: 1, gap: 2 },
  lesson: { flexDirection: 'row', alignItems: 'stretch', gap: space.md, minHeight: 56 },
  rail: { width: 26, alignItems: 'center' },
  line: { flex: 1, width: 2 },
  node: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 10, height: 6, borderLeftWidth: 2.5, borderBottomWidth: 2.5, transform: [{ rotate: '-45deg' }], marginTop: -2 },
  lessonWords: { flex: 1, justifyContent: 'center', paddingVertical: 6, gap: 1 },
  testOut: { marginTop: space.sm, paddingTop: space.md, paddingBottom: 2, borderTopWidth: 1, minHeight: 44, justifyContent: 'center' },
});
