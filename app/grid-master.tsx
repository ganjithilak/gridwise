import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { GridBoard, HEAD_H, ROW_W } from '@/game/GridBoard';
import {
  finishBonus,
  GRID_LEVELS,
  gridLevelOpen,
  messageFor,
  pause,
  starsOf,
  startState,
  steer,
  step,
  taskFor,
  type Dir,
  type GridEvent,
  type GridOutcome,
  type GridState,
} from '@/game/gridMaster';
import { clockTime } from '@/game/records';
import { dayKey, now } from '@/lib/clock';
import { buzz } from '@/lib/feedback';
import { useHydrated, useProgress } from '@/progress/store';
import type { ShortcutId } from '@/spreadsheet/controller';
import { KeyCaps } from '@/spreadsheet/KeyCaps';
import { comboLabel } from '@/spreadsheet/shortcuts';
import { mono, radius, space, type as typography, useTheme } from '@/theme';
import { ScreenSky } from '@/world/ui/ScreenSky';

/** Shift and an arrow steer: in a spreadsheet they stretch a selection, and the snake is one. */
const STEER: Partial<Record<ShortcutId, Dir>> = { extendUp: 'up', extendDown: 'down', extendLeft: 'left', extendRight: 'right' };
const BONUS_MS = 3000;
const stars = (n: number): string => '★'.repeat(n) + '☆'.repeat(3 - n);

interface Result extends GridOutcome {
  xp: number;
  ms: number;
  stars: 1 | 2 | 3;
  end: GridState;
}

/** A word of help after a key press, kept on screen until something else happens. */
interface Nudge {
  text: string;
  during: GridEvent | null;
}

const HOW_TO_PLAY = [
  'The snake is a selection on the sheet. Steer it with Shift + an arrow key.',
  'The card names a cell to collect. Every orange dot looks the same, so read the cell references.',
  'A wrong dot makes the snake longer. A green −1 square makes it shorter.',
  'Collect every named cell, then steer into the gold centre. Arrive one cell long for a bonus round.',
];

/**
 * Grid Master, World 1: The Grid. A snake-style game played on the sheet itself, steered
 * with the shortcut for stretching a selection. It lives on the Practice tab, beside
 * Speed Trial, and is never part of a lesson.
 */
