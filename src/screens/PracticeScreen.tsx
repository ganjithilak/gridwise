import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { defaultCourse, skillName } from '@/content';
import { GRID_LEVELS } from '@/game/gridMaster';
import { GAME_LEVELS } from '@/game/speedTrial';
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

  // How far each game has got: the number of levels finished, out of how many.
  // Core educational games. Grid Master now lives in the locked Advanced Arcade below
  // (its code and route are kept; see docs/games.md).
  const reached = (ids: string[]) => ids.filter((id) => data.game.levels[id] !== undefined).length;
  const arcadeDone = reached(GRID_LEVELS.map((level) => level.id));
  const games = [
    {
      id: 'open-speed-trial',
      title: 'Speed Trial',
      about: 'Press the shortcut, against the clock',
      done: reached(GAME_LEVELS.map((level) => level.id)),
      levels: GAME_LEVELS.length,
      path: '/speed-trial' as const,
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top + space.md }]}>
      <ScreenSky />
      <View style={styles.column}>
        <Text style={[typography.title, { color: c.ink }]}>Practice</Text>

        {/* The games. They are always here, whatever else there is to practise. */}
        <View style={styles.games}>
          {games.map((g) => {
            const progress = g.done > 0 ? `${g.done} of ${g.levels} levels done` : 'Not played yet';
            return (
              <Pressable
                key={g.id}
                testID={g.id}
                accessibilityRole="button"
                accessibilityLabel={`${g.title}, a game. ${g.about}. ${progress}.`}
                onPress={() => router.push(g.path)}
                style={({ pressed }) => [
                  styles.game,
                  { backgroundColor: c.accentSoft, borderColor: c.accent, borderBottomWidth: pressed ? 1 : 4, marginTop: pressed ? 3 : 0 },
                ]}
              >
                <Text style={[typography.label, { color: c.accent }]}>GAME</Text>
                <Text style={[typography.heading, { color: c.ink }]}>{g.title}</Text>
                <Text style={[typography.small, { color: c.inkSoft }]} numberOfLines={2}>
                  {g.about}
                </Text>
                <Text style={[typography.small, styles.progress, { color: c.accent }]}>{progress}</Text>
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
            <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
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
            </ScrollView>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  arcade: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, padding: space.md, gap: 2, opacity: 0.85 },
  screen: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 480, paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.md },
  scroll: { flex: 1 },
  list: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderRadius: radius.md, padding: space.md },
  games: { flexDirection: 'row', gap: space.sm },
  game: { flex: 1, borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: 2, userSelect: 'none' },
  progress: { marginTop: 'auto', paddingTop: 4, fontWeight: '700' },
  pip: { width: 10, height: 10, borderRadius: 5 },
  words: { flex: 1, gap: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: space.md },
  centre: { textAlign: 'center' },
});
