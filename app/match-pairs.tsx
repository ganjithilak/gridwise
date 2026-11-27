import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { SectionLabel } from '@/components/Panel';
import { defaultCourse } from '@/content';
import { parseRange } from '@/engine';
import { availablePairs, buildBoards, CATEGORIES, categoryCounts, firstSkillOf, MIN_PAIRS, rightOrder, type CategoryId, type Face, type Pair } from '@/game/matchPairs';
import { lessonTeaching } from '@/game/taught';
import { ComputerChoice, GameFrame, GameIntro, GameResults, GameTop, Prompt, useLeaveGame } from '@/game/ui/GameParts';
import { useGame, useGo } from '@/game/ui/useGame';
import { buzz } from '@/lib/feedback';
import { mono, radius, space, type as typography, useTheme } from '@/theme';
import { usePrefs } from '@/world/prefs';

type Pick = { side: 'left' | 'right'; id: string } | null;

/** A little sheet with the named cells lit, for "Cell references and highlighted cells". */
function MiniGrid({ cells, size = 17 }: { cells: string; size?: number }) {
  const c = useTheme();
  const r = parseRange(cells);
  const cols = 5;
  const rows = 5;
  const lit = (col: number, row: number) => !!r && col >= r.start.col && col <= r.end.col && row >= r.start.row && row <= r.end.row;
  return (
    <View accessible accessibilityLabel={`A grid with ${cells.includes(':') ? 'a block' : 'one cell'} highlighted`}>
      <View style={styles.miniRow}>
        <View style={{ width: size * 0.8 }} />
        {Array.from({ length: cols }, (_, col) => (
          <Text key={col} style={[styles.miniHead, { width: size, color: c.inkSoft }]}>
            {String.fromCharCode(65 + col)}
          </Text>
        ))}
      </View>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.miniRow}>
          <Text style={[styles.miniHead, { width: size * 0.8, color: c.inkSoft }]}>{row + 1}</Text>
          {Array.from({ length: cols }, (_, col) => (
            <View key={col} style={{ width: size, height: size * 0.72, borderWidth: StyleSheet.hairlineWidth, borderColor: c.outline, backgroundColor: lit(col, row) ? c.accent : c.surface }} />
          ))}
        </View>
      ))}
    </View>
  );
}

function FaceView({ face, ink, compact }: { face: Face; ink: string; compact: boolean }) {
  const c = useTheme();
  if ('cells' in face) return <MiniGrid cells={face.cells} size={compact ? 14 : 17} />;
  if ('icon' in face) {
    return (
      <View style={[styles.icon, { borderColor: c.outline, backgroundColor: c.sunken }]} accessible accessibilityLabel={face.label}>
        <Text style={[styles.iconText, { color: ink }]}>{face.icon}</Text>
      </View>
    );
  }
  return <Text style={[face.code ? [styles.code, { fontFamily: mono }] : styles.words, { color: ink }]}>{face.text}</Text>;
}

const faceLabel = (f: Face): string => ('cells' in f ? `the grid with ${f.cells} lit` : 'icon' in f ? f.label : f.text);

function Tile({ face, state, onPress, testID, tall }: { face: Face; state: 'idle' | 'chosen' | 'wrong' | 'done'; onPress: () => void; testID: string; tall: boolean }) {
  const c = useTheme();
  // On a phone on its side the board turns: items in a row across the top, partners below.
  const { width, height } = useWindowDimensions();
  const compact = width > height && height < 600;
  const motion = usePrefs((s) => s.motion);
  const [shake] = useState(() => new Animated.Value(0));
  const [settle] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (motion !== 'full') return;
    if (state === 'wrong') {
      shake.setValue(0);
      Animated.sequence([-1, 1, -0.6, 0.6, 0].map((to) => Animated.timing(shake, { toValue: to, duration: 55, useNativeDriver: true }))).start();
    }
    if (state === 'done') {
      // A small, satisfied lift, then it settles back as completed.
      settle.setValue(1);
      Animated.sequence([Animated.timing(settle, { toValue: 1.06, duration: 110, useNativeDriver: true }), Animated.timing(settle, { toValue: 1, duration: 160, useNativeDriver: true })]).start();
    }
  }, [state, motion, shake, settle]);
  const tone =
    state === 'done' ? { bg: c.goodSoft, edge: c.goodSoft, ink: c.good }
    : state === 'wrong' ? { bg: c.badSoft, edge: c.bad, ink: c.bad }
    : state === 'chosen' ? { bg: c.accentSoft, edge: c.accent, ink: c.accent }
    : { bg: c.surface, edge: c.outline, ink: c.ink };
  return (
    <Animated.View style={[styles.tileWrap, compact && styles.tileAcross, { opacity: state === 'done' ? 0.55 : 1, transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }, { scale: settle }] }]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={faceLabel(face)}
        accessibilityState={{ selected: state === 'chosen', disabled: state === 'done' }}
        disabled={state === 'done'}
        onPress={onPress}
        style={({ pressed }) => [styles.tile, tall && !compact && styles.tall, compact && styles.tileFill, { backgroundColor: tone.bg, borderColor: tone.edge, borderBottomWidth: state === 'done' ? 1.5 : pressed ? 1.5 : 4, marginTop: pressed && state !== 'done' ? 2.5 : 0 }]}
      >
        <FaceView face={face} ink={tone.ink} compact={compact} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Match Pairs: two columns of tiles; join each item on the left to its partner on the
 * right. A pair that is right settles as done; a wrong one shakes and gives a clue for the
 * first tile chosen. Two boards a go.
 */
