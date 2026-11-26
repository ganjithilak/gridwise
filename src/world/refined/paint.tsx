/**
 * The Refined theme's paint box: a natural, balanced palette and the gradients its drawings
 * share. Shading comes from light and colour, not outlines: forms are lit from the upper left
 * (where the sun is), shadowed to the lower right, and fade into a warm haze with distance.
 *
 * Gradient ids are prefixed `rf-` and identical wherever they appear, so several drawings can
 * each carry the defs they need without clashing (ids are page-wide on the web).
 */
import { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

export const R = {
  skyTop: '#2C5C8F',
  skyHigh: '#3F78B2',
  skyMid: '#74A3CF',
  skyLow: '#B7D0E2',
  haze: '#ECE7D4',
  sun: '#FFF6DE',
  sunGlow: '#FFE6A8',

  ridgeFar: '#A9BFC0',
  ridgeNear: '#91AF9E',
  hazeTint: '#C9D6CF',

  wheat: '#C9AE63',
  barley: '#AEBB5F',
  youngCrop: '#8BAA55',
  pasture: '#72994B',
  ploughed: '#93765A',
  stubble: '#B9A26B',
  hedge: '#4B6F42',

  grassLight: '#93BE63',
  grass: '#6E9E48',
  grassDeep: '#4F7F35',
  blade: '#3F6B2C',

  leafLight: '#8DB563',
  leaf: '#5C8A43',
  leafDeep: '#3B6230',
  bark: '#6E5038',
  barkDark: '#4A3423',

  wood: '#9A7249',
  woodLight: '#C29B6C',
  woodDark: '#664A30',
  grain: '#5A4029',
  shingle: '#7A5B3F',
  canvasRed: '#A9473B',
  canvasRedShade: '#86352C',
  canvas: '#EDE3CB',
  canvasShade: '#D3C6A8',

  apple: '#B9372E',
  golden: '#DDB04A',
  pear: '#B6BB55',
  plum: '#5F3B6D',
  tomato: '#C8442F',
  orange: '#DD8930',
  carrot: '#DC7A30',
  potato: '#BE9A69',
  pumpkin: '#D8832E',

  steel: '#AFBAC2',
  steelDark: '#7D8992',

  plaid: '#9C5338',
  plaidDark: '#73392A',
  denim: '#4F6A86',
  denimDark: '#3C536B',
  burlap: '#D2B88A',
  burlapDark: '#B39A6E',
  straw: '#D8B865',
  strawDark: '#B5944A',
} as const;

export type ProduceKind = 'apple' | 'golden' | 'pear' | 'plum' | 'tomato' | 'orange';

const PRODUCE: Record<ProduceKind, [string, string, string]> = {
  apple: ['#E3725E', R.apple, '#7E2019'],
  golden: ['#F4D27E', R.golden, '#9C7020'],
  pear: ['#DCE08A', R.pear, '#7D8230'],
  plum: ['#8F6A9E', R.plum, '#3B2244'],
  tomato: ['#EC7A5E', R.tomato, '#87281A'],
  orange: ['#F5B866', R.orange, '#9A5718'],
};

/** Every shared gradient. Drop `<PaintDefs />` into any Svg that uses them. */
export function PaintDefs() {
  return (
    <Defs>
      <RadialGradient id="rf-leaf" cx="35%" cy="30%" r="75%">
        <Stop offset="0" stopColor={R.leafLight} />
        <Stop offset="0.55" stopColor={R.leaf} />
        <Stop offset="1" stopColor={R.leafDeep} />
      </RadialGradient>
      <RadialGradient id="rf-leaf-far" cx="35%" cy="30%" r="75%">
        <Stop offset="0" stopColor="#8FAE77" />
        <Stop offset="1" stopColor="#5F8156" />
      </RadialGradient>
      <LinearGradient id="rf-bark" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#8A6848" />
        <Stop offset="1" stopColor={R.barkDark} />
      </LinearGradient>
      <LinearGradient id="rf-wood" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor={R.woodLight} />
        <Stop offset="0.5" stopColor={R.wood} />
        <Stop offset="1" stopColor={R.woodDark} />
      </LinearGradient>
      <LinearGradient id="rf-wood-v" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={R.woodLight} />
        <Stop offset="1" stopColor={R.wood} />
      </LinearGradient>
      <LinearGradient id="rf-steel" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#DDE4E8" />
        <Stop offset="0.45" stopColor={R.steel} />
        <Stop offset="1" stopColor={R.steelDark} />
      </LinearGradient>
      {(Object.keys(PRODUCE) as ProduceKind[]).map((k) => (
        <RadialGradient key={k} id={`rf-${k}`} cx="35%" cy="32%" r="70%">
          <Stop offset="0" stopColor={PRODUCE[k][0]} />
          <Stop offset="0.6" stopColor={PRODUCE[k][1]} />
          <Stop offset="1" stopColor={PRODUCE[k][2]} />
        </RadialGradient>
      ))}
    </Defs>
  );
}

/** A piece of fruit: shaded sphere with a soft highlight. */
export function Produce({ x, y, r, kind }: { x: number; y: number; r: number; kind: ProduceKind }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={`url(#rf-${kind})`} />
      <Ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.28} ry={r * 0.18} fill="#FFFFFF" opacity={0.55} />
    </G>
  );
}

