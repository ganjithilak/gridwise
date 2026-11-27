import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { defaultCourse } from '@/content';
import { GameKeyboard } from '@/game/GameKeyboard';
import { freshSeed } from '@/game/random';
import { clockTime } from '@/game/records';
import {
  answerLabel,
  explainMiss,
  fromKeyName,
  GAME_LEVELS,
  hintFor,
  holdsFor,
  isRight,
  levelOpen,
  levelSkills,
  roundFor,
  shortcutById,
  shortcutsAt,
  type RealKey,
  type TrialTask,
} from '@/game/speedTrial';
import { lessonTeaching } from '@/game/taught';
import { Choice, ComputerChoice, GameFrame, GameResults, GameTop, stars, useLeaveGame } from '@/game/ui/GameParts';
import { useGame } from '@/game/ui/useGame';
import { now } from '@/lib/clock';
import { buzz } from '@/lib/feedback';
import type { PressKey } from '@/spreadsheet/shortcuts';
import { mono, radius, space, type as typography, useTheme } from '@/theme';

type Mode = 'practice' | 'timed';

interface Round {
  level: number;
  mode: Mode;
  tasks: TrialTask[];
  at: number;
  startedAt: number;
  /** The task in hand has been got wrong, so it gets its full hint and no longer counts as first time. */
  missed: boolean;
  firstTry: number;
  known: string[];
}

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Keys shown as caps: "Ctrl" "+" "C", for recognition tasks. */
function Caps({ keys }: { keys: string[] }) {
  const c = useTheme();
  return (
    <View style={styles.caps} accessible accessibilityLabel={keys.join(' plus ')}>
      {keys.map((k, i) => (
        <View key={`${k}${i}`} style={styles.capWrap}>
          {i > 0 ? <Text style={[styles.plus, { color: c.inkSoft }]}>+</Text> : null}
          <View style={[styles.cap, { backgroundColor: c.surface, borderColor: c.outline }]}>
            <Text style={[styles.capText, { color: c.ink, fontFamily: mono }]}>{k}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Speed Trial: the keys game. Execution (an action is named; press its keys) and recognition
 * (keys are shown; name the action). Practice has no clock; Timed keeps a best time. Stars
 * are for accuracy only. Levels open with the lessons that teach their keys.
 */
export default function SpeedTrialScreen() {
  const c = useTheme();
  const leave = useLeaveGame();
  const { height } = useWindowDimensions();
  const g = useGame('trial');
  const [mode, setMode] = useState<Mode>('practice');
  const [round, setRound] = useState<Round | null>(null);
  const [done, setDone] = useState<(ReturnType<typeof g.finish> & { ms: number; level: number; mode: Mode; asked: number; firstTry: number }) | null>(null);
  const [held, setHeld] = useState<readonly RealKey[]>([]);
  const [said, setSaid] = useState<string | null>(null);
  const [wrongKeys, setWrongKeys] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const finish = g.finish;
  const timed = round?.mode === 'timed';
  useEffect(() => {
    if (!round || !timed) return;
    const tick = setInterval(() => setElapsed(now() - round.startedAt), 100);
    return () => clearInterval(tick);
  }, [round, timed]);

  useEffect(() => {
    if (wrongKeys.length === 0) return;
    const clear = setTimeout(() => setWrongKeys([]), 500);
    return () => clearTimeout(clear);
  }, [wrongKeys]);

  const start = (level: number, m: Mode = mode) => {
    setDone(null);
    setHeld([]);
    setSaid(null);
    setPicked(null);
    setElapsed(0);
    setRound({ level, mode: m, tasks: roundFor(level, freshSeed(), g.taught), at: 0, startedAt: now(), missed: false, firstTry: 0, known: [] });
  };

  const advance = useCallback(
    (r: Round, rightFirst: boolean, shortcutId: string) => {
      const firstTry = r.firstTry + (rightFirst ? 1 : 0);
      const known = rightFirst && r.tasks[r.at].kind === 'press' ? [...r.known, shortcutId] : r.known;
      setHeld([]);
      setSaid(null);
      setPicked(null);
      if (r.at + 1 < r.tasks.length) {
        setRound({ ...r, at: r.at + 1, missed: false, firstTry, known });
        return;
      }
      const ms = now() - r.startedAt;
      const levelId = GAME_LEVELS[r.level].id;
      const outcome = finish({ ms, asked: r.tasks.length, firstTry, timed: r.mode === 'timed', known }, levelId);
      setRound(null);
      setDone({ ...outcome, ms, level: r.level, mode: r.mode, asked: r.tasks.length, firstTry });
    },
    [finish],
  );

  const answer = useCallback(
    (holding: readonly RealKey[], key: PressKey) => {
      if (!round || !g.computer || round.tasks[round.at].kind !== 'press') return;
      const task = shortcutById(round.tasks[round.at].id);
      setHeld([]);
      if (!isRight(task, g.computer, holding, key)) {
        buzz('wrong');
        setWrongKeys([key, ...holding]);
        setSaid(explainMiss(task, g.computer, holding, key));
        setRound({ ...round, missed: true });
        return;
      }
      buzz('correct');
      advance(round, !round.missed, task.id);
    },
    [round, g.computer, advance],
  );

  // A real keyboard, where there is one: real keys are the point of the game.
  const live = useRef(answer);
  useEffect(() => {
    live.current = answer;
  });
  const playing = round !== null;
  useEffect(() => {
    if (Platform.OS !== 'web' || !playing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (['Control', 'Meta', 'Shift', 'Alt'].includes(e.key)) return;
      const key = fromKeyName(e.key);
      if (!key || e.altKey) return;
      // Stops the browser acting on Ctrl + A, Space, Tab and the rest.
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

  if (!g.hydrated) return <View style={[styles.fill, { backgroundColor: c.bg }]} />;
  if (!g.computer) return <ComputerChoice onChoose={g.setComputer} onLeave={leave} />;
  const computer = g.computer;

  if (round) {
    const item = round.tasks[round.at];
    const task = shortcutById(item.id);
    const hint = hintFor(g.data.game, task.id, round.missed);
    const pointOut = { holds: hint === 'none' ? [] : holdsFor(task, computer), key: hint === 'full' ? task.key : null };
    const keys = answerLabel(task, computer).split(' + ');
    const keyHeight = height < 560 ? 30 : height < 720 ? 36 : 40;

    const pick = (option: string) => {
      if (picked) return;
      setPicked(option);
      if (option === task.does) {
        buzz('correct');
        setTimeout(() => advance(round, !round.missed, task.id), 500);
      } else {
        buzz('wrong');
        setSaid(`Not “${option}”. ${sentence(task.cue)}.`);
        setRound({ ...round, missed: true });
        setTimeout(() => setPicked(null), 700);
      }
    };

    return (
      <GameFrame wide>
        <GameTop
          onClose={() => setRound(null)}
          at={round.at}
          total={round.tasks.length}
          right={
            timed ? (
              <Text style={[styles.clock, { color: c.ink, fontFamily: mono }]} testID="trial-clock">
                {clockTime(elapsed)}
              </Text>
            ) : null
          }
        />
        <View style={styles.middle}>
          <View style={[styles.task, { backgroundColor: c.surface, borderColor: said ? c.bad : c.line }]} testID="trial-task">
            {item.kind === 'press' ? (
              <>
                <Text style={[typography.label, { color: c.inkSoft }]}>PRESS THE KEYS TO</Text>
                <Text style={[styles.taskText, { color: c.ink }]}>{task.task}</Text>
              </>
            ) : (
              <>
                <Text style={[typography.label, { color: c.inkSoft }]}>WHAT DO THESE KEYS DO?</Text>
                <Caps keys={keys} />
              </>
            )}
          </View>
          <Text style={[typography.small, styles.centre, styles.help, { color: said ? c.bad : c.inkSoft }]} testID="trial-help">
            {said ??
              (item.kind === 'name'
                ? 'Choose what they do.'
                : hint === 'full'
                  ? task.hold.length > 0
                    ? 'The keys are lit. Tap the first: it stays held. Then the second.'
                    : 'The key is lit.'
                  : hint === 'first'
                    ? 'Only the first key is lit now. Which goes with it?'
                    : 'No hint for this one now.')}
          </Text>
        </View>
        {item.kind === 'name' ? (
          <View style={styles.options}>
            {item.options?.map((o) => (
              <Choice key={o} label={sentence(o)} testID={`name-${o}`} state={picked === o ? (o === task.does ? 'right' : 'wrong') : 'idle'} onPress={() => pick(o)} />
            ))}
          </View>
        ) : (
          <GameKeyboard
            computer={computer}
            held={held}
            hint={pointOut}
            wrong={wrongKeys}
            onHold={(key) => {
              buzz('key');
              setHeld((h) => (h.includes(key) ? h.filter((k) => k !== key) : [...h, key]));
            }}
            onKey={(key) => answer(held, key)}
            keyHeight={keyHeight}
          />
        )}
      </GameFrame>
    );
  }

  if (done) {
    const next = GAME_LEVELS.findIndex((_, i) => i > done.level && levelOpen(g.taught, i));
    return (
      <GameResults
        {...done}
        best={done.mode === 'timed' ? done.record.bestTimedMs : null}
        note={`${GAME_LEVELS[done.level].title} · ${done.mode === 'timed' ? 'timed' : 'practice'}`}
        onAgain={() => start(done.level, done.mode)}
        onLeave={() => setDone(null)}
        leaveLabel="All levels"
        extra={next >= 0 ? <Choice testID="trial-next" label={`Next level: ${GAME_LEVELS[next].title}`} onPress={() => start(next, done.mode)} /> : null}
      />
    );
  }

  return (
    <GameFrame>
      <GameTop onClose={leave} closeLabel="Back to Games" />
      <Text style={[typography.title, { color: c.ink }]}>Speed Trial</Text>
      <Text style={[typography.body, { color: c.inkSoft }]}>
        An action is named: press its keys. Or keys are shown: say what they do. Stars are for accuracy, never for speed.
      </Text>
      <View style={styles.modes} accessibilityRole="radiogroup">
        {(
          [
            { id: 'practice', title: 'Practice', detail: 'No clock' },
            { id: 'timed', title: 'Timed', detail: 'Keeps a best time' },
          ] as const
        ).map((m) => {
          const on = mode === m.id;
          return (
            <Pressable
              key={m.id}
              testID={`mode-${m.id}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setMode(m.id)}
              style={[styles.mode, { backgroundColor: on ? c.accentSoft : c.surface, borderColor: on ? c.accent : c.outline }]}
            >
              <Text style={[typography.bodyStrong, { color: on ? c.accent : c.ink }]}>{m.title}</Text>
              <Text style={[typography.small, { color: c.inkSoft }]}>{m.detail}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView style={styles.fill} contentContainerStyle={styles.levels} showsVerticalScrollIndicator={false}>
        {GAME_LEVELS.map((level, i) => {
          const open = levelOpen(g.taught, i);
          const record = g.data.game.levels[level.id];
          const fresh = level.adds.map((id) => answerLabel(shortcutById(id), computer)).join(',  ');
          const opener = levelSkills(i)
            .filter((s) => !g.taught.has(s))
            .map((s) => lessonTeaching(defaultCourse, s))
            .filter(Boolean)
            .join(' and ');
          return (
            <Pressable
              key={level.id}
              testID={`trial-${level.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Level ${i + 1}: ${level.title}. ${open ? (record ? `Best ${record.bestAccuracy ?? 0}% first time` : 'Not played yet') : `Opens after ${opener}`}`}
              accessibilityState={{ disabled: !open }}
              disabled={!open}
              onPress={() => start(i)}
              style={[styles.level, { backgroundColor: c.surface, borderColor: c.outline, opacity: open ? 1 : 0.5 }]}
            >
              <View style={styles.levelHead}>
                <Text style={[typography.label, { color: c.accent }]}>LEVEL {i + 1}</Text>
                <Text style={[styles.levelStars, { color: c.spark }]}>{record ? stars(record.bestStars) : ''}</Text>
              </View>
              <Text style={[typography.heading, { color: c.ink }]}>{level.title}</Text>
              <Text style={[typography.small, { color: c.inkSoft, fontFamily: mono }]}>{fresh}</Text>
              <Text style={[typography.small, { color: c.inkSoft }]}>
                {!open
                  ? `Opens after ${opener}`
                  : record
                    ? `Best ${record.bestAccuracy ?? 0}% first time${record.bestTimedMs ? ` · timed ${clockTime(record.bestTimedMs)}` : ''} · played ${record.plays}×`
                    : `${shortcutsAt(i, g.taught).length} actions in play. Not played yet.`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  clock: { fontSize: 18, fontWeight: '700' },
  middle: { flex: 1, justifyContent: 'center', gap: space.sm },
  task: { borderWidth: 2, borderRadius: radius.lg, padding: space.lg, gap: space.sm, alignItems: 'center' },
  taskText: { fontSize: 22, lineHeight: 28, fontWeight: '800', textAlign: 'center' },
  help: { minHeight: 40 },
  centre: { textAlign: 'center' },
  options: { gap: space.sm },
  caps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  capWrap: { flexDirection: 'row', alignItems: 'center' },
  plus: { fontSize: 18, fontWeight: '700', marginHorizontal: 8 },
  cap: { minWidth: 54, height: 50, paddingHorizontal: 12, borderWidth: 1, borderBottomWidth: 4, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  capText: { fontSize: 18, fontWeight: '800' },
  modes: { flexDirection: 'row', gap: space.sm },
  mode: { flex: 1, borderWidth: 1.5, borderRadius: radius.md, padding: space.sm, gap: 1, userSelect: 'none' },
  levels: { gap: space.sm, paddingBottom: space.md },
  level: { borderWidth: 1, borderBottomWidth: 4, borderRadius: radius.lg, padding: space.md, gap: 2, userSelect: 'none' },
  levelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelStars: { fontSize: 16, letterSpacing: 2 },
});
