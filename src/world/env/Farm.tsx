/**
 * The farm above ground, in two layers so things can stand between them (the scarecrow
 * stands behind the fence):
 *
 *   FarmBackdrop    far hills (orchard, vineyard), near hills (apples, tomatoes, oranges, plums)
 *   …scarecrow…
 *   FarmForeground  fence, field, stall, bushes, watering can, pumpkin, grass lip
 *
 * Both are static drawings (memoised SVG), so they cost nothing per frame. The centre of the
 * field is kept clear for the learner's plant to grow into a tree, and for a future farmer.
 *
 * TEMPORARY ARTWORK.
 */
import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { seeded } from '../geometry';
import { W } from '../palette';

import { FruitTree, Pumpkin, TomatoRow, VineRow, WateringCan, type FruitKind } from './Produce';
import { Stall } from './Stall';

/** Where things are on the farm, for anything that has to line up with the painting. */
export function farmGeometry(width: number, ground: number) {
  const field = ground * 0.74;
  return {
    field,
    fenceTop: field - ground * 0.07,
    /** The scarecrow's pole, behind the fence on the right. */
    scarecrow: { x: width * 0.72, base: field + 2 },
  };
}

/** A row of rolling hills: its outline as a path, and its height at any x. */
function hill(width: number, base: number, rise: number, bumps: number, phase: number) {
  const step = width / bumps;
  const at = (i: number) => base - rise * (0.5 + 0.5 * Math.sin(phase + i * 1.3));
  const peak = (i: number) => base - rise * (0.65 + 0.35 * Math.sin(phase + i * 1.7)) - rise * 0.6;
  const start = base - rise * (0.5 + 0.5 * Math.sin(phase));
  const ends = Array.from({ length: bumps }, (_, i) => at(i + 1));
  // Each bump is a quadratic whose control point is mid-way across, so x is linear in t.
  const y = (x: number) => {
    const i = Math.min(bumps - 1, Math.max(0, Math.floor(x / step)));
    const t = (x - i * step) / step;
    const y0 = i === 0 ? start : ends[i - 1];
    return (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * peak(i) + t * t * ends[i];
  };
  const path = (bottom: number) => {
    let d = `M0,${bottom} L0,${start.toFixed(1)}`;
    for (let i = 0; i < bumps; i++) d += ` Q${(i * step + step / 2).toFixed(1)},${peak(i).toFixed(1)} ${((i + 1) * step).toFixed(1)},${ends[i].toFixed(1)}`;
    return `${d} L${width},${bottom} Z`;
  };
  /** The top edge only, for a rim of light. */
  const rim = () => {
    let d = `M0,${start.toFixed(1)}`;
    for (let i = 0; i < bumps; i++) d += ` Q${(i * step + step / 2).toFixed(1)},${peak(i).toFixed(1)} ${((i + 1) * step).toFixed(1)},${ends[i].toFixed(1)}`;
    return d;
  };
  return { y, path, rim };
}

/** Far and near hills, planted. */
export const FarmBackdrop = memo(function FarmBackdrop({ width, ground }: { width: number; ground: number }) {
  const { field } = farmGeometry(width, ground);
  const far = hill(width, ground * 0.58, ground * 0.08, 3, 0.6);
  const near = hill(width, ground * 0.69, ground * 0.07, 2, 4.1);

  const art = useMemo(() => {
    const rand = seeded(23);
    // Far orchard: tiny trees along the far hill, left half.
    const farTrees: { x: number; y: number; r: number; kind: FruitKind }[] = [];
    for (let row = 0; row < 2; row++) {
      for (let x = width * 0.03 + row * 7; x < width * 0.46; x += 15) {
        farTrees.push({ x: x + rand() * 4, y: far.y(x) + 9 + row * 9, r: 3.6 + rand(), kind: rand() > 0.5 ? 'apple' : 'orange' });
      }
    }
    // Near hill: apple orchard (left), tomatoes (middle), oranges and plums (right).
    const nearTrees: { x: number; y: number; r: number; kind: FruitKind; seed: number }[] = [];
    for (let row = 0; row < 2; row++) {
      for (let x = width * 0.02 + row * 12; x < width * 0.34; x += 25) {
        nearTrees.push({ x: x + rand() * 6, y: near.y(x) + 12 + row * 12, r: 8 + rand() * 2.5, kind: rand() > 0.85 ? 'pear' : 'apple', seed: Math.floor(rand() * 5) });
      }
      for (let x = width * 0.7 + row * 12; x < width * 1.02; x += 25) {
        nearTrees.push({ x: x + rand() * 6, y: near.y(x) + 12 + row * 12, r: 8 + rand() * 2.5, kind: rand() > 0.7 ? 'plum' : 'orange', seed: Math.floor(rand() * 5) });
      }
    }
    nearTrees.sort((a, b) => a.y - b.y);
    return { farTrees, nearTrees };
  }, [width, ground]); // eslint-disable-line react-hooks/exhaustive-deps

  const tomatoX = width * 0.4;
  const tomatoLen = width * 0.24;

  return (
    <Svg width={width} height={field + 8} style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Far hill: soft, hazy, with an orchard and a vineyard. */}
      <Path d={far.path(field + 4)} fill={W.hillFar} />
      <Path d={hill(width, ground * 0.6, ground * 0.05, 3, 2.2).path(field + 4)} fill={W.hillFarShade} opacity={0.6} />
      <Path d={far.rim()} stroke="#C9EBCF" strokeWidth={3} fill="none" opacity={0.6} />
      {art.farTrees.map((t, i) => (
        <G key={i} opacity={0.85}>
          <Circle cx={t.x} cy={t.y - t.r} r={t.r} fill={W.treeFar} />
          <Circle cx={t.x - t.r * 0.3} cy={t.y - t.r * 1.3} r={t.r * 0.45} fill={W.hillFar} opacity={0.7} />
          <Circle cx={t.x + t.r * 0.35} cy={t.y - t.r * 0.8} r={1} fill={t.kind === 'apple' ? '#E2392F' : '#FF9A1F'} />
        </G>
      ))}
      {[0, 1, 2, 3].map((k) => (
        <Path
          key={`v${k}`}
          d={Array.from({ length: 24 }, (_, i) => {
            const x = width * 0.56 + (i / 23) * width * 0.4;
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${(far.y(x) + 8 + k * 7).toFixed(1)}`;
          }).join(' ')}
          stroke={W.treeFar}
          strokeWidth={3}
          strokeDasharray="5 2"
          fill="none"
          opacity={0.85}
        />
      ))}

      {/* Near hill. */}
      <Path d={near.path(field + 4)} fill={W.hillNear} />
      <Path d={hill(width, ground * 0.71, ground * 0.03, 2, 1.1).path(field + 4)} fill={W.hillNearShade} opacity={0.55} />
      <Path d={near.rim()} stroke={W.grassLight} strokeWidth={3} fill="none" opacity={0.7} />
      {/* Ploughed lines for texture. */}
      {[1, 2, 3].map((k) => (
        <Path
          key={`f${k}`}
          d={Array.from({ length: 20 }, (_, i) => {
            const x = (i / 19) * width;
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${(near.y(x) + k * 13).toFixed(1)}`;
          }).join(' ')}
          stroke={W.hillNearShade}
          strokeWidth={1}
          fill="none"
          opacity={0.45}
        />
      ))}
      {[0, 1].map((k) => (
        <VineRow key={`vr${k}`} x={width * 0.36 + k * 6} y={near.y(width * 0.48) + 6 + k * 9} length={width * 0.1} h={8} />
      ))}
      {[0, 1, 2].map((k) => (
        <TomatoRow key={`t${k}`} x={tomatoX + width * 0.08 + k * 4} y={near.y(tomatoX + tomatoLen / 2) + 14 + k * 10} length={tomatoLen * 0.7} h={10 + k * 1.5} />
      ))}
      {art.nearTrees.map((t, i) => (
        <FruitTree key={i} x={t.x} y={t.y} r={t.r} kind={t.kind} seed={t.seed} />
      ))}
    </Svg>
  );
});

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

