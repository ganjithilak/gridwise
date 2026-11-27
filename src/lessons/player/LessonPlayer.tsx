import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buzz } from '@/lib/feedback';
import { now } from '@/lib/clock';
import { REVIEW_ID } from '@/progress/finish';
import { lessonIdOf } from '@/progress/mastery';
import { fromSaved, toSaved, type Run, type SavedRun, type Side } from '@/progress/saved';
import type { Computer } from '@/spreadsheet/shortcuts';
import { MOTION_MS, radius, space, TOUCH, useTheme } from '@/theme';

import {
  advance,
  currentItem,
  freshAttempt,
  isFinished,
  itemKey,
  progressOf,
  recordCheck,
  revealHint,
  showSolution,
  startSession,
  summarize,
  type Playable,
  type Session,
  type Summary,
} from '../session';
import { sameSnapshot, type ExerciseSnapshot } from '../snapshot';
import { isScored, type Exercise, type LessonStep } from '../types';
import { ExerciseView } from './exercises';
import type { Metrics, Phase, StepNav } from './GridExercise';
import { HintButton } from './HintButton';
import { ProgressBar } from './ProgressBar';
import { ScreenSky } from '@/world/ui/ScreenSky';

interface Props {
  /** A lesson, a unit test or a practice round. */
  lesson: Playable;
  /** Whether shortcuts are shown with Ctrl or with Cmd. */
  computer?: Computer;
  /** Where this lesson was left last time, if it was left part-way through. */
  resume?: SavedRun | null;
  /** Called on every step with what to keep, so the lesson can be reopened at the same place. */
  onSave?: (run: SavedRun) => void;
  onFinish: (summary: Summary) => void;
  onQuit: () => void;
  /** With the screen on its side: which half the sheet takes. The lesson takes the other. */
  sheetSide?: Side;
  onSheetSide?: (side: Side) => void;
}

/** A screen this much wider than it is tall gets the split layout: sheet on one side, lesson on the other. */
const SPLIT_FROM = 560;

/** Sizes that depend on how tall the phone is. Small phones get the 40 pt minimum. */
function metricsFor(height: number, layout: Metrics['layout']): Metrics {
  const roomy = height >= 740;
  return {
    keyHeight: roomy ? TOUCH.ideal : TOUCH.min,
    barHeight: roomy ? TOUCH.ideal : TOUCH.min,
    cardHeight: roomy ? 76 : 54,
    cardLines: roomy ? 3 : 2,
    layout,
  };
}

/** Which of the three steps of a lesson is on screen: being shown, practising, or a practical task. */
function stepOf(exercise: Exercise, phase: Phase): LessonStep {
  if (exercise.type === 'demo' && (phase === 'watch' || phase === 'watched')) return 'teach';
  return exercise.apply ? 'apply' : 'lesson';
}

const STEP_NAMES: Record<LessonStep, string> = { teach: 'Teach', lesson: 'Lesson', apply: 'Apply' };
const STEPS: readonly LessonStep[] = ['teach', 'lesson', 'apply'];

const NO_NAV: StepNav = { back: null, forward: null };
const NO_ATTEMPT = freshAttempt();
const noop = () => {};

/**
 * Runs one lesson from the first exercise to the last, then reports how it went.
 * The learner can step back to anything they have already seen and forward again,
 * and the lesson reopens where it was left.
 */
