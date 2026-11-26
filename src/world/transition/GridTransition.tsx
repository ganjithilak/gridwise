import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/theme';

import { useTransitionStore } from './nav';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/** Frames from the curved dome (0) to the flat sheet (FRAMES - 1). */
const FRAMES = 5;
const FULL_MS = 820;
const REDUCED_MS = 320;

type Pt = { x: number; y: number };

/**
 * The same mesh, bent: `bend` 1 is the sky dome seen from inside (the world's spreadsheet
 * atmosphere), 0 is a flat sheet of cells. Points are blended between the two, so every
 * line of the sky becomes a row or column of the sheet.
 */
function meshFrames(w: number, h: number) {
  const tilt = (24 * Math.PI) / 180;
  const horizon = h * 0.78;
  const zenith = -h * 0.35;
  const f = (horizon - zenith) / (Math.tan(tilt) + 1 / Math.tan(tilt));
  const cy = horizon - f * Math.tan(tilt);
  const dome = (lat: number, lon: number): Pt => {
    const la = (lat * Math.PI) / 180;
    const lo = (lon * Math.PI) / 180;
    const X = Math.cos(la) * Math.sin(lo);
    const Y = Math.sin(la);
    const Z = Math.cos(la) * Math.cos(lo);
    const y2 = Y * Math.cos(tilt) - Z * Math.sin(tilt);
    const z2 = Math.max(0.08, Y * Math.sin(tilt) + Z * Math.cos(tilt));
    return { x: w / 2 + (f * X) / z2, y: cy - (f * y2) / z2 };
  };
  const lats = Array.from({ length: 17 }, (_, i) => 3 + i * 5); // low to high
  const lons = Array.from({ length: 29 }, (_, j) => -84 + j * 6);
  // The flat sheet: rows top to bottom (highest latitude at the top), columns left to right.
  const cellW = Math.max(56, Math.min(84, w / 5.2));
  const cellH = 32;
  const top = h * 0.14;
  const flat = (i: number, j: number): Pt => ({ x: w / 2 + (j - (lons.length - 1) / 2) * cellW - cellW / 2, y: top + (lats.length - 1 - i) * cellH });
  const frames = Array.from({ length: FRAMES }, (_, k) => {
    const bend = 1 - k / (FRAMES - 1);
    const at = (i: number, j: number): Pt => {
      const a = flat(i, j);
      const b = dome(lats[i], lons[j]);
      return { x: a.x + (b.x - a.x) * bend, y: a.y + (b.y - a.y) * bend };
    };
    const line = (pts: Pt[]) => pts.map((p, n) => `${n ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const rows = lats.map((_, i) => line(lons.map((__, j) => at(i, j))));
    const cols = lons.map((_, j) => line(lats.map((__, i) => at(i, j))));
    return `${rows.join(' ')} ${cols.join(' ')}`;
  });
  // Column letters and row numbers for the flat sheet, the first visible column as headers.
  const firstCol = lons.findIndex((_, j) => flat(0, j).x >= -cellW * 0.2);
  const letters = Array.from({ length: 8 }, (_, n) => ({ x: flat(0, firstCol + 1 + n).x + cellW / 2, t: LETTERS[n] })).filter((l) => l.x < w);
  const numbers = Array.from({ length: Math.floor((h - top) / cellH) - 1 }, (_, n) => ({ y: top + (n + 1) * cellH + cellH * 0.65, t: String(n + 1) }));
  return { frames, letters, numbers, headerX: flat(0, firstCol).x, cellW, cellH, top };
}

/**
 * Gridwise's lesson transition. Going in, the camera moves up into the spreadsheet sky, the
 * curved grid fills the view, straightens into a flat sheet with its letters and numbers,
 * and the lesson appears in its place. Coming out runs the other way, back to the world.
 *
 * About 0.8 s in full, all on the native driver (precomputed frames cross-faded, no redraws).
 * Reduced is a 0.3 s fade; Off navigates directly (see `useLessonNav`).
 */
export function GridTransition() {
  const run = useTransitionStore((s) => s.run);
  const end = useTransitionStore((s) => s.end);
  const c = useTheme();
  const { width: w, height: h } = useWindowDimensions();
  const [t] = useState(() => new Animated.Value(0));
  const mesh = useMemo(() => meshFrames(w, h), [w, h]);

  useEffect(() => {
    if (!run) return;
    const full = run.mode === 'full';
    const ms = full ? FULL_MS : REDUCED_MS;
    t.setValue(0);
    // Navigate while the overlay covers the screen: late going in, early coming out.
    const navAt = full ? (run.dir === 'in' ? 0.72 : 0.22) : 0.5;
    const nav = setTimeout(run.mid, ms * navAt);
    const anim = Animated.timing(t, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    anim.start(() => end(run.id));
    return () => {
      clearTimeout(nav);
      anim.stop();
    };
  }, [run, t, end]);

  if (!run) return null;
  const full = run.mode === 'full';
  const into = run.dir === 'in';
  const fade = (input: number[], output: number[]) => t.interpolate({ inputRange: input, outputRange: output, extrapolate: 'clamp' });
  // Time runs backwards through the frames when coming out.
  const at = (x: number) => (into ? x : 1 - x);
  const ordered = (pairs: [number, number][]) => {
    const p = pairs.map(([x, y]) => [at(x), y] as [number, number]).sort((a, b) => a[0] - b[0]);
    return fade(
      p.map((q) => q[0]),
      p.map((q) => q[1]),
    );
  };

  if (!full) {
    return <Animated.View pointerEvents="auto" style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, opacity: fade([0, 0.5, 1], [0, 1, 0]) }]} />;
  }

  const container = into ? fade([0, 0.12, 0.8, 1], [0, 1, 1, 0]) : fade([0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const sky = ordered([
    [0, 1],
    [0.42, 1],
    [0.68, 0],
    [1, 0],
  ]);
  const sheet = ordered([
    [0, 0],
    [0.45, 0],
    [0.7, 1],
    [1, 1],
  ]);
  const scale = ordered([
    [0, 1],
    [0.32, 1.16],
    [0.7, 1],
    [1, 1],
  ]);
  const frameOpacity = (k: number) => {
    const peak = 0.3 + k * 0.1;
    if (k === 0)
      return ordered([
        [0, 1],
        [peak, 1],
        [peak + 0.1, 0],
        [1, 0],
      ]);
    if (k === FRAMES - 1)
      return ordered([
        [0, 0],
        [peak - 0.1, 0],
        [peak, 1],
        [1, 1],
      ]);
    return ordered([
      [0, 0],
      [peak - 0.1, 0],
      [peak, 1],
      [peak + 0.1, 0],
      [1, 0],
    ]);
  };
  const headers = ordered([
    [0, 0],
    [0.62, 0],
    [0.74, 1],
    [1, 1],
  ]);

  return (
    <Animated.View pointerEvents="auto" style={[StyleSheet.absoluteFill, { opacity: container }]} testID="grid-transition">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: sky }]}>
        <Svg width={w} height={h}>
          <Defs>
            <LinearGradient id="gt-sky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#24507F" />
              <Stop offset="0.6" stopColor="#4F86BD" />
              <Stop offset="1" stopColor="#9EC2DE" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={w} height={h} fill="url(#gt-sky)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, opacity: sheet }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}>
        {mesh.frames.map((d, k) => (
          <Animated.View key={k} style={[StyleSheet.absoluteFill, { opacity: frameOpacity(k) }]}>
            <Svg width={w} height={h}>
              <Path d={d} stroke="#FFFFFF" strokeOpacity={0.5 - k * 0.05} strokeWidth={1} fill="none" />
            </Svg>
          </Animated.View>
        ))}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headers }]}>
          <Svg width={w} height={h}>
            <Rect x={0} y={mesh.top} width={w} height={mesh.cellH} fill={c.accent} opacity={0.12} />
            <Rect x={mesh.headerX} y={mesh.top} width={mesh.cellW} height={h} fill={c.accent} opacity={0.08} />
            <G fill={c.inkSoft} fontWeight="700" fontSize={13} textAnchor="middle" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif">
              {mesh.letters.map((l) => (
                <SvgText key={l.t} x={l.x} y={mesh.top + mesh.cellH * 0.65}>
                  {l.t}
                </SvgText>
              ))}
              {mesh.numbers.map((n) => (
                <SvgText key={n.t} x={mesh.headerX + mesh.cellW / 2} y={n.y}>
                  {n.t}
                </SvgText>
              ))}
            </G>
          </Svg>
        </Animated.View>
      </Animated.View>
      <View style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}
