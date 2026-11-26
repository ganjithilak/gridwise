/**
 * The painted world: sky, hills, farm stall, grass and soil.
 *
 * TEMPORARY ARTWORK. Every shape here is drawn in code as a stand-in, to settle the
 * composition, proportions and mood of Creative Direction V2. Production art (painted
 * layers or animation files) replaces these components one by one; their props and
 * placement are the contract to keep.
 */
import { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { seeded } from './geometry';
import { W } from './palette';

/** The sky behind everything above ground: deep blue up high, hazy near the hills. */
export const SkyBackdrop = memo(function SkyBackdrop({ width, height, skyPanel }: { width: number; height: number; skyPanel: number }) {
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
      {/* The sun, in the farm's sky, with a soft glow. */}
      <Circle cx={width * 0.16} cy={skyPanel + (height - skyPanel) * 0.2} r={Math.min(width, 500) * 0.36} fill="url(#sunGlow)" />
      <Circle cx={width * 0.16} cy={skyPanel + (height - skyPanel) * 0.2} r={Math.min(width, 500) * 0.085} fill={W.sun} />
    </Svg>
  );
});

/** One fluffy cel-shaded cloud, drawn in a 160 x 70 box. */
function CloudShape({ w }: { w: number }) {
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
export function DriftingCloud({ y, size, width, seconds, start }: { y: number; size: number; width: number; seconds: number; start: number }) {
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
      <CloudShape w={size} />
    </Animated.View>
  );
}

/** A row of rolling hills as one path, from `base` up to bumps of `rise`. */
function hills(width: number, base: number, rise: number, bumps: number, phase: number, bottom: number): string {
  const step = width / bumps;
  let d = `M0,${bottom} L0,${base - rise * (0.5 + 0.5 * Math.sin(phase))}`;
  for (let i = 0; i < bumps; i++) {
    const x0 = i * step;
    const top = base - rise * (0.65 + 0.35 * Math.sin(phase + i * 1.7));
    const end = base - rise * (0.5 + 0.5 * Math.sin(phase + (i + 1) * 1.3));
    d += ` Q${(x0 + step * 0.5).toFixed(1)},${(top - rise * 0.6).toFixed(1)} ${(x0 + step).toFixed(1)},${end.toFixed(1)}`;
  }
  return `${d} L${width},${bottom} Z`;
}

/** A daisy at (x, y). */
function Daisy({ x, y, r, colour }: { x: number; y: number; r: number; colour: string }) {
  return (
    <G transform={`translate(${x},${y})`}>
      <Path d={`M0,0 v${r * 2.4}`} stroke={W.grassEdge} strokeWidth={1.2} />
      {[0, 72, 144, 216, 288].map((a) => (
        <Ellipse key={a} cx={0} cy={-r * 0.8} rx={r * 0.5} ry={r * 0.85} fill={colour} stroke={W.grassEdge} strokeWidth={0.6} transform={`rotate(${a})`} />
      ))}
      <Circle cx={0} cy={0} r={r * 0.45} fill={W.flowerYellow} />
    </G>
  );
}

/** A tuft of grass blades standing on (x, y). */
function tuft(x: number, y: number, h: number): string {
  return `M${x - 6},${y} Q${x - 5},${y - h * 0.6} ${x - 8},${y - h} Q${x - 2},${y - h * 0.5} ${x - 1},${y} Q${x},${y - h * 0.8} ${x + 2},${y - h * 1.15} Q${x + 3},${y - h * 0.6} ${x + 4},${y} Q${x + 6},${y - h * 0.5} ${x + 9},${y - h * 0.85} Q${x + 7},${y - h * 0.3} ${x + 8},${y} Z`;
}

