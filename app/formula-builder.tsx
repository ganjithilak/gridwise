import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BUILDER_SKILLS, buildRound, diagnose, diagnoseChoice, type BuildChallenge } from '@/game/formulaBuilder';
import { withCell } from '@/game/farmSheets';
import { Choice, GameFrame, GameIntro, GameResults, GameTop, Prompt, useLeaveGame } from '@/game/ui/GameParts';
import { SheetGame } from '@/game/ui/SheetGame';
import { coverNames, useGame, useGo } from '@/game/ui/useGame';
import { buzz } from '@/lib/feedback';
import { FeedbackSheet } from '@/lessons/player/FeedbackSheet';
import { SheetController } from '@/spreadsheet/controller';
import { BarFrame, Fx } from '@/spreadsheet/FormulaBar';
import { Grid } from '@/spreadsheet/Grid';
import { TokenTray } from '@/spreadsheet/TokenTray';
import { useSheet } from '@/spreadsheet/useSheet';
import { Workbench } from '@/spreadsheet/Workbench';
import { mono, space, type as typography, useTheme } from '@/theme';

function BuildQuestion({ ch, onDone, onMiss }: { ch: BuildChallenge; onDone: () => void; onMiss: () => void }) {
  const c = useTheme();
  const [controller] = useState(() => new SheetController(ch.sheet, ch.cell));
  const state = useSheet(controller);
  const [pieces, setPieces] = useState<string[]>([]);
  const [said, setSaid] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const right = said?.tone === 'good';
  const built = ch.kind === 'choose' ? (picked ?? '') : pieces.join('');

  const judge = (formula: string) => {
    const why = ch.kind === 'choose' ? diagnoseChoice(ch, formula) : diagnose(ch, formula);
    if (why === null) {
      buzz('correct');
      // The formula goes into its cell, and the cells it uses light up, as in a lesson.
      controller.reset(withCell(ch.sheet, ch.cell, formula), ch.cell);
      setNonce((n) => n + 1);
      setSaid({ tone: 'good', text: ch.explain });
    } else {
      buzz('wrong');
      onMiss();
      setSaid({ tone: 'bad', text: why });
    }
  };

  let bottom: React.ReactNode;
  if (right) {
    bottom = <FeedbackSheet tone="good" title="Correct" message={said?.text} primary={{ label: 'Continue', onPress: onDone, testID: 'continue' }} />;
  } else if (ch.kind === 'choose') {
    bottom = (
      <View style={styles.choices}>
        {ch.options?.map((o) => (
          <Choice
            key={o}
            label={o}
            code
            testID={`option-${o}`}
            state={picked === o ? (said?.tone === 'bad' ? 'wrong' : 'chosen') : 'idle'}
            onPress={() => {
              setPicked(o);
              judge(o);
            }}
          />
        ))}
      </View>
    );
  } else {
    bottom = (
      <TokenTray
        tokens={ch.tokens}
        onToken={(t) => {
          buzz('key');
          setSaid(null);
          setPieces((p) => [...p, t]);
        }}
        onBackspace={() => {
          setSaid(null);
          setPieces((p) => p.slice(0, -1));
        }}
        onEnter={() => judge(built)}
      />
    );
  }

  const bar = (
    <BarFrame name={ch.cell} height={44} active={!right}>
      <Fx />
      <Text style={[styles.built, { color: built ? c.ink : c.inkFaint, fontFamily: mono }]} numberOfLines={1} ellipsizeMode="head" testID="built-formula">
        {built || (ch.kind === 'choose' ? 'Choose the formula that works' : 'Tap the pieces below')}
      </Text>
    </BarFrame>
  );

  return (
    <SheetGame
      bottomHeight={176}
      top={
        <>
          <Prompt label={ch.kind === 'choose' ? 'Which formula works?' : 'Build the formula'}>{ch.ask}</Prompt>
          <Text style={[typography.small, styles.say, { color: said?.tone === 'bad' ? c.bad : c.inkSoft }]} testID="builder-say">
            {said?.tone === 'bad' ? said.text : ch.kind === 'choose' ? 'One works. One has a slip in how it is written; one uses the wrong calculation.' : '⌫ takes the last piece off. ↵ checks it.'}
          </Text>
        </>
      }
      sheet={
        <Workbench bar={bar}>
          <Grid controller={controller} state={state} locked celebrate={right ? { cell: ch.cell, nonce } : null} />
        </Workbench>
      }
      bottom={bottom}
    />
  );
}

/**
 * Formula Builder: put a formula together from its pieces for a question about the farm's
 * records. At the top tier some goes ask which of three formulas works.
 */
export default function FormulaBuilderScreen() {
  const c = useTheme();
  const leave = useLeaveGame();
  const g = useGame('builder');
  const play = useGo<BuildChallenge>();
  if (!g.hydrated) return <View style={[styles.fill, { backgroundColor: c.bg }]} />;
  const begin = () => play.start((seed) => buildRound(g.taught, g.newest, g.tier, seed));
  if (play.result) return <GameResults {...play.result} best={null} onAgain={begin} onLeave={leave} />;
  if (!play.go) {
    const open = BUILDER_SKILLS.some((s) => g.taught.has(s));
    return (
      <GameIntro
        title="Formula Builder"
        about="A question about the farm’s records, and the pieces of a formula to answer it. Some pieces do not belong. As you improve there are more of them."
        covers={coverNames(BUILDER_SKILLS, g.taught)}
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
      <BuildQuestion key={`${go.seed}-${go.at}`} ch={go.items[go.at]} onMiss={play.miss} onDone={() => play.next(g.finish)} />
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  say: { minHeight: 38 },
  built: { flex: 1, alignSelf: 'center', fontSize: 16, fontWeight: '700', paddingRight: 8 },
  choices: { gap: space.sm },
});