export function LessonPlayer({ lesson, computer = 'win', resume, onSave, onFinish, onQuit, sheetSide = 'left', onSheetSide }: Props) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // On its side (or on a computer) there is room for the sheet and the lesson side by side.
  const split = width > height && width >= SPLIT_FROM;
  const metrics = metricsFor(height - insets.top - insets.bottom, split ? (sheetSide === 'left' ? 'sheet-left' : 'sheet-right') : 'stack');

  const [run, setRun] = useState<Run>(
    () => (resume ? fromSaved(resume, lesson, now()) : null) ?? { session: startSession(lesson, now()), snapshots: {} },
  );
  const { session } = run;
  const update = useCallback(
    (change: (s: Session) => Session) => setRun((r) => ({ ...r, session: change(r.session) })),
    [],
  );

  /** Which finished exercise is being looked at again. Null means the one still to do. */
  const [viewing, setViewing] = useState<number | null>(null);
  const reviewing = viewing !== null && viewing < session.done.length;
  const index = reviewing ? viewing : session.done.length;
  const item = reviewing ? session.done[viewing] : currentItem(session);
  const key = item ? itemKey(item) : '';

  const [phase, setPhase] = useState<Phase>('do');
  /** How to skip the demonstration on screen, when there is one. */
  const [skip, setSkip] = useState<(() => void) | null>(null);
  const onSkipChange = useCallback((fn: (() => void) | null) => setSkip(() => fn), []);
  /** The steps back and forward that the exercise on screen has within itself. */
  const [nav, setNav] = useState<StepNav>(NO_NAV);

  // Keep the lesson on the device after every change.
  const finished = isFinished(session);
  const latest = useRef(run);
  useEffect(() => {
    latest.current = run;
    if (!isFinished(run.session)) onSave?.(toSaved(run, now()));
  }, [run, onSave]);

  const reported = useRef(false);
  useEffect(() => {
    if (!finished || reported.current) return;
    reported.current = true;
    buzz('complete');
    onFinish(summarize(session, lesson, now()));
  }, [finished, session, lesson, onFinish]);

  // The combo chip gives one small bounce each time the run grows.
  const bounce = useState(() => new Animated.Value(1))[0];
  useEffect(() => {
    if (session.combo < 2) return;
    bounce.setValue(1.3);
    Animated.timing(bounce, { toValue: 1, duration: MOTION_MS, useNativeDriver: true }).start();
  }, [session.combo, bounce]);

  const onCheck = useCallback((status: 'pass' | 'soft' | 'fail') => update((s) => recordCheck(s, status)), [update]);
  const onShowMe = useCallback(() => update((s) => showSolution(s)), [update]);
  const onContinue = useCallback(() => update((s) => advance(s, now())), [update]);
  const onHint = useCallback(() => update((s) => revealHint(s)), [update]);

  const onSnapshot = useCallback(
    (snapshot: ExerciseSnapshot, leaving: boolean) => {
      setRun((r) => (sameSnapshot(r.snapshots[key], snapshot) ? r : { ...r, snapshots: { ...r.snapshots, [key]: snapshot } }));
      if (!leaving) return;
      // The lesson may be closing, so this one is written straight away as well.
      const r = latest.current;
      if (isFinished(r.session) || sameSnapshot(r.snapshots[key], snapshot)) return;
      onSave?.(toSaved({ ...r, snapshots: { ...r.snapshots, [key]: snapshot } }, now()));
    },
    [key, onSave],
  );

  if (!item) return <View style={[styles.screen, { backgroundColor: c.bg }]} />;

  // Back and forward move one step at a time: through a demonstration, then between exercises.
  const lookAt = (target: number) => setViewing(target < session.done.length ? target : null);
  const back = nav.back ?? (index > 0 ? () => lookAt(index - 1) : null);
  const forward = nav.forward;
  const step = stepOf(item.exercise, phase);
  // A unit test or a practice round has no Teach, Lesson, Apply: it says what it is instead.
  const kindLabel = lesson.id.endsWith('.test') ? 'Test' : lesson.id === REVIEW_ID || lessonIdOf(lesson.id) !== lesson.id ? 'Practice' : null;
  const swapSides = () => onSheetSide?.(sheetSide === 'left' ? 'right' : 'left');

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: c.bg,
          paddingTop: insets.top + 4,
          paddingBottom: insets.bottom + space.sm,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <ScreenSky variant="quiet" />
      <View style={[styles.column, split && styles.wideColumn]}>
        <View style={styles.top}>
          <Pressable
            testID="quit-lesson"
            accessibilityRole="button"
            accessibilityLabel="Leave the lesson. Your place is kept."
            onPress={onQuit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 2 }}
            style={styles.quit}
          >
            <Text style={[styles.quitText, { color: c.inkSoft }]}>✕</Text>
          </Pressable>
          <Arrow testID="step-back" direction="back" label="Go back a step" onPress={back} colour={c.ink} />
          <View style={styles.progress}>
            <View style={styles.progressTrack}>
              <ProgressBar value={progressOf(session)} />
            </View>
            {/* Teach, Lesson, Apply: where in the lesson's three steps this is. */}
            <View
              testID="lesson-step"
              accessibilityRole="text"
              accessibilityLabel={kindLabel ?? `Step: ${STEP_NAMES[step]}. A lesson goes Teach, Lesson, Apply.`}
              style={styles.steps}
            >
              {kindLabel ? (
                <Text style={[styles.stepName, { color: c.accent }]}>{kindLabel.toUpperCase()}</Text>
              ) : null}
              {(kindLabel ? [] : STEPS).map((name) =>
                name === step || split ? (
                  <Text key={name} style={[styles.stepName, { color: name === step ? c.accent : c.inkSoft, opacity: name === step ? 1 : 0.55 }]}>
                    {STEP_NAMES[name].toUpperCase()}
                  </Text>
                ) : (
                  <View key={name} style={[styles.stepDot, { backgroundColor: c.outline }]} />
                ),
              )}
            </View>
          </View>
          <Arrow testID="step-forward" direction="forward" label="Go forward a step" onPress={forward} colour={c.ink} />
          {reviewing ? (
            <View testID="looking-back" style={[styles.chip, { backgroundColor: c.sunken }]}>
              <Text style={[styles.chipText, { color: c.inkSoft }]}>Looking back</Text>
            </View>
          ) : session.combo >= 2 ? (
            <Animated.View testID="combo" style={[styles.chip, { backgroundColor: c.sparkSoft, transform: [{ scale: bounce }] }]}>
              <Text style={[styles.chipText, { color: c.hint }]}>{session.combo} in a row</Text>
            </Animated.View>
          ) : null}
          {phase === 'do' && !reviewing ? <HintButton shown={session.attempt.hintsShown} onPress={onHint} /> : null}
          {skip ? (
            <Pressable
              testID="skip-demo"
              accessibilityRole="button"
              accessibilityLabel="Skip the demonstration"
              onPress={skip}
              hitSlop={8}
              style={styles.skip}
            >
              <Text style={[styles.skipText, { color: c.inkSoft }]}>Skip</Text>
            </Pressable>
          ) : null}
          {split && onSheetSide ? (
            <Pressable
              testID="swap-sides"
              accessibilityRole="button"
              accessibilityLabel={`Swap sides: put the sheet on the ${sheetSide === 'left' ? 'right' : 'left'}`}
              onPress={swapSides}
              hitSlop={8}
              style={[styles.swap, { borderColor: c.outline }]}
            >
              <Text style={[styles.swapText, { color: c.inkSoft }]}>⇄</Text>
            </Pressable>
          ) : null}
        </View>

        <ExerciseView
          // A finished exercise opened again is a separate screen from the one still to do.
          key={`${key}:${reviewing ? 'review' : 'live'}`}
          exercise={item.exercise}
          hideKeys={lesson.hideKeys}
          computer={computer}
          attempt={reviewing ? NO_ATTEMPT : session.attempt}
          willComeBack={!item.isRetry && isScored(item.exercise)}
          metrics={metrics}
          saved={run.snapshots[key]}
          review={reviewing}
          onCheck={reviewing ? noop : onCheck}
          onShowMe={reviewing ? noop : onShowMe}
          onContinue={reviewing ? () => lookAt(index + 1) : onContinue}
          onPhase={setPhase}
          onSkipChange={onSkipChange}
          onNavChange={setNav}
          onSnapshot={onSnapshot}
          onSheetSide={onSheetSide}
        />
      </View>
    </View>
  );
}

