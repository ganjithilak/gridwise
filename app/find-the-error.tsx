import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { toA1 } from '@/engine';
import { ERROR_SKILLS, errorRound, fixMiss, type ErrorPuzzle } from '@/game/findTheError';
import { Choice, GameFrame, GameIntro, GameResults, GameTop, NoteCard, Prompt, useLeaveGame } from '@/game/ui/GameParts';
import { selectOnlyController } from '@/game/ui/sheet';
import { SheetGame } from '@/game/ui/SheetGame';
import { coverNames, useGame, useGo } from '@/game/ui/useGame';
import { buzz } from '@/lib/feedback';
import { FeedbackSheet } from '@/lessons/player/FeedbackSheet';
import { FormulaBar } from '@/spreadsheet/FormulaBar';
import { Grid } from '@/spreadsheet/Grid';
import { useSheet } from '@/spreadsheet/useSheet';
import { Workbench } from '@/spreadsheet/Workbench';
import { space, type as typography, useTheme } from '@/theme';

function Puzzle({ p, onDone, onMiss }: { p: ErrorPuzzle; onDone: () => void; onMiss: () => void }) {
  const c = useTheme();
  const [controller] = useState(() => selectOnlyController(p.sheet, 'A1'));
  const state = useSheet(controller);
  const [phase, setPhase] = useState<'find' | 'fix' | 'done'>('find');
  const [said, setSaid] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const cell = toA1(state.selection);

  const name = () => {
    if (p.wrong.includes(cell)) {
      buzz('correct');
      setPhase('fix');
      setSaid({ tone: 'good', text: p.problem });
      return;
    }
    buzz('wrong');
    onMiss();
    setSaid({ tone: 'bad', text: `${cell} is right as it is. Keep looking: compare it with the cells around it${p.note ? ' and with the note' : ''}.` });
  };

  const fix = (option: string) => {
    setPicked(option);
    if (option === p.right) {
      buzz('correct');
      controller.reset(p.fixed, p.fixCell);
      setNonce((n) => n + 1);
      setPhase('done');
      setSaid({ tone: 'good', text: p.why });
      return;
    }
    buzz('wrong');
    onMiss();
    setSaid({ tone: 'bad', text: fixMiss(p, option) });
  };

  let bottom: React.ReactNode;
  if (phase === 'done') {
    bottom = <FeedbackSheet tone="good" title="Corrected" message={said?.text} primary={{ label: 'Continue', onPress: onDone, testID: 'continue' }} />;
  } else if (phase === 'fix') {
    bottom = (
      <View style={styles.choices}>
        {p.fixes.map((o) => (
          <Choice key={o} label={o} code testID={`fix-${o}`} state={picked === o ? 'wrong' : 'idle'} onPress={() => fix(o)} />
        ))}
      </View>
    );
  } else {
    bottom = <Choice testID="name-cell" label={`The problem is in ${cell}`} onPress={name} />;
  }

  return (
    <SheetGame
      bottomHeight={176}
      top={
        <>
          <Prompt label={phase === 'find' ? 'Find the error' : `Correct ${p.fixCell}`}>{phase === 'find' ? p.ask : `What should ${p.fixCell} hold?`}</Prompt>
          <Text style={[typography.small, styles.say, { color: said?.tone === 'bad' ? c.bad : said ? c.good : c.inkSoft }]} testID="error-say">
            {said ? said.text : 'Tap a cell to see what is really in it, formula and all, in the bar above the sheet.'}
          </Text>
          {p.note ? <NoteCard title={p.note.title} lines={p.note.lines} /> : null}
        </>
      }
      sheet={
        <Workbench bar={<FormulaBar controller={controller} state={state} locked height={40} />}>
          <Grid controller={controller} state={state} locked={phase !== 'find'} celebrate={phase === 'done' ? { cell: p.fixCell, nonce } : null} />
        </Workbench>
      }
      bottom={bottom}
    />
  );
}

/**
 * Find the Error: a farm record with one mistake. Find the cell, then choose the correction;
 * each step says why.
 */
export default function FindTheErrorScreen() {
  const c = useTheme();
  const leave = useLeaveGame();
  const g = useGame('errors');
  const play = useGo<ErrorPuzzle>();
  if (!g.hydrated) return <View style={[styles.fill, { backgroundColor: c.bg }]} />;
  const begin = () => play.start((seed) => errorRound(g.taught, g.newest, seed));
  if (play.result) return <GameResults {...play.result} best={null} onAgain={begin} onLeave={leave} />;
  if (!play.go) {
    const open = ERROR_SKILLS.some((s) => g.taught.has(s));
    return (
      <GameIntro
        title="Find the Error"
        about="Each record has one mistake: a figure typed wrongly, or a formula that does not do what it should. Find it, then choose the correction."
        covers={coverNames(ERROR_SKILLS, g.taught)}
        locked={open ? null : 'Opens after Entering and Correcting Data.'}
        record={g.record}
        onPlay={begin}
        onLeave={leave}
      />
    );
  }
  const go = play.go;
  return (
    <GameFrame wide>
      <GameTop onClose={play.stop} at={go.at} total={go.items.length} />
      <Puzzle key={`${go.seed}-${go.at}`} p={go.items[go.at]} onMiss={play.miss} onDone={() => play.next(g.finish)} />
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  say: { minHeight: 38 },
  choices: { gap: space.sm },
});
