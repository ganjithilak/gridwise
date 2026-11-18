import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { GameKeyboard } from '@/game/GameKeyboard';
import {
  answerLabel,
  clockTime,
  GAME_LEVELS,
  hintFor,
  holdsFor,
  isRight,
  keysAt,
  levelOpen,
  ROUND_LENGTH,
  roundFor,
  shortcutById,
  shortcutsAt,
  type RealKey,
  type RoundOutcome,
} from '@/game/speedTrial';
import { dayKey, now } from '@/lib/clock';
import { buzz } from '@/lib/feedback';
import { useHydrated, useProgress } from '@/progress/store';
import type { Computer, PressKey } from '@/spreadsheet/shortcuts';
import { mono, radius, space, type as typography, useTheme } from '@/theme';

const stars = (n: number): string => '★'.repeat(n) + '☆'.repeat(3 - n);

/** What a real keyboard calls a key, in the game's own names. Null for a key the game has no use for. */
function fromEvent(key: string): PressKey | null {
  if (key === ' ' || key === 'Spacebar') return 'Space';
  if (key.startsWith('Arrow')) return key.slice(5);
  return /^[a-zA-Z]$/.test(key) ? key.toUpperCase() : null;
}

interface Round {
  level: number;
  tasks: string[];
  at: number;
  startedAt: number;
  misses: number;
  /** The task in hand has been got wrong at least once, so it gets its full hint. */
  missed: boolean;
  firstTry: string[];
}

/**
 * Speed Trial: the shortcut game. A task is named and the player presses its keys, as
 * fast as they can. It is on the Practice tab and never part of a lesson.
 */
