import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { farmGeometry } from '../env/Farm';
import { seeded } from '../geometry';

import { PaintDefs, R, Tree } from './paint';
import { RefinedStall } from './Stall';

/** A watering can in galvanised steel, lit from the left. */
function WateringCan({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G transform={`translate(${x},${y}) scale(${s / 40})`}>
      <Ellipse cx={2} cy={1} rx={22} ry={3} fill="#2C4A22" opacity={0.3} />
      <Path d="M-8,-12 L-29,-29 L-26,-32 L-5,-17 Z" fill="url(#rf-steel)" />
      <Path d="M-33,-35 l7,-3 l3.5,8.5 l-7,3 z" fill="#C8D1D7" />
      <Path d="M-11,0 L-9,-25 Q4,-29 16,-25 L18,0 Z" fill="url(#rf-steel)" />
      <Path d="M-10,-8 Q4,-11 17.4,-8" stroke="#7D8992" strokeWidth={1.2} fill="none" opacity={0.7} />
      <Path d="M-6,-27 Q3,-42 16,-25" stroke="#8C979F" strokeWidth={3.2} fill="none" strokeLinecap="round" />
      <Path d="M-7,-21 Q-6,-10 -5,-3" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
    </G>
  );
}

/** A pumpkin: ribbed, shaded, with a stalk and a leaf. */
function Pumpkin({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G transform={`translate(${x},${y}) scale(${s / 40})`}>
      <Defs>
        <RadialGradient id="rf-pumpkin" cx="35%" cy="30%" r="75%">
          <Stop offset="0" stopColor="#F1AA5A" />
          <Stop offset="0.6" stopColor={R.pumpkin} />
          <Stop offset="1" stopColor="#8E4A16" />
        </RadialGradient>
      </Defs>
      <Ellipse cx={2} cy={1} rx={30} ry={3.6} fill="#2C4A22" opacity={0.35} />
      <Ellipse cx={-12} cy={-14} rx={13} ry={14} fill="url(#rf-pumpkin)" />
      <Ellipse cx={12} cy={-14} rx={13} ry={14} fill="url(#rf-pumpkin)" />
      <Ellipse cx={0} cy={-15} rx={12} ry={15} fill="url(#rf-pumpkin)" />
      <Path d="M-4,-29 Q-6,-14 -4,0 M4,-29 Q6,-14 4,0" stroke="#9A5418" strokeWidth={0.8} fill="none" opacity={0.5} />
      <Path d="M0,-29 q-1,-6 3,-9" stroke="#6B6A35" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M3,-35 q8,-7 14,-1 q-6,6 -14,1" fill={R.leaf} />
    </G>
  );
}

/**
 * Refined foreground: a split-rail timber fence, the home field with texture and dappled light,
 * the stall, a framing apple tree, a watering can and a pumpkin, and the grass edge over the
 * soil. The middle of the field stays open for the learner's tree.
 */
