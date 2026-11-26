import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import type { Expression } from '@/components/Mascot';
import { buzz } from '@/lib/feedback';
import type { Side } from '@/progress/saved';
import { SheetController } from '@/spreadsheet/controller';
import { BarFrame, Fx } from '@/spreadsheet/FormulaBar';
import { Grid } from '@/spreadsheet/Grid';
import { Workbench } from '@/spreadsheet/Workbench';
import { forComputer, type Computer } from '@/spreadsheet/shortcuts';
import { useSheet } from '@/spreadsheet/useSheet';
import { mono, radius, space, useTheme } from '@/theme';

import type { CheckOutcome } from '../checks';
import { correctOptions, isRightPick, picksSeveral } from '../pick';
import { SHOW_ME_AFTER, type Attempt } from '../session';
import type { ExerciseSnapshot, Phase } from '../snapshot';
import type { PickExercise as PickKind } from '../types';
import { praiseFor } from '../voice';
import type { Metrics, StepNav } from './GridExercise';
import { MessageCard, type Tone } from './MessageCard';
import { SplitScreen } from './SplitScreen';

export interface PickExerciseProps {
  exercise: PickKind;
  computer?: Computer;
  attempt: Attempt;
  willComeBack: boolean;
  metrics: Metrics;
  saved?: ExerciseSnapshot;
  review?: boolean;
  onCheck: (status: CheckOutcome['status']) => void;
  onShowMe: () => void;
  onContinue: () => void;
  onPhase?: (phase: Phase) => void;
  onNavChange?: (nav: StepNav) => void;
  onSnapshot?: (snapshot: ExerciseSnapshot, leaving: boolean) => void;
  onSheetSide?: (side: Side) => void;
}

const BLANK_SHEET = { cols: 1, rows: 1 };

/**
 * A question with options to choose from: either about an idea, or "what will this
 * formula show?". The sheet, when there is one, is only there to be read.
 */
