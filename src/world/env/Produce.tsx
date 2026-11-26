/**
 * Produce and props, as small SVG groups placed by the farm (TEMPORARY ARTWORK in the
 * world's cel style: flat fill, a hard shadow shape, a highlight, warm ink line).
 *
 * The crops are the ones the lessons use (Golden Apples Farm: apples, pears, plums,
 * tomatoes, carrots, potatoes), plus oranges and grapes from the art direction.
 */
import { Circle, Ellipse, G, Path } from 'react-native-svg';

import { W } from '../palette';

export const FRUIT = {
  apple: { fill: '#E2392F', shade: '#B3241D' },
  golden: { fill: '#FFC93C', shade: '#E7951B' },
  orange: { fill: '#FF9A1F', shade: '#D9700B' },
  pear: { fill: '#C6D84A', shade: '#97AA2A' },
  plum: { fill: '#7E4BB5', shade: '#5A3388' },
  tomato: { fill: '#F0442E', shade: '#BE2D1B' },
  grape: { fill: '#7A4FC2', shade: '#55339A' },
} as const;
export type FruitKind = keyof typeof FRUIT;

/** A piece of fruit: a ball with a shadow crescent and a glint. */
export function Fruit({ x, y, r, kind }: { x: number; y: number; r: number; kind: FruitKind }) {
  const c = FRUIT[kind];
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={c.fill} stroke={W.ink} strokeWidth={Math.max(0.5, r * 0.18)} />
      <Path d={`M${x + r * 0.9},${y - r * 0.3} A${r},${r} 0 0 1 ${x - r * 0.4},${y + r * 0.92} A${r * 1.1},${r * 1.1} 0 0 0 ${x + r * 0.9},${y - r * 0.3} Z`} fill={c.shade} />
      <Circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="#FFFFFF" opacity={0.75} />
    </G>
  );
}

/**
 * A fruit tree: short trunk, a canopy of three overlapping puffs (shadowed on the right,
 * lit on the left), fruit dotted through it, and a shadow on the grass.
 */
export function FruitTree({ x, y, r, kind, seed = 0 }: { x: number; y: number; r: number; kind: FruitKind; seed?: number }) {
  const puffs: [number, number, number][] = [
    [-r * 0.55, -r * 1.25, r * 0.72],
    [r * 0.5, -r * 1.2, r * 0.75],
    [0, -r * 1.72, r * 0.8],
  ];
  // Fruit placed round the canopy, varied a little per tree.
  const spots = [
    [-0.7, -1.0],
    [0.15, -1.45],
    [0.75, -1.05],
    [-0.25, -1.9],
    [0.5, -1.75],
    [-0.9, -1.45],
    [0.05, -0.95],
  ].filter((_, i) => (i + seed) % 5 !== 0);
  return (
    <G>
      <Ellipse cx={x + r * 0.2} cy={y + 1} rx={r * 1.15} ry={r * 0.22} fill={W.grassEdge} opacity={0.35} />
      <Path d={`M${x - r * 0.12},${y} L${x - r * 0.08},${y - r * 1.1} L${x + r * 0.1},${y - r * 1.1} L${x + r * 0.16},${y} Z`} fill={W.trunk} stroke={W.ink} strokeWidth={0.8} />
      <G fill={W.grassEdge}>
        {puffs.map(([px, py, pr], i) => (
          <Circle key={`e${i}`} cx={x + px} cy={y + py} r={pr + 1.1} />
        ))}
      </G>
      <G fill={W.hillNearShade}>
        {puffs.map(([px, py, pr], i) => (
          <Circle key={`s${i}`} cx={x + px} cy={y + py} r={pr} />
        ))}
      </G>
      <G fill={W.grass}>
        {puffs.map(([px, py, pr], i) => (
          <Circle key={`b${i}`} cx={x + px - pr * 0.16} cy={y + py - pr * 0.14} r={pr * 0.8} />
        ))}
      </G>
      <Circle cx={x - r * 0.35} cy={y - r * 1.95} r={r * 0.28} fill={W.grassLight} opacity={0.9} />
      {spots.map(([fx, fy], i) => (
        <Fruit key={i} x={x + fx * r} y={y + fy * r} r={Math.max(1.4, r * 0.17)} kind={kind} />
      ))}
    </G>
  );
}