interface ArrowProps {
  direction: 'back' | 'forward';
  label: string;
  /** Null when there is nowhere to go in this direction. */
  onPress: (() => void) | null;
  colour: string;
  testID: string;
}

/** A chevron drawn from two borders, so it stays sharp at any size and needs no icon file. */
function Arrow({ direction, label, onPress, colour, testID }: ArrowProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress ?? undefined}
      hitSlop={{ top: 8, bottom: 8, left: 3, right: 3 }}
      style={[styles.arrow, { opacity: onPress ? 1 : 0.22 }]}
    >
      <View
        style={[
          styles.chevron,
          { borderColor: colour },
          direction === 'back' ? styles.chevronBack : styles.chevronForward,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 480, paddingHorizontal: space.md, gap: space.sm },
  // Wide enough for two halves, but not so wide on a computer that the eye has to travel.
  wideColumn: { maxWidth: 1000 },
  top: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 6 },
  progress: { flex: 1, gap: 4 },
  progressTrack: { flexDirection: 'row' },
  steps: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 12 },
  stepName: { fontSize: 10, lineHeight: 12, fontWeight: '800', letterSpacing: 0.6 },
  stepDot: { width: 5, height: 5, borderRadius: 3 },
  swap: { width: 34, height: 28, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  swapText: { fontSize: 16, fontWeight: '700' },
  quit: { width: 30, height: 36, alignItems: 'center', justifyContent: 'center' },
  quitText: { fontSize: 18, fontWeight: '700' },
  arrow: { width: 30, height: 36, alignItems: 'center', justifyContent: 'center' },
  chevron: { width: 11, height: 11, borderTopWidth: 2.5, borderRadius: 1 },
  chevronBack: { borderLeftWidth: 2.5, transform: [{ rotate: '-45deg' }], marginLeft: 4 },
  chevronForward: { borderRightWidth: 2.5, transform: [{ rotate: '45deg' }], marginRight: 4 },
  chip: { height: 26, paddingHorizontal: 10, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontWeight: '800' },
  skip: { height: 36, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontSize: 14, fontWeight: '700' },
});