/** The farm stall: posts, a striped scalloped awning, a counter of golden fruit and a sign. */
function Stall({ x, base, w }: { x: number; base: number; w: number }) {
  const h = w * 1.08;
  const top = base - h;
  const stripes = 6;
  const sw = (w + 12) / stripes;
  const awTop = top + h * 0.1;
  const awBot = top + h * 0.34;
  const counter = top + h * 0.6;
  return (
    <G>
      {/* Shadow on the grass. */}
      <Ellipse cx={x + w * 0.52} cy={base + 2} rx={w * 0.62} ry={w * 0.07} fill={W.grassDark} opacity={0.55} />
      {/* Back wall. */}
      <Rect x={x + 4} y={awBot - 4} width={w - 8} height={counter - awBot + 4} fill={W.woodDark} />
      <Path d={`M${x + 4},${awBot + 14} h${w - 8}`} stroke={W.ink} strokeWidth={1} opacity={0.3} />
      {/* Posts. */}
      {[x + 2, x + w - 10].map((px) => (
        <G key={px}>
          <Rect x={px} y={awTop} width={8} height={base - awTop} fill={W.wood} stroke={W.ink} strokeWidth={1.4} />
          <Rect x={px + 5} y={awTop} width={3} height={base - awTop} fill={W.woodDark} opacity={0.7} />
        </G>
      ))}
      {/* Roof board. */}
      <Path d={`M${x - 10},${awTop + 2} L${x + 8},${top} L${x + w - 8},${top} L${x + w + 10},${awTop + 2} Z`} fill={W.woodLight} stroke={W.ink} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d={`M${x + w * 0.55},${top} L${x + w - 8},${top} L${x + w + 10},${awTop + 2} L${x + w * 0.62},${awTop + 2} Z`} fill={W.wood} />
      {/* Awning: alternating stripes with a scalloped hem. */}
      {Array.from({ length: stripes }, (_, i) => {
        const sx = x - 6 + i * sw;
        const colour = i % 2 === 0 ? W.awning : W.awningCream;
        return (
          <Path
            key={i}
            d={`M${sx},${awTop} L${sx + sw},${awTop} L${sx + sw},${awBot} Q${sx + sw / 2},${awBot + sw * 0.55} ${sx},${awBot} Z`}
            fill={colour}
            stroke={W.ink}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
        );
      })}
      <Rect x={x - 6} y={awTop} width={w + 12} height={(awBot - awTop) * 0.28} fill={W.awningShade} opacity={0.35} />
      {/* Crates of golden fruit and a basket of leaves on the counter. */}
      {[0.08, 0.5].map((f, ci) => {
        const cx = x + w * f;
        const cw = w * 0.4;
        return (
          <G key={f}>
            {Array.from({ length: 4 }, (_, i) => (
              <G key={i}>
                <Circle cx={cx + cw * (0.17 + i * 0.22)} cy={counter - 6} r={w * 0.055} fill={ci === 0 ? W.fruit : W.awning} stroke={W.ink} strokeWidth={1} />
                <Circle cx={cx + cw * (0.14 + i * 0.22)} cy={counter - 8} r={w * 0.016} fill="#FFFBE6" />
              </G>
            ))}
            <Rect x={cx} y={counter - 4} width={cw} height={h * 0.07} fill={W.woodLight} stroke={W.ink} strokeWidth={1.2} />
          </G>
        );
      })}
      {/* Counter and its planked front. */}
      <Rect x={x - 4} y={counter} width={w + 8} height={h * 0.06} fill={W.woodLight} stroke={W.ink} strokeWidth={1.4} />
      <Rect x={x} y={counter + h * 0.06} width={w} height={base - counter - h * 0.06} fill={W.wood} stroke={W.ink} strokeWidth={1.4} />
      {[0.25, 0.5, 0.75].map((f) => (
        <Path key={f} d={`M${x + w * f},${counter + h * 0.06} V${base}`} stroke={W.woodDark} strokeWidth={1.4} />
      ))}
      <Rect x={x + w * 0.6} y={counter + h * 0.06} width={w * 0.4} height={base - counter - h * 0.06} fill={W.woodDark} opacity={0.35} />
      {/* The sign, nailed to the counter's front. */}
      <Rect x={x + w * 0.14} y={counter + h * 0.12} width={w * 0.72} height={h * 0.13} rx={3} fill={W.awningCream} stroke={W.ink} strokeWidth={1.3} />
      <SvgText x={x + w * 0.5} y={counter + h * 0.12 + h * 0.092} fontSize={Math.max(8, w * 0.085)} fontWeight="800" fill={W.woodDark} textAnchor="middle">
        FRESH TODAY
      </SvgText>
    </G>
  );
}

/** A round bush, cel-shaded. */
function Bush({ x, y, r }: { x: number; y: number; r: number }) {
  const puffs: [number, number, number][] = [
    [-r * 0.7, -r * 0.3, r * 0.6],
    [0, -r * 0.65, r * 0.75],
    [r * 0.7, -r * 0.3, r * 0.62],
    [0, 0, r * 0.7],
  ];
  return (
    <G transform={`translate(${x},${y})`}>
      <Ellipse cx={0} cy={r * 0.4} rx={r * 1.4} ry={r * 0.2} fill={W.grassDark} opacity={0.6} />
      <G fill={W.grassEdge}>
        {puffs.map(([px, py, pr], i) => (
          <Circle key={`e${i}`} cx={px} cy={py} r={pr + 1.6} />
        ))}
      </G>
      <G fill={W.hillNearShade}>
        {puffs.map(([px, py, pr], i) => (
          <Circle key={`s${i}`} cx={px} cy={py} r={pr} />
        ))}
      </G>
      <G fill={W.grassLight}>
        {puffs.map(([px, py, pr], i) => (
          <Circle key={`b${i}`} cx={px - pr * 0.12} cy={py - pr * 0.16} r={pr * 0.78} />
        ))}
      </G>
      <Circle cx={-r * 0.2} cy={-r * 0.5} r={r * 0.09} fill={W.flowerPink} />
      <Circle cx={r * 0.55} cy={-r * 0.25} r={r * 0.08} fill={W.flowerPink} />
      <Circle cx={r * 0.1} cy={-r * 0.05} r={r * 0.08} fill={W.flowerWhite} />
    </G>
  );
}