/** A row of staked tomato plants: canes, a twist of vine, and red fruit. */
export function TomatoRow({ x, y, length, h }: { x: number; y: number; length: number; h: number }) {
  const stakes = Math.max(3, Math.round(length / 14));
  const step = length / (stakes - 1);
  return (
    <G>
      <Ellipse cx={x + length / 2} cy={y + 1} rx={length / 2 + 4} ry={2.6} fill={W.soilTop} opacity={0.7} />
      {Array.from({ length: stakes }, (_, i) => {
        const sx = x + i * step;
        return (
          <G key={i}>
            <Path d={`M${sx},${y} V${y - h}`} stroke={W.woodDark} strokeWidth={1.2} />
            <Path d={`M${sx},${y - 1} q${-h * 0.3},${-h * 0.3} 0,${-h * 0.5} t0,${-h * 0.45}`} stroke={W.grassEdge} strokeWidth={h * 0.32} strokeLinecap="round" fill="none" />
            <Path d={`M${sx},${y - 1} q${-h * 0.3},${-h * 0.3} 0,${-h * 0.5} t0,${-h * 0.45}`} stroke={W.grass} strokeWidth={h * 0.2} strokeLinecap="round" fill="none" />
            <Fruit x={sx + h * 0.16} y={y - h * 0.38} r={h * 0.13} kind="tomato" />
            {i % 2 === 0 ? <Fruit x={sx - h * 0.14} y={y - h * 0.7} r={h * 0.11} kind="tomato" /> : null}
          </G>
        );
      })}
      <Path d={`M${x},${y - h * 0.85} H${x + length}`} stroke={W.woodDark} strokeWidth={0.8} opacity={0.7} />
    </G>
  );
}

/** A grapevine row on a wire, with hanging bunches. */
export function VineRow({ x, y, length, h }: { x: number; y: number; length: number; h: number }) {
  const posts = Math.max(2, Math.round(length / 22) + 1);
  const step = length / (posts - 1);
  return (
    <G>
      {Array.from({ length: posts }, (_, i) => (
        <Path key={`p${i}`} d={`M${x + i * step},${y} V${y - h}`} stroke={W.woodDark} strokeWidth={1} />
      ))}
      <Path d={`M${x},${y - h} H${x + length}`} stroke={W.woodDark} strokeWidth={0.7} />
      <Path
        d={`M${x},${y - h * 0.9} ${Array.from({ length: Math.ceil(length / 8) }, (_, i) => `q4,${i % 2 ? 4 : -3} 8,0`).join(' ')}`}
        stroke={W.hillNearShade}
        strokeWidth={h * 0.42}
        strokeLinecap="round"
        fill="none"
      />
      {Array.from({ length: Math.floor(length / 11) }, (_, i) => (
        <G key={`g${i}`}>
          <Circle cx={x + 5 + i * 11} cy={y - h * 0.55} r={h * 0.13} fill={FRUIT.grape.fill} />
          <Circle cx={x + 7 + i * 11} cy={y - h * 0.48} r={h * 0.11} fill={FRUIT.grape.shade} />
        </G>
      ))}
    </G>
  );
}

/** A hanging bunch of grapes, centred on its stalk at (x, y). */
export function GrapeBunch({ x, y, s }: { x: number; y: number; s: number }) {
  const rows = [3, 3, 2, 1];
  return (
    <G>
      <Path d={`M${x},${y - s * 0.3} V${y + s * 0.2}`} stroke={W.woodDark} strokeWidth={s * 0.12} />
      <Path d={`M${x},${y} q${s * 0.5},${-s * 0.4} ${s * 0.8},0 q${-s * 0.4},${s * 0.2} ${-s * 0.8},0`} fill={W.leaf} stroke={W.leafEdge} strokeWidth={0.6} />
      {rows.map((n, r) =>
        Array.from({ length: n }, (_, i) => {
          const gx = x + (i - (n - 1) / 2) * s * 0.36;
          const gy = y + s * 0.35 + r * s * 0.3;
          return (
            <G key={`${r}-${i}`}>
              <Circle cx={gx} cy={gy} r={s * 0.2} fill={FRUIT.grape.fill} stroke={W.ink} strokeWidth={0.5} />
              <Circle cx={gx - s * 0.06} cy={gy - s * 0.06} r={s * 0.06} fill="#FFFFFF" opacity={0.6} />
            </G>
          );
        }),
      )}
    </G>
  );
}

