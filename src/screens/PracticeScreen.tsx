import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Panel, SectionLabel } from '@/components/Panel';
import { Mascot } from '@/components/Mascot';
import { defaultCourse, skillName } from '@/content';
import { gameStatuses } from '@/game/catalogue';
import { GRID_LEVELS } from '@/game/gridMaster';
import { dayKey } from '@/lib/clock';
import { REVIEW_ID } from '@/progress/finish';
import { reviewSession } from '@/progress/playable';
import { dueSkills } from '@/progress/srs';
import { dataOf, useHydrated, useProgress } from '@/progress/store';
import { mono, space, type as typography, useTheme } from '@/theme';
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
        <Text style={[typography.small, { color: c.inkSoft }]}>Quick games on what you have learned. Each opens with the lesson that teaches it.</Text>

        <SectionLabel>Core games</SectionLabel>
        {/* The games. They are always here, whatever else there is to practise. */}
        <View style={styles.games}>
          {games.map(({ entry, open, opensAfter, plays, bestStars }) => {
            const progress = !open ? (opensAfter ?? 'Not open yet') : plays > 0 ? `${'★'.repeat(bestStars)}${'☆'.repeat(3 - bestStars)}  played ${plays}×` : 'Not played yet';
            return (
              <Panel
                key={entry.id}
                testID={`open-${entry.id}`}
                accessibilityLabel={`${entry.title}, a game. ${entry.about}. ${progress}.`}
                disabled={!open}
                dashed={!open}
                onPress={() => router.push(entry.path)}
                style={[styles.game, !open && styles.closed]}
              >
                <View style={styles.gameHead}>
                  <View style={[styles.emblem, { borderColor: open ? c.accent : c.line, backgroundColor: open ? c.accentSoft : c.sunken }]}>
                    <Text style={[styles.emblemText, { color: open ? c.accent : c.inkFaint, fontFamily: mono }]}>{EMBLEMS[entry.id] ?? '·'}</Text>
                  </View>
                  <Text style={[typography.bodyStrong, styles.gameTitle, { color: c.ink }]} numberOfLines={2}>
                    {entry.title}
                  </Text>
                </View>
                <Text style={[typography.small, styles.about, { color: c.inkSoft }]} numberOfLines={2}>
                  {entry.about}
                </Text>
                <Text style={[styles.progress, { color: open ? c.spark : c.inkFaint }]} numberOfLines={2}>
                  {progress}
                </Text>
              </Panel>
            );
          })}
        </View>

        {/* The Advanced Arcade: larger arcade games, locked while they are developed further. */}
        <SectionLabel>Advanced Arcade</SectionLabel>
        <Panel
          testID="advanced-arcade"
          dashed
          accessibilityLabel={`Advanced Arcade, locked. Grid Master, ${arcadeDone} of ${GRID_LEVELS.length} levels done, is being developed further.`}
          style={styles.arcade}
        >
          <Text style={[typography.bodyStrong, { color: c.ink }]}>Grid Master and more · locked</Text>
          <Text style={[typography.small, { color: c.inkSoft }]}>
            Arcade challenges built on your spreadsheet skills. Being developed further; the core games come first.
          </Text>
        </Panel>

        <SectionLabel>Practice</SectionLabel>
        {session || inProgress ? (
          <>
            <Text style={[typography.body, { color: c.inkSoft }]}>
              A short round on the skills that need it most. Different numbers from the lessons.
            </Text>
            <View style={styles.list}>
              {due.map((skill) => {
                const weak = data.skills[skill].weak;
                return (
                  <Panel key={skill} testID={`due-${skill}`} style={styles.row}>
                    <View style={[styles.pip, { backgroundColor: weak ? c.spark : c.accent }]} />
                    <View style={styles.words}>
                      <Text style={[typography.bodyStrong, { color: c.ink }]}>{skillName(skill)}</Text>
                      <Text style={[typography.small, { color: c.inkSoft }]}>{weak ? 'Missed last time' : 'Due for another look'}</Text>
                    </View>
                  </Panel>
                );
              })}
            </View>
            <Button testID="start-practice" label={inProgress ? 'Continue' : 'Start practice'} onPress={start} />
          </>
        ) : (
          <Panel style={styles.empty}>
            <Mascot expression="happy" size={56} />
            <Text style={[typography.heading, styles.centre, { color: c.ink }]}>Nothing to practise right now</Text>
            <Text style={[typography.body, styles.centre, { color: c.inkSoft }]}>
              Skills you miss in a lesson turn up here, and so do ones that are due for another look. Nothing is repeated for the sake of it.
            </Text>
          </Panel>
        )}
      </ScrollView>
    </View>
  );
}

/** A small mark for each game, set in the code face: a sign of what it practises. */
const EMBLEMS: Record<string, string> = { match: '⇄', hunt: 'C4', trial: '⌘', errors: '!', builder: 'fx', predict: '=?' };

const styles = StyleSheet.create({
  arcade: { padding: space.md, gap: 2, opacity: 0.85 },
  screen: { flex: 1, alignItems: 'center' },
  scrollAll: { flex: 1, width: '100%', maxWidth: 520 },
  column: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.md },
  list: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  games: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  game: { flexGrow: 1, flexBasis: '45%', minHeight: 118, paddingHorizontal: space.md, paddingVertical: space.md, gap: 4 },
  closed: { opacity: 0.72 },
  gameHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  gameTitle: { flex: 1, lineHeight: 19 },
  emblem: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emblemText: { fontSize: 13, fontWeight: '800' },
  about: { fontSize: 13, lineHeight: 17 },
  progress: { marginTop: 'auto', paddingTop: 4, fontSize: 12.5, fontWeight: '700' },
  pip: { width: 10, height: 10, borderRadius: 5 },
  words: { flex: 1, gap: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.lg },
  centre: { textAlign: 'center' },
});