/**
 * A tree, painted: a trunk, a crown of overlapping masses lit from the upper left, a darker
 * underside and a contact shadow. `far` uses the hazier leaf for distant trees.
 */
export function Tree({ x, y, s, fruit, far = false, seed = 0 }: { x: number; y: number; s: number; fruit?: ProduceKind; far?: boolean; seed?: number }) {
  const v = (n: number) => Math.sin(seed * 12.9898 + n * 78.233) * 0.5 + 0.5; // stable variation
  const masses: [number, number, number, number][] = [
    [-0.55, -1.25, 0.62, 0.55],
    [0.5, -1.3, 0.6, 0.52],
    [-0.1, -1.75, 0.7, 0.6],
    [0.25, -2.05, 0.5, 0.42],
    [-0.45, -1.95, 0.45, 0.4],
    [0.05, -1.15, 0.7, 0.45],
  ];
  const leaf = far ? 'url(#rf-leaf-far)' : 'url(#rf-leaf)';
  return (
    <G>
      <Ellipse cx={x + s * 0.25} cy={y + s * 0.04} rx={s * 0.95} ry={s * 0.16} fill="#2F4A22" opacity={far ? 0.15 : 0.28} />
      <Path d={`M${x - s * 0.1},${y} C${x - s * 0.06},${y - s * 0.5} ${x - s * 0.12},${y - s * 0.8} ${x - s * 0.05},${y - s * 1.1} L${x + s * 0.09},${y - s * 1.1} C${x + s * 0.06},${y - s * 0.7} ${x + s * 0.1},${y - s * 0.4} ${x + s * 0.14},${y} Z`} fill="url(#rf-bark)" />
      {masses.map(([mx, my, rx, ry], i) => (
        <Ellipse key={i} cx={x + mx * s + (v(i) - 0.5) * s * 0.08} cy={y + my * s} rx={rx * s} ry={ry * s} fill={leaf} />
      ))}
      {/* Dappled light on the upper left of the crown. */}
      {!far ? (
        <G fill={R.leafLight} opacity={0.5}>
          <Ellipse cx={x - s * 0.35} cy={y - s * 2.0} rx={s * 0.2} ry={s * 0.13} />
          <Ellipse cx={x - s * 0.65} cy={y - s * 1.45} rx={s * 0.16} ry={s * 0.1} />
          <Ellipse cx={x + s * 0.05} cy={y - s * 2.3} rx={s * 0.13} ry={s * 0.08} />
        </G>
      ) : null}
      {fruit
        ? [
            [-0.6, -1.15],
            [0.45, -1.4],
            [-0.15, -1.6],
            [0.6, -1.0],
            [0.1, -2.0],
            [-0.75, -1.6],
          ].map(([fx, fy], i) =>
            (i + seed) % 4 === 0 ? null : <Produce key={`f${i}`} x={x + fx * s} y={y + fy * s} r={Math.max(1.1, s * 0.09)} kind={fruit} />,
          )
        : null}
    </G>
  );
}
