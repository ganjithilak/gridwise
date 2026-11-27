import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import type { GameLevelRecord } from '@/progress/saved';
import type { Computer } from '@/spreadsheet/shortcuts';
import { mono, radius, space, type as typography, useTheme } from '@/theme';
import { usePrefs } from '@/world/prefs';
import { ScreenSky } from '@/world/ui/ScreenSky';

import { clockTime, type NewBest } from '../records';

/**
 * The pieces every core game is built from, so the six read as one family: the same frame
 * under the spreadsheet sky, the same top bar, the same intro, choices and results.
 */

/** The screen: safe-area padding, the quiet sky band, and a centred column. */
export function GameFrame({ children, wide = false, testID }: { children: ReactNode; wide?: boolean; testID?: string }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      testID={testID}
      style={[
        styles.screen,
        { backgroundColor: c.bg, paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.md, paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      <ScreenSky variant="quiet" />
      <View style={[styles.column, { maxWidth: wide ? 720 : 560 }]}>{children}</View>
    </View>
  );
}

/** Back to the Games side of the world, or wherever the game was opened from. */
export function useLeaveGame(): () => void {
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace('/practice'));
}

/** ✕, a progress bar of the go, and anything on the right (a clock). */
export function GameTop({ onClose, at, total, right, closeLabel = 'Stop the game' }: { onClose: () => void; at?: number; total?: number; right?: ReactNode; closeLabel?: string }) {
  const c = useTheme();
  return (
    <View style={styles.top}>
      <Pressable testID="game-close" accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} hitSlop={10} style={styles.close}>
        <Text style={[styles.closeText, { color: c.inkSoft }]}>✕</Text>
      </Pressable>
      {total !== undefined && at !== undefined ? (
        <View style={[styles.track, { backgroundColor: c.sunken }]} accessible accessibilityLabel={`Question ${Math.min(at + 1, total)} of ${total}`} testID="game-progress">
          <View style={[styles.fill, { backgroundColor: c.accent, width: `${(100 * at) / total}%` }]} />
        </View>
      ) : (
        <View style={styles.grow} />
      )}
      {right}
    </View>
  );
}

/** The question, in the size and weight every game uses. */
export function Prompt({ label, children, testID }: { label?: string; children: ReactNode; testID?: string }) {
  const c = useTheme();
  return (
    <View style={styles.prompt} testID={testID ?? 'game-prompt'}>
      {label ? <Text style={[typography.label, { color: c.accent }]}>{label.toUpperCase()}</Text> : null}
      <Text style={[styles.promptText, { color: c.ink }]}>{children}</Text>
    </View>
  );
}

export type ChoiceState = 'idle' | 'chosen' | 'right' | 'wrong' | 'done';

