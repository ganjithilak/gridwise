import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Panel, SectionLabel } from '@/components/Panel';
import { CELL_BLUE, CELL_COLOURS, Mascot } from '@/components/Mascot';
import { defaultCourse } from '@/content';
import { GRID_LEVELS } from '@/game/gridMaster';
import { GAMES } from '@/game/catalogue';
import { clockTime } from '@/game/records';
import { GAME_LEVELS } from '@/game/speedTrial';
import { dayKey, shiftClock } from '@/lib/clock';
import { levelFor } from '@/progress/level';
import { STREAK_BADGES, streakBadge, unitBadge } from '@/progress/path';
import { NAME_LENGTH, PROFILE_COLOURS } from '@/progress/saved';
import { dataOf, useHydrated, useProgress } from '@/progress/store';
import { streakToday } from '@/progress/streak';
import { radius, space, type as typography, useTheme } from '@/theme';
import { usePrefs } from '@/world/prefs';
import { ScreenSky } from '@/world/ui/ScreenSky';

/** Every badge there is, in the order they are usually earned. */
const BADGES: { id: string; name: string; how: string }[] = [
  ...defaultCourse.units.map((unit) => ({
    id: unitBadge(unit.id),
    name: unit.title,
    // Passing a unit's test earns its badge too (see badgesFor).
    how: unit.checkpoint ? `Finish every lesson in “${unit.title}”, or pass its test` : `Finish every lesson in “${unit.title}”`,
  })),
  ...STREAK_BADGES.map((days) => ({ id: streakBadge(days), name: `${days} days in a row`, how: `Learn something ${days} days running` })),
];