/**
 * Above ground: hills, a fence, the stall, the field, flowers and the grass lip that hangs
 * over the soil. `ground` is the y of the soil line; the drawing runs `lip` below it.
 */
export const FarmScene = memo(function FarmScene({ width, ground, lip }: { width: number; ground: number; lip: number }) {
  const field = ground * 0.74;
  const art = useMemo(() => {
    const rand = seeded(7);
    const daisies = Array.from({ length: Math.round(width / 34) }, () => ({
      x: rand() * width,
      y: field + 24 + rand() * (ground - field - 34),
      r: 2.4 + rand() * 1.8,
      colour: rand() > 0.75 ? W.flowerPink : W.flowerWhite,
    })).filter((d) => Math.abs(d.x - width / 2) > 50);
    const tufts = Array.from({ length: Math.round(width / 16) }, (_, i) => ({ x: i * 16 + rand() * 8, h: 9 + rand() * 9 }));
    const patches = Array.from({ length: 6 }, () => ({ x: rand() * width, y: field + 20 + rand() * (ground - field - 30), rx: 26 + rand() * 40 }));
    return { daisies, tufts, patches };
  }, [width, ground, field]);

  const stallW = Math.min(width * 0.3, 168);
  const fenceTop = field - ground * 0.07;
  const posts = Math.ceil(width / 38) + 1;
  const height = ground + lip;

  // The grass edge that hangs over the soil: a bumpy lip along the ground line.
  let lipPath = `M0,${ground - 4}`;
  for (let x = 0; x <= width + 12; x += 12) lipPath += ` Q${x + 6},${ground + 9 + ((x / 12) % 3) * 2} ${x + 12},${ground + 2}`;
  lipPath += ` L${width},${ground - 6} L0,${ground - 6} Z`;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="field" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={W.grassLight} />
          <Stop offset="1" stopColor={W.grass} />
        </LinearGradient>
      </Defs>
      {/* Far hills, then the nearer hills. */}
      <Path d={hills(width, ground * 0.58, ground * 0.08, 3, 0.6, field + 4)} fill={W.hillFar} />
      <Path d={hills(width, ground * 0.6, ground * 0.05, 3, 2.2, field + 4)} fill={W.hillFarShade} opacity={0.7} />
      <Path d={hills(width, ground * 0.69, ground * 0.07, 2, 4.1, field + 4)} fill={W.hillNear} />
      <Path d={hills(width, ground * 0.71, ground * 0.03, 2, 1.1, field + 4)} fill={W.hillNearShade} opacity={0.65} />

      {/* Fence along the back of the field. */}
      <G>
        <Rect x={0} y={fenceTop + 8} width={width} height={5} fill={W.fence} stroke={W.ink} strokeWidth={1} />
        <Rect x={0} y={fenceTop + 22} width={width} height={5} fill={W.fence} stroke={W.ink} strokeWidth={1} />
        {Array.from({ length: posts }, (_, i) => (
          <G key={i}>
            <Path d={`M${i * 38 + 4},${field + 6} V${fenceTop + 3} L${i * 38 + 8},${fenceTop - 2} L${i * 38 + 12},${fenceTop + 3} V${field + 6} Z`} fill={W.fence} stroke={W.ink} strokeWidth={1.1} strokeLinejoin="round" />
            <Rect x={i * 38 + 9} y={fenceTop + 3} width={3} height={field - fenceTop + 2} fill={W.fenceShade} />
          </G>
        ))}
      </G>

      {/* The field. */}
      <Path d={`M0,${field + 6} Q${width / 2},${field - 6} ${width},${field + 6} L${width},${ground} L0,${ground} Z`} fill="url(#field)" stroke={W.grassEdge} strokeWidth={1.2} />
      {art.patches.map((p, i) => (
        <Ellipse key={i} cx={p.x} cy={p.y} rx={p.rx} ry={p.rx * 0.18} fill={W.grassDark} opacity={0.18} />
      ))}

      <Stall x={width * 0.05} base={ground - ground * 0.035} w={stallW} />
      <Bush x={width * 0.86} y={ground - ground * 0.05} r={Math.min(width * 0.075, 46)} />
      <Bush x={width * 0.97} y={ground - ground * 0.11} r={Math.min(width * 0.05, 30)} />

      {art.daisies.map((d, i) => (
        <Daisy key={i} x={d.x} y={d.y} r={d.r} colour={d.colour} />
      ))}

      {/* Grass lip over the soil, then tufts standing along the front. */}
      <Path d={lipPath} fill={W.grass} stroke={W.grassEdge} strokeWidth={1.4} strokeLinejoin="round" />
      <G fill={W.grassDark} stroke={W.grassEdge} strokeWidth={0.8}>
        {art.tufts.map((t, i) => (
          <Path key={i} d={tuft(t.x, ground + 1, t.h)} />
        ))}
      </G>
    </Svg>
  );
});

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