/** A watering can standing on the grass at (x, y), facing left. */
export function WateringCan({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G transform={`translate(${x},${y}) scale(${s / 40})`}>
      <Ellipse cx={2} cy={0} rx={22} ry={3.5} fill={W.grassEdge} opacity={0.35} />
      {/* Spout and rose. */}
      <Path d="M-8,-12 L-30,-30 L-27,-33 L-5,-17 Z" fill="#A9B7C2" stroke={W.ink} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M-34,-36 l7,-3 l4,9 l-7,3 z" fill="#C9D4DC" stroke={W.ink} strokeWidth={1.2} strokeLinejoin="round" />
      {/* Body. */}
      <Path d="M-12,0 L-10,-26 Q4,-30 16,-26 L18,0 Z" fill="#B8C6D1" stroke={W.ink} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M6,-28 Q14,-28 16,-26 L18,0 L8,0 Z" fill="#8E9DAA" />
      <Path d="M-8,-22 Q-7,-10 -6,-3" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.7} />
      {/* Handle. */}
      <Path d="M-6,-28 Q3,-44 16,-26" stroke={W.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M-6,-28 Q3,-44 16,-26" stroke="#B8C6D1" strokeWidth={2.6} fill="none" strokeLinecap="round" />
      {/* A leaf badge. */}
      <Path d="M2,-16 q5,-6 9,-1 q-5,5 -9,1" fill={W.leaf} stroke={W.leafEdge} strokeWidth={0.8} />
    </G>
  );
}

/** A pumpkin sitting at (x, y): ribbed, with a curly stalk and a leaf. */
export function Pumpkin({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G transform={`translate(${x},${y}) scale(${s / 40})`}>
      <Ellipse cx={0} cy={0} rx={30} ry={4} fill={W.grassEdge} opacity={0.4} />
      <Ellipse cx={-12} cy={-15} rx={13} ry={15} fill="#F28A1E" stroke={W.ink} strokeWidth={1.3} />
      <Ellipse cx={12} cy={-15} rx={13} ry={15} fill="#E07812" stroke={W.ink} strokeWidth={1.3} />
      <Ellipse cx={0} cy={-16} rx={12} ry={16} fill="#FF9B2E" stroke={W.ink} strokeWidth={1.3} />
      <Path d="M8,-30 Q20,-24 20,-6 Q24,-18 14,-28 Z" fill="#C5650C" opacity={0.6} />
      <Ellipse cx={-4} cy={-24} rx={3} ry={5} fill="#FFFFFF" opacity={0.45} />
      <Path d="M0,-31 q-1,-7 4,-10" stroke="#5B7A2A" strokeWidth={3.2} fill="none" strokeLinecap="round" />
      <Path d="M3,-38 q8,-8 14,-2 q-6,6 -14,2" fill={W.grass} stroke={W.grassEdge} strokeWidth={0.9} />
      <Path d="M-2,-36 q-6,-2 -6,3 q0,4 4,3" stroke="#5B7A2A" strokeWidth={1.2} fill="none" />
    </G>
  );
}

/** A burlap sack of potatoes, slumped, with a few spilling out. */
export function PotatoSack({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G transform={`translate(${x},${y}) scale(${s / 40})`}>
      <Ellipse cx={2} cy={0} rx={24} ry={3.5} fill={W.grassEdge} opacity={0.4} />
      <Path d="M-16,0 Q-22,-20 -12,-34 L12,-34 Q22,-20 16,0 Z" fill="#D9B98A" stroke={W.ink} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M4,-34 L12,-34 Q22,-20 16,0 L6,0 Q12,-18 4,-34 Z" fill="#B8976A" />
      <Path d="M-12,-34 Q0,-40 12,-34 Q0,-30 -12,-34 Z" fill="#8C6A44" stroke={W.ink} strokeWidth={1} />
      <Path d="M-8,-20 q4,-3 8,0 q4,3 8,0" stroke="#8C6A44" strokeWidth={1} fill="none" />
      {[
        [-6, -36],
        [3, -38],
        [20, -2],
        [26, -1],
      ].map(([px, py], i) => (
        <Ellipse key={i} cx={px} cy={py} rx={5} ry={3.8} fill="#C8A06A" stroke={W.ink} strokeWidth={0.8} />
      ))}
    </G>
  );
}