/** The fence, the field and what stands on it, down to the grass lip over the soil. */
export const FarmForeground = memo(function FarmForeground({ width, ground, lip }: { width: number; ground: number; lip: number }) {
  const { field, fenceTop } = farmGeometry(width, ground);
  const art = useMemo(() => {
    const rand = seeded(7);
    const daisies = Array.from({ length: Math.round(width / 30) }, () => ({
      x: rand() * width,
      y: field + 22 + rand() * (ground - field - 32),
      r: 2.2 + rand() * 1.8,
      colour: rand() > 0.75 ? W.flowerPink : W.flowerWhite,
    })).filter((d) => Math.abs(d.x - width / 2) > width * 0.2);
    const tufts = Array.from({ length: Math.round(width / 16) }, (_, i) => ({ x: i * 16 + rand() * 8, h: 9 + rand() * 9 }));
    const hatches = Array.from({ length: Math.round(width / 9) }, () => ({ x: rand() * width, y: field + 12 + rand() * (ground - field - 16), h: 3 + rand() * 4 }));
    return { daisies, tufts, hatches };
  }, [width, ground, field]);

  const stallW = Math.min(width * 0.34, 190);
  const posts = Math.ceil(width / 38) + 1;
  const height = ground + lip;

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

      {/* Fence. */}
      <G>
        <Rect x={0} y={fenceTop + 8} width={width} height={5} fill={W.fence} stroke={W.ink} strokeWidth={1} />
        <Rect x={0} y={fenceTop + 22} width={width} height={5} fill={W.fence} stroke={W.ink} strokeWidth={1} />
        <Rect x={0} y={fenceTop + 11} width={width} height={2} fill={W.fenceShade} opacity={0.6} />
        <Rect x={0} y={fenceTop + 25} width={width} height={2} fill={W.fenceShade} opacity={0.6} />
        {Array.from({ length: posts }, (_, i) => (
          <G key={i}>
            <Path d={`M${i * 38 + 4},${field + 6} V${fenceTop + 3} L${i * 38 + 8},${fenceTop - 2} L${i * 38 + 12},${fenceTop + 3} V${field + 6} Z`} fill={W.fence} stroke={W.ink} strokeWidth={1.1} strokeLinejoin="round" />
            <Rect x={i * 38 + 9} y={fenceTop + 3} width={3} height={field - fenceTop + 2} fill={W.fenceShade} />
          </G>
        ))}
      </G>

      {/* Field, with a soft light band and blade hatching for texture. */}
      <Path d={`M0,${field + 6} Q${width / 2},${field - 6} ${width},${field + 6} L${width},${ground} L0,${ground} Z`} fill="url(#field)" stroke={W.grassEdge} strokeWidth={1.2} />
      <Ellipse cx={width * 0.55} cy={field + (ground - field) * 0.35} rx={width * 0.5} ry={(ground - field) * 0.14} fill="#FFFFFF" opacity={0.08} />
      <G stroke={W.grassDark} strokeWidth={1} opacity={0.4} strokeLinecap="round">
        {art.hatches.map((g, i) => (
          <Path key={i} d={`M${g.x},${g.y} l${-1},${-g.h}`} />
        ))}
      </G>

      <Stall x={width * 0.04} base={ground - ground * 0.035} w={stallW} />
      <Bush x={width * 0.97} y={ground - ground * 0.1} r={Math.min(width * 0.06, 36)} />
      <WateringCan x={width * 0.76} y={ground - ground * 0.04} s={Math.min(width * 0.095, 52)} />
      <Pumpkin x={width * 0.92} y={ground - ground * 0.025} s={Math.min(width * 0.1, 56)} />

      {art.daisies.map((d, i) => (
        <Daisy key={i} x={d.x} y={d.y} r={d.r} colour={d.colour} />
      ))}

      <Path d={lipPath} fill={W.grass} stroke={W.grassEdge} strokeWidth={1.4} strokeLinejoin="round" />
      <G fill={W.grassDark} stroke={W.grassEdge} strokeWidth={0.8}>
        {art.tufts.map((t, i) => (
          <Path key={i} d={tuft(t.x, ground + 1, t.h)} />
        ))}
      </G>
    </Svg>
  );
});