export const RefinedFarmForeground = memo(function RefinedFarmForeground({ width, ground, lip }: { width: number; ground: number; lip: number }) {
  const { field, fenceTop } = farmGeometry(width, ground);
  const art = useMemo(() => {
    const rand = seeded(17);
    const blades = Array.from({ length: Math.round(width / 3.2) }, () => {
      const y = field + 8 + rand() * (ground - field - 6);
      const near = (y - field) / (ground - field);
      return { x: rand() * width, y, h: 2 + near * 6 * (0.6 + rand() * 0.6), lean: (rand() - 0.5) * 3, light: rand() > 0.5 };
    });
    const flowers = Array.from({ length: Math.round(width / 26) }, () => ({
      x: rand() * width,
      y: field + 14 + rand() * (ground - field - 22),
      c: rand() > 0.7 ? '#E8D27A' : rand() > 0.5 ? '#F1EFE6' : '#C9B8D9',
    })).filter((f) => Math.abs(f.x - width / 2) > width * 0.18);
    const edge = Array.from({ length: Math.round(width / 5) }, (_, i) => ({ x: i * 5 + rand() * 4, h: 5 + rand() * 9, lean: (rand() - 0.5) * 5 }));
    return { blades, flowers, edge };
  }, [width, ground, field]);

  const stallW = Math.min(width * 0.34, 190);
  const posts = Math.ceil(width / 46) + 1;
  const height = ground + lip;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <PaintDefs />
      <Defs>
        <LinearGradient id="rf-field" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={R.grassLight} />
          <Stop offset="1" stopColor={R.grass} />
        </LinearGradient>
        <LinearGradient id="rf-lip" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={R.grass} />
          <Stop offset="1" stopColor={R.grassDeep} />
        </LinearGradient>
      </Defs>

      {/* A framing apple tree on the right, behind the fence. */}
      <Tree x={width * 0.93} y={field + 4} s={Math.min(width * 0.09, 50)} fruit="apple" seed={3} />

      {/* Split-rail fence. */}
      <G>
        {[fenceTop + 9, fenceTop + 23].map((ry, i) => (
          <G key={i}>
            <Rect x={0} y={ry} width={width} height={4.5} fill="url(#rf-wood-v)" />
            <Rect x={0} y={ry + 3.4} width={width} height={1.1} fill="#000000" opacity={0.22} />
          </G>
        ))}
        {Array.from({ length: posts }, (_, i) => {
          const px = i * 46 + 6;
          return (
            <G key={i}>
              <Rect x={px} y={fenceTop} width={6} height={field - fenceTop + 6} rx={1} fill="url(#rf-wood)" />
              <Path d={`M${px + 2},${fenceTop + 4} v${field - fenceTop - 2}`} stroke={R.grain} strokeWidth={0.5} opacity={0.5} />
            </G>
          );
        })}
      </G>

      {/* The home field. */}
      <Path d={`M0,${field + 6} Q${width / 2},${field - 4} ${width},${field + 6} L${width},${ground} L0,${ground} Z`} fill="url(#rf-field)" />
      <Ellipse cx={width * 0.6} cy={field + (ground - field) * 0.4} rx={width * 0.55} ry={(ground - field) * 0.18} fill="#FFF6D8" opacity={0.1} />
      <Ellipse cx={width * 0.15} cy={field + 16} rx={width * 0.22} ry={8} fill="#2C4A22" opacity={0.16} />
      <G strokeLinecap="round">
        {art.blades.map((b, i) => (
          <Path key={i} d={`M${b.x},${b.y} q${b.lean * 0.3},${-b.h * 0.6} ${b.lean},${-b.h}`} stroke={b.light ? '#A9CB76' : R.blade} strokeWidth={0.8} opacity={b.light ? 0.5 : 0.35} fill="none" />
        ))}
      </G>

      <RefinedStall x={width * 0.04} base={ground - ground * 0.035} w={stallW} />
      <WateringCan x={width * 0.77} y={ground - ground * 0.04} s={Math.min(width * 0.09, 50)} />
      <Pumpkin x={width * 0.92} y={ground - ground * 0.025} s={Math.min(width * 0.095, 54)} />

      {art.flowers.map((f, i) => (
        <G key={i}>
          <Path d={`M${f.x},${f.y} v5`} stroke={R.blade} strokeWidth={0.7} opacity={0.7} />
          <Circle cx={f.x} cy={f.y} r={1.7} fill={f.c} />
        </G>
      ))}

      {/* The grass edge over the soil: soft blades, no outline. */}
      <Path d={`M0,${ground - 4} ${Array.from({ length: Math.ceil(width / 14) + 1 }, (_, i) => `Q${i * 14 + 7},${ground + 8} ${i * 14 + 14},${ground + 1}`).join(' ')} L${width},${ground - 6} L0,${ground - 6} Z`} fill="url(#rf-lip)" />
      <G strokeLinecap="round" fill="none">
        {art.edge.map((b, i) => (
          <Path key={i} d={`M${b.x},${ground + 3} q${b.lean * 0.3},${-b.h * 0.6} ${b.lean},${-b.h}`} stroke={i % 3 === 0 ? '#9BC56C' : R.grassDeep} strokeWidth={1.6} />
        ))}
      </G>
    </Svg>
  );
});
