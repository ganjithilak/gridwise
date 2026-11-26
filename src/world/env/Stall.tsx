import { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { W } from '../palette';

import { Fruit, GrapeBunch, PotatoSack, type FruitKind } from './Produce';

/**
 * Golden Apples Farm's stall (the farm the lessons are set on). Upgraded from the first
 * prototype, same style: shelves of preserves, oil and milk, pies, crates of the lesson
 * produce (apples, golden apples, pears, plums, tomatoes, carrots), hanging grapes, a
 * lantern, and a sack of potatoes beside it.
 *
 * Later it can show the learner's own stock, sales and purchases from spreadsheet tasks:
 * the crates are drawn from a list for that reason.
 *
 * TEMPORARY ARTWORK.
 */
export function Stall({ x, base, w }: { x: number; base: number; w: number }) {
  const h = w * 1.22;
  const top = base - h;
  const stripes = 6;
  const sw = (w + 12) / stripes;
  const awTop = top + h * 0.15;
  const awBot = top + h * 0.34;
  const counter = top + h * 0.66;
  const shelf1 = awBot + h * 0.13;
  const shelf2 = awBot + h * 0.27;
  const u = w / 100; // a hundredth of the stall's width

  // The crates on the counter: what a lesson's stock sheet would list.
  const crates: { kind: FruitKind; label: string }[] = [
    { kind: 'apple', label: 'Apples' },
    { kind: 'golden', label: 'Golden' },
    { kind: 'pear', label: 'Pears' },
    { kind: 'plum', label: 'Plums' },
  ];
  const crateW = (w - 6 * u) / crates.length;

  return (
    <G>
      <Defs>
        <RadialGradient id="lantern" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFE9A0" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#FFE9A0" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* Shadow on the grass. */}
      <Ellipse cx={x + w * 0.55} cy={base + 2} rx={w * 0.7} ry={w * 0.07} fill={W.grassDark} opacity={0.55} />

      {/* Back wall: vertical boards. */}
      <Rect x={x + 3} y={awBot - 4} width={w - 6} height={counter - awBot + 4} fill={W.woodDark} />
      {[0.2, 0.4, 0.6, 0.8].map((f) => (
        <Path key={f} d={`M${x + w * f},${awBot} V${counter}`} stroke={W.ink} strokeWidth={0.7} opacity={0.35} />
      ))}
      <Rect x={x + 3} y={awBot - 4} width={w - 6} height={h * 0.05} fill={W.ink} opacity={0.25} />

      {/* Top shelf: preserves, oil and milk. */}
      <G>
        {[
          { cx: 0.14, fill: FRUIT_JAM.plum },
          { cx: 0.26, fill: FRUIT_JAM.apple },
          { cx: 0.38, fill: FRUIT_JAM.golden },
        ].map((j) => (
          <G key={j.cx}>
            <Rect x={x + w * j.cx - 4.5 * u} y={shelf1 - 10 * u} width={9 * u} height={10 * u} rx={1.5 * u} fill={j.fill} stroke={W.ink} strokeWidth={0.8} />
            <Rect x={x + w * j.cx - 5 * u} y={shelf1 - 12.5 * u} width={10 * u} height={3 * u} rx={1 * u} fill="#E9E1D0" stroke={W.ink} strokeWidth={0.7} />
            <Rect x={x + w * j.cx - 3 * u} y={shelf1 - 7.5 * u} width={6 * u} height={4 * u} fill={W.awningCream} opacity={0.9} />
            <Rect x={x + w * j.cx - 3.2 * u} y={shelf1 - 9 * u} width={1.3 * u} height={7 * u} fill="#FFFFFF" opacity={0.45} />
          </G>
        ))}
        {[0.55, 0.65].map((cx) => (
          <G key={cx}>
            <Path
              d={`M${x + w * cx - 3.5 * u},${shelf1} V${shelf1 - 11 * u} Q${x + w * cx},${shelf1 - 15 * u} ${x + w * cx + 3.5 * u},${shelf1 - 11 * u} V${shelf1} Z`}
              fill="#E8B830"
              opacity={0.92}
              stroke={W.ink}
              strokeWidth={0.8}
            />
            <Rect x={x + w * cx - 1.2 * u} y={shelf1 - 19 * u} width={2.4 * u} height={5 * u} fill="#E8B830" stroke={W.ink} strokeWidth={0.6} />
            <Rect x={x + w * cx - 1.4 * u} y={shelf1 - 20.5 * u} width={2.8 * u} height={2 * u} fill={W.woodDark} />
            <Rect x={x + w * cx - 2.4 * u} y={shelf1 - 10 * u} width={1.2 * u} height={8 * u} fill="#FFFFFF" opacity={0.5} />
          </G>
        ))}
        {/* Milk. */}
        <Path d={`M${x + w * 0.8 - 4 * u},${shelf1} V${shelf1 - 10 * u} L${x + w * 0.8 - 2 * u},${shelf1 - 14 * u} H${x + w * 0.8 + 2 * u} L${x + w * 0.8 + 4 * u},${shelf1 - 10 * u} V${shelf1} Z`} fill="#FBFBF5" stroke={W.ink} strokeWidth={0.8} />
        <Rect x={x + w * 0.8 - 2.2 * u} y={shelf1 - 16 * u} width={4.4 * u} height={2.4 * u} fill="#3C7BD9" stroke={W.ink} strokeWidth={0.6} />
        <Rect x={x + 3} y={shelf1} width={w - 6} height={2.4 * u} fill={W.woodLight} stroke={W.ink} strokeWidth={0.8} />
      </G>

      {/* Second shelf: pies and a basket of pears. */}
      <G>
        {[0.2, 0.42].map((cx) => (
          <G key={cx}>
            <Ellipse cx={x + w * cx} cy={shelf2 - 3 * u} rx={9 * u} ry={3.5 * u} fill="#D99A45" stroke={W.ink} strokeWidth={0.8} />
            <Ellipse cx={x + w * cx} cy={shelf2 - 4.2 * u} rx={7.5 * u} ry={2.6 * u} fill="#F2C06A" />
            <Path d={`M${x + w * cx - 5 * u},${shelf2 - 5 * u} l${10 * u},${2 * u} M${x + w * cx - 5 * u},${shelf2 - 3.5 * u} l${10 * u},${-2 * u}`} stroke="#C27C2C" strokeWidth={0.8} />
          </G>
        ))}
        <Path d={`M${x + w * 0.62},${shelf2} h${22 * u} l${-2 * u},${-6 * u} h${-18 * u} z`} fill={W.woodLight} stroke={W.ink} strokeWidth={0.8} />
        {[0, 1, 2, 3].map((i) => (
          <Fruit key={i} x={x + w * 0.66 + i * 4.6 * u} y={shelf2 - 7.5 * u} r={2.6 * u} kind="pear" />
        ))}
        <Rect x={x + 3} y={shelf2} width={w - 6} height={2.4 * u} fill={W.woodLight} stroke={W.ink} strokeWidth={0.8} />
      </G>

      {/* Posts. */}
      {[x + 1, x + w - 8].map((px) => (
        <G key={px}>
          <Rect x={px} y={awTop} width={7} height={base - awTop} fill={W.wood} stroke={W.ink} strokeWidth={1.3} />
          <Rect x={px + 4.5} y={awTop} width={2.5} height={base - awTop} fill={W.woodDark} opacity={0.7} />
        </G>
      ))}

      {/* Roof, and the farm's name on a board above it. */}
      <Path d={`M${x - 10},${awTop + 2} L${x + 8},${top + h * 0.09} L${x + w - 8},${top + h * 0.09} L${x + w + 10},${awTop + 2} Z`} fill={W.woodLight} stroke={W.ink} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d={`M${x + w * 0.55},${top + h * 0.09} L${x + w - 8},${top + h * 0.09} L${x + w + 10},${awTop + 2} L${x + w * 0.62},${awTop + 2} Z`} fill={W.wood} />
      <Path
        d={`M${x + w * 0.14},${top + h * 0.1} L${x + w * 0.14},${top + h * 0.02} Q${x + w * 0.5},${top - h * 0.06} ${x + w * 0.86},${top + h * 0.02} L${x + w * 0.86},${top + h * 0.1} Z`}
        fill={W.wood}
        stroke={W.ink}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path d={`M${x + w * 0.17},${top + h * 0.08} L${x + w * 0.17},${top + h * 0.03} Q${x + w * 0.5},${top - h * 0.035} ${x + w * 0.83},${top + h * 0.03} L${x + w * 0.83},${top + h * 0.08} Z`} fill={W.woodLight} />
      <SvgText x={x + w * 0.5} y={top + h * 0.075} fontSize={Math.max(6, w * 0.066)} fontWeight="900" fill={W.woodDark} textAnchor="middle">
        GOLDEN APPLES
      </SvgText>
      <Path d={`M${x + w * 0.5 - 4 * u},${top - h * 0.035} q${4 * u},${-7 * u} ${8 * u},0 q${-4 * u},${3 * u} ${-8 * u},0`} fill={W.leaf} stroke={W.leafEdge} strokeWidth={0.7} />
      <Circle cx={x + w * 0.5} cy={top - h * 0.03} r={2.6 * u} fill={FRUIT_JAM.golden} stroke={W.ink} strokeWidth={0.7} />

      {/* Awning: alternating stripes with a scalloped hem. */}
      {Array.from({ length: stripes }, (_, i) => {
        const sx = x - 6 + i * sw;
        return (
          <Path
            key={i}
            d={`M${sx},${awTop} L${sx + sw},${awTop} L${sx + sw},${awBot} Q${sx + sw / 2},${awBot + sw * 0.55} ${sx},${awBot} Z`}
            fill={i % 2 === 0 ? W.awning : W.awningCream}
            stroke={W.ink}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        );
      })}
      <Rect x={x - 6} y={awTop} width={w + 12} height={(awBot - awTop) * 0.3} fill={W.awningShade} opacity={0.35} />

      {/* Grapes hanging from the hem, and a lantern on the right post. */}
      <GrapeBunch x={x + 9 * u} y={awBot + 4 * u} s={9 * u} />
      <GrapeBunch x={x + 19 * u} y={awBot + 6 * u} s={7.5 * u} />
      <Circle cx={x + w - 4} cy={awBot + 11 * u} r={14 * u} fill="url(#lantern)" />
      <Path d={`M${x + w - 4},${awBot} v${4 * u}`} stroke={W.ink} strokeWidth={0.8} />
      <Rect x={x + w - 4 - 3.5 * u} y={awBot + 4 * u} width={7 * u} height={10 * u} rx={1.5 * u} fill="#FFD976" stroke={W.ink} strokeWidth={1} />
      <Path d={`M${x + w - 4 - 3.5 * u},${awBot + 9 * u} h${7 * u}`} stroke={W.ink} strokeWidth={0.6} />

      {/* Crates of produce on the counter. */}
      {crates.map((crate, i) => {
        const cx = x + 3 * u + i * crateW;
        const rows = [0, 1];
        return (
          <G key={crate.kind}>
            {rows.map((r) =>
              [0, 1, 2].map((k) => (
                <Fruit key={`${r}-${k}`} x={cx + crateW * (0.22 + k * 0.28) + (r ? crateW * 0.14 : 0)} y={counter - 5 * u - r * 4 * u} r={3.2 * u} kind={crate.kind} />
              )),
            )}
            <Rect x={cx + 1} y={counter - 4 * u} width={crateW - 2} height={6 * u} fill={W.woodLight} stroke={W.ink} strokeWidth={0.9} />
            <Path d={`M${cx + 1},${counter - 1 * u} h${crateW - 2}`} stroke={W.woodDark} strokeWidth={0.7} />
          </G>
        );
      })}

      {/* Counter and its planked front, with the sign. */}
      <Rect x={x - 4} y={counter} width={w + 8} height={h * 0.05} fill={W.woodLight} stroke={W.ink} strokeWidth={1.3} />
      <Rect x={x} y={counter + h * 0.05} width={w} height={base - counter - h * 0.05} fill={W.wood} stroke={W.ink} strokeWidth={1.3} />
      {[0.25, 0.5, 0.75].map((f) => (
        <Path key={f} d={`M${x + w * f},${counter + h * 0.05} V${base}`} stroke={W.woodDark} strokeWidth={1.2} />
      ))}
      <Rect x={x + w * 0.6} y={counter + h * 0.05} width={w * 0.4} height={base - counter - h * 0.05} fill={W.woodDark} opacity={0.35} />
      <Rect x={x + w * 0.16} y={counter + h * 0.1} width={w * 0.68} height={h * 0.11} rx={3} fill={W.awningCream} stroke={W.ink} strokeWidth={1.2} />
      <SvgText x={x + w * 0.5} y={counter + h * 0.1 + h * 0.078} fontSize={Math.max(7, w * 0.078)} fontWeight="800" fill={W.woodDark} textAnchor="middle">
        FRESH TODAY
      </SvgText>

      {/* Beside it: a sack of potatoes and a crate of carrots and tomatoes. */}
      <PotatoSack x={x + w + 14 * u} y={base} s={22 * u} />
      <G>
        {[0, 1, 2].map((i) => (
          <G key={i}>
            <Path d={`M${x - 14 * u + i * 4 * u},${base - 11 * u} l${1 * u},${-5 * u} m${0},${5 * u} l${2 * u},${-4 * u}`} stroke={W.grassEdge} strokeWidth={1.1} />
            <Path d={`M${x - 15 * u + i * 4 * u},${base - 11 * u} l${1.6 * u},${8 * u} l${1.6 * u},${-8 * u} z`} fill="#F28C28" stroke={W.ink} strokeWidth={0.6} />
          </G>
        ))}
        <Fruit x={x - 3 * u} y={base - 11 * u} r={2.8 * u} kind="tomato" />
        <Fruit x={x + 2 * u} y={base - 10 * u} r={2.6 * u} kind="tomato" />
        <Rect x={x - 17 * u} y={base - 9 * u} width={22 * u} height={9 * u} fill={W.woodLight} stroke={W.ink} strokeWidth={1} />
        <Path d={`M${x - 17 * u},${base - 4.5 * u} h${22 * u}`} stroke={W.woodDark} strokeWidth={0.8} />
      </G>
    </G>
  );
}

const FRUIT_JAM = { plum: '#6B3A9E', apple: '#C8322A', golden: '#F2B320' } as const;
