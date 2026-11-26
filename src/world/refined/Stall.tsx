import { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { Produce, R, type ProduceKind } from './paint';

/**
 * Golden Apples Farm's stall, Refined: built from real timber (planked, grained, with a
 * shingled roof and braced posts), a weathered canvas awning, a carved sign, and stock that
 * matches the lessons: apples, golden apples, pears, plums, tomatoes, carrots, potatoes,
 * preserves, oil, milk and pies. Same footprint as the Classic stall.
 */
export function RefinedStall({ x, base, w }: { x: number; base: number; w: number }) {
  const h = w * 1.22;
  const top = base - h;
  const u = w / 100;
  const roofTop = top + h * 0.05;
  const eave = top + h * 0.17;
  const awBot = top + h * 0.33;
  const shelf1 = awBot + h * 0.13;
  const shelf2 = awBot + h * 0.27;
  const counter = top + h * 0.66;
  const stripes = 7;
  const sw = (w + 10 * u) / stripes;
  const crates: ProduceKind[] = ['apple', 'golden', 'pear', 'plum'];
  const crateW = (w - 6 * u) / crates.length;

  return (
    <G>
      <Defs>
        <LinearGradient id="rf-awning-red" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#B85346" />
          <Stop offset="1" stopColor={R.canvasRedShade} />
        </LinearGradient>
        <LinearGradient id="rf-awning-cream" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F4ECD8" />
          <Stop offset="1" stopColor={R.canvasShade} />
        </LinearGradient>
        <LinearGradient id="rf-glass" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <Stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.05} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0.15} />
        </LinearGradient>
        <RadialGradient id="rf-lamp" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFE7A6" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#FFE7A6" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Ground shadow. */}
      <Ellipse cx={x + w * 0.55} cy={base + 1} rx={w * 0.72} ry={w * 0.06} fill="#2C4A22" opacity={0.35} />

      {/* Back wall: planks of slightly different tones, with grain. */}
      {Array.from({ length: 6 }, (_, i) => {
        const px = x + 3 * u + (i * (w - 6 * u)) / 6;
        const pw = (w - 6 * u) / 6;
        return (
          <G key={i}>
            <Rect x={px} y={eave} width={pw} height={counter - eave} fill={i % 2 ? '#6D5035' : '#755639'} />
            <Path d={`M${px + pw * 0.3},${eave + 4} q${pw * 0.1},${(counter - eave) * 0.5} 0,${counter - eave - 8}`} stroke={R.grain} strokeWidth={0.5} opacity={0.5} fill="none" />
            <Path d={`M${px},${eave} V${counter}`} stroke="#3E2C1C" strokeWidth={0.6} opacity={0.6} />
          </G>
        );
      })}
      <Rect x={x + 3 * u} y={eave} width={w - 6 * u} height={(counter - eave) * 0.25} fill="#000000" opacity={0.18} />

      {/* Top shelf: preserves, oil and milk. */}
      {(['#6B3A57', '#9E2E25', '#C89632'] as const).map((jam, i) => {
        const cx = x + w * (0.13 + i * 0.11);
        return (
          <G key={jam}>
            <Rect x={cx - 4 * u} y={shelf1 - 9 * u} width={8 * u} height={9 * u} rx={1.6 * u} fill={jam} />
            <Rect x={cx - 4 * u} y={shelf1 - 9 * u} width={8 * u} height={9 * u} rx={1.6 * u} fill="url(#rf-glass)" />
            <Rect x={cx - 4.4 * u} y={shelf1 - 11 * u} width={8.8 * u} height={2.4 * u} rx={0.8 * u} fill="#D9CDB4" />
            <Rect x={cx - 2.6 * u} y={shelf1 - 6.5 * u} width={5.2 * u} height={3.2 * u} fill="#EFE6D2" opacity={0.9} />
          </G>
        );
      })}
      {[0.56, 0.66].map((f) => {
        const cx = x + w * f;
        return (
          <G key={f}>
            <Path d={`M${cx - 3 * u},${shelf1} V${shelf1 - 10 * u} Q${cx},${shelf1 - 13.5 * u} ${cx + 3 * u},${shelf1 - 10 * u} V${shelf1} Z`} fill="#C9962E" opacity={0.9} />
            <Rect x={cx - 1.1 * u} y={shelf1 - 17 * u} width={2.2 * u} height={4.5 * u} fill="#C9962E" opacity={0.9} />
            <Rect x={cx - 1.3 * u} y={shelf1 - 18.4 * u} width={2.6 * u} height={1.6 * u} fill="#5A3F28" />
            <Path d={`M${cx - 3 * u},${shelf1} V${shelf1 - 10 * u} Q${cx},${shelf1 - 13.5 * u} ${cx + 3 * u},${shelf1 - 10 * u} V${shelf1} Z`} fill="url(#rf-glass)" />
          </G>
        );
      })}
      <Path d={`M${x + w * 0.8 - 3.6 * u},${shelf1} V${shelf1 - 9 * u} L${x + w * 0.8 - 1.8 * u},${shelf1 - 12.5 * u} H${x + w * 0.8 + 1.8 * u} L${x + w * 0.8 + 3.6 * u},${shelf1 - 9 * u} V${shelf1} Z`} fill="#F7F4EC" />
      <Rect x={x + w * 0.8 - 2 * u} y={shelf1 - 14.4 * u} width={4 * u} height={2 * u} fill="#4F6A86" />
      <Rect x={x + 3 * u} y={shelf1} width={w - 6 * u} height={2.2 * u} fill="url(#rf-wood-v)" />
      <Rect x={x + 3 * u} y={shelf1 + 2.2 * u} width={w - 6 * u} height={1.2 * u} fill="#000000" opacity={0.25} />

      {/* Second shelf: pies and a basket of pears. */}
      {[0.2, 0.41].map((f) => (
        <G key={f}>
          <Ellipse cx={x + w * f} cy={shelf2 - 2.6 * u} rx={8.4 * u} ry={3 * u} fill="#B87A35" />
          <Ellipse cx={x + w * f} cy={shelf2 - 3.6 * u} rx={7 * u} ry={2.3 * u} fill="#DDAA5E" />
          <Path d={`M${x + w * f - 5 * u},${shelf2 - 4.2 * u} l${10 * u},${1.4 * u} M${x + w * f - 5 * u},${shelf2 - 2.9 * u} l${10 * u},${-1.4 * u}`} stroke="#A8692A" strokeWidth={0.7} opacity={0.8} />
        </G>
      ))}
      <Path d={`M${x + w * 0.61},${shelf2} h${23 * u} l${-2 * u},${-6 * u} h${-19 * u} z`} fill="#A98458" />
      {[0, 1, 2, 3].map((i) => (
        <Produce key={i} x={x + w * 0.65 + i * 4.8 * u} y={shelf2 - 7.6 * u} r={2.7 * u} kind="pear" />
      ))}
      <Rect x={x + 3 * u} y={shelf2} width={w - 6 * u} height={2.2 * u} fill="url(#rf-wood-v)" />
      <Rect x={x + 3 * u} y={shelf2 + 2.2 * u} width={w - 6 * u} height={1.2 * u} fill="#000000" opacity={0.25} />

      {/* Posts, with knee braces under the eave. */}
      {[x, x + w - 7 * u].map((px, i) => (
        <G key={px}>
          <Rect x={px} y={eave} width={7 * u} height={base - eave} fill="url(#rf-wood)" />
          <Path d={`M${px + 2 * u},${eave + 10} v${base - eave - 20}`} stroke={R.grain} strokeWidth={0.5} opacity={0.5} />
          <Path d={i === 0 ? `M${px + 7 * u},${eave + 14 * u} L${px + 16 * u},${eave}` : `M${px},${eave + 14 * u} L${px - 9 * u},${eave}`} stroke={R.wood} strokeWidth={2.6 * u} strokeLinecap="square" />
        </G>
      ))}

      {/* Roof: a shingled pitch over a fascia board. */}
      <Path d={`M${x - 8 * u},${eave} L${x + 6 * u},${roofTop} L${x + w - 6 * u},${roofTop} L${x + w + 8 * u},${eave} Z`} fill={R.shingle} />
      {Array.from({ length: 3 }, (_, r) => {
        const y0 = roofTop + ((eave - roofTop) * (r + 1)) / 3.2;
        const inset = 6 * u - (14 * u * (r + 1)) / 3.2;
        return (
          <Path
            key={r}
            d={Array.from({ length: Math.ceil((w + 16 * u) / (7 * u)) }, (_, i) => {
              const sx = x + inset + i * 7 * u;
              return `M${sx},${y0} q${3.5 * u},${2.6 * u} ${7 * u},0`;
            }).join(' ')}
            stroke="#5A4230"
            strokeWidth={0.9}
            fill="none"
            opacity={0.7}
          />
        );
      })}
      <Path d={`M${x + w * 0.55},${roofTop} L${x + w - 6 * u},${roofTop} L${x + w + 8 * u},${eave} L${x + w * 0.6},${eave} Z`} fill="#000000" opacity={0.18} />
      <Rect x={x - 8 * u} y={eave - 1} width={w + 16 * u} height={3 * u} fill="url(#rf-wood-v)" />

      {/* Carved sign on the ridge. */}
      <Rect x={x + w * 0.16} y={roofTop - 11 * u} width={w * 0.68} height={11 * u} rx={2 * u} fill="#5B4029" />
      <Rect x={x + w * 0.16 + 1.2 * u} y={roofTop - 9.8 * u} width={w * 0.68 - 2.4 * u} height={8.6 * u} rx={1.4 * u} fill="#6E5034" />
      <SvgText x={x + w * 0.5} y={roofTop - 3.5 * u} fontSize={Math.max(6.5, 6.6 * u)} fontStyle="italic" fontWeight="700" fontFamily="Georgia, serif" fill="#F1DFAF" textAnchor="middle">
        Golden Apples
      </SvgText>

      {/* Awning: weathered canvas, scalloped, with soft folds. */}
      {Array.from({ length: stripes }, (_, i) => {
        const sx = x - 5 * u + i * sw;
        return (
          <Path
            key={i}
            d={`M${sx},${eave + 2 * u} L${sx + sw},${eave + 2 * u} L${sx + sw},${awBot} Q${sx + sw / 2},${awBot + sw * 0.5} ${sx},${awBot} Z`}
            fill={i % 2 === 0 ? 'url(#rf-awning-red)' : 'url(#rf-awning-cream)'}
          />
        );
      })}
      <Path d={Array.from({ length: stripes }, (_, i) => `M${x - 5 * u + i * sw + sw * 0.5},${eave + 3 * u} v${(awBot - eave) * 0.7}`).join(' ')} stroke="#000000" strokeWidth={0.6} opacity={0.12} />
      <Rect x={x - 5 * u} y={eave + 2 * u} width={w + 10 * u} height={2.5 * u} fill="#000000" opacity={0.15} />

      {/* Grapes hanging from the hem, and a lantern. */}
      {[
        [9, 4, 1],
        [17, 6, 0.85],
      ].map(([gx, gy, sc]) => (
        <G key={gx}>
          <Path d={`M${x + gx * u},${awBot} v${gy * u}`} stroke="#5A4230" strokeWidth={0.7} />
          {[
            [0, 0],
            [-1.4, 1.2],
            [1.4, 1.2],
            [-0.7, 2.4],
            [0.7, 2.4],
            [0, 3.6],
            [-1.4, 3.4],
            [1.2, 3.5],
            [0, 4.8],
          ].map(([dx, dy], i) => (
            <Circle key={i} cx={x + gx * u + dx * 1.6 * u * sc} cy={awBot + gy * u + 1.6 * u + dy * 1.5 * u * sc} r={1.25 * u * sc} fill="url(#rf-plum)" />
          ))}
        </G>
      ))}
      <Circle cx={x + w - 4 * u} cy={awBot + 10 * u} r={15 * u} fill="url(#rf-lamp)" />
      <Path d={`M${x + w - 4 * u},${awBot} v${4 * u}`} stroke="#3E2C1C" strokeWidth={0.7} />
      <Rect x={x + w - 7 * u} y={awBot + 4 * u} width={6 * u} height={9 * u} rx={1.4 * u} fill="#F3D27C" />
      <Rect x={x + w - 7 * u} y={awBot + 4 * u} width={6 * u} height={9 * u} rx={1.4 * u} fill="url(#rf-glass)" />
      <Rect x={x + w - 7.6 * u} y={awBot + 3 * u} width={7.2 * u} height={1.6 * u} fill="#3E2C1C" />

      {/* Crates on the counter. */}
      {crates.map((kind, i) => {
        const cx = x + 3 * u + i * crateW;
        return (
          <G key={kind}>
            {[0, 1].map((r) =>
              [0, 1, 2].map((k) => <Produce key={`${r}-${k}`} x={cx + crateW * (0.22 + k * 0.28) + (r ? crateW * 0.14 : 0)} y={counter - 5 * u - r * 3.8 * u} r={3.1 * u} kind={kind} />),
            )}
            <Rect x={cx + 0.8} y={counter - 4 * u} width={crateW - 1.6} height={5.5 * u} fill="url(#rf-wood-v)" />
            <Path d={`M${cx + 0.8},${counter - 1.3 * u} h${crateW - 1.6}`} stroke={R.grain} strokeWidth={0.6} opacity={0.7} />
            <Path d={`M${cx + 0.8},${counter - 4 * u} v${5.5 * u} M${cx + crateW - 0.8},${counter - 4 * u} v${5.5 * u}`} stroke="#3E2C1C" strokeWidth={0.6} opacity={0.5} />
          </G>
        );
      })}

      {/* Counter top and planked front. */}
      <Rect x={x - 3 * u} y={counter} width={w + 6 * u} height={4.5 * u} fill="url(#rf-wood-v)" />
      <Rect x={x - 3 * u} y={counter + 4.5 * u} width={w + 6 * u} height={1.2 * u} fill="#000000" opacity={0.3} />
      {Array.from({ length: 5 }, (_, i) => {
        const pw = w / 5;
        const px = x + i * pw;
        return (
          <G key={i}>
            <Rect x={px} y={counter + 5.7 * u} width={pw} height={base - counter - 5.7 * u} fill={i % 2 ? '#8E6A45' : '#987250'} />
            <Path d={`M${px + pw * 0.4},${counter + 8 * u} q${pw * 0.12},${(base - counter) * 0.4} 0,${base - counter - 12 * u}`} stroke={R.grain} strokeWidth={0.5} opacity={0.5} fill="none" />
            <Path d={`M${px},${counter + 5.7 * u} V${base}`} stroke="#3E2C1C" strokeWidth={0.6} opacity={0.6} />
          </G>
        );
      })}
      <Rect x={x + w * 0.55} y={counter + 5.7 * u} width={w * 0.45} height={base - counter - 5.7 * u} fill="#000000" opacity={0.16} />
      <Rect x={x + w * 0.18} y={counter + h * 0.11} width={w * 0.64} height={h * 0.1} rx={1.5 * u} fill="#EFE6D2" />
      <SvgText x={x + w * 0.5} y={counter + h * 0.11 + h * 0.07} fontSize={Math.max(6.5, 6.6 * u)} fontStyle="italic" fontWeight="700" fontFamily="Georgia, serif" fill="#5A4029" textAnchor="middle">
        Fresh today
      </SvgText>

      {/* Potatoes in a sack, and a crate of carrots and tomatoes, beside the stall. */}
      <G>
        <Ellipse cx={x + w + 16 * u} cy={base} rx={12 * u} ry={2 * u} fill="#2C4A22" opacity={0.35} />
        <Path d={`M${x + w + 6 * u},${base} Q${x + w + 3 * u},${base - 12 * u} ${x + w + 9 * u},${base - 19 * u} L${x + w + 22 * u},${base - 19 * u} Q${x + w + 28 * u},${base - 11 * u} ${x + w + 25 * u},${base} Z`} fill={R.burlap} />
        <Path d={`M${x + w + 17 * u},${base - 19 * u} L${x + w + 22 * u},${base - 19 * u} Q${x + w + 28 * u},${base - 11 * u} ${x + w + 25 * u},${base} L${x + w + 18 * u},${base} Z`} fill={R.burlapDark} opacity={0.8} />
        {[
          [11, -20],
          [16, -21.5],
          [20, -20],
        ].map(([px, py], i) => (
          <Ellipse key={i} cx={x + w + px * u} cy={base + py * u} rx={3 * u} ry={2.3 * u} fill={R.potato} />
        ))}
      </G>
      <G>
        {[0, 1, 2].map((i) => (
          <G key={i}>
            <Path d={`M${x - 13 * u + i * 3.6 * u},${base - 10 * u} l${0.8 * u},${-4.5 * u} m0,${4.5 * u} l${1.8 * u},${-3.6 * u}`} stroke="#5E8A3C" strokeWidth={0.9} />
            <Path d={`M${x - 14 * u + i * 3.6 * u},${base - 10 * u} l${1.5 * u},${7.5 * u} l${1.5 * u},${-7.5 * u} z`} fill={R.carrot} />
          </G>
        ))}
        <Produce x={x - 2.5 * u} y={base - 10.5 * u} r={2.6 * u} kind="tomato" />
        <Produce x={x + 2 * u} y={base - 9.8 * u} r={2.4 * u} kind="tomato" />
        <Rect x={x - 16 * u} y={base - 8.5 * u} width={21 * u} height={8.5 * u} fill="url(#rf-wood-v)" />
        <Path d={`M${x - 16 * u},${base - 4.2 * u} h${21 * u}`} stroke={R.grain} strokeWidth={0.6} opacity={0.7} />
      </G>
    </G>
  );
}
