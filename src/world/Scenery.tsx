/**
 * The painted world: sky, hills, farm stall, grass and soil.
 *
 * TEMPORARY ARTWORK. Every shape here is drawn in code as a stand-in, to settle the
 * composition, proportions and mood of Creative Direction V2. Production art (painted
 * layers or animation files) replaces these components one by one; their props and
 * placement are the contract to keep.
 */
import { memo, useEffect, useMemo, useState, type ComponentType } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { SkyDome } from './env/SkyDome';
import { seeded } from './geometry';
import { W } from './palette';

/** The sky behind everything above ground: deep blue up high, hazy near the hills. */
export const SkyBackdrop = memo(function SkyBackdrop({ width, height, skyPanel, horizon }: { width: number; height: number; skyPanel: number; horizon: number }) {
  // The gradient stops are placed so the farm's own sky (below the sky panel) is the light part.
  const farmStart = skyPanel / height;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={W.skyTop} />
          <Stop offset={String(farmStart * 0.6)} stopColor={W.skyHigh} />
          <Stop offset={String(farmStart + (1 - farmStart) * 0.35)} stopColor={W.skyMid} />
          <Stop offset={String(farmStart + (1 - farmStart) * 0.75)} stopColor={W.skyLow} />
          <Stop offset="1" stopColor={W.haze} />
        </LinearGradient>
        <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={W.sunGlow} stopOpacity={0.75} />
          <Stop offset="0.45" stopColor={W.sunGlow} stopOpacity={0.25} />
          <Stop offset="1" stopColor={W.sunGlow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#sky)" />
      <SkyDome width={width} horizon={horizon} zenith={-skyPanel * 0.15} labelsAt={skyPanel + (height - skyPanel) * 0.17} />
      {/* The sun, in the farm's sky, with a soft glow. */}
      <Circle cx={width * 0.16} cy={skyPanel + (height - skyPanel) * 0.2} r={Math.min(width, 500) * 0.36} fill="url(#sunGlow)" />
      <Circle cx={width * 0.16} cy={skyPanel + (height - skyPanel) * 0.2} r={Math.min(width, 500) * 0.085} fill={W.sun} />
    </Svg>
  );
});

/** One fluffy cel-shaded cloud, drawn in a 160 x 70 box. */
export function CloudShape({ w }: { w: number }) {
  const h = (w * 70) / 160;
  const puffs: [number, number, number][] = [
    [36, 46, 22],
    [64, 30, 26],
    [96, 32, 22],
    [124, 46, 20],
    [80, 50, 24],
  ];
  return (
    <Svg width={w} height={h} viewBox="0 0 160 70">
      <G fill={W.cloudEdge}>
        {puffs.map(([x, y, r], i) => (
          <Circle key={`e${i}`} cx={x} cy={y} r={r + 1.6} />
        ))}
      </G>
      <G fill={W.cloudShade}>
        {puffs.map(([x, y, r], i) => (
          <Circle key={`s${i}`} cx={x} cy={y} r={r} />
        ))}
      </G>
      <G fill={W.cloud}>
        {puffs.map(([x, y, r], i) => (
          <Circle key={`b${i}`} cx={x - 1} cy={y - 4} r={r - 2} />
        ))}
      </G>
    </Svg>
  );
}

/** A cloud that drifts across the sky and comes round again. */
export function DriftingCloud({
  y,
  size,
  width,
  seconds,
  start,
  Shape = CloudShape,
}: {
  y: number;
  size: number;
  width: number;
  seconds: number;
  start: number;
  /** The theme's cloud drawing. */
  Shape?: ComponentType<{ w: number }>;
}) {
  const [x] = useState(() => new Animated.Value(start));
  useEffect(() => {
    const from = -size;
    const to = width + size * 0.2;
    // The first pass starts where the cloud already is, so the sky is never empty on arrival.
    const first = Animated.timing(x, {
      toValue: to,
      duration: ((to - start * width) / (to - from)) * seconds * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    x.setValue(start * width);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: from, duration: 0, useNativeDriver: true }),
        Animated.timing(x, { toValue: to, duration: seconds * 1000, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    first.start(({ finished }) => finished && loop.start());
    return () => {
      first.stop();
      loop.stop();
    };
  }, [x, size, width, seconds, start]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top: y, left: 0, transform: [{ translateX: x }] }}>
      <Shape w={size} />
    </Animated.View>
  );
}

