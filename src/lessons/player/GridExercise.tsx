import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import type { Expression } from '@/components/Mascot';
import { a1, parseRange, toA1 } from '@/engine';
import { buzz } from '@/lib/feedback';
import type { Side } from '@/progress/saved';
import { SheetController, type KeyId, type ShortcutId } from '@/spreadsheet/controller';
import { FormulaBar } from '@/spreadsheet/FormulaBar';
import { FormulaKeyboard, keyboardHeight } from '@/spreadsheet/FormulaKeyboard';
import { Grid } from '@/spreadsheet/Grid';
import { applySheetKey, listenForKeys, readKey, type KeyResult } from '@/spreadsheet/keyboard';
import { KeyCaps } from '@/spreadsheet/KeyCaps';
import { capSetFor, comboLabel, forComputer, modifierKey, type Computer } from '@/spreadsheet/shortcuts';
import { TokenTray } from '@/spreadsheet/TokenTray';
import { Toolbar } from '@/spreadsheet/Toolbar';
import { useSheet } from '@/spreadsheet/useSheet';
import { Workbench } from '@/spreadsheet/Workbench';
import { space } from '@/theme';

import { checkController, type CheckOutcome } from '../checks';
import { applyScript } from '../script';
import { SHOW_ME_AFTER, XP_PER_FIRST_TRY, type Attempt } from '../session';
import { isTurn, type ExerciseSnapshot, type Phase, type Work } from '../snapshot';
import { notYetFor, praiseFor, RIGHT_RESULT, shownFor } from '../voice';
import type { ScriptStep, SheetExercise } from '../types';
import { FeedbackSheet } from './FeedbackSheet';
import { MessageCard, type Tone } from './MessageCard';
import { lastStop } from './scriptRunner';
import { SplitScreen } from './SplitScreen';
import { useScriptPlayer } from './useScriptPlayer';

export type { Phase } from '../snapshot';

export interface Metrics {
  keyHeight: number;
  barHeight: number;
  cardHeight: number;
  cardLines: number;
  /**
   * `stack` is a phone held upright: everything in one column. On its side there is room
   * for the sheet on one half and the lesson on the other.
   */
  layout: 'stack' | 'sheet-left' | 'sheet-right';
}

/** One step back or forward within this exercise. Null when there is none in that direction. */
export interface StepNav {
  back: (() => void) | null;
  forward: (() => void) | null;
}

export interface GridExerciseProps {
  exercise: SheetExercise;
  /** A demonstration to play before the learner's turn. */
  watch?: readonly ScriptStep[];
  hideKeys?: readonly KeyId[];
  /** Whether shortcuts are shown with Ctrl or with Cmd. */
  computer?: Computer;
  attempt: Attempt;
  /** True if "Show me" will bring this exercise back at the end of the lesson. */
  willComeBack: boolean;
  metrics: Metrics;
  /** Where this exercise was left, if it has been open before. Read once, as it opens. */
  saved?: ExerciseSnapshot;
  /** An earlier, finished exercise being looked at again: it can be read but not changed. */
  review?: boolean;
  onCheck: (status: CheckOutcome['status']) => void;
  onShowMe: () => void;
  onContinue: () => void;
  onPhase?: (phase: Phase) => void;
  /** Told how to skip the demonstration while one is playing, and null when none is. */
  onSkipChange?: (skip: (() => void) | null) => void;
  /** Told how to step back and forward, whenever what is possible changes. */
  onNavChange?: (nav: StepNav) => void;
  /** Told where the exercise stands on every change, and once more (`leaving`) as it closes. */
  onSnapshot?: (snapshot: ExerciseSnapshot, leaving: boolean) => void;
  /** In the split layout: the lesson side was swiped across, so the sheet goes to this side. */
  onSheetSide?: (side: Side) => void;
}