export default function MatchPairsScreen() {
  const c = useTheme();
  const { width, height } = useWindowDimensions();
  const leave = useLeaveGame();
  const g = useGame('match');
  const play = useGo<Pair[]>();
  const [category, setCategory] = useState<CategoryId | 'mixed'>('mixed');
  const [chosen, setChosen] = useState<Pick>(null);
  const [done, setDone] = useState<string[]>([]);
  const [wrong, setWrong] = useState<{ ids: string[]; clue: string } | null>(null);
  const [missedPairs, setMissedPairs] = useState<string[]>([]);
  const [cleanSoFar, setCleanSoFar] = useState(0);

  useEffect(() => {
    if (!wrong) return;
    const clear = setTimeout(() => setWrong((w) => (w ? { ...w, ids: [] } : w)), 600);
    return () => clearTimeout(clear);
  }, [wrong]);

  if (!g.hydrated) return <View style={[styles.fill, { backgroundColor: c.bg }]} />;
  if (!g.computer && category === 'shortcuts') return <ComputerChoice onChoose={g.setComputer} onLeave={() => setCategory('mixed')} />;

  const computer = g.computer ?? 'win';
  // Shortcut pairs need to know Ctrl or Cmd; until it is known, a mixed go leaves them out.
  const pairsNow = (seed: number) => availablePairs(g.taught, computer, seed).filter((p) => g.computer || p.category !== 'shortcuts');
  const counts = categoryCounts(pairsNow(1));
  const playable = (id: CategoryId) => counts[id] >= MIN_PAIRS || (id === 'shortcuts' && !g.computer && availablePairs(g.taught, 'win', 1).filter((p) => p.category === 'shortcuts').length >= MIN_PAIRS);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const begin = () => {
    setChosen(null);
    setDone([]);
    setWrong(null);
    setMissedPairs([]);
    setCleanSoFar(0);
    play.start((seed) => buildBoards(pairsNow(seed), category, g.tier, g.newest, seed));
  };

  if (play.result) {
    const r = play.result;
    return <GameResults {...r} best={null} onAgain={begin} onLeave={leave} note={category === 'mixed' ? 'Mixed pairs from everything you have learned.' : CATEGORIES.find((x) => x.id === category)?.title} />;
  }

  if (!play.go) {
    return (
      <GameIntro
        title="Match Pairs"
        about="Join each item on the left to its partner on the right. A wrong pair gives a clue; there is no clock."
        covers={CATEGORIES.filter((x) => counts[x.id] > 0).map((x) => x.title)}
        locked={total < MIN_PAIRS ? 'Opens after Welcome to Golden Apples Farm.' : null}
        record={g.record}
        onPlay={begin}
        onLeave={leave}
      >
        <SectionLabel>Choose pairs</SectionLabel>
        <View style={styles.chips}>
          {[{ id: 'mixed' as const, title: 'Mixed', about: '' }, ...CATEGORIES].map((x) => {
            const open = x.id === 'mixed' ? total >= MIN_PAIRS : playable(x.id);
            const on = category === x.id;
            const opener = x.id === 'mixed' ? null : lessonTeaching(defaultCourse, firstSkillOf(x.id));
            return (
              <Pressable
                key={x.id}
                testID={`category-${x.id}`}
                accessibilityRole="button"
                accessibilityLabel={open ? x.title : `${x.title}, opens after ${opener}`}
                accessibilityState={{ selected: on, disabled: !open }}
                disabled={!open}
                onPress={() => setCategory(x.id)}
                style={[styles.chip, { backgroundColor: on ? c.accent : c.surface, borderColor: on ? c.accentDeep : c.outline, opacity: open ? 1 : 0.45 }]}
              >
                <Text style={[styles.chipText, { color: on ? c.onAccent : c.ink }]}>{x.title}</Text>
                {!open && opener ? <Text style={[styles.chipSub, { color: c.inkSoft }]}>After {opener}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </GameIntro>
    );
  }

  const go = play.go;
  const board = go.items[go.at];
  const right = rightOrder(board, go.seed + go.at);
  const boardsBefore = go.items.slice(0, go.at).reduce((t, b) => t + b.length, 0);
  const asked = go.items.reduce((t, b) => t + b.length, 0);
  // A board with little grids on it gives every tile their height, so the rows line up.
  const tall = board.some((p) => 'cells' in p.left || 'cells' in p.right);

  const across = width > height && height < 600;

  const choose = (side: 'left' | 'right', id: string) => {
    if (done.includes(id)) return;
    if (!chosen || chosen.side === side) {
      buzz('key');
      setChosen(chosen?.side === side && chosen.id === id ? null : { side, id });
      return;
    }
    const first = board.find((p) => p.id === chosen.id) as Pair;
    setChosen(null);
    if (chosen.id === id) {
      buzz('correct');
      const nowDone = [...done, id];
      const clean = missedPairs.includes(id) ? cleanSoFar : cleanSoFar + 1;
      setCleanSoFar(clean);
      setDone(nowDone);
      setWrong(null);
      if (nowDone.length === board.length) {
        // Board cleared: a short pause to see it, then the next board or the results.
        setTimeout(() => {
          setDone([]);
          play.next(g.finish, { asked, firstTry: clean });
        }, 450);
      }
      return;
    }
    buzz('wrong');
    if (!missedPairs.includes(first.id)) setMissedPairs([...missedPairs, first.id]);
    setWrong({ ids: [`${chosen.side}-${chosen.id}`, `${side}-${id}`], clue: `Not a pair. ${first.clue}` });
  };

  const stateOf = (side: 'left' | 'right', id: string) =>
    done.includes(id) ? 'done' : wrong?.ids.includes(`${side}-${id}`) ? 'wrong' : chosen?.side === side && chosen.id === id ? 'chosen' : 'idle';

  return (
    <GameFrame wide>
      <GameTop onClose={play.stop} at={boardsBefore + done.length} total={asked} />
      <Prompt label={`Board ${go.at + 1} of ${go.items.length}`}>Tap an item, then its partner.</Prompt>
      <View style={[styles.board, across && styles.boardAcross]} testID="match-board">
        <View style={[styles.side, across && styles.sideAcross]}>
          {board.map((p) => (
            <Tile key={p.id} tall={tall} face={p.left} state={stateOf('left', p.id)} onPress={() => choose('left', p.id)} testID={`left-${p.id}`} />
          ))}
        </View>
        <View style={[styles.side, across && styles.sideAcross]}>
          {right.map((p) => (
            <Tile key={p.id} tall={tall} face={p.right} state={stateOf('right', p.id)} onPress={() => choose('right', p.id)} testID={`right-${p.id}`} />
          ))}
        </View>
      </View>
      <View style={[styles.clue, { backgroundColor: wrong ? c.badSoft : 'transparent' }]} testID="match-clue">
        <Text style={[typography.small, { color: wrong ? c.bad : c.inkSoft }]}>{wrong ? wrong.clue : done.length > 0 ? `${done.length} of ${board.length} matched.` : ' '}</Text>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderWidth: 1, borderBottomWidth: 3, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, userSelect: 'none' },
  chipText: { fontSize: 14, fontWeight: '700' },
  chipSub: { fontSize: 11 },
  board: { flex: 1, flexDirection: 'row', gap: space.sm },
  boardAcross: { flexDirection: 'column' },
  side: { flex: 1, gap: space.sm, justifyContent: 'center' },
  sideAcross: { flexDirection: 'row', alignItems: 'stretch' },
  tileWrap: { flexShrink: 1 },
  tileAcross: { flex: 1 },
  tileFill: { flex: 1 },
  tile: { minHeight: 56, borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', userSelect: 'none' },
  tall: { minHeight: 92 },
  words: { fontSize: 14.5, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
  code: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  icon: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18, fontWeight: '800' },
  miniRow: { flexDirection: 'row', alignItems: 'center' },
  miniHead: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  clue: { minHeight: 44, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 8, justifyContent: 'center' },
});