export default function GridMasterScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hydrated = useHydrated();
  const { width, height } = useWindowDimensions();
  const game = useProgress((s) => s.game);
  const computer = useProgress((s) => s.profile.computer) ?? 'win';
  const finishGrid = useProgress((s) => s.finishGrid);

  const [play, setPlay] = useState<GridState | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [clock, setClock] = useState(0);
  const [bonusLeft, setBonusLeft] = useState(BONUS_MS);
  /** When the snake first moved, and when it reached the centre. The time between is the score. */
  const times = useRef<{ start: number | null; end: number | null }>({ start: null, end: null });
  const recorded = useRef(false);

  const status = play?.status ?? null;
  const stepMs = play ? GRID_LEVELS[play.level].stepMs : 0;

  // The snake moves on its own, one cell at a time.
  useEffect(() => {
    if (status !== 'running') return;
    const timer = setInterval(() => setPlay((p) => (p ? step(p) : p)), stepMs);
    return () => clearInterval(timer);
  }, [status, stepMs]);

  // The clock starts with the first move and stops in the centre.
  useEffect(() => {
    if (status === 'running' && times.current.start === null) times.current.start = now();
    if ((status === 'bonus' || status === 'done') && times.current.end === null) times.current.end = now();
    if (status !== 'running' && status !== 'stopped') return;
    const tick = setInterval(() => setClock(times.current.start === null ? 0 : now() - times.current.start), 100);
    return () => clearInterval(tick);
  }, [status]);

  // The bonus round: one shortcut, in three seconds.
  useEffect(() => {
    if (status !== 'bonus') return;
    const started = now();
    const tick = setInterval(() => setBonusLeft(Math.max(0, BONUS_MS - (now() - started))), 100);
    const end = setTimeout(() => setPlay((p) => (p ? finishBonus(p, false) : p)), BONUS_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(end);
    };
  }, [status]);

  // A buzz for what just happened.
  const event = play?.event ?? null;
  useEffect(() => {
    if (!event) return;
    if (event.kind === 'right' || event.kind === 'shrink' || event.kind === 'gate') buzz('correct');
    else if (event.kind === 'centre') buzz('complete');
    else if (event.kind !== 'portal' && event.kind !== 'paused' && event.kind !== 'blocked') buzz('wrong');
  }, [event]);

  // Leaving the app pauses the snake rather than letting it run into a wall unseen.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') setPlay((p) => (p ? pause(p) : p));
    });
    return () => sub.remove();
  }, []);

  // A finished level is saved once, then the results are shown.
  useEffect(() => {
    if (!play || play.status !== 'done' || recorded.current) return;
    recorded.current = true;
    const ms = Math.max(0, (times.current.end ?? now()) - (times.current.start ?? now()));
    const earned = starsOf(play);
    const outcome = finishGrid(play.level, { ms, stars: earned }, dayKey());
    setResult({ ...outcome, ms, stars: earned, end: play });
  }, [play, finishGrid]);

  if (!hydrated) return <View style={[styles.screen, { backgroundColor: c.bg }]} />;

  const start = (level: number) => {
    times.current = { start: null, end: null };
    recorded.current = false;
    setResult(null);
    setNudge(null);
    setClock(0);
    setBonusLeft(BONUS_MS);
    setPlay(startState(level));
  };
  const toLevels = () => {
    setPlay(null);
    setResult(null);
  };
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/practice'));

  const say = (text: string) => play && setNudge({ text, during: play.event });
  const onCombo = (id: ShortcutId) => {
    if (!play) return;
    const dir = STEER[id];
    if (dir) {
      setNudge(null);
      setPlay((p) => (p ? steer(p, dir) : p));
      return;
    }
    const level = GRID_LEVELS[play.level];
    if (id === 'selectRow' || id === 'selectColumn') {
      if (play.status !== 'bonus') say(`${comboLabel(id, computer)} selects a whole ${id === 'selectRow' ? 'row' : 'column'}. Keep it for the bonus round.`);
      else if (id === level.bonus) setPlay((p) => (p ? finishBonus(p, true) : p));
      else say(`That was ${comboLabel(id, computer)}. The bonus asks for ${comboLabel(level.bonus, computer)}.`);
      return;
    }
    say('An arrow on its own just moves the active cell. Hold Shift with it to steer.');
  };
  const onLoose = () => say('Steer with Shift + an arrow. Tap Shift first: it stays held.');

  const frame = (children: ReactNode) => (
    <View
      style={[
        styles.screen,
        { backgroundColor: c.bg, paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.md, paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      <ScreenSky variant="quiet" />
      {children}
    </View>
  );

  // ---- the results of a level ------------------------------------------------------------
  if (result) {
    const level = GRID_LEVELS[result.end.level];
    const next = GRID_LEVELS[result.end.level + 1];
    const lines = [
      { got: true, text: 'Reached the centre' },
      { got: result.end.short, text: 'Arrived one cell long' },
      { got: result.end.bonus, text: `Bonus: ${comboLabel(level.bonus, computer)} in time` },
    ];
    return frame(
      <ScrollView style={styles.column} contentContainerStyle={styles.centred} showsVerticalScrollIndicator={false}>
        <Mascot expression={result.stars === 3 ? 'cheering' : 'happy'} size={64} />
        <Text style={[styles.stars, { color: c.spark }]} testID="gm-stars" accessibilityLabel={`${result.stars} of 3 stars`}>
          {stars(result.stars)}
        </Text>
        <Text style={[typography.title, styles.centre, { color: c.ink }]}>{result.newBest ? 'New best time!' : 'Level done'}</Text>
        <Text style={[typography.body, styles.centre, { color: c.inkSoft }]}>{level.title}</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]} testID="gm-star-lines">
          {lines.map((line) => (
            <Text key={line.text} style={[typography.body, { color: line.got ? c.ink : c.inkSoft }]}>
              <Text style={{ color: line.got ? c.spark : c.inkFaint }}>{line.got ? '★  ' : '☆  '}</Text>
              {line.text}
            </Text>
          ))}
        </View>
        <View style={styles.results}>
          {[
            { label: 'Time', value: clockTime(result.ms) },
            { label: 'Best', value: clockTime(result.game.levels[level.id].bestMs) },
            { label: 'Wrong', value: String(result.end.wrong) },
            { label: 'XP', value: `+${result.xp}` },
          ].map((stat) => (
            <View key={stat.label} style={[styles.result, { backgroundColor: c.surface, borderColor: c.line }]}>
              <Text style={[styles.resultValue, { color: c.ink }]}>{stat.value}</Text>
              <Text style={[typography.label, { color: c.inkSoft }]}>{stat.label.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        {result.opened ? (
          <Text style={[typography.small, styles.centre, { color: c.accent, fontWeight: '700' }]} testID="gm-opened">
            New level open: {result.opened.title}
          </Text>
        ) : null}
        <View style={styles.wide}>
          {next ? <Button testID="gm-next" label={`Next level: ${next.title}`} onPress={() => start(result.end.level + 1)} /> : null}
          <Button testID="gm-again" kind={next ? 'secondary' : 'primary'} label="Play again" onPress={() => start(result.end.level)} />
          <Button testID="gm-levels" kind="quiet" label="All levels" onPress={toLevels} />
        </View>
      </ScrollView>,
    );
  }

  // ---- playing ---------------------------------------------------------------------------
  if (play) {
    const level = GRID_LEVELS[play.level];
    const wide = width > height && width >= 560;
    const roomW = wide ? Math.min(width - insets.left - insets.right - 2 * space.md, 1000) * 0.56 : Math.min(width - insets.left - insets.right, 560) - 2 * space.md;
    const roomH = wide ? height - insets.top - insets.bottom - 2 * space.md : height - insets.top - insets.bottom - 300;
    const cell = Math.max(18, Math.min(46, Math.floor(Math.min((roomW - ROW_W - 3) / level.cols, (roomH - HEAD_H - 3) / level.rows))));
    const bonus = play.status === 'bonus';
    const task = bonus ? `Bonus! Press ${comboLabel(level.bonus, computer)}` : taskFor(play);
    const line = nudge && nudge.during === play.event ? nudge.text : bonus ? `Quick: ${Math.ceil(bonusLeft / 1000)} s left.` : messageFor(play);
    const bad = play.status === 'stopped' && play.event?.kind !== 'paused';

    const top = (
      <View style={styles.top}>
        <Pressable testID="gm-quit" accessibilityRole="button" accessibilityLabel="Stop and go back to the levels" onPress={toLevels} hitSlop={10} style={styles.quit}>
          <Text style={[styles.quitText, { color: c.inkSoft }]}>✕</Text>
        </Pressable>
        <Text style={[typography.label, styles.grow, { color: c.inkSoft }]} numberOfLines={1}>
          LEVEL {play.level + 1} · {level.title.toUpperCase()}
        </Text>
        <Text style={[styles.clock, { color: c.ink, fontFamily: mono }]} testID="gm-clock">
          {clockTime(clock)}
        </Text>
      </View>
    );
    const card = (
      <View
        style={[styles.task, { backgroundColor: bonus ? c.sparkSoft : c.surface, borderColor: bonus ? c.spark : bad ? c.bad : c.line }]}
        testID="gm-card"
        accessibilityLiveRegion="polite"
      >
        <Text style={[styles.taskText, { color: c.ink }]} testID="gm-task">
          {task}
        </Text>
        <Text style={[typography.small, { color: bad ? c.bad : c.inkSoft }]} numberOfLines={3} testID="gm-message">
          {line ?? ' '}
        </Text>
      </View>
    );
    const info = (
      <View style={styles.info}>
        <View style={[styles.nameBox, { borderColor: c.outline, backgroundColor: c.surface }]}>
          <Text style={[styles.name, { color: c.ink, fontFamily: mono }]} testID="gm-head">
            {play.snake[0]}
          </Text>
        </View>
        <Text style={[typography.small, styles.grow, { color: c.inkSoft }]} numberOfLines={1} testID="gm-stats">
          {play.snake.length} {play.snake.length === 1 ? 'cell' : 'cells'} long · {Math.min(play.found, level.targets.length)} of {level.targets.length} found
        </Text>
      </View>
    );
    const keys = <KeyCaps computer={computer} set="moving" onCombo={onCombo} onLoose={onLoose} locked={play.status === 'done'} height={44} />;
    const board = <GridBoard state={play} cell={cell} />;

    return frame(
      wide ? (
        <View style={[styles.split, styles.wideColumn]}>
          <View style={styles.boardSide}>{board}</View>
          <View style={styles.panel}>
            {top}
            {card}
            {info}
            <View style={styles.grow} />
            {keys}
          </View>
        </View>
      ) : (
        <View style={styles.column}>
          {top}
          {card}
          {info}
          {board}
          <View style={styles.grow} />
          {keys}
        </View>
      ),
    );
  }

  // ---- the levels ------------------------------------------------------------------------
  return frame(
    <View style={styles.column}>
      <View style={styles.top}>
        <Pressable testID="gm-leave" accessibilityRole="button" accessibilityLabel="Back to Practice" onPress={leave} hitSlop={10} style={styles.quit}>
          <Text style={[styles.quitText, { color: c.inkSoft }]}>✕</Text>
        </Pressable>
        <Text style={[typography.title, styles.grow, { color: c.ink }]}>Grid Master</Text>
      </View>
      <ScrollView style={styles.grow} contentContainerStyle={styles.levels} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]} testID="gm-how">
          <Text style={[typography.label, { color: c.accent }]}>WORLD 1 · THE GRID · HOW TO PLAY</Text>
          {HOW_TO_PLAY.map((text) => (
            <Text key={text} style={[typography.small, { color: c.ink }]}>
              •  {text}
            </Text>
          ))}
        </View>
        {GRID_LEVELS.map((level, i) => {
          const open = gridLevelOpen(game, i);
          const record = game.levels[level.id];
          return (
            <Pressable
              key={level.id}
              testID={`gm-${level.id}`}
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
              <Text style={[typography.small, { color: c.inkSoft }]}>{level.about}</Text>
              <Text style={[typography.small, { color: c.inkSoft }]}>
                {!open
                  ? 'Finish the level before to open this'
                  : record
                    ? `Best ${clockTime(record.bestMs)} · played ${record.plays} ${record.plays === 1 ? 'time' : 'times'}`
                    : 'Not played yet'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>,
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 560, paddingHorizontal: space.md, gap: space.sm },
  wideColumn: { maxWidth: 1000 },
  split: { flex: 1, width: '100%', flexDirection: 'row', gap: space.md, paddingHorizontal: space.md },
  boardSide: { justifyContent: 'center' },
  panel: { flex: 1, gap: space.sm, minWidth: 260 },
  top: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: space.md },
  quit: { width: 30, height: 40, alignItems: 'center', justifyContent: 'center' },
  quitText: { fontSize: 18, fontWeight: '700' },
  clock: { fontSize: 18, fontWeight: '700' },
  grow: { flex: 1 },
  task: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm, gap: 2, minHeight: 78, justifyContent: 'center' },
  taskText: { fontSize: 19, lineHeight: 24, fontWeight: '800' },
  info: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  nameBox: { minWidth: 52, height: 30, borderWidth: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  name: { fontSize: 15, fontWeight: '700' },
  centre: { textAlign: 'center' },
  centred: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingVertical: space.md },
  card: { alignSelf: 'stretch', borderWidth: 1, borderRadius: radius.md, padding: space.md, gap: 6 },
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
