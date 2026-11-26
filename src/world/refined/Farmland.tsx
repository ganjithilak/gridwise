import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { farmGeometry } from '../env/Farm';
import { seeded } from '../geometry';

import { PaintDefs, R, Tree, type ProduceKind } from './paint';

type Pt = { x: number; y: number };

/** Mixes a hex colour towards another by `t` (0..1). */
function mix(a: string, b: string, t: number): string {
  const p = parseInt(a.slice(1), 16);
  const q = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((p >> s) & 255) + (((q >> s) & 255) - ((p >> s) & 255)) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

type Crop = 'wheat' | 'barley' | 'young' | 'pasture' | 'ploughed' | 'stubble' | 'orchard' | 'tomatoes';
const CROP_COLOUR: Record<Crop, string> = {
  wheat: R.wheat,
  barley: R.barley,
  young: R.youngCrop,
  pasture: R.pasture,
  ploughed: R.ploughed,
  stubble: R.stubble,
  orchard: R.pasture,
  tomatoes: R.youngCrop,
};
const ROWED: Crop[] = ['wheat', 'barley', 'young', 'ploughed', 'stubble', 'tomatoes'];

/**
 * Refined background: productive farmland in perspective rather than decorative bumps.
 * Two hazy ridges on the horizon, then a patchwork of fields that rolls towards the viewer,
 * divided by hedgerows that converge on a vanishing point. Fields show crop rows; some are
 * orchards. Colour fades into the warm haze with distance (atmospheric perspective).
 */
export const RefinedFarmBackdrop = memo(function RefinedFarmBackdrop({ width, ground }: { width: number; ground: number }) {
  const { field } = farmGeometry(width, ground);
  const art = useMemo(() => {
    const rand = seeded(91);
    const yH = ground * 0.5;
    const V: Pt = { x: width * 0.54, y: yH - ground * 0.3 };
    const bottom = field + 8;
    const N = 6;
    // Rolling field boundaries: closer together near the horizon, gently undulating.
    const level = (k: number, x: number) => {
      const t = Math.pow(k / N, 1.55);
      return yH + (bottom - yH) * t + (2 + k * 2.2) * Math.sin((x / width) * Math.PI * 1.7 + k * 1.3) * (k === 0 ? 0 : 1);
    };
    // Hedgerows fanning out from the vanishing point.
    const M = 5;
    const spokesAt = Array.from({ length: 2 * M + 1 }, (_, j) => width * 0.54 + (j - M) * width * 0.36 + (rand() - 0.5) * width * 0.08);
    const spokeX = (j: number, y: number) => V.x + (spokesAt[j] - V.x) * ((y - V.y) / (bottom - V.y));
    const corner = (k: number, j: number): Pt => {
      let y = level(k, spokeX(j, yH));
      for (let n = 0; n < 4; n++) y = level(k, spokeX(j, y));
      return { x: spokeX(j, y), y };
    };
    const edge = (k: number, a: Pt, b: Pt) =>
      Array.from({ length: 9 }, (_, i) => {
        const x = a.x + ((b.x - a.x) * i) / 8;
        return { x, y: level(k, x) };
      });

    const crops: Crop[] = ['wheat', 'barley', 'young', 'pasture', 'ploughed', 'stubble'];
    const patches: { d: string; fill: string; rows: string[]; rowColour: string; trees: { x: number; y: number; s: number; fruit?: ProduceKind }[]; k: number }[] = [];
    for (let k = 0; k < N; k++) {
      for (let j = 0; j < 2 * M; j++) {
        const tl = corner(k, j);
        const tr = corner(k, j + 1);
        const bl = corner(k + 1, j);
        const br = corner(k + 1, j + 1);
        if (Math.max(tl.x, tr.x, bl.x, br.x) < -20 || Math.min(tl.x, tr.x, bl.x, br.x) > width + 20) continue;
        const top = edge(k, tl, tr);
        const bot = edge(k + 1, bl, br).reverse();
        const d = `M${[...top, ...bot].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`;
        // The two nearest bands get orchards and tomatoes, the rest arable land and pasture.
        let crop: Crop = crops[Math.floor(rand() * crops.length)];
        if (k >= N - 2 && (j === 2 || j === 7)) crop = 'orchard';
        if (k === N - 1 && j === 5) crop = 'tomatoes';
        const haze = 0.55 * (1 - k / N);
        const fill = mix(CROP_COLOUR[crop], R.hazeTint, haze);
        const rows: string[] = [];
        if (ROWED.includes(crop)) {
          const n = 5 + k * 2;
          for (let r = 1; r < n; r++) {
            const f = r / n;
            const a = { x: tl.x + (tr.x - tl.x) * f, y: tl.y + (tr.y - tl.y) * f };
            const b = { x: bl.x + (br.x - bl.x) * f, y: bl.y + (br.y - bl.y) * f };
            rows.push(`M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`);
          }
        }
        const trees: { x: number; y: number; s: number; fruit?: ProduceKind }[] = [];
        if (crop === 'orchard') {
          const cols = 4 + k;
          for (let r = 1; r <= 3; r++) {
            const fy = r / 3.6;
            for (let c = 0; c < cols; c++) {
              const fx = (c + 0.5) / cols;
              const x = tl.x + (tr.x - tl.x) * fx + (bl.x - tl.x + (br.x - tr.x - (bl.x - tl.x)) * fx) * fy;
              const y = tl.y + (bl.y - tl.y) * fy + (tr.y - tl.y) * fx * (1 - fy);
              trees.push({ x, y, s: 2.2 + k * 1.1 + fy * 1.2, fruit: j < M ? 'apple' : 'orange' });
            }
          }
          trees.sort((a, b) => a.y - b.y);
        }
        patches.push({ d, fill, rows, rowColour: mix(CROP_COLOUR[crop], '#2E3B1E', 0.35), trees, k });
      }
    }
    const hedges: { d: string; w: number; k: number }[] = [];
    for (let k = 1; k <= N; k++) {
      const pts = Array.from({ length: 30 }, (_, i) => {
        const x = -20 + ((width + 40) * i) / 29;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${level(k, x).toFixed(1)}`;
      });
      hedges.push({ d: pts.join(' '), w: 0.8 + k * 0.45, k });
    }
    for (let j = 0; j <= 2 * M; j++) {
      const a = corner(0, j);
      const b = corner(N, j);
      hedges.push({ d: `M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`, w: 1.4, k: 3 });
    }
    // Trees dotted along the hedgerows, bigger as they come closer.
    const hedgeTrees: { x: number; y: number; s: number }[] = [];
    for (let k = 1; k < N; k++) {
      for (let x = rand() * 60; x < width; x += 40 + rand() * 90) hedgeTrees.push({ x, y: level(k, x), s: 2.4 + k * 1.6 });
    }
    hedgeTrees.sort((a, b) => a.y - b.y);
    // A far ridge and a nearer one on the horizon.
    const ridge = (base: number, amp: number, ph: number) =>
      `M0,${yH + 2} ` +
      Array.from({ length: 24 }, (_, i) => {
        const x = (width * i) / 23;
        const y = base - amp * (0.6 * Math.sin((x / width) * Math.PI * 2.2 + ph) + 0.4 * Math.sin((x / width) * Math.PI * 5.1 + ph * 2));
        return `L${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ') +
      ` L${width},${yH + 2} Z`;
    // The farmhouse and barn, far off on the left.
    const house = corner(1, 3);
    return { yH, patches, hedges, hedgeTrees, ridges: [ridge(yH - ground * 0.05, ground * 0.035, 0.4), ridge(yH - ground * 0.015, ground * 0.02, 2.1)], house };
  }, [width, ground, field]);

  return (
    <Svg width={width} height={field + 8} style={StyleSheet.absoluteFill} pointerEvents="none">
      <PaintDefs />
      <Defs>
        <LinearGradient id="rf-haze" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={R.haze} stopOpacity={0.42} />
          <Stop offset="1" stopColor={R.haze} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={art.ridges[0]} fill={R.ridgeFar} />
      <Path d={art.ridges[1]} fill={R.ridgeNear} />
      {art.patches.map((p, i) => (
        <G key={i}>
          <Path d={p.d} fill={p.fill} />
          {p.rows.length > 0 ? <Path d={p.rows.join(' ')} stroke={p.rowColour} strokeWidth={0.5 + p.k * 0.25} opacity={0.45} /> : null}
        </G>
      ))}
      {/* Farmstead, small and hazy. */}
      <G opacity={0.8}>
        <Rect x={art.house.x - 14} y={art.house.y - 9} width={12} height={9} fill="#D9CFBC" />
        <Path d={`M${art.house.x - 15.5},${art.house.y - 9} L${art.house.x - 8},${art.house.y - 15} L${art.house.x - 0.5},${art.house.y - 9} Z`} fill="#7E6A5C" />
        <Rect x={art.house.x + 1} y={art.house.y - 11} width={15} height={11} fill="#9A5848" />
        <Path d={`M${art.house.x - 0.5},${art.house.y - 11} L${art.house.x + 8.5},${art.house.y - 18} L${art.house.x + 17.5},${art.house.y - 11} Z`} fill="#6B4B42" />
        <Rect x={art.house.x + 6} y={art.house.y - 6} width={5} height={6} fill="#5D3B33" />
      </G>
      {art.hedges.map((hdg, i) => (
        <Path key={`h${i}`} d={hdg.d} stroke={mix(R.hedge, R.hazeTint, 0.5 * (1 - hdg.k / 6))} strokeWidth={hdg.w} fill="none" strokeLinecap="round" opacity={0.85} />
      ))}
      {art.hedgeTrees.map((t, i) => (
        <Tree key={`t${i}`} x={t.x} y={t.y} s={t.s} far={t.s < 7} seed={i} />
      ))}
      {art.patches.flatMap((p, i) => p.trees.map((t, n) => <Tree key={`o${i}-${n}`} x={t.x} y={t.y} s={t.s} far={t.s < 6} fruit={t.s > 5 ? t.fruit : undefined} seed={n} />))}
      {/* Distance haze over the far fields. */}
      <Rect x={0} y={art.yH - 30} width={width} height={(field - art.yH) * 0.55 + 30} fill="url(#rf-haze)" />
    </Svg>
  );
});