/** The cell an exercise opens on: the one named, or for a built formula, the one it goes in. */
const openingCell = (exercise: SheetExercise): string =>
  exercise.select ?? (exercise.type === 'formula-build' ? exercise.cell : 'A1');

/** The cell to make a fuss of when the answer is right, if the checks are about one. */
function resultCell(exercise: SheetExercise): string | null {
  for (const check of exercise.checks) {
    if ('cell' in check) return check.cell;
    if ('range' in check) {
      const area = parseRange(check.range);
      if (area) return toA1(area.start);
    }
  }
  return null;
}

interface Opening {
  controller: SheetController;
  phase: Phase;
  /** The learner's turn, set aside while they look back at the demonstration. */
  parked: Work | null;
  /** A script to start playing straight away, and the step to start it at. */
  play: { script: 'watch' | 'solution'; from: number } | null;
}

/** Works out how an exercise opens: fresh, or back where it was left. */
function open(
  exercise: SheetExercise,
  watch: readonly ScriptStep[] | undefined,
  saved: ExerciseSnapshot | undefined,
  review: boolean,
): Opening {
  const controller = new SheetController(exercise.sheet, openingCell(exercise));
  if (saved) {
    const { phase, work } = saved;
    if ((phase === 'watch' || phase === 'watched') && watch) {
      const from = phase === 'watched' ? lastStop(watch) : saved.stop;
      return { controller, phase: 'watch', parked: work, play: { script: 'watch', from } };
    }
    if (phase === 'showing') {
      if (watch) applyScript(controller, watch);
      return { controller, phase: 'showing', parked: null, play: { script: 'solution', from: saved.stop } };
    }
    if (work && isTurn(phase) && !(review && phase === 'do')) {
      controller.restore(work.sheet);
      return { controller, phase, parked: null, play: null };
    }
  }
  if (review) {
    // Nothing was kept for this one, so show it finished the standard way.
    if (watch) applyScript(controller, watch);
    applyScript(controller, exercise.solution);
    return { controller, phase: 'correct', parked: null, play: null };
  }
  if (watch) return { controller, phase: 'watch', parked: null, play: { script: 'watch', from: 0 } };
  return { controller, phase: 'do', parked: null, play: null };
}

/**
 * One exercise on the live grid: an optional demonstration, the learner's turn, checking,
 * and "Show me". Wrong answers stay on screen to be fixed; nothing typed is ever lost,
 * not by stepping back to read something again and not by leaving the lesson.
 *
 * The same screen serves every kind of task done on the sheet. What differs is what sits
 * under the grid: the formula keyboard, a toolbar, key caps for shortcuts, or a tray of
 * formula pieces to build with.
 */
