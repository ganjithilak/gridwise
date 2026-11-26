import { memo, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import type { Checkpoint } from '@/lessons/types';
import { STAGE_INFO, type LessonNode, type UnitNode } from '@/progress/path';

import { polyline, resample, sampleCubic, seeded, type Pt } from './geometry';
import { W } from './palette';

/** What a tap on the roots picked: a lesson, or a unit's test at its junction. */
export type RootPick = { kind: 'lesson'; node: LessonNode; unit: UnitNode } | { kind: 'test'; checkpoint: Checkpoint; unit: UnitNode };

interface PlacedLesson {
  node: LessonNode;
  at: Pt;
  /** Distance along the root from its junction. */
  along: number;
  /** Which way the root runs here (unit vector), for the little rootlet beside the node. */
  dir: Pt;
}

interface PlacedUnit {
  unit: UnitNode;
  side: -1 | 1;
  junction: Pt;
  root: Pt[];
  lessons: PlacedLesson[];
  /** How far along the root is white: up to the furthest lesson that is open. */
  grown: number;
  label: Pt;
}

export interface RootLayout {
  taproot: Pt[];
  /** How far down the taproot is white. */
  taprootGrown: number;
  units: PlacedUnit[];
  height: number;
}

const NODE = 36;
/** Unit labels never run wider than this, so they stay on screen. */
const LABEL_W = 168;
const LESSON_GAP = 56;

/** Arc length up to each point. */
function lengths(points: Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < points.length; i++) out.push(out[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  return out;
}

function pointAt(points: Pt[], lens: number[], s: number): { at: Pt; dir: Pt } {
  let i = 1;
  while (i < lens.length - 1 && lens[i] < s) i++;
  const a = points[i - 1];
  const b = points[i];
  const seg = lens[i] - lens[i - 1] || 1;
  const t = Math.min(1, Math.max(0, (s - lens[i - 1]) / seg));
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { at: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, dir: { x: (b.x - a.x) / len, y: (b.y - a.y) / len } };
}

const taprootX = (cx: number, y: number) => cx + Math.sin(y / 120) * 10;

/**
 * Lays the course out as a root system (Creative Direction V2, section 3). The taproot runs
 * down from the plant; each unit is a root branching off it, alternating sides, deeper as
 * the course goes on. Lessons sit along the root, the last at its tip, and a unit's test
 * sits at the junction where it leaves the taproot.
 *
 * `y = 0` is the soil line; `firstJunction` is how deep the first unit leaves the taproot.
 */
export function layoutRoots(path: UnitNode[], width: number, firstJunction: number): RootLayout {
  const cx = width / 2;
  const span = Math.min(width * 0.38, 240);
  let y = firstJunction;
  const units: PlacedUnit[] = path.map((unit, i) => {
    const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
    const n = unit.lessons.length;
    const junction = { x: taprootX(cx, y), y };
    const drop = Math.max(60, (n - 1) * LESSON_GAP + 70 - span * 0.75);
    const root = sampleCubic(
      junction,
      { x: junction.x + side * span * 0.55, y: y + 4 },
      { x: cx + side * span, y: y + drop * 0.25 + 10 },
      { x: cx + side * span * 0.9, y: y + drop + 20 },
    );
    const lens = lengths(root);
    const total = lens[lens.length - 1];
    const first = 52;
    const gap = n > 1 ? Math.min(64, (total - first - 22) / (n - 1)) : 0;
    const lessons = unit.lessons.map((node, k) => {
      const along = first + k * gap;
      return { node, along, ...pointAt(root, lens, along) };
    });
    const reached = lessons.filter((l) => l.node.state !== 'locked');
    const allDone = lessons.every((l) => l.node.state === 'done');
    const grown = allDone ? total : reached.length > 0 ? reached[reached.length - 1].along : 0;
    const placed: PlacedUnit = {
      unit,
      side,
      junction,
      root,
      lessons,
      grown,
      label: { x: junction.x + side * Math.min(span * 0.5, 110), y: y - 34 },
    };
    y += Math.max(150, drop * 0.6 + 96);
    return placed;
  });
  const bottom = Math.max(...units.map((u) => u.root[u.root.length - 1].y)) + 160;
  const taproot = resample(
    Array.from({ length: 80 }, (_, i) => {
      const ty = (i / 79) * (bottom - 40);
      return { x: taprootX(cx, ty), y: ty };
    }),
    6,
  );
  // The taproot grows down the main path only; a side root lights up once the taproot reaches it.
  const open = units.filter((u) => u.grown > 0 && !u.unit.unit.optional);
  const taprootGrown = open.length > 0 ? Math.max(...open.map((u) => u.junction.y)) + 14 : firstJunction * 0.55;
  for (const u of units) if (u.unit.unit.optional && u.junction.y > taprootGrown) u.grown = 0;
  return { taproot, taprootGrown, units, height: bottom };
}

/** Splits a root into the part grown so far (white) and the rest (faint). */
function split(points: Pt[], grown: number): [Pt[], Pt[]] {
  const lens = lengths(points);
  const i = lens.findIndex((l) => l >= grown);
  if (i === -1) return [points, []];
  if (i === 0) return [[], points];
  return [points.slice(0, i + 1), points.slice(i)];
}

/** A tapering root: drawn in short runs, each a little thinner, with a cel shadow and a glow. */
function Root({ points, from, to, lit }: { points: Pt[]; from: number; to: number; lit: boolean }) {
  if (points.length < 2) return null;
  const runs: { d: string; w: number }[] = [];
  const step = 6;
  for (let i = 0; i < points.length - 1; i += step) {
    const run = points.slice(i, Math.min(points.length, i + step + 1));
    const t = i / Math.max(1, points.length - 1);
    runs.push({ d: polyline(run), w: from + (to - from) * t });
  }
  if (!lit) {
    return (
      <G fill="none" strokeLinecap="round" strokeLinejoin="round">
        {runs.map((r, i) => (
          <Path key={i} d={r.d} stroke={W.rootFaint} strokeWidth={Math.max(2, r.w * 0.7)} />
        ))}
      </G>
    );
  }
  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      {runs.map((r, i) => (
        <Path key={`g${i}`} d={r.d} stroke={W.rootGlow} strokeOpacity={0.14} strokeWidth={r.w + 10} />
      ))}
      <G transform="translate(1.2,2)">
        {runs.map((r, i) => (
          <Path key={`s${i}`} d={r.d} stroke={W.rootShade} strokeWidth={r.w} />
        ))}
      </G>
      {runs.map((r, i) => (
        <Path key={`m${i}`} d={r.d} stroke={W.root} strokeWidth={r.w} />
      ))}
    </G>
  );
}

/** A little forked rootlet beside a lesson, pointing away from the root. */
function rootlet(at: Pt, dir: Pt, side: number, length: number): Pt[] {
  const nx = -dir.y * side;
  const ny = Math.abs(dir.x) * 0.6 + 0.5;
  const end = { x: at.x + nx * length, y: at.y + ny * length };
  return sampleCubic(at, { x: at.x + nx * length * 0.4, y: at.y + 4 }, { x: end.x - nx * 4, y: end.y - 6 }, end, 4);
}

/** The fine roots fanning out under the plant, more of them as it grows. */
function plantRootlets(cx: number, stage: number): Pt[][] {
  const count = [1, 2, 4, 6, 7, 8, 9, 10][stage] ?? 10;
  const rand = seeded(11);
  const out: Pt[][] = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    // Uneven lengths, depths and droop, so they read as roots rather than ribs.
    const len = (34 + rand() * 60) * (0.7 + stage * 0.08);
    const start = { x: cx + side * (1 + rand() * 3), y: 4 + rand() * 40 };
    const droop = 0.3 + rand() * 0.7;
    const wiggle = (rand() - 0.5) * 18;
    out.push(
      sampleCubic(
        start,
        { x: start.x + side * len * 0.35, y: start.y + 4 + wiggle },
        { x: start.x + side * len * 0.75, y: start.y + len * droop * 0.4 - wiggle },
        { x: start.x + side * len * (1.05 - droop * 0.35), y: start.y + len * droop },
        5,
      ),
    );
  }
  return out;
}