/** One answer to choose: a word, a number or a formula. A wrong one shakes, once and gently. */
export function Choice({ label, state = 'idle', onPress, code = false, testID, style, disabled }: { label: string; state?: ChoiceState; onPress: () => void; code?: boolean; testID?: string; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const c = useTheme();
  const motion = usePrefs((s) => s.motion);
  const [shake] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (state !== 'wrong' || motion !== 'full') return;
    shake.setValue(0);
    Animated.sequence([-1, 1, -0.6, 0.6, 0].map((to) => Animated.timing(shake, { toValue: to, duration: 55, useNativeDriver: true }))).start();
  }, [state, motion, shake]);
  const tone =
    state === 'right' ? { bg: c.goodSoft, edge: c.good, ink: c.good }
    : state === 'wrong' ? { bg: c.badSoft, edge: c.bad, ink: c.bad }
    : state === 'chosen' ? { bg: c.accentSoft, edge: c.accent, ink: c.accent }
    : state === 'done' ? { bg: 'transparent', edge: c.line, ink: c.inkFaint }
    : { bg: c.surface, edge: c.outline, ink: c.ink };
  return (
    <Animated.View style={[style, { transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }] }]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: state === 'chosen', disabled: disabled || state === 'done' }}
        disabled={disabled || state === 'done'}
        onPress={onPress}
        style={({ pressed }) => [
          styles.choice,
          { backgroundColor: tone.bg, borderColor: tone.edge, borderBottomWidth: state === 'done' ? 1 : pressed ? 1.5 : 4, marginTop: pressed && state !== 'done' ? 2.5 : 0 },
        ]}
      >
        <Text style={[code ? [styles.code, { fontFamily: mono }] : styles.choiceText, { color: tone.ink }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Before a go: what the game is, what it covers so far, and Play. */
export function GameIntro({
  title,
  about,
  covers,
  locked,
  record,
  onPlay,
  onLeave,
  children,
  playLabel = 'Play',
}: {
  title: string;
  about: string;
  covers: string[];
  /** Why it cannot be played yet: "Opens after Cells and References". */
  locked?: string | null;
  record?: GameLevelRecord;
  onPlay: () => void;
  onLeave: () => void;
  children?: ReactNode;
  playLabel?: string;
}) {
  const c = useTheme();
  return (
    <GameFrame testID="game-intro">
      <GameTop onClose={onLeave} closeLabel="Back to Games" />
      <ScrollView style={styles.grow} contentContainerStyle={styles.introBody} showsVerticalScrollIndicator={false}>
        <Text style={[typography.title, { color: c.ink }]}>{title}</Text>
        <Text style={[typography.body, { color: c.inkSoft }]}>{about}</Text>
        {record ? (
          <Text style={[typography.small, { color: c.inkSoft }]} testID="game-record">
            Best: {stars(record.bestStars)} · {record.bestAccuracy ?? 0}% first time · played {record.plays} {record.plays === 1 ? 'time' : 'times'}
          </Text>
        ) : null}
        {children}
        {covers.length > 0 ? (
          <View style={[styles.covers, { backgroundColor: c.surface, borderColor: c.line }]} testID="game-covers">
            <Text style={[typography.label, { color: c.inkSoft }]}>COVERS WHAT YOU HAVE LEARNED SO FAR</Text>
            <Text style={[typography.small, { color: c.ink }]}>{covers.join(' · ')}</Text>
          </View>
        ) : null}
      </ScrollView>
      {locked ? (
        <View style={[styles.locked, { borderColor: c.line }]} testID="game-locked">
          <Text style={[typography.bodyStrong, { color: c.ink }]}>Not open yet</Text>
          <Text style={[typography.small, { color: c.inkSoft }]}>{locked}</Text>
        </View>
      ) : (
        <Button testID="game-play" label={playLabel} onPress={onPlay} />
      )}
    </GameFrame>
  );
}

export const stars = (n: number): string => '★'.repeat(n) + '☆'.repeat(3 - n);

/**
 * After a go. Plain, specific words: what was got right first time, not how amazing it was.
 */
export function GameResults({
  stars: earned,
  accuracy,
  asked,
  firstTry,
  ms,
  best,
  xp,
  newBest,
  first,
  note,
  onAgain,
  onLeave,
  extra,
  leaveLabel = 'Back to Games',
}: {
  stars: 1 | 2 | 3;
  accuracy: number;
  asked: number;
  firstTry: number;
  ms: number;
  /** The time to show as best, if this game keeps one. */
  best?: number | null;
  xp: number;
  newBest: NewBest;
  first: boolean;
  note?: string;
  onAgain: () => void;
  onLeave: () => void;
  extra?: ReactNode;
  leaveLabel?: string;
}) {
  const c = useTheme();
  const heading =
    newBest === 'accuracy' ? 'Your most accurate go yet' : newBest === 'time' ? 'A new best time' : earned === 3 ? 'Every one right first time' : earned === 2 ? 'Most right first time' : 'Round finished';
  const stats: { label: string; value: string; sub?: string }[] = [
    { label: 'First time', value: `${firstTry}/${asked}` },
    { label: 'Accuracy', value: `${accuracy}%` },
    { label: 'Time', value: clockTime(ms), sub: best ? `best ${clockTime(best)}` : undefined },
    { label: 'XP', value: `+${xp}` },
  ];
  return (
    <GameFrame testID="game-results">
      <View style={styles.centred}>
        <Mascot expression={earned === 3 ? 'cheering' : 'happy'} size={64} />
        <Text style={[styles.stars, { color: c.spark }]} testID="game-stars" accessibilityLabel={`${earned} of 3 stars`}>
          {stars(earned)}
        </Text>
        <Text style={[typography.title, styles.centre, { color: c.ink }]} testID="game-heading">
          {heading}
        </Text>
        {note ? <Text style={[typography.body, styles.centre, { color: c.inkSoft }]}>{note}</Text> : null}
        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.stat, { backgroundColor: c.surface, borderColor: c.line }]}>
              <Text style={[styles.statValue, { color: c.ink }]}>{s.value}</Text>
              <Text style={[typography.label, styles.statLabel, { color: c.inkSoft }]} numberOfLines={1}>
                {s.label.toUpperCase()}
              </Text>
              {s.sub ? (
                <Text style={[styles.statSub, { color: c.spark }]} testID="game-best">
                  {s.sub}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
        {!first && earned < 3 ? (
          <Text style={[typography.small, styles.centre, { color: c.inkSoft }]}>Three stars: every answer right first time. Speed never costs a star.</Text>
        ) : null}
        {extra}
      </View>
      <View style={styles.buttons}>
        <Button testID="game-again" label="Play again" onPress={onAgain} />
        <Button testID="game-leave" kind="quiet" label={leaveLabel} onPress={onLeave} />
      </View>
    </GameFrame>
  );
}

/** Ctrl or Cmd: asked once, the first time a game needs it, then kept with the profile. */
export function ComputerChoice({ onChoose, onLeave }: { onChoose: (computer: Computer) => void; onLeave: () => void }) {
  const c = useTheme();
  const options: { computer: Computer; title: string; detail: string }[] = [
    { computer: 'win', title: 'Windows', detail: 'Shortcuts use the Ctrl key' },
    { computer: 'mac', title: 'Mac', detail: 'Shortcuts use the Cmd key' },
  ];
  return (
    <GameFrame>
      <GameTop onClose={onLeave} closeLabel="Back to Games" />
      <View style={styles.centred}>
        <Mascot expression="thinking" size={64} />
        <Text style={[typography.title, styles.centre, { color: c.ink }]}>Which computer do you use?</Text>
        <Text style={[typography.body, styles.centre, { color: c.inkSoft }]}>Shortcut keys are named differently on each. You can change this in Profile.</Text>
        {options.map((o) => (
          <Pressable
            key={o.computer}
            testID={`computer-${o.computer}`}
            accessibilityRole="button"
            accessibilityLabel={`${o.title}. ${o.detail}`}
            onPress={() => onChoose(o.computer)}
            style={[styles.option, { backgroundColor: c.surface, borderColor: c.outline }]}
          >
            <Text style={[typography.heading, { color: c.ink }]}>{o.title}</Text>
            <Text style={[typography.small, { color: c.inkSoft }]}>{o.detail}</Text>
          </Pressable>
        ))}
      </View>
    </GameFrame>
  );
}

/** A note to check a sheet against: a docket, a delivery list. */
export function NoteCard({ title, lines }: { title: string; lines: string[] }) {
  const c = useTheme();
  return (
    <View style={[styles.note, { backgroundColor: c.sparkSoft, borderColor: c.spark }]} testID="game-note">
      <Text style={[typography.label, { color: c.ink }]}>{title.toUpperCase()}</Text>
      <Text style={[typography.small, { color: c.ink }]}>{lines.join('   ·   ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', paddingHorizontal: space.md, gap: space.sm },
  top: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: space.md },
  close: { width: 30, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 18, fontWeight: '700' },
  track: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  grow: { flex: 1 },
  prompt: { gap: 4, paddingVertical: space.xs },
  promptText: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  choice: { minHeight: 48, borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', userSelect: 'none' },
  choiceText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  code: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  introBody: { gap: space.md, paddingVertical: space.md },
  covers: { borderWidth: 1, borderRadius: radius.md, padding: space.md, gap: 4 },
  locked: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, padding: space.md, gap: 2 },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  centre: { textAlign: 'center' },
  stars: { fontSize: 36, letterSpacing: 4 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignSelf: 'stretch', justifyContent: 'center' },
  stat: { flexGrow: 1, flexBasis: 64, borderWidth: 1, borderRadius: radius.md, paddingVertical: space.sm, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10.5, letterSpacing: 0.4 },
  statSub: { fontSize: 11, fontWeight: '700' },
  buttons: { gap: space.sm },
  option: { alignSelf: 'stretch', borderWidth: 1, borderBottomWidth: 4, borderRadius: radius.lg, padding: space.md, gap: 2, userSelect: 'none' },
  note: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm, gap: 2 },
});