export function GridExercise({
  exercise,
  watch,
  hideKeys,
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
  onSkipChange,
  onNavChange,
  onSnapshot,
  onSheetSide,
}: GridExerciseProps) {
  // Worked out once: this component is shown for one exercise and then thrown away.
  const [opening] = useState(() => open(exercise, watch, saved, review));
  const { controller } = opening;
  const state = useSheet(controller);
  const player = useScriptPlayer(controller);
  const select = openingCell(exercise);
  const say = (text: string) => forComputer(text, computer);

  const tools = exercise.tools ?? [];
  const chips = exercise.chips ?? [];
  const tray = exercise.type === 'formula-build' ? exercise.tokens : null;
  // Key caps show whenever the task involves a shortcut, including a demonstration of one.
  const combos = [
    ...[...exercise.solution, ...(watch ?? [])].flatMap((step) => ('combo' in step ? [step.combo] : [])),
    ...exercise.checks.flatMap((check) => (check.type === 'usedShortcut' ? [check.id] : [])),
  ];
  const caps = exercise.type === 'shortcut-press' || combos.length > 0;
  const capSet = capSetFor(combos);

  const [phase, setPhaseState] = useState<Phase>(opening.phase);
  const [parked, setParked] = useState<Work | null>(opening.parked);
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [checkedVersion, setCheckedVersion] = useState(-1);
  /** Which message the card shows when there is more than one to choose from. */
  const [latest, setLatest] = useState<'outcome' | 'hint' | 'nudge' | 'key' | null>(
    opening.phase === 'do' && attempt.hintsShown > 0 ? 'hint' : null,
  );
  const [showTask, setShowTask] = useState(false);
  /** A word about a key press that did nothing: the wrong modifier, or a cell still being typed in. */
  const [keyNote, setKeyNote] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<{ cell: string; nonce: number } | null>(null);
  // Cell's words vary with the exercise and with how it went, but never change on a second look.
  const praise = praiseFor(exercise.id, attempt, exercise.praise);
  const shown = shownFor(willComeBack);

  const setPhase = useCallback(
    (next: Phase) => {
      setPhaseState(next);
      onPhase?.(next);
    },
    [onPhase],
  );

  // Open on the step the learner had reached. A demonstration waits there for Next.
  const started = useRef(false);
  useEffect(() => {
    onPhase?.(opening.phase);
    if (started.current || !opening.play) return;
    started.current = true;
    if (opening.play.script === 'watch' && watch) {
      player.play(watch, () => setPhase('watched'), opening.play.from);
    } else {
      player.play(exercise.solution, () => setPhase('shown'), opening.play.from);
    }
    // Runs once per exercise: the player and callbacks are stable for its lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The Skip button lives in the lesson's top bar, so tell it when there is something to skip.
  const { playing, finish } = player;
  useEffect(() => {
    onSkipChange?.(playing ? finish : null);
    return () => onSkipChange?.(null);
  }, [playing, finish, onSkipChange]);

  // A new hint takes over the card.
  const hintsSeen = useRef(attempt.hintsShown);
  useEffect(() => {
    if (attempt.hintsShown > hintsSeen.current) {
      setLatest('hint');
      setShowTask(false);
    }
    hintsSeen.current = attempt.hintsShown;
  }, [attempt.hintsShown]);

  const doing = phase === 'do';
  /**
   * A task answered by typing into a cell, a value or a formula: the keys stay open while
   * doing it, so selecting a cell and typing replaces its contents, as in Excel.
   */
  const typesValues =
    exercise.checks.some((c) => c.type === 'cellValue' || c.type === 'outcome') || (exercise.solution ?? []).some((step) => 'key' in step);
  const locked = !doing;
  const editing = state.editing !== null;
  // Once the learner changes the sheet, the last "not quite" no longer describes it.
  const stale = outcome !== null && state.version !== checkedVersion;
  const liveOutcome = stale ? null : outcome;

  // A formula that is built from pieces is always open for building: there is no cell to tap.
  const buildCell = exercise.type === 'formula-build' ? exercise.cell : null;
  useEffect(() => {
    if (buildCell && doing && !editing && controller.sheet.getRaw(a1(buildCell)) === '') controller.startEdit();
  }, [buildCell, doing, editing, controller, state.version]);

  /** What the card says after a key press: clears an old nudge, or explains a press that did nothing. */
  const noteKey = useCallback(
    (result: KeyResult) => {
      if (!result.claimed) return;
      if (!result.note) {
        setLatest((now) => (now === 'nudge' || now === 'key' ? null : now));
        return;
      }
      if (result.note === 'finishTyping') {
        setKeyNote('Press Enter to finish typing first. Then try the shortcut again.');
      } else {
        const { wrongModifier, used } = result.note;
        const where = computer === 'mac' ? 'On a Mac' : 'On Windows';
        setKeyNote(`${where} it is ${comboLabel(wrongModifier, computer)}. ${used} is a different key there.`);
      }
      setLatest('key');
    },
    [computer],
  );

  // A real keyboard works too, where there is one: typing and every shortcut the sheet
  // knows, read for this learner's computer. Listening happens before a clicked cell or
  // key cap sees the key, so Space and Enter reach the sheet (see listenForKeys).
  useEffect(() => {
    if (Platform.OS !== 'web' || !doing || tray) return;
    return listenForKeys(window, (e) => {
      const read = readKey(e, computer);
      if (!read) return false;
      const result = applySheetKey(controller, read, hideKeys);
      noteKey(result);
      return result.claimed;
    });
  }, [controller, computer, doing, hideKeys, tray, noteKey]);

  const check = () => {
    // An entry still being typed is confirmed first, as Enter would; one that can't be
    // accepted stays open with its message.
    if (controller.getState().editing && !controller.commit()) return;
    const result = checkController(exercise.checks, controller);
    onCheck(result.status);
    setCheckedVersion(state.version);
    setShowTask(false);
    if (result.status === 'pass') {
      setOutcome(null);
      const cell = resultCell(exercise);
      setCelebrate(cell ? { cell, nonce: Date.now() } : null);
      buzz('correct');
      setPhase('correct');
      return;
    }
    setOutcome(result);
    setLatest('outcome');
    if (result.status === 'fail') buzz('wrong');
  };

  /**
   * Plays the demonstration again from step `from`. If the learner has had their turn,
   * their sheet is set aside first and put back when they return to it.
   */
  const rewatch = (from: number) => {
    if (!watch) return;
    if (isTurn(phase)) setParked({ phase, sheet: controller.capture() });
    setOutcome(null);
    setCelebrate(null);
    controller.reset(exercise.sheet, select);
    setPhase('watch');
    player.play(watch, () => setPhase('watched'), from);
  };

  /** Plays the worked solution from step `from`. */
  const reshow = (from: number) => {
    setOutcome(null);
    controller.reset(exercise.sheet, select);
    if (watch) applyScript(controller, watch);
    setPhase('showing');
    player.play(exercise.solution, () => setPhase('shown'), from);
  };

  const showMe = () => {
    onShowMe();
    reshow(0);
  };

  /** From the end of the demonstration to the learner's own sheet. */
  const startTurn = () => {
    if (parked) {
      controller.restore(parked.sheet);
      setParked(null);
      setPhase(parked.phase);
    } else if (review) {
      controller.reset(exercise.sheet, select);
      if (watch) applyScript(controller, watch);
      applyScript(controller, exercise.solution);
      setPhase('correct');
    } else {
      // What the app did while demonstrating doesn't count as the learner's own doing.
      controller.forgetActions();
      setPhase('do');
    }
  };

  // A tap on the strip of key caps goes the same way as a real key press.
  const onCombo = useCallback(
    (id: ShortcutId) => noteKey(applySheetKey(controller, { kind: 'shortcut', id })),
    [controller, noteKey],
  );

  // ---- one step back, one step forward ------------------------------------------------
  let back: (() => void) | null;
  let forward: (() => void) | null;
  if (phase === 'watch' || phase === 'showing') {
    back = playing && player.canBack ? player.back : null;
    forward = playing ? player.next : null;
  } else if (phase === 'watched') {
    back = () => rewatch(lastStop(watch ?? []));
    forward = startTurn;
  } else if (phase === 'shown') {
    back = () => reshow(lastStop(exercise.solution));
    forward = onContinue;
  } else {
    back = watch ? () => rewatch(lastStop(watch)) : null;
    forward = phase === 'correct' ? onContinue : null;
  }

  // The arrows live in the lesson's top bar. It is handed the same two functions for the
  // whole exercise and only told again when a direction opens or closes.
  const nav = useRef<StepNav>({ back: null, forward: null });
  useEffect(() => {
    nav.current = { back, forward };
  });
  const goBack = useCallback(() => nav.current.back?.(), []);
  const goForward = useCallback(() => nav.current.forward?.(), []);
  const canBack = back !== null;
  const canForward = forward !== null;
  useEffect(() => {
    onNavChange?.({ back: canBack ? goBack : null, forward: canForward ? goForward : null });
  }, [canBack, canForward, goBack, goForward, onNavChange]);
  useEffect(() => () => onNavChange?.({ back: null, forward: null }), [onNavChange]);

  // ---- remembering where this exercise stands ----------------------------------------
  const { stop } = player;
  const standing = useRef({ phase, stop, parked });
  useEffect(() => {
    standing.current = { phase, stop, parked };
  });
  const snapshot = useCallback((): ExerciseSnapshot => {
    const now = standing.current;
    const work = isTurn(now.phase) ? { phase: now.phase, sheet: controller.capture() } : now.parked;
    return { phase: now.phase, stop: now.stop, work };
  }, [controller]);
  useEffect(() => {
    if (!review) onSnapshot?.(snapshot(), false);
  }, [phase, stop, parked, state.version, review, onSnapshot, snapshot]);
  // Once more on the way out, which is what keeps a half-typed formula.
  const leave = useRef<() => void>(() => {});
  useEffect(() => {
    leave.current = () => {
      if (!review) onSnapshot?.(snapshot(), true);
    };
  });
  useEffect(() => () => leave.current(), []);

  // ---- what the card says ------------------------------------------------------------
  let card: { mood: Expression; tone: Tone; text: string };
  const hint = attempt.hintsShown > 0 ? exercise.hints[attempt.hintsShown - 1] : null;
  if (phase === 'watch' || phase === 'watched') {
    card = { mood: 'happy', tone: 'say', text: player.caption ?? 'Watch how it is done.' };
  } else if (phase === 'shown' && player.caption === null) {
    // Reopened after the worked solution had been shown: say what the task was.
    card = { mood: 'thinking', tone: 'task', text: exercise.prompt };
  } else if (phase === 'showing' || phase === 'shown') {
    card = { mood: 'thinking', tone: 'say', text: player.caption ?? 'Here is how it is done.' };
  } else if (phase === 'correct') {
    card = { mood: 'cheering', tone: 'task', text: exercise.prompt };
  } else if (state.editing?.error) {
    card = { mood: 'oops', tone: 'bad', text: state.editing.error };
  } else if (latest === 'key' && keyNote) {
    card = { mood: 'thinking', tone: 'hint', text: keyNote };
  } else if (latest === 'nudge') {
    const first = capSet === 'letters' ? modifierKey(computer) : 'Ctrl or Shift';
    card = { mood: 'thinking', tone: 'hint', text: `Press ${first} first. It stays held. Then press the other key.` };
  } else if (showTask) {
    card = { mood: 'neutral', tone: 'task', text: exercise.prompt };
  } else if (latest === 'outcome' && liveOutcome && !editing) {
    // The panel under the grid is saying what went wrong, so the card keeps the task in view.
    card = { mood: liveOutcome.status === 'fail' ? 'oops' : 'happy', tone: 'task', text: exercise.prompt };
  } else if (latest === 'outcome' && liveOutcome?.status === 'fail') {
    // The keyboard has replaced the panel: keep the reason on screen while they fix it.
    card = { mood: 'oops', tone: 'bad', text: liveOutcome.message };
  } else if (latest === 'outcome' && liveOutcome?.status === 'soft') {
    card = { mood: 'happy', tone: 'hint', text: liveOutcome.message };
  } else if (hint && latest === 'hint') {
    card = { mood: 'thinking', tone: 'hint', text: hint };
  } else {
    card = { mood: 'neutral', tone: 'task', text: exercise.prompt };
  }
  const cardFlips = doing && !state.editing?.error && (card.tone !== 'task' || showTask);

  // ---- what is under the grid --------------------------------------------------------
  // With nothing to report, the space under the grid holds a tip. Each time that space
  // comes back (the keyboard closes, or a result is cleared) it is the next tip's turn.
  const tipSpace = doing && !editing && !liveOutcome;
  const [tipTurn, setTipTurn] = useState({ open: tipSpace, times: tipSpace ? 1 : 0 });
  if (tipTurn.open !== tipSpace) {
    setTipTurn({ open: tipSpace, times: tipTurn.times + (tipSpace ? 1 : 0) });
  }
  const tip = exercise.tips[Math.max(0, tipTurn.times - 1) % exercise.tips.length];

  const offerShowMe = doing && attempt.wrongChecks >= SHOW_ME_AFTER && !attempt.solutionShown;
  const firstGo = attempt.wrongChecks === 0 && attempt.hintsShown === 0 && !attempt.solutionShown;
  const showMeAction = offerShowMe ? { label: 'Show me', onPress: showMe, testID: 'show-me' } : undefined;
  const checkAction = { label: 'Check', onPress: check, testID: 'check' };
  // Their turn is already done if they came back here to read the demonstration again.
  const turnLabel = (parked && parked.phase !== 'do') || review ? 'My answer' : 'My turn';

  // The tools this task uses sit on top of whatever else is under the grid. While the app
  // is demonstrating they are still there, so it can be seen pressing them.
  const visibleTools = tools.filter((tool) => tool !== 'fill');
  let top = null;
  if (caps) {
    top = (
      <KeyCaps
        computer={computer}
        set={capSet}
        onCombo={onCombo}
        onLoose={() => setLatest('nudge')}
        // The sheet above listens to the whole keyboard; the strip only shows and taps keys.
        keyboard={false}
        flash={player.flashKey}
        locked={locked}
        height={metrics.keyHeight}
      />
    );
  } else if (visibleTools.length > 0) {
    top = (
      <Toolbar
        tools={visibleTools}
        state={state}
        onTool={(tool) => controller.runTool(tool)}
        flash={player.flashKey}
        locked={locked}
        height={metrics.keyHeight}
      />
    );
  }

  // While typing, Check sits under the keys, so the space under the sheet has to hold both.
  const keysWithCheck = typesValues && doing && top === null && !tray;
  let bottom;
  if (editing && tray) {
    bottom = (
      <TokenTray
        tokens={tray}
        onToken={(token) => controller.pressChip(token)}
        onBackspace={() => controller.pressKey('backspace')}
        onEnter={() => controller.pressKey('enter')}
        flash={player.flashKey}
        locked={locked}
        keyHeight={metrics.keyHeight}
      />
    );
  } else if (typesValues && doing && (editing || !liveOutcome) && top === null) {
    // Entering values or formulas: the keys are there as soon as a cell is selected, so typing
    // replaces the cell's contents, as it does in Excel. Tapping the cell again still edits it.
    // The keys and Check stay put while typing, so nothing moves under the learner's thumb.
    bottom = (
      <FeedbackSheet
        top={
          <FormulaKeyboard
            onKey={(key) => controller.pressKey(key)}
            hidden={hideKeys}
            chips={chips}
            onChip={(chip) => controller.pressChip(chip)}
            flashKey={player.flashKey}
            locked={locked}
            keyHeight={metrics.keyHeight}
          />
        }
        primary={checkAction}
        secondary={showMeAction}
      />
    );
  } else if (editing) {
    bottom = (
      <FormulaKeyboard
        onKey={(key) => controller.pressKey(key)}
        hidden={hideKeys}
        chips={chips}
        onChip={(chip) => controller.pressChip(chip)}
        flashKey={player.flashKey}
        locked={locked}
        keyHeight={metrics.keyHeight}
      />
    );
  } else if (phase === 'watch' || phase === 'showing') {
    bottom = top;
  } else if (phase === 'watched') {
    bottom = (
      <FeedbackSheet
        primary={{ label: turnLabel, onPress: startTurn, testID: 'my-turn' }}
        secondary={{ label: 'Replay', onPress: () => rewatch(0), testID: 'watch-again' }}
      />
    );
  } else if (phase === 'shown') {
    bottom = (
      <FeedbackSheet
        tone="plain"
        title={shown.title}
        message={shown.message}
        primary={{ label: 'Continue', onPress: onContinue, testID: 'continue' }}
      />
    );
  } else if (phase === 'correct') {
    bottom = (
      <FeedbackSheet
        tone="good"
        title={praise}
        message={say(exercise.explain)}
        // Right first time, with no hint, earns the bonus. Demonstrations are practice and earn none.
        badge={firstGo && exercise.type !== 'demo' && !review ? `+${XP_PER_FIRST_TRY} XP` : undefined}
        primary={{ label: 'Continue', onPress: onContinue, testID: 'continue' }}
      />
    );
  } else if (liveOutcome?.status === 'fail') {
    bottom = (
      <FeedbackSheet tone="bad" title={notYetFor(exercise.id, attempt.wrongChecks)} message={say(liveOutcome.message)} top={top} primary={checkAction} secondary={showMeAction} />
    );
  } else if (liveOutcome?.status === 'soft') {
    bottom = (
      <FeedbackSheet
        tone="good"
        title={RIGHT_RESULT}
        message={say(liveOutcome.message.replace('Right answer. ', ''))}
        top={top}
        primary={checkAction}
      />
    );
  } else {
    // Nothing to report yet, so the space holds a tip. A check result takes its place.
    bottom = <FeedbackSheet tip={say(tip)} top={top} primary={checkAction} secondary={showMeAction} />;
  }

  const cardView = (
    <MessageCard
      mood={card.mood}
      tone={card.tone}
      text={say(card.text)}
      height={metrics.cardHeight}
      lines={metrics.cardLines}
      onPress={player.playing ? player.next : cardFlips ? () => setShowTask((v) => !v) : undefined}
      action={player.playing ? { label: 'Next', onPress: player.next } : undefined}
    />
  );
  const barView = <FormulaBar controller={controller} state={state} locked={locked} height={metrics.barHeight} />;
  const gridView = (
    <Grid
      controller={controller}
      state={state}
      // A formula built from pieces is not typed into, so its cells don't respond to taps.
      locked={locked || tray !== null}
      fillHandle={tools.includes('fill')}
      ghostCell={player.ghostCell}
      celebrate={phase === 'correct' ? celebrate : null}
    />
  );
  // While the app is demonstrating, a tap anywhere on the sheet is Next too: easier to
  // reach with a thumb than the button on the card.
  const nextAnywhere = player.playing ? (
    <Pressable testID="next-anywhere" accessibilityRole="button" accessibilityLabel="Next step" onPress={player.next} style={StyleSheet.absoluteFill} />
  ) : null;

  if (metrics.layout !== 'stack') {
    // On its side: the sheet has one half to itself, and the lesson and keys have the other.
    return (
      <SplitScreen
        layout={metrics.layout}
        onSheetSide={onSheetSide}
        sheet={
          <Workbench bar={barView}>
            {gridView}
            {nextAnywhere}
          </Workbench>
        }
        lesson={
          <>
            {cardView}
            <View style={styles.under}>{bottom}</View>
          </>
        }
      />
    );
  }

  return (
    <View style={styles.fill}>
      {cardView}
      <Workbench bar={barView}>
        {gridView}
        {nextAnywhere}
      </Workbench>
      <View style={{ height: keyboardHeight(metrics.keyHeight, chips.length > 0) + (keysWithCheck ? CHECK_ROW : 0) }}>{bottom}</View>
    </View>
  );
}

/** The Check button under the keys (a 48 pt button) and the gap above it. */
const CHECK_ROW = 55;

const styles = StyleSheet.create({
  fill: { flex: 1, gap: space.sm },
  // Beside the sheet, the keys or the result sit at the bottom of their half, under the card.
  under: { flex: 1, justifyContent: 'flex-end' },
});