export function PickExercise({
  exercise,
  computer = 'win',
  attempt,
  willComeBack,
  metrics,
  saved,
  review = false,
  onCheck,
  onShowMe,
  onContinue,
  onPhase,
  onNavChange,
  onSnapshot,
  onSheetSide,
}: PickExerciseProps) {
  const c = useTheme();
  const say = (text: string) => forComputer(text, computer);
  const right = correctOptions(exercise);
  const several = picksSeveral(exercise);
  const predicting = exercise.type === 'predict-output';

  const [controller] = useState(
    () => new SheetController(exercise.sheet ?? BLANK_SHEET, predicting ? exercise.cell : 'A1'),
  );
  const sheetState = useSheet(controller);

  // A finished question reopens showing the right answer; an unfinished one, what was chosen so far.
  const opened: Phase = saved?.phase === 'correct' || saved?.phase === 'shown' ? saved.phase : review ? 'correct' : 'do';
  const [phase, setPhaseState] = useState<Phase>(opened);
  const [picked, setPicked] = useState<number[]>(() => (opened === 'do' ? (saved?.picked ?? []) : right));
  /** The options that were checked and found wrong, so they can be marked. */
  const [wrong, setWrong] = useState<number[]>([]);
  const [latest, setLatest] = useState<'outcome' | 'hint' | null>(opened === 'do' && attempt.hintsShown > 0 ? 'hint' : null);
  const praise = praiseFor(exercise.id, attempt, exercise.praise);

  const setPhase = useCallback(
    (next: Phase) => {
      setPhaseState(next);
      onPhase?.(next);
    },
    [onPhase],
  );
  useEffect(() => {
    onPhase?.(opened);
    // Once, as the question opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hintsSeen = useRef(attempt.hintsShown);
  useEffect(() => {
    if (attempt.hintsShown > hintsSeen.current) setLatest('hint');
    hintsSeen.current = attempt.hintsShown;
  }, [attempt.hintsShown]);

  const doing = phase === 'do';

  const choose = (index: number) => {
    if (!doing) return;
    buzz('key');
    setWrong([]);
    setLatest((now) => (now === 'outcome' ? null : now));
    setPicked((now) => {
      if (!several) return [index];
      return now.includes(index) ? now.filter((i) => i !== index) : [...now, index];
    });
  };

  const check = () => {
    if (picked.length === 0) return;
    if (isRightPick(exercise, picked)) {
      onCheck('pass');
      buzz('correct');
      setWrong([]);
      setPhase('correct');
      return;
    }
    onCheck('fail');
    buzz('wrong');
    setWrong(picked.filter((i) => !right.includes(i)));
    setLatest('outcome');
  };

  const showMe = () => {
    onShowMe();
    setPicked(right);
    setWrong([]);
    setPhase('shown');
  };

  // Forward is Continue once the question is answered. There are no steps to go back through.
  const answered = phase === 'correct' || phase === 'shown';
  const forward = useRef(onContinue);
  useEffect(() => {
    forward.current = onContinue;
  });
  const goForward = useCallback(() => forward.current(), []);
  useEffect(() => {
    onNavChange?.({ back: null, forward: answered ? goForward : null });
  }, [answered, goForward, onNavChange]);
  useEffect(() => () => onNavChange?.({ back: null, forward: null }), [onNavChange]);

  useEffect(() => {
    if (!review) onSnapshot?.({ phase, stop: 0, work: null, picked }, false);
  }, [phase, picked, review, onSnapshot]);

  // ---- what the card says ------------------------------------------------------------
  const hint = attempt.hintsShown > 0 ? exercise.hints[attempt.hintsShown - 1] : null;
  let card: { mood: Expression; tone: Tone; text: string };
  if (phase === 'correct') card = { mood: 'cheering', tone: 'task', text: exercise.prompt };
  else if (phase === 'shown') card = { mood: 'thinking', tone: 'task', text: exercise.prompt };
  else if (latest === 'outcome' && wrong.length > 0) {
    const missing = several && picked.every((i) => right.includes(i));
    card = { mood: 'oops', tone: 'bad', text: missing ? 'Nearly. There is more than one right answer here.' : 'Not that one. Have another look.' };
  } else if (hint && latest === 'hint') card = { mood: 'thinking', tone: 'hint', text: hint };
  else card = { mood: 'neutral', tone: 'task', text: exercise.prompt };

  const offerShowMe = doing && attempt.wrongChecks >= SHOW_ME_AFTER && !attempt.solutionShown;
  const optionHeight = metrics.keyHeight;

  const cardView = <MessageCard mood={card.mood} tone={card.tone} text={say(card.text)} height={metrics.cardHeight} lines={metrics.cardLines} />;

  // "What will this show?" puts the formula in the bar; a question about a sheet only reads it.
  const formulaView = predicting ? (
    <BarFrame name={exercise.cell} height={metrics.barHeight}>
      <Fx />
      <Text testID="predict-formula" numberOfLines={1} style={[styles.formulaText, { color: c.ink, fontFamily: mono }]}>
        {exercise.formula}
      </Text>
    </BarFrame>
  ) : null;

  const sheetView = exercise.sheet ? (
    <Workbench bar={formulaView}>
      <Grid controller={controller} state={sheetState} locked />
    </Workbench>
  ) : null;

  const optionsView = (
      <View style={styles.options} accessibilityRole={several ? undefined : 'radiogroup'}>
        {exercise.options.map((option, i) => {
          const chosen = picked.includes(i);
          const isWrong = wrong.includes(i);
          const isRight = answered && right.includes(i);
          const edge = isWrong ? c.bad : isRight || chosen ? c.accent : c.outline;
          const fill = isWrong ? c.badSoft : isRight || chosen ? c.accentSoft : c.surface;
          return (
            <Pressable
              key={i}
              testID={`option-${i}`}
              accessibilityRole={several ? 'checkbox' : 'radio'}
              accessibilityLabel={say(option)}
              accessibilityState={{ checked: chosen, disabled: !doing }}
              // Said out loud by a screen reader: which option is chosen (or, once answered, right).
              aria-checked={chosen || isRight}
              disabled={!doing}
              onPress={() => choose(i)}
              style={[styles.option, { minHeight: optionHeight, backgroundColor: fill, borderColor: edge }]}
            >
              <View style={[several ? styles.box : styles.dot, { borderColor: edge, backgroundColor: chosen || isRight ? edge : 'transparent' }]} />
              <Text style={[styles.optionText, { color: c.ink, fontFamily: predicting ? mono : undefined }]}>{say(option)}</Text>
            </Pressable>
          );
        })}
      </View>
  );

  const noteView = answered ? (
    <View
      style={[styles.note, { backgroundColor: phase === 'correct' ? c.goodSoft : c.surface }, phase === 'correct' && { borderWidth: 1.5, borderColor: c.good }]}
      testID={phase === 'correct' ? 'feedback-good' : 'feedback-plain'}
    >
      <Text style={[styles.noteTitle, { color: phase === 'correct' ? c.good : c.ink }]}>
        {phase === 'correct' ? praise : willComeBack ? "Here it is. You'll get another go at the end." : 'Here it is.'}
      </Text>
      <Text style={[styles.noteText, { color: c.ink }]} numberOfLines={3}>
        {say(exercise.explain)}
      </Text>
    </View>
  ) : null;

  const buttonsView = (
    <View style={styles.buttons}>
      {offerShowMe ? <Button kind="secondary" label="Show me" onPress={showMe} testID="show-me" style={styles.side} /> : null}
      {answered ? (
        <Button label="Continue" onPress={onContinue} testID="continue" style={styles.main} />
      ) : (
        <Button label="Check" onPress={check} testID="check" disabled={picked.length === 0} style={styles.main} />
      )}
    </View>
  );

  if (metrics.layout !== 'stack') {
    // On its side there is less height, so the options scroll if they must and the button stays put.
    const answering = (
      <>
        {cardView}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {optionsView}
          {noteView}
        </ScrollView>
        {buttonsView}
      </>
    );
    if (!sheetView) return <View style={styles.alone}>{answering}</View>;
    return (
      <SplitScreen
        layout={metrics.layout}
        onSheetSide={onSheetSide}
        sheet={sheetView}
        lesson={answering}
      />
    );
  }

  return (
    <View style={styles.fill}>
      {cardView}
      {sheetView ?? <View style={styles.sheet} />}
      {optionsView}
      {noteView}
      {buttonsView}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: space.sm },
  // A question with no sheet, on a wide screen: one column, kept to a comfortable reading width.
  alone: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', gap: space.sm },
  scroll: { flex: 1 },
  scrollContent: { gap: space.sm },
  formulaText: { flex: 1, alignSelf: 'center', paddingRight: 10, fontSize: 16 },
  sheet: { flex: 1, minHeight: 0 },
  options: { gap: 6 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderRadius: radius.md,
    userSelect: 'none',
  },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  box: { width: 16, height: 16, borderRadius: 4, borderWidth: 2 },
  optionText: { flex: 1, fontSize: 15, lineHeight: 20 },
  note: { borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8, gap: 2 },
  noteTitle: { fontSize: 16, fontWeight: '800' },
  noteText: { fontSize: 14, lineHeight: 19 },
  buttons: { flexDirection: 'row', gap: 10 },
  side: { flex: 1 },
  main: { flex: 2 },
});