/**
 * The soil: loamy brown, darker the deeper it goes, with strata, pebbles, the odd big stone
 * and fine grass roots just under the surface.
 */
export const Soil = memo(function Soil({ width, height }: { width: number; height: number }) {
  const art = useMemo(() => {
    const rand = seeded(42);
    const area = width * height;
    const pebbles = Array.from({ length: Math.round(area / 5200) }, () => {
      const r = 1.6 + rand() * rand() * 7;
      return { x: rand() * width, y: 24 + rand() * (height - 30), r, tone: rand() };
    });
    const specks = Array.from({ length: Math.round(area / 1400) }, () => ({ x: rand() * width, y: rand() * height, r: 0.6 + rand() * 1.1, light: rand() > 0.5 }));
    const stones = Array.from({ length: Math.max(3, Math.round(height / 420)) }, (_, i) => ({
      x: i % 2 === 0 ? width * (0.02 + rand() * 0.08) : width * (0.9 + rand() * 0.08),
      y: 160 + (i * (height - 260)) / Math.max(3, Math.round(height / 420)) + rand() * 60,
      r: 14 + rand() * 12,
    }));
    const fibres = Array.from({ length: Math.round(width / 9) }, (_, i) => ({ x: i * 9 + rand() * 6, l: 6 + rand() * 14, bend: (rand() - 0.5) * 8 }));
    const strata = Array.from({ length: Math.round(height / 140) }, (_, i) => 90 + i * 140 + rand() * 40);
    return { pebbles, specks, stones, fibres, strata };
  }, [width, height]);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={W.soilTop} />
          <Stop offset="0.08" stopColor={W.soil} />
          <Stop offset="0.55" stopColor={W.soilDeep} />
          <Stop offset="1" stopColor={W.soilDeepest} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#soil)" />
      {/* Dark humus band right under the grass. */}
      <Rect x={0} y={0} width={width} height={26} fill={W.humus} opacity={0.55} />
      {art.strata.map((y, i) => (
        <Path
          key={i}
          d={`M0,${y} Q${width * 0.25},${y - 14} ${width * 0.5},${y} T${width},${y} L${width},${y + 10} Q${width * 0.75},${y + 22} ${width * 0.5},${y + 10} T0,${y + 10} Z`}
          fill="#FFFFFF"
          opacity={0.035}
        />
      ))}
      {art.specks.map((s, i) => (
        <Circle key={`k${i}`} cx={s.x} cy={s.y} r={s.r} fill={s.light ? W.pebbleLight : W.pebbleDark} opacity={0.5} />
      ))}
      {art.pebbles.map((p, i) => (
        <G key={`p${i}`}>
          <Ellipse cx={p.x} cy={p.y + p.r * 0.25} rx={p.r * 1.25} ry={p.r * 0.85} fill={W.pebbleDark} opacity={0.7} />
          <Ellipse cx={p.x} cy={p.y} rx={p.r * 1.2} ry={p.r * 0.8} fill={p.tone > 0.5 ? W.pebble : W.pebbleLight} opacity={0.85} />
        </G>
      ))}
      {art.stones.map((s, i) => (
        <G key={`s${i}`}>
          <Ellipse cx={s.x} cy={s.y} rx={s.r * 1.35} ry={s.r} fill={W.pebble} stroke={W.pebbleDark} strokeWidth={1.6} />
          <Path d={`M${s.x + s.r * 0.2},${s.y - s.r} A${s.r * 1.35},${s.r} 0 0 1 ${s.x + s.r * 1.35},${s.y} A${s.r * 1.35},${s.r} 0 0 1 ${s.x - s.r * 0.6},${s.y + s.r * 0.9} Q${s.x + s.r * 0.9},${s.y + s.r * 0.2} ${s.x + s.r * 0.2},${s.y - s.r} Z`} fill={W.pebbleDark} opacity={0.45} />
          <Ellipse cx={s.x - s.r * 0.45} cy={s.y - s.r * 0.4} rx={s.r * 0.35} ry={s.r * 0.18} fill={W.pebbleLight} />
        </G>
      ))}
      {/* Fine grass roots hanging from the surface. */}
      <G stroke={W.rootShade} strokeWidth={0.9} fill="none" opacity={0.55} strokeLinecap="round">
        {art.fibres.map((f, i) => (
          <Path key={i} d={`M${f.x},4 q${f.bend},${f.l * 0.5} ${f.bend * 0.4},${f.l}`} />
        ))}
      </G>
    </Svg>
  );
});
