import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { SectionLabel, useRefinedUI } from '@/components/Panel';
import { useProgress } from '@/progress/store';
import { radius, space, type as typography, useTheme, type Palette } from '@/theme';
import { Goldspire } from '@/world/Goldspire';
import { ScreenSky } from '@/world/ui/ScreenSky';

interface Stop {
  id: string;
  title: string;
  words: string;
  picture: (c: Palette, refined: boolean) => ReactNode;
}

/** A small drawing of the sheet with one cell selected, made from plain boxes. */
function MiniSheet({ c }: { c: Palette }) {
  const rows = [
    ['Fruit', 'Price per kg'],
    ['Apples', '$4.00'],
    ['Pears', '$3.50'],
  ];
  return (
    <View style={[styles.mini, { borderColor: c.outline, backgroundColor: c.surface }]}>
      {rows.map((row, r) => (
        <View key={row[0]} style={styles.miniRow}>
          {row.map((cell, col) => {
            const selected = r === 2 && col === 1;
            return (
              <View key={cell} style={[styles.miniCell, { borderColor: selected ? c.accent : c.line, borderWidth: selected ? 2 : 0.5 }]}>
                <Text style={[styles.miniText, { color: c.ink, fontWeight: r === 0 ? '800' : '400', textAlign: col === 1 && r > 0 ? 'right' : 'left' }]}>
                  {cell}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** One of the three steps of a lesson, as a labelled row. */
function Step({ c, name, words, on }: { c: Palette; name: string; words: string; on: boolean }) {
  return (
    <View style={[styles.step, { backgroundColor: on ? c.accentSoft : c.surface, borderColor: on ? c.accent : c.line, borderRadius: 14 }]}>
      <Text style={[styles.stepName, { color: c.accent }]}>{name}</Text>
      <Text style={[typography.small, styles.stepWords, { color: c.ink }]}>{words}</Text>
    </View>
  );
}

function Key({ c, label }: { c: Palette; label: string }) {
  return (
    <View style={[styles.key, { backgroundColor: c.surface, borderColor: c.outline }]}>
      <Text style={[styles.keyText, { color: c.ink }]}>{label}</Text>
    </View>
  );
}

/**
 * The tour: what the app is, how a lesson goes, and where everything is. Five stops,
 * each one screen, and it can be skipped from any of them. It is offered once, on first
 * launch, and can be taken again from the Profile screen.
 */
const STOPS: Stop[] = [
  {
    id: 'path',
    title: 'From roots to fruits',
    words:
      'You grow your skills like a plant. First the roots: the spreadsheet itself. Then the trunk: your first formulas. Then the branches: smarter formulas. Last the fruit: real jobs, start to finish.',
    picture: (_c, refined) => <Goldspire stage={7} ripe height={150} refined={refined} />,
  },
  {
    id: 'steps',
    title: 'Every lesson has three steps',
    words: 'The bar at the top of a lesson shows which step you are on. Nothing is tested before it has been taught.',
    picture: (c) => (
      <View style={styles.steps}>
        <Step c={c} name="TEACH" words="Watch a short step, shown on a real sheet." on />
        <Step c={c} name="LESSON" words="Do it yourself. Hints are there if you want them." on={false} />
        <Step c={c} name="APPLY" words="Use it on a practical task, like updating a price." on={false} />
      </View>
    ),
  },
  {
    id: 'sheet',
    title: 'A real sheet, not a quiz',
    words:
      'Tap a cell to select it, then type: what you type replaces what was there. Then press Check. A wrong answer costs nothing: it stays on screen so you can fix it and check again.',
    picture: (c) => (
      <View style={styles.sheetDemo}>
        <MiniSheet c={c} />
        <View style={[styles.checkPill, { backgroundColor: c.accent }]}>
          <Text style={[styles.checkText, { color: c.onAccent }]}>Check</Text>
        </View>
      </View>
    ),
  },
  {
    id: 'practice',
    title: 'Games and practice',
    words:
      'The Games tab has six short games on what you have learned, from matching pairs to building formulas, and each opens with the lesson that teaches it. It also brings back anything you found tricky.',
    picture: (c) => (
      <View style={styles.combo}>
        <Key c={c} label="Ctrl" />
        <Text style={[styles.plus, { color: c.inkSoft }]}>+</Text>
        <Key c={c} label="C" />
        <Text style={[styles.time, { color: c.spark }]}>★★★</Text>
      </View>
    ),
  },
  {
    id: 'profile',
    title: 'Your profile, and one last tip',
    words:
      'The Profile tab keeps your progress, finished lessons, badges and game results. And in a lesson, turn your phone on its side for a split screen: the sheet on one half, the lesson on the other.',
    picture: () => <Mascot expression="cheering" size={96} />,
  },
];

export default function TourScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setTourSeen = useProgress((s) => s.setTourSeen);
  const [at, setAt] = useState(0);
  const stop = STOPS[at];
  const last = at === STOPS.length - 1;
  const refined = useRefinedUI();

  // Wherever it was opened from is still underneath: the welcome question, or the Profile screen.
  const leave = () => {
    setTourSeen();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.lg }]}>
      <ScreenSky />
      <View style={styles.column}>
        <View style={styles.top}>
          <SectionLabel testID="tour-count">{`${at + 1} of ${STOPS.length}`}</SectionLabel>
          {last ? null : <Button testID="tour-skip" kind="quiet" label="Skip the tour" onPress={leave} style={styles.skip} />}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.stop} showsVerticalScrollIndicator={false}>
          <View style={styles.picture} testID={`tour-${stop.id}`}>
            {stop.picture(c, refined)}
          </View>
          <Text style={[typography.title, styles.centre, { color: c.ink }]}>{stop.title}</Text>
          <Text style={[typography.body, styles.centre, { color: c.inkSoft }]}>{stop.words}</Text>
        </ScrollView>

        <View style={styles.dots} accessibilityLabel={`Stop ${at + 1} of ${STOPS.length}`}>
          {STOPS.map((s, i) => (
            <View key={s.id} style={[styles.dot, { backgroundColor: i === at ? c.accent : c.outline, width: i === at ? 18 : 7 }]} />
          ))}
        </View>
        <View style={styles.buttons}>
          {at > 0 ? <Button testID="tour-back" kind="secondary" label="Back" onPress={() => setAt(at - 1)} style={styles.side} /> : null}
          <Button testID="tour-next" label={last ? 'Start learning' : 'Next'} onPress={last ? leave : () => setAt(at + 1)} style={styles.main} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 480, paddingHorizontal: space.lg, gap: space.md },
  top: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { minHeight: 40, paddingHorizontal: 0 },
  scroll: { flex: 1 },
  stop: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingVertical: space.md },
  picture: { minHeight: 160, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  centre: { textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { height: 7, borderRadius: 4 },
  buttons: { flexDirection: 'row', gap: space.sm },
  side: { flex: 1 },
  main: { flex: 2 },
  steps: { alignSelf: 'stretch', gap: 6 },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: space.md },
  stepName: { width: 58, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  stepWords: { flex: 1 },
  sheetDemo: { alignItems: 'center', gap: space.md },
  mini: { borderWidth: 1.5, borderRadius: radius.sm, overflow: 'hidden' },
  miniRow: { flexDirection: 'row' },
  miniCell: { width: 84, height: 30, justifyContent: 'center', paddingHorizontal: 8 },
  miniText: { fontSize: 14 },
  checkPill: { borderRadius: radius.md, paddingHorizontal: 28, paddingVertical: 8 },
  checkText: { fontSize: 15, fontWeight: '700' },
  combo: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  key: { minWidth: 46, height: 46, paddingHorizontal: 10, borderRadius: radius.sm, borderWidth: 1, borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 16, fontWeight: '800' },
  plus: { fontSize: 20, fontWeight: '700' },
  time: { fontSize: 22, fontWeight: '700', marginLeft: space.md },
});