/** Profile: how it is going, the two settings there are, and a way to start over. */
export default function ProfileScreen() {
  const { theme, motion, setTheme, setMotion } = usePrefs();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const hydrated = useHydrated();
  const store = useProgress();
  const data = dataOf(store);
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  /** The name as it is being typed. It is kept when the box is left, so spaces can be typed on the way. */
  const [draft, setDraft] = useState(data.profile.name);
  const [draftFor, setDraftFor] = useState(data.profile.name);
  if (draftFor !== data.profile.name) {
    // The saved name changed under the box: read from the device, tidied on saving, or cleared by starting over.
    setDraftFor(data.profile.name);
    setDraft(data.profile.name);
  }
  /** Bumped when the test clock is moved, so the numbers on screen are worked out again. */
  const [, setClockMoves] = useState(0);
  const today = dayKey();

  if (!hydrated) return <View style={[styles.screen, { backgroundColor: c.bg }]} />;

  const lessonsDone = Object.keys(data.finished).length;
  const level = levelFor(data.xp);
  const finished = defaultCourse.units
    .flatMap((unit) => unit.lessons)
    .flatMap((lesson) => (data.finished[lesson.id] ? [{ lesson, record: data.finished[lesson.id] }] : []));
  const stats = [
    { label: 'XP', value: String(data.xp) },
    { label: 'Days in a row', value: String(streakToday(data.streak, today)) },
    { label: 'Best run of days', value: String(data.streak.best) },
    { label: 'Lessons done', value: String(lessonsDone) },
  ];
  const computer = data.profile.computer;

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top + space.md }]}>
      <ScreenSky />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.column} showsVerticalScrollIndicator={false}>
        <Text style={[typography.title, { color: c.ink }]}>Profile</Text>

        {/* Who they are in the app: a name, and the colour of their Cell. */}
        <Panel style={styles.card} testID="profile-card">
          <View style={styles.who}>
            <Mascot expression="happy" size={56} />
            <View style={styles.words}>
              <SectionLabel>Your name</SectionLabel>
              <TextInput
                testID="profile-name"
                accessibilityLabel="Your name"
                value={draft}
                onChangeText={setDraft}
                onBlur={() => store.setName(draft)}
                onSubmitEditing={() => store.setName(draft)}
                placeholder="What should we call you?"
                placeholderTextColor={c.inkFaint}
                maxLength={NAME_LENGTH}
                autoCorrect={false}
                returnKeyType="done"
                style={[styles.name, { color: c.ink, borderColor: c.outline, backgroundColor: c.bg }]}
              />
              <Text style={[typography.small, { color: c.inkSoft }]}>
                Level {level.level} · {level.into} of {level.needed} XP to the next
              </Text>
            </View>
          </View>
          <View style={styles.swatches} accessibilityRole="radiogroup" accessibilityLabel="The colour of Cell">
            {PROFILE_COLOURS.map((colour) => {
              const on = data.profile.colour === colour;
              const fill = (CELL_COLOURS[colour] ?? CELL_BLUE).body;
              return (
                <Pressable
                  key={colour}
                  testID={`colour-${colour}`}
                  accessibilityRole="radio"
                  accessibilityLabel={CELL_COLOURS[colour]?.name ?? 'Blue'}
                  accessibilityState={{ checked: on }}
                  aria-checked={on}
                  onPress={() => store.setColour(colour)}
                  style={[styles.swatch, { borderColor: on ? c.ink : 'transparent' }]}
                >
                  <View style={[styles.swatchFill, { backgroundColor: fill }]} />
                </Pressable>
              );
            })}
          </View>
        </Panel>

        <View style={styles.stats}>
          {stats.map((stat) => (
            <Panel key={stat.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: c.ink }]}>{stat.value}</Text>
              <Text style={[typography.label, { color: c.inkSoft }]}>{stat.label.toUpperCase()}</Text>
            </Panel>
          ))}
        </View>

        <SectionLabel>Lessons done</SectionLabel>
        <Panel style={styles.card} testID="lessons-done">
          {finished.length === 0 ? (
            <Text style={[typography.small, { color: c.inkSoft }]}>None yet. Each lesson you finish is listed here with your best score.</Text>
          ) : (
            finished.map(({ lesson, record }) => (
              <View key={lesson.id} style={styles.line} testID={`done-${lesson.id}`}>
                <Text style={[typography.body, styles.words, { color: c.ink }]} numberOfLines={1}>
                  {lesson.title}
                </Text>
                <Text style={[typography.small, { color: c.inkSoft }]}>
                  {record.bestFirstTry} of {record.scored} first try
                </Text>
              </View>
            ))
          )}
        </Panel>

        <SectionLabel>Game results</SectionLabel>
        <Panel style={styles.card} testID="game-results">
          {[
            ...GAMES.filter((g) => g.id !== 'trial').map((g) => ({ id: g.id, name: g.title })),
            ...GAME_LEVELS.map((gameLevel, i) => ({ id: gameLevel.id, name: `Speed Trial ${i + 1}: ${gameLevel.title}` })),
            ...GRID_LEVELS.map((gridLevel, i) => ({ id: gridLevel.id, name: `Grid Master ${i + 1}: ${gridLevel.title}` })),
          ].map((gameLevel) => {
            const record = data.game.levels[gameLevel.id];
            return (
              <View key={gameLevel.id} style={styles.line}>
                <Text style={[typography.body, styles.words, { color: record ? c.ink : c.inkSoft }]} numberOfLines={1}>
                  {gameLevel.name}
                </Text>
                <Text style={[typography.small, { color: record ? c.spark : c.inkSoft, fontWeight: record ? '700' : '400' }]}>
                  {record ? `${'★'.repeat(record.bestStars)}  ${record.bestAccuracy !== undefined ? `${record.bestAccuracy}%` : clockTime(record.bestMs)}` : 'Not played'}
                </Text>
              </View>
            );
          })}
          <View style={styles.gameButtons}>
            <Button testID="profile-play" kind="quiet" label="Play Speed Trial" onPress={() => router.push('/speed-trial')} style={styles.half} />
            {/* Grid Master is in the locked Advanced Arcade; its results stay listed above. */}
          </View>
        </Panel>

        <SectionLabel>Badges</SectionLabel>
        <View style={styles.badges}>
          {BADGES.map((badge) => {
            const earned = data.badges.includes(badge.id);
            return (
              <Panel
                key={badge.id}
                testID={`badge-${badge.id}`}
                accessibilityLabel={`${badge.name}. ${earned ? 'Earned' : badge.how}`}
                glow={earned}
                dashed={!earned}
                style={[styles.badge, !earned && styles.unearned]}
              >
                <View style={[styles.medal, { backgroundColor: earned ? c.spark : c.sunken }]} />
                <View style={styles.words}>
                  <Text style={[typography.bodyStrong, { color: earned ? c.ink : c.inkSoft }]}>{badge.name}</Text>
                  <Text style={[typography.small, { color: c.inkSoft }]}>{earned ? 'Earned' : badge.how}</Text>
                </View>
              </Panel>
            );
          })}
        </View>

        <SectionLabel>Settings</SectionLabel>
        <Panel style={styles.setting}>
          <View style={styles.words}>
            <Text style={[typography.bodyStrong, { color: c.ink }]}>Sound and vibration</Text>
            <Text style={[typography.small, { color: c.inkSoft }]}>A small buzz and chime for right and wrong answers</Text>
          </View>
          <Choice
            testID="setting-feedback"
            options={[
              { label: 'On', on: data.profile.feedback, onPress: () => store.setFeedback(true) },
              { label: 'Off', on: !data.profile.feedback, onPress: () => store.setFeedback(false) },
            ]}
          />
        </Panel>
        <Panel style={styles.setting}>
          <View style={styles.words}>
            <Text style={[typography.bodyStrong, { color: c.ink }]}>My computer</Text>
            <Text style={[typography.small, { color: c.inkSoft }]}>Shortcuts are shown with Ctrl on Windows and Cmd on a Mac</Text>
          </View>
          <Choice
            testID="setting-computer"
            options={[
              { label: 'Windows', on: computer === 'win', onPress: () => store.setComputer('win') },
              { label: 'Mac', on: computer === 'mac', onPress: () => store.setComputer('mac') },
            ]}
          />
        </Panel>

        <Panel style={styles.setting}>
          <View style={styles.words}>
            <Text style={[typography.bodyStrong, { color: c.ink }]}>Look</Text>
            <Text style={[typography.small, { color: c.inkSoft }]}>Dark is the app&apos;s own look. Auto follows your phone.</Text>
          </View>
          <Choice
            testID="setting-look"
            options={[
              { label: 'Dark', on: data.profile.look === 'dark', onPress: () => store.setLook('dark') },
              { label: 'Light', on: data.profile.look === 'light', onPress: () => store.setLook('light') },
              { label: 'Auto', on: data.profile.look === 'auto', onPress: () => store.setLook('auto') },
            ]}
          />
        </Panel>

        <Panel style={styles.setting}>
          <View style={styles.words}>
            <Text style={[typography.bodyStrong, { color: c.ink }]}>World style</Text>
            <Text style={[typography.small, { color: c.inkSoft }]}>Refined is the app&apos;s own. Classic Farm is the first, brighter cartoon style.</Text>
          </View>
          <Choice
            testID="setting-theme"
            options={[
              { label: 'Refined', on: theme === 'refined', onPress: () => setTheme('refined') },
              { label: 'Classic', on: theme === 'classic', onPress: () => setTheme('classic') },
            ]}
          />
        </Panel>

        <Panel style={styles.setting}>
          <View style={styles.words}>
            <Text style={[typography.bodyStrong, { color: c.ink }]}>Transitions</Text>
            <Text style={[typography.small, { color: c.inkSoft }]}>The move from the world into a lesson and back. Reduced is a quick fade; Off goes straight there.</Text>
          </View>
          <Choice
            testID="setting-motion"
            options={[
              { label: 'Full', on: motion === 'full', onPress: () => setMotion('full') },
              { label: 'Reduced', on: motion === 'reduced', onPress: () => setMotion('reduced') },
              { label: 'Off', on: motion === 'off', onPress: () => setMotion('off') },
            ]}
          />
        </Panel>

        <Button testID="profile-tour" kind="secondary" label="Take the tour of the app again" onPress={() => router.push('/tour')} />

        {confirming ? (
          <View style={[styles.confirm, { backgroundColor: c.badSoft }]}>
            <Text style={[typography.body, { color: c.ink }]}>
              This clears every lesson, your XP, your streak and your badges. It cannot be undone.
            </Text>
            <View style={styles.confirmButtons}>
              <Button kind="secondary" label="Keep my progress" onPress={() => setConfirming(false)} style={styles.half} />
              <Button
                testID="reset-confirm"
                label="Clear it all"
                onPress={() => {
                  store.reset();
                  setConfirming(false);
                }}
                style={styles.half}
              />
            </View>
          </View>
        ) : (
          <Button testID="reset" kind="quiet" label="Start over from the beginning" onPress={() => setConfirming(true)} />
        )}

        {__DEV__ ? (
          // For testing streaks without waiting until tomorrow. Not part of a released build.
          <Button
            testID="skip-day"
            kind="quiet"
            label={`Testing: jump to tomorrow (it is ${today})`}
            onPress={() => {
              shiftClock(86_400_000);
              setClockMoves((n) => n + 1);
            }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

interface ChoiceProps {
  testID: string;
  options: { label: string; on: boolean; onPress: () => void }[];
}

/** Two or three buttons side by side, of which one is chosen. */
function Choice({ testID, options }: ChoiceProps) {
  const c = useTheme();
  return (
    <View style={[styles.choice, { borderColor: c.outline }]} testID={testID}>
      {options.map((option) => (
        <Pressable
          key={option.label}
          accessibilityRole="radio"
          accessibilityLabel={option.label}
          accessibilityState={{ checked: option.on }}
          aria-checked={option.on}
          onPress={option.onPress}
          style={[styles.option, { backgroundColor: option.on ? c.accent : 'transparent' }]}
        >
          <Text style={[styles.optionText, { color: option.on ? c.onAccent : c.ink }]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  scroll: { flex: 1, width: '100%' },
  column: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.md },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stat: { flexGrow: 1, flexBasis: '45%', paddingVertical: space.md, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
  badges: { gap: space.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  unearned: { opacity: 0.78 },
  medal: { width: 22, height: 22, borderRadius: 6, transform: [{ rotate: '45deg' }] },
  words: { flex: 1, gap: 1 },
  card: { padding: space.md, gap: space.sm },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { minHeight: 44, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 10, fontSize: 16, fontWeight: '600', marginVertical: 2 },
  swatches: { flexDirection: 'row', gap: space.sm },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  swatchFill: { width: 28, height: 28, borderRadius: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 28 },
  gameButtons: { flexDirection: 'row', gap: space.sm },
  setting: { padding: space.md, gap: space.md },
  choice: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, overflow: 'hidden' },
  option: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', userSelect: 'none' },
  optionText: { fontSize: 15, fontWeight: '700' },
  confirm: { borderRadius: radius.md, padding: space.md, gap: space.md },
  confirmButtons: { flexDirection: 'row', gap: space.sm },
  half: { flex: 1 },
});
