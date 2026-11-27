import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { defaultCourse, skillName } from '@/content';
import { gameStatuses } from '@/game/catalogue';
import { GRID_LEVELS } from '@/game/gridMaster';
import { dayKey } from '@/lib/clock';
import { REVIEW_ID } from '@/progress/finish';
import { reviewSession } from '@/progress/playable';
import { dueSkills } from '@/progress/srs';
import { dataOf, useHydrated, useProgress } from '@/progress/store';
import { radius, space, type as typography, useTheme } from '@/theme';
import { ScreenSky } from '@/world/ui/ScreenSky';
import { useLessonNav } from '@/world/transition/nav';

/** Practice: only what was missed, and what is due to be looked at again. Never padding. */
export default function PracticeScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openLesson } = useLessonNav();
  const hydrated = useHydrated();
  const store = useProgress();
  const data = dataOf(store);
  const today = dayKey();

  if (!hydrated) return <View style={[styles.screen, { backgroundColor: c.bg }]} />;

  const due = dueSkills(data.skills, today);
  const session = reviewSession(defaultCourse, data, today);
  const inProgress = data.runs[REVIEW_ID] !== undefined;
  const start = () => openLesson(REVIEW_ID);

  // The core games. Grid Master lives in the locked Advanced Arcade below (its code and
  // route are kept; see docs/development-plan.md, Stage 6).
  const arcadeDone = GRID_LEVELS.filter((level) => data.game.levels[level.id] !== undefined).length;
  const games = gameStatuses(defaultCourse, data);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top + space.md }]}>
      <ScreenSky />
      <ScrollView style={styles.scrollAll} contentContainerStyle={styles.column} showsVerticalScrollIndicator={false}>
        <Text style={[typography.title, { color: c.ink }]}>Games</Text>

        {/* The games. They are always here, whatever else there is to practise. */}
        <View style={styles.games}>
          {games.map(({ entry, open, opensAfter, plays, bestStars }) => {
            const progress = !open ? (opensAfter ?? 'Not open yet') : plays > 0 ? `${'★'.repeat(bestStars)}${'☆'.repeat(3 - bestStars)}  played ${plays}×` : 'Not played yet';
            return (
              <Pressable
                key={entry.id}
                testID={`open-${entry.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${entry.title}, a game. ${entry.about}. ${progress}.`}
                accessibilityState={{ disabled: !open }}
                disabled={!open}
                onPress={() => router.push(entry.path)}
                style={({ pressed }) => [
                  styles.game,
                  open
                    ? { backgroundColor: c.accentSoft, borderColor: c.accent, borderBottomWidth: pressed ? 1 : 4, marginTop: pressed ? 3 : 0 }
                    : { backgroundColor: c.surface, borderColor: c.line, borderStyle: 'dashed', opacity: 0.7 },
                ]}
              >
                <Text style={[typography.bodyStrong, { color: c.ink }]} numberOfLines={1}>
                  {entry.title}
                </Text>
                <Text style={[typography.small, styles.about, { color: c.inkSoft }]} numberOfLines={2}>
                  {entry.about}
                </Text>
                <Text style={[styles.progress, { color: open ? c.accent : c.inkSoft }]} numberOfLines={2}>
                  {progress}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* The Advanced Arcade: larger arcade games, locked while they are developed further. */}
        <View
          testID="advanced-arcade"
          accessible
          accessibilityLabel={`Advanced Arcade, locked. Grid Master, ${arcadeDone} of ${GRID_LEVELS.length} levels done, is being developed further.`}
          style={[styles.arcade, { borderColor: c.line, backgroundColor: c.surface }]}
        >
          <Text style={[typography.label, { color: c.inkSoft }]}>ADVANCED ARCADE · LOCKED</Text>
          <Text style={[typography.bodyStrong, { color: c.ink }]}>Grid Master and more</Text>
          <Text style={[typography.small, { color: c.inkSoft }]}>
            Arcade challenges built on your spreadsheet skills. Being developed further; the core games come first.
          </Text>
        </View>

        {session || inProgress ? (
          <>
            <Text style={[typography.body, { color: c.inkSoft }]}>
              A short round on the skills that need it most. Different numbers from the lessons.
            </Text>
            <Text style={[typography.label, { color: c.inkSoft }]}>PRACTICE</Text>
            <View style={styles.list}>
              {due.map((skill) => {
                const weak = data.skills[skill].weak;
                return (
                  <View key={skill} testID={`due-${skill}`} style={[styles.row, { backgroundColor: c.surface, borderColor: c.line }]}>
                    <View style={[styles.pip, { backgroundColor: weak ? c.spark : c.accent }]} />
                    <View style={styles.words}>
                      <Text style={[typography.bodyStrong, { color: c.ink }]}>{skillName(skill)}</Text>
                      <Text style={[typography.small, { color: c.inkSoft }]}>{weak ? 'Missed last time' : 'Due for another look'}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <Button testID="start-practice" label={inProgress ? 'Continue' : 'Start practice'} onPress={start} />
          </>
        ) : (
          <View style={styles.empty}>
            <Mascot expression="happy" size={72} />
            <Text style={[typography.heading, styles.centre, { color: c.ink }]}>Nothing to practise right now</Text>
            <Text style={[typography.body, styles.centre, { color: c.inkSoft }]}>
              Skills you miss in a lesson turn up here, and so do ones that are due for another look. Nothing is repeated for the sake of it.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  arcade: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, padding: space.md, gap: 2, opacity: 0.85 },
  screen: { flex: 1, alignItems: 'center' },
  scrollAll: { flex: 1, width: '100%', maxWidth: 520 },
  column: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.md },
  list: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderRadius: radius.md, padding: space.md },
  games: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  game: { flexGrow: 1, flexBasis: '45%', minHeight: 104, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: space.sm, gap: 2, userSelect: 'none' },
  about: { fontSize: 13, lineHeight: 17 },
  progress: { marginTop: 'auto', paddingTop: 4, fontSize: 12.5, fontWeight: '700' },
  pip: { width: 10, height: 10, borderRadius: 5 },
  words: { flex: 1, gap: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.md },
  centre: { textAlign: 'center' },
});