interface Props {
  layout: RootLayout;
  width: number;
  /** The plant's growth stage, for the fine roots under it. */
  stage: number;
  nextId: string | null;
  picked: string | null;
  onPick: (pick: RootPick) => void;
}

/** The drawing of the roots. Kept apart from the nodes so a tap never redraws the soil. */
const RootDrawing = memo(function RootDrawing({ layout, width, stage }: { layout: RootLayout; width: number; stage: number }) {
  const [tapLit, tapFaint] = split(layout.taproot, layout.taprootGrown);
  const totalTap = lengths(layout.taproot).at(-1) ?? 1;
  // The taproot thickens as the plant grows: a thread under a seed, a strong root under a tree.
  const thick = 6 + stage * 1.5;
  const tapW = (y: number) => thick - (y / totalTap) * (thick - 4);
  return (
    <Svg width={width} height={layout.height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {plantRootlets(width / 2, stage).map((r, i) => (
        <Root key={`pr${i}`} points={r} from={4} to={1.4} lit />
      ))}
      {layout.units.map((u) => {
        const [lit, faint] = split(u.root, u.grown);
        return (
          <G key={u.unit.unit.id}>
            <Root points={faint} from={6} to={2.5} lit={false} />
            <Root points={lit} from={9} to={Math.max(3, 9 - (u.grown / 400) * 6)} lit />
            {u.lessons.map((l) => {
              const on = l.node.state !== 'locked';
              return <Root key={l.node.lesson.id} points={rootlet(l.at, l.dir, u.side, 24)} from={3.2} to={1.2} lit={on} />;
            })}
          </G>
        );
      })}
      <Root points={tapFaint} from={tapW(layout.taprootGrown)} to={4} lit={false} />
      <Root points={tapLit} from={thick} to={tapW(layout.taprootGrown)} lit />
    </Svg>
  );
});

/** The pulsing ring round the lesson to do next. */
function NextRing() {
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
        },
      ]}
    />
  );
}

