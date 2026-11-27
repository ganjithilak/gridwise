import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { withCell } from '@/game/farmSheets';
import { PREDICT_SKILLS, predictRound, type PredictQuestion } from '@/game/predict';
import { Choice, GameFrame, GameIntro, GameResults, GameTop, Prompt, useLeaveGame } from '@/game/ui/GameParts';
import { selectOnlyController } from '@/game/ui/sheet';
import { SheetGame } from '@/game/ui/SheetGame';
import { coverNames, useGame, useGo } from '@/game/ui/useGame';
import { buzz } from '@/lib/feedback';
import { FeedbackSheet } from '@/lessons/player/FeedbackSheet';
import { BarFrame, Fx } from '@/spreadsheet/FormulaBar';
import { Grid } from '@/spreadsheet/Grid';
import { useSheet } from '@/spreadsheet/useSheet';
import { Workbench } from '@/spreadsheet/Workbench';
import { mono, space, type as typography, useTheme } from '@/theme';

function Question({ q, onDone, onMiss }: { q: PredictQuestion; onDone: () => void; onMiss: () => void }) {
  const c = useTheme();
  const [controller] = useState(() => selectOnlyController(q.sheet, q.cell));
  const state = useSheet(controller);
  const [picked, setPicked] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const right = picked === q.right;

  // One choice: then the formula is worked out on the sheet, and the cells it used light up.
  const choose = (option: string) => {
    if (picked) return;
    setPicked(option);
    controller.reset(withCell(q.sheet, q.cell, q.formula), q.cell);
    setNonce((n) => n + 1);
    if (option === q.right) buzz('correct');
    else {
      buzz('wrong');
      onMiss();
    }
  };

  const bottom = picked ? (
    <FeedbackSheet
      tone={right ? 'good' : 'bad'}
      title={right ? `Correct: ${q.right}` : `It shows ${q.right}`}
      message={q.why}
      primary={{ label: 'Continue', onPress: onDone, testID: 'continue' }}
    />
  ) : (
    <View style={styles.choices}>
      {q.options.map((o) => (
        <Choice key={o} label={o} code testID={`option-${o}`} onPress={() => choose(o)} style={styles.choice} />
      ))}
    </View>
  );

  return (
    <SheetGame
      bottomHeight={150}
      top={
        <>
          <Prompt label="Predict the result">What will {q.cell} show?</Prompt>
          <Text style={[typography.small, styles.say, { color: c.inkSoft }]}>{q.context ?? 'Read the formula in the bar, then the cells it uses.'}</Text>
        </>
      }
      sheet={
        <Workbench
          bar={
            <BarFrame name={q.cell} height={q.formula.length > 24 ? 56 : 44}>
              <Fx />
              {/* The whole formula has to be readable: it wraps rather than being cut short. */}
              <Text style={[styles.formula, q.formula.length > 24 && styles.long, { color: c.ink, fontFamily: mono }]} numberOfLines={2} testID="predict-formula">
                {q.formula}
              </Text>
            </BarFrame>
          }
        >
          <Grid controller={controller} state={state} locked celebrate={picked ? { cell: q.cell, nonce } : null} />
        </Workbench>
      }
      bottom={bottom}
    />
  );
}

/** Predict the Result: read a formula and the cells it uses, and say what it will show. */
export default function PredictTheResultScreen() {
  const c = useTheme();
  const leave = useLeaveGame();
  const g = useGame('predict');
  const play = useGo<PredictQuestion>();
  if (!g.hydrated) return <View style={[styles.fill, { backgroundColor: c.bg }]} />;
  const begin = () => play.start((seed) => predictRound(g.taught, g.newest, seed));
  if (play.result) return <GameResults {...play.result} best={null} onAgain={begin} onLeave={leave} />;
  if (!play.go) {
    const open = PREDICT_SKILLS.some((s) => g.taught.has(s));
    return (
      <GameIntro
        title="Predict the Result"
        about="A formula sits in a cell. Work out what it will show before the sheet does. The wrong answers are the slips people really make."
        covers={coverNames(PREDICT_SKILLS, g.taught)}
        locked={open ? null : 'Opens after Add it up, the first formulas lesson.'}
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
      <Question key={`${go.seed}-${go.at}`} q={go.items[go.at]} onMiss={play.miss} onDone={() => play.next(g.finish)} />
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  say: { minHeight: 20 },
  formula: { flex: 1, alignSelf: 'center', fontSize: 16, fontWeight: '700', paddingRight: 8 },
  long: { fontSize: 14, lineHeight: 19 },
  choices: { flexDirection: 'row', gap: space.sm },
  choice: { flex: 1 },
});
