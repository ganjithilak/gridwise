import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { parseRange, rangeToA1, sameRange, type RangeAddr } from '@/engine';
import { HUNT_LENGTH, huntFeedback, huntRight, huntRound, type HuntTask } from '@/game/cellHunt';
import { Choice, GameFrame, GameIntro, GameResults, GameTop, Prompt, useLeaveGame } from '@/game/ui/GameParts';
import { selectOnlyController } from '@/game/ui/sheet';
import { SheetGame } from '@/game/ui/SheetGame';
import { coverNames, useGame, useGo } from '@/game/ui/useGame';
import { buzz } from '@/lib/feedback';
import { FeedbackSheet } from '@/lessons/player/FeedbackSheet';
import { FormulaBar } from '@/spreadsheet/FormulaBar';
import { Grid } from '@/spreadsheet/Grid';
import { applySheetKey, listenForKeys, readKey } from '@/spreadsheet/keyboard';
import { KeyCaps } from '@/spreadsheet/KeyCaps';
import { useSheet } from '@/spreadsheet/useSheet';
import { Workbench } from '@/spreadsheet/Workbench';
import { space, type as typography, useTheme } from '@/theme';

const SKILLS = ['xl.cell.address', 'xl.select.column', 'xl.select.row', 'xl.select.extend', 'xl.select.range', 'xl.keys.move'];

/** The keys under the sheet: only for tasks done with keys. */
const usesKeys = (task: HuntTask) => task.kind === 'column' || task.kind === 'row' || task.kind === 'range' || task.kind === 'arrows';

function HuntQuestion({ task, computer, onDone, onMiss }: { task: HuntTask; computer: 'win' | 'mac'; onDone: () => void; onMiss: () => void }) {
  const c = useTheme();
  const [controller] = useState(() => selectOnlyController(task.sheet, task.from));
  const state = useSheet(controller);
  const [said, setSaid] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const right = said?.tone === 'good';
  const target = parseRange(task.target) as RangeAddr;
  const seen = useRef(rangeToA1(state.range));
  const settled = useRef(false);

  // A block to name is lit from the start.
  useEffect(() => {
    if (task.kind === 'name') controller.selectRange(task.target);
  }, [controller, task]);

  // Answers on the sheet are judged as the selection changes: the right selection is
  // accepted straight away; a tapped cell is an answer, so a wrong one is a miss.
  useEffect(() => {
    if (task.kind === 'name') return;
    return controller.subscribe(() => {
      const range = controller.getState().range;
      const now = rangeToA1(range);
      if (settled.current || now === seen.current) return;
      seen.current = now;
      if (sameRange(range, target)) {
        settled.current = true;
        buzz('correct');
        setNonce((n) => n + 1);
        setSaid({ tone: 'good', text: huntRight(task) });
      } else if (task.kind === 'cell') {
        buzz('wrong');
        onMiss();
        setSaid({ tone: 'bad', text: huntFeedback(task, range) });
      }
    });
  }, [controller, task, target, onMiss]);

  // A real keyboard, for the tasks done with keys.
  useEffect(() => {
    if (Platform.OS !== 'web' || !usesKeys(task) || right) return;
    return listenForKeys(window, (e) => {
      const read = readKey(e, computer);
      if (!read) return false;
      return applySheetKey(controller, read).claimed;
    });
  }, [controller, computer, task, right]);

  const check = () => {
    buzz('wrong');
    onMiss();
    setSaid({ tone: 'bad', text: huntFeedback(task, state.range) });
  };

  const choose = (option: string) => {
    if (right) return;
    setPicked(option);
    if (option === task.target) {
      settled.current = true;
      buzz('correct');
      setSaid({ tone: 'good', text: huntRight(task) });
    } else {
      buzz('wrong');
      onMiss();
      const r = parseRange(option) as RangeAddr;
      setSaid({ tone: 'bad', text: `Not ${option}. ${huntFeedback({ ...task, target: task.target }, r)}` });
    }
  };

  let bottom: React.ReactNode = null;
  if (right) {
    bottom = <FeedbackSheet tone="good" title="Correct" message={said?.text} primary={{ label: 'Continue', onPress: onDone, testID: 'continue' }} />;
  } else if (task.kind === 'name') {
    bottom = (
      <View style={styles.options}>
        {task.options?.map((o) => (
          <Choice key={o} label={o} code testID={`option-${o}`} state={picked === o ? (o === task.target ? 'right' : 'wrong') : 'idle'} onPress={() => choose(o)} style={styles.option} />
        ))}
      </View>
    );
  } else if (usesKeys(task)) {
    bottom = (
      <View style={styles.keys}>
        <KeyCaps computer={computer} set="moving" keyboard={false} onCombo={(id) => applySheetKey(controller, { kind: 'shortcut', id })} height={44} />
        {task.kind !== 'arrows' ? <Choice label="Check" testID="check" onPress={check} /> : null}
      </View>
    );
  }

  return (
    <SheetGame
      bottomHeight={132}
      top={
        <>
          <Prompt label="Find it">{task.ask}</Prompt>
          <Text style={[typography.small, styles.how, { color: said?.tone === 'bad' ? c.bad : c.inkSoft }]} testID="hunt-say">
            {said?.tone === 'bad' ? said.text : (task.how ?? ' ')}
          </Text>
        </>
      }
      sheet={
        <Workbench bar={<FormulaBar controller={controller} state={state} locked height={40} />}>
          <Grid controller={controller} state={state} locked={task.kind === 'arrows' || task.kind === 'name' || right} celebrate={right && nonce ? { cell: task.target.split(':')[0], nonce } : null} />
        </Workbench>
      }
      bottom={bottom}
    />
  );
}

/**
 * Cell Hunt: find a cell, a row, a column or a block on a real sheet, or name the block
 * that is lit. Tasks come only from what the lessons have taught, and the sheet changes
 * shape from one task to the next.
 */
export default function CellHuntScreen() {
  const c = useTheme();
  const leave = useLeaveGame();
  const g = useGame('hunt');
  const play = useGo<HuntTask>();
  if (!g.hydrated) return <View style={[styles.fill, { backgroundColor: c.bg }]} />;

  const begin = () => play.start((seed) => huntRound(g.taught, g.tier, seed));

  if (play.result) return <GameResults {...play.result} best={null} onAgain={begin} onLeave={leave} />;

  if (!play.go) {
    const open = g.taught.has('xl.cell.address');
    return (
      <GameIntro
        title="Cell Hunt"
        about={`Find cells, rows, columns and ranges on a sheet that changes shape every time. ${HUNT_LENGTH} tasks a go, at your own pace.`}
        covers={coverNames(SKILLS, g.taught)}
        locked={open ? null : 'Opens after Cells and References.'}
        record={g.record}
        onPlay={begin}
        onLeave={leave}
      />
    );
  }

  const go = play.go;
  const task = go.items[go.at];
  return (
    <GameFrame wide>
      <GameTop onClose={play.stop} at={go.at} total={go.items.length} />
      <HuntQuestion key={`${go.seed}-${go.at}`} task={task} computer={g.computer ?? 'win'} onMiss={play.miss} onDone={() => play.next(g.finish)} />
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  how: { minHeight: 38 },
  keys: { gap: space.sm },
  options: { flexDirection: 'row', gap: space.sm },
  option: { flex: 1 },
});