export default function SpeedTrialScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hydrated = useHydrated();
  const { height } = useWindowDimensions();
  const game = useProgress((s) => s.game);
  const computer = useProgress((s) => s.profile.computer);
  const setComputer = useProgress((s) => s.setComputer);
  const finishGame = useProgress((s) => s.finishGame);

  const [round, setRound] = useState<Round | null>(null);
  const [done, setDone] = useState<(RoundOutcome & { xp: number; ms: number; misses: number; level: number }) | null>(null);
  const [held, setHeld] = useState<readonly RealKey[]>([]);
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // The clock on screen. The time that counts is taken from the start and the last answer.
  useEffect(() => {
    if (!round) return;
    const tick = setInterval(() => setElapsed(now() - round.startedAt), 100);
    return () => clearInterval(tick);
  }, [round]);

  useEffect(() => {
    if (!flash) return;
    const clear = setTimeout(() => setFlash(null), 350);
    return () => clearTimeout(clear);
  }, [flash]);

  const start = (level: number) => {
    setDone(null);
    setHeld([]);
    setElapsed(0);
    setRound({ level, tasks: roundFor(level, game.levels[GAME_LEVELS[level].id]?.plays ?? 0), at: 0, startedAt: now(), misses: 0, missed: false, firstTry: [] });
  };

  const answer = useCallback(
    (holding: readonly RealKey[], key: PressKey) => {
      if (!round || !computer) return;
      const task = shortcutById(round.tasks[round.at]);
      setHeld([]);
      if (!isRight(task, computer, holding, key)) {
        buzz('wrong');
        setFlash('wrong');
        setRound({ ...round, misses: round.misses + 1, missed: true });
        return;
      }
      buzz('correct');
      setFlash('right');
      const firstTry = round.missed ? round.firstTry : [...round.firstTry, task.id];
      if (round.at + 1 < round.tasks.length) {
        setRound({ ...round, at: round.at + 1, missed: false, firstTry });
        return;
      }
      const ms = now() - round.startedAt;
      const outcome = finishGame(round.level, { ms, misses: round.misses, firstTry }, dayKey());
      buzz('complete');
      setRound(null);
      setDone({ ...outcome, ms, misses: round.misses, level: round.level });
    },
    [round, computer, finishGame],
  );

  // A real keyboard, where there is one: the real keys are the whole point of the game.
  const live = useRef(answer);
  useEffect(() => {
    live.current = answer;
  });
  const playing = round !== null;
  useEffect(() => {
    if (Platform.OS !== 'web' || !playing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const key = fromEvent(e.key);
      if (!key || e.altKey) return;
      // Stops the browser doing its own thing with Ctrl + A, Space and the rest.
      e.preventDefault();
      const holding: RealKey[] = [];
      if (e.ctrlKey) holding.push('Ctrl');
      if (e.metaKey) holding.push('Cmd');
      if (e.shiftKey) holding.push('Shift');
      live.current(holding, key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [playing]);

  if (!hydrated) return <View style={[styles.screen, { backgroundColor: c.bg }]} />;

  const frame = (children: React.ReactNode) => (
    <View
      style={[
        styles.screen,
        { backgroundColor: c.bg, paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.md, paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      <View style={styles.column}>{children}</View>
    </View>
  );

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/practice'));

  // The keys are named differently on each kind of computer, so that comes first.
  if (!computer) {
    const options: { computer: Computer; title: string; detail: string }[] = [
      { computer: 'win', title: 'Windows', detail: 'Shortcuts use the Ctrl key' },
      { computer: 'mac', title: 'Mac', detail: 'Shortcuts use the Cmd key' },
    ];
    return frame(
      <View style={styles.centred}>
        <Mascot expression="thinking" size={72} />
        <Text style={[typography.title, styles.centre, { color: c.ink }]}>Which computer do you use?</Text>
        <Text style={[typography.body, styles.centre, { color: c.inkSoft }]}>The shortcut keys are named differently on each.</Text>
        {options.map((option) => (
          <Pressable
            key={option.computer}
            testID={`computer-${option.computer}`}
            accessibilityRole="button"
            accessibilityLabel={`${option.title}. ${option.detail}`}
            onPress={() => setComputer(option.computer)}
            style={[styles.level, { backgroundColor: c.surface, borderColor: c.outline }]}
          >
            <Text style={[typography.heading, { color: c.ink }]}>{option.title}</Text>
            <Text style={[typography.small, { color: c.inkSoft }]}>{option.detail}</Text>
          </Pressable>
        ))}
      </View>,
    );
  }

  if (round) {
    const task = shortcutById(round.tasks[round.at]);
    const hint = hintFor(game, task.id, round.missed);
    const pointOut = {
      holds: hint === 'none' ? [] : holdsFor(task, computer),
      key: hint === 'full' ? task.key : null,
    };
    const tone = flash === 'wrong' ? c.bad : flash === 'right' ? c.accent : c.line;
    return frame(
      <>
        <View style={styles.top}>
          <Pressable testID="trial-quit" accessibilityRole="button" accessibilityLabel="Stop the game" onPress={() => setRound(null)} hitSlop={10} style={styles.quit}>
            <Text style={[styles.quitText, { color: c.inkSoft }]}>✕</Text>
          </Pressable>
          <Text style={[typography.label, { color: c.inkSoft }]} testID="trial-count">
            TASK {round.at + 1} OF {ROUND_LENGTH}
          </Text>
          <Text style={[styles.clock, { color: c.ink, fontFamily: mono }]} testID="trial-clock">
            {clockTime(elapsed)}
          </Text>
        </View>

        <View style={styles.middle}>
          <View style={[styles.task, { backgroundColor: c.surface, borderColor: tone }]} testID="trial-task" accessibilityLabel={task.task}>
            <Text style={[typography.label, { color: c.inkSoft }]}>PRESS THE SHORTCUT TO</Text>
            <Text style={[styles.taskText, { color: c.ink }]}>{task.task}</Text>
          </View>
          <Text style={[typography.small, styles.centre, styles.help, { color: round.missed ? c.bad : c.inkSoft }]} testID="trial-help">
            {round.missed
              ? `Not that one. It is ${answerLabel(task, computer)}.`
              : hint === 'full'
                ? 'The keys to press are lit. Tap the first: it stays held.'
                : hint === 'first'
                  ? 'Only the first key is lit now. Which key goes with it?'
                  : 'No hint for this one. You know it.'}
          </Text>
        </View>

        <GameKeyboard
          computer={computer}
          lit={keysAt(round.level, computer)}
          held={held}
          hint={pointOut}
          onHold={(key) => {
            buzz('key');
            setHeld((nowHeld) => (nowHeld.includes(key) ? nowHeld.filter((k) => k !== key) : [...nowHeld, key]));
          }}
          onKey={(key) => answer(held, key)}
          keyHeight={height < 500 ? 34 : 42}
        />
      </>,
    );
  }

  if (done) {
    const level = GAME_LEVELS[done.level];
    const next = GAME_LEVELS[done.level + 1];
    return frame(
      <View style={styles.centred}>
        <Mascot expression={done.stars === 3 ? 'cheering' : 'happy'} size={72} />
        <Text style={[styles.stars, { color: c.spark }]} testID="trial-stars" accessibilityLabel={`${done.stars} of 3 stars`}>
          {stars(done.stars)}
        </Text>
        <Text style={[typography.title, styles.centre, { color: c.ink }]}>{done.newBest ? 'New best time!' : done.stars === 3 ? 'Clean and quick!' : 'Round done'}</Text>
        <Text style={[typography.body, styles.centre, { color: c.inkSoft }]}>{level.title}</Text>
        <View style={styles.results}>
          {[
            { label: 'Time', value: clockTime(done.ms) },
            { label: 'Best', value: clockTime(done.game.levels[level.id].bestMs) },
            { label: 'Misses', value: String(done.misses) },
            { label: 'XP', value: `+${done.xp}` },
          ].map((stat) => (
            <View key={stat.label} style={[styles.result, { backgroundColor: c.surface, borderColor: c.line }]}>
              <Text style={[styles.resultValue, { color: c.ink }]}>{stat.value}</Text>
              <Text style={[typography.label, { color: c.inkSoft }]}>{stat.label.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        {done.opened ? (
          <Text style={[typography.small, styles.centre, { color: c.accent, fontWeight: '700' }]} testID="trial-opened">
            New level open: {done.opened.title}
          </Text>
        ) : done.stars < 3 ? (
          <Text style={[typography.small, styles.centre, { color: c.inkSoft }]}>Three stars: no misses, and under {ROUND_LENGTH * 2.5} seconds.</Text>
        ) : null}
        <View style={styles.wide}>
          {next ? <Button testID="trial-next" label={`Next level: ${next.title}`} onPress={() => start(done.level + 1)} /> : null}
          <Button testID="trial-again" kind={next ? 'secondary' : 'primary'} label="Play again" onPress={() => start(done.level)} />
          <Button testID="trial-levels" kind="quiet" label="All levels" onPress={() => setDone(null)} />
        </View>
      </View>,
    );
  }

  return frame(
    <>
      <View style={styles.top}>
        <Pressable testID="trial-leave" accessibilityRole="button" accessibilityLabel="Back to Practice" onPress={leave} hitSlop={10} style={styles.quit}>
          <Text style={[styles.quitText, { color: c.inkSoft }]}>✕</Text>
        </Pressable>
        <Text style={[typography.title, styles.grow, { color: c.ink }]}>Speed Trial</Text>
      </View>
      <Text style={[typography.body, { color: c.inkSoft }]}>
        A task appears. Press its keyboard shortcut as fast as you can. Eight tasks a go, and each level adds more shortcuts.
      </Text>
      <ScrollView style={styles.grow} contentContainerStyle={styles.levels} showsVerticalScrollIndicator={false}>
        {GAME_LEVELS.map((level, i) => {
          const open = levelOpen(game, i);
          const record = game.levels[level.id];
          const fresh = level.adds.map((id) => answerLabel(shortcutById(id), computer)).join(',  ');
          return (
            <Pressable
              key={level.id}
              testID={`trial-${level.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Level ${i + 1}: ${level.title}. ${open ? (record ? `Best time ${clockTime(record.bestMs)}` : 'Not played yet') : 'Finish the level before to open this'}`}
              accessibilityState={{ disabled: !open }}
              disabled={!open}
              onPress={() => start(i)}
              style={[styles.level, { backgroundColor: c.surface, borderColor: c.outline, opacity: open ? 1 : 0.45 }]}
            >
              <View style={styles.levelHead}>
                <Text style={[typography.label, { color: c.accent }]}>LEVEL {i + 1}</Text>
                <Text style={[styles.levelStars, { color: c.spark }]}>{record ? stars(record.bestStars) : ''}</Text>
              </View>
              <Text style={[typography.heading, { color: c.ink }]}>{level.title}</Text>
              <Text style={[typography.small, { color: c.inkSoft }]}>New: {fresh}</Text>
              <Text style={[typography.small, { color: c.inkSoft }]}>
                {!open
                  ? 'Finish the level before to open this'
                  : record
                    ? `Best ${clockTime(record.bestMs)} · played ${record.plays} ${record.plays === 1 ? 'time' : 'times'}`
                    : `${shortcutsAt(i).length} shortcuts in play. Not played yet.`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>,
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 640, paddingHorizontal: space.md, gap: space.md },
  top: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: space.md },
  quit: { width: 30, height: 40, alignItems: 'center', justifyContent: 'center' },
  quitText: { fontSize: 18, fontWeight: '700' },
  clock: { fontSize: 20, fontWeight: '700', marginLeft: 'auto' },
  grow: { flex: 1 },
  middle: { flex: 1, justifyContent: 'center', gap: space.sm },
  task: { borderWidth: 2, borderRadius: radius.lg, padding: space.lg, gap: space.xs, alignItems: 'center' },
  taskText: { fontSize: 22, lineHeight: 28, fontWeight: '800', textAlign: 'center' },
  help: { minHeight: 38 },
  centre: { textAlign: 'center' },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  stars: { fontSize: 40, letterSpacing: 4 },
  results: { flexDirection: 'row', gap: space.sm, alignSelf: 'stretch' },
  result: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingVertical: space.sm, alignItems: 'center', gap: 2 },
  resultValue: { fontSize: 17, fontWeight: '800' },
  wide: { alignSelf: 'stretch', gap: space.sm },
  levels: { gap: space.sm, paddingBottom: space.md },
  level: { alignSelf: 'stretch', borderWidth: 1, borderBottomWidth: 4, borderRadius: radius.lg, padding: space.md, gap: 2, userSelect: 'none' },
  levelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelStars: { fontSize: 16, letterSpacing: 2 },
});