/** One lesson on the roots: a seed-pod button, its look saying where it stands. */
function LessonPod({ item, number, next, picked, onPress }: { item: PlacedLesson; number: number; next: boolean; picked: boolean; onPress: () => void }) {
  const { state } = item.node;
  const look = {
    done: { bg: W.root, edge: W.gold, ink: W.woodDark },
    practice: { bg: W.goldSoft, edge: W.fruitShade, ink: W.fruitEdge },
    open: { bg: next ? W.fruit : W.card, edge: next ? W.fruitEdge : W.root, ink: W.cardInk },
    locked: { bg: W.soilDeep, edge: 'rgba(255,238,214,0.28)', ink: 'rgba(255,238,214,0.45)' },
  }[state];
  const status = state === 'done' ? 'done' : state === 'practice' ? 'practice round waiting' : state === 'open' ? (next ? 'up next' : 'open') : 'locked';
  return (
    <Pressable
      testID={`lesson-${item.node.lesson.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${item.node.lesson.title}, ${status}`}
      onPress={onPress}
      hitSlop={6}
      style={[styles.podHit, { left: item.at.x - NODE / 2, top: item.at.y - NODE / 2 }]}
    >
      {next ? <NextRing /> : null}
      <View style={[styles.pod, { backgroundColor: look.bg, borderColor: picked ? W.awning : look.edge, borderWidth: picked ? 3.5 : 2.5 }]}>
        <Text style={[styles.podText, { color: look.ink }]}>{state === 'done' ? '✓' : number}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Main 2's interactive layer: the roots and, on them, every lesson and unit test. Coordinates
 * are the soil's own, with 0 at the soil line.
 */
export function RootMap({ layout, width, stage, nextId, picked, onPick }: Props) {
  return (
    <View pointerEvents="box-none" style={{ width, height: layout.height }}>
      <RootDrawing layout={layout} width={width} stage={stage} />
      {layout.units.map((u) => {
        const stageName = STAGE_INFO[u.unit.unit.stage].name.toUpperCase();
        const place = u.unit.unit.optional ? 'SIDE ROOT' : stageName;
        return (
          <View key={u.unit.unit.id} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            <View
              pointerEvents="none"
              style={[styles.label, u.side < 0 ? { right: Math.min(width - LABEL_W - 8, width - u.label.x - 40) } : { left: Math.min(width - LABEL_W - 8, u.label.x - 40) }, { top: u.label.y - 18 }]}
            >
              <Text style={styles.labelTag}>
                {place}
                {u.unit.complete ? ' · DONE' : ''}
              </Text>
              <Text style={styles.labelTitle} numberOfLines={1}>
                {u.unit.unit.title}
              </Text>
            </View>
            {u.unit.testOut ? (
              <Pressable
                testID={`test-${u.unit.testOut.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Know ${u.unit.unit.title} already? Take the test to skip it.`}
                onPress={() => onPick({ kind: 'test', checkpoint: u.unit.testOut!, unit: u.unit })}
                hitSlop={8}
                style={[styles.testHit, { left: u.junction.x - 15, top: u.junction.y - 15 }]}
              >
                <View style={[styles.test, { borderColor: picked === u.unit.testOut.id ? W.awning : W.gold }]}>
                  <Text style={styles.testText}>★</Text>
                </View>
              </Pressable>
            ) : null}
            {u.lessons.map((l, k) => (
              <LessonPod
                key={l.node.lesson.id}
                item={l}
                number={k + 1}
                next={l.node.lesson.id === nextId}
                picked={picked === l.node.lesson.id}
                onPress={() => onPick({ kind: 'lesson', node: l.node, unit: u.unit })}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  podHit: { position: 'absolute', width: NODE, height: NODE, alignItems: 'center', justifyContent: 'center' },
  pod: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  podText: { fontSize: 15, fontWeight: '900' },
  ring: { position: 'absolute', width: NODE, height: NODE, borderRadius: NODE / 2, borderWidth: 3, borderColor: W.fruit },
  label: { position: 'absolute', backgroundColor: W.soilChip, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, maxWidth: LABEL_W },
  labelTag: { color: W.fruit, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  labelTitle: { color: W.soilInk, fontSize: 14, fontWeight: '800' },
  testHit: { position: 'absolute', width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  test: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2.5,
    backgroundColor: W.soilDeepest,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  testText: { color: W.fruit, fontSize: 12, fontWeight: '900', transform: [{ rotate: '-45deg' }] },
});
