import { createContext, useContext, useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { W } from './palette';

interface Props {
  /** 0 Seed … 7 Fruit (see `GROWTH_STAGES`). */
  stage: number;
  ripe?: boolean;
  /** Drawn height in points. The ground sits 92% of the way down. */
  height: number;
  /** Painted shading without outlines, for the Refined theme. */
  refined?: boolean;
}

/** The drawing box: 200 wide, 280 high, ground at y = 258. */
const VB_W = 200;
const VB_H = 280;
const GROUND = 258;
const CX = 100;

/** True while drawing for the Refined theme: painted shading, no outlines. */
const Refined = createContext(false);

/** A teardrop leaf with its tip at the origin, pointing up, cel-shaded down its right side. */
function Leaf({ x, y, s, a, back = false }: { x: number; y: number; s: number; a: number; back?: boolean }) {
  const rf = useContext(Refined);
  const full = `M0,0 C${s * 0.62},${-s * 0.2} ${s * 0.56},${-s * 0.82} 0,${-s} C${-s * 0.56},${-s * 0.82} ${-s * 0.62},${-s * 0.2} 0,0 Z`;
  const shade = `M0,0 C${s * 0.62},${-s * 0.2} ${s * 0.56},${-s * 0.82} 0,${-s} C${s * 0.18},${-s * 0.6} ${s * 0.16},${-s * 0.3} 0,0 Z`;
  return (
    <G transform={`translate(${x},${y}) rotate(${a})`}>
      <Path d={full} fill={rf ? (back ? 'url(#gs-leaf-back)' : 'url(#gs-leaf)') : back ? W.leafShade : W.leaf} stroke={rf ? 'none' : W.leafEdge} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d={shade} fill={back ? '#15705F' : W.leafShade} opacity={rf ? 0.3 : 1} />
      <Path d={`M0,${-s * 0.1} Q${-s * 0.06},${-s * 0.5} 0,${-s * 0.86}`} stroke={W.leafLight} strokeWidth={rf ? 0.9 : 1.3} opacity={rf ? 0.45 : 1} fill="none" strokeLinecap="round" />
    </G>
  );
}

/** Leaf clusters: [angle, size, drop]. Uneven on purpose, so the crown reads as grown. */
const CLUSTER_BACK: [number, number, number][] = [
  [-150, 26, 8],
  [-112, 34, 6],
  [-58, 38, 2],
  [-8, 34, -2],
  [44, 40, 2],
  [98, 32, 6],
  [142, 28, 9],
];
const CLUSTER_FRONT: [number, number, number][] = [
  [-128, 28, 10],
  [-84, 33, 7],
  [-34, 30, 4],
  [18, 31, 5],
  [70, 34, 7],
  [118, 26, 10],
];

/** A lilac bell hanging from (x, y). */
function Bell({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const rf = useContext(Refined);
  return (
    <G transform={`translate(${x},${y}) scale(${s})`}>
      <Path d="M0,-6 v5" stroke={W.leafEdge} strokeWidth={1.4} />
      <Path d="M-6,8 C-6,-2 6,-2 6,8 L8.5,13 C3,10.5 -3,10.5 -8.5,13 Z" fill={rf ? '#C1A9E0' : W.bell} stroke={rf ? 'none' : W.bellEdge} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M2,1 C5,3 6,6 6,8 L8.5,13 C6,12 4.5,11.6 3,11.4 Z" fill={W.bellShade} />
      <Circle cx={0} cy={13} r={1.6} fill={W.fruit} />
    </G>
  );
}

/** A golden fruit hanging from (x, y). Ripe fruit glows. */
function Fruit({ x, y, ripe }: { x: number; y: number; ripe: boolean }) {
  const rf = useContext(Refined);
  return (
    <G transform={`translate(${x},${y})`}>
      {ripe ? <Circle cx={0} cy={9} r={17} fill="url(#fruitGlow)" /> : null}
      <Path d="M0,-4 v5" stroke={W.leafEdge} strokeWidth={1.6} />
      <Path d="M0,0 q6,-6 10,-2 q-5,4 -10,2" fill={W.leaf} stroke={rf ? 'none' : W.leafEdge} strokeWidth={1} />
      <Circle cx={0} cy={10} r={9.5} fill={rf ? 'url(#gs-fruit)' : W.fruit} stroke={rf ? 'none' : W.fruitEdge} strokeWidth={1.5} />
      {rf ? null : <Path d="M8.6,6 A9.5,9.5 0 0 1 -4,18.6 A11,11 0 0 0 8.6,6 Z" fill={W.fruitShade} />}
      <Ellipse cx={-3.4} cy={6.5} rx={2.6} ry={1.8} fill="#FFFBE6" />
    </G>
  );
}

/** The trunk's outline: tapering, with a gentle S so it reads as grown rather than placed. */
function trunkPath(height: number, base: number, top: number): { body: string; shade: string; grooves: string } {
  const n = 18;
  const left: string[] = [];
  const right: string[] = [];
  const shade: string[] = [];
  const grooves: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = GROUND - t * height;
    const x = CX + Math.sin(t * Math.PI * 1.15) * 7;
    const w = base + (top - base) * t;
    left.push(`${(x - w / 2).toFixed(1)},${y.toFixed(1)}`);
    right.push(`${(x + w / 2).toFixed(1)},${y.toFixed(1)}`);
    shade.push(`${(x + w * 0.12).toFixed(1)},${y.toFixed(1)}`);
    // The spiral: a groove wrapping round the trunk every few steps.
    if (i % 3 === 1 && i < n - 1) grooves.push(`M${(x - w / 2 + 1).toFixed(1)},${(y + 3).toFixed(1)} Q${x.toFixed(1)},${(y - 4).toFixed(1)} ${(x + w / 2 - 1).toFixed(1)},${(y - 9).toFixed(1)}`);
  }
  const body = `M${left.join(' L')} L${[...right].reverse().join(' L')} Z`;
  const shadeBody = `M${shade.join(' L')} L${[...right].reverse().join(' L')} Z`;
  return { body, shade: shadeBody, grooves: grooves.join(' ') };
}

/** A branch from the trunk, as a tapering stroke pair. */
function Branch({ d, w }: { d: string; w: number }) {
  const rf = useContext(Refined);
  return (
    <G fill="none" strokeLinecap="round">
      {rf ? null : <Path d={d} stroke={W.trunkLine} strokeWidth={w + 3} />}
      <Path d={d} stroke={W.trunk} strokeWidth={w} />
    </G>
  );
}

/**
 * Goldspire: the prototype's one species. A spiralling trunk, teal teardrop leaves, lilac
 * bells and golden fruit. Original to Gridwise; not a creature and has no face.
 *
 * TEMPORARY ARTWORK: a placeholder to judge scale and silhouette per stage. Production
 * art (and other species) will replace it.
 */
export function Goldspire({ stage, ripe = false, height, refined = false }: Props) {
  const [sway] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sway]);
  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-1.2deg', '1.2deg'] });
  const width = (height * VB_W) / VB_H;

  // Per stage: how tall the stem / trunk is, and how thick at the base and top.
  const trunkH = [0, 0, 0, 46, 110, 150, 160, 166][stage] ?? 166;
  const trunkBase = [0, 0, 0, 5, 14, 18, 19, 20][stage] ?? 20;
  const trunkTop = [0, 0, 0, 3, 6, 7, 7, 7][stage] ?? 7;
  const topY = GROUND - trunkH;
  const topX = CX + Math.sin(Math.PI * 1.15) * 7;
  const trunk = stage >= 3 ? trunkPath(trunkH, trunkBase, trunkTop) : null;

  const crown = stage >= 5;
  const leftEnd = { x: CX - 56, y: GROUND - 118 };
  const rightEnd = { x: CX + 54, y: GROUND - 128 };

  return (
    <Animated.View
      pointerEvents="none"
      style={{ width, height, transform: [{ rotate }], transformOrigin: `50% ${((GROUND / VB_H) * 100).toFixed(0)}%` }}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <RadialGradient id="gs-leaf" cx="30%" cy="25%" r="85%">
            <Stop offset="0" stopColor="#8AD2BB" />
            <Stop offset="0.55" stopColor="#3FA68C" />
            <Stop offset="1" stopColor="#1F6E5D" />
          </RadialGradient>
          <RadialGradient id="gs-leaf-back" cx="30%" cy="25%" r="85%">
            <Stop offset="0" stopColor="#4C9C86" />
            <Stop offset="1" stopColor="#174F43" />
          </RadialGradient>
          <LinearGradient id="gs-bark" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#A07552" />
            <Stop offset="0.6" stopColor="#7A5338" />
            <Stop offset="1" stopColor="#523523" />
          </LinearGradient>
          <RadialGradient id="gs-fruit" cx="35%" cy="30%" r="70%">
            <Stop offset="0" stopColor="#FFF0B8" />
            <Stop offset="0.45" stopColor="#F2C14E" />
            <Stop offset="1" stopColor="#B07A16" />
          </RadialGradient>
          <RadialGradient id="gs-mound" cx="45%" cy="25%" r="75%">
            <Stop offset="0" stopColor="#8A6446" />
            <Stop offset="1" stopColor="#4A2F1D" />
          </RadialGradient>
          <RadialGradient id="gs-seed" cx="35%" cy="30%" r="75%">
            <Stop offset="0" stopColor="#E7B77C" />
            <Stop offset="1" stopColor="#8A5A2C" />
          </RadialGradient>
          <RadialGradient id="fruitGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={W.fruitGlow} stopOpacity={0.9} />
            <Stop offset="1" stopColor={W.fruitGlow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Refined.Provider value={refined}>

        {/* The tilled mound it grows from. */}
        <Ellipse cx={CX} cy={GROUND + 4} rx={44} ry={11} fill={refined ? 'url(#gs-mound)' : W.soilTop} stroke={refined ? 'none' : W.ink} strokeWidth={1.4} />
        <Path d={`M${CX - 40},${GROUND + 3} Q${CX},${GROUND - 9} ${CX + 40},${GROUND + 3}`} fill={W.pebble} opacity={0.55} />
        <Path d={`M${CX - 22},${GROUND + 6} q4,-3 8,0 M${CX + 10},${GROUND + 7} q4,-3 8,0`} stroke={W.soilDeep} strokeWidth={1.4} fill="none" strokeLinecap="round" />

        {stage === 0 ? (
          <G>
            {/* The mystery seed, half buried, with a glint. */}
            <Ellipse cx={CX} cy={GROUND - 2} rx={9} ry={11} fill={refined ? 'url(#gs-seed)' : W.seed} stroke={refined ? 'none' : W.ink} strokeWidth={1.4} />
            <Path d={`M${CX + 3},${GROUND - 12} Q${CX + 9},${GROUND - 3} ${CX + 4},${GROUND + 7}`} fill={W.seedShade} />
            <Path d={`M${CX - 5},${GROUND - 7} q2,-3 5,-3`} stroke="#FFE7C2" strokeWidth={2} strokeLinecap="round" fill="none" />
            <Path d={`M${CX + 18},${GROUND - 26} l2,-6 l2,6 l6,2 l-6,2 l-2,6 l-2,-6 l-6,-2 z`} fill="#FFFFFF" opacity={0.9} />
          </G>
        ) : null}

        {stage === 1 || stage === 2 ? (
          <G>
            {/* A cracked seed with a curled sprout. Stage 2 is the same sprout, taller: its news is underground. */}
            <Ellipse cx={CX - 3} cy={GROUND} rx={8} ry={6} fill={refined ? 'url(#gs-seed)' : W.seed} stroke={refined ? 'none' : W.ink} strokeWidth={1.2} />
            <Path
              d={stage === 1 ? `M${CX},${GROUND - 2} C${CX + 2},${GROUND - 14} ${CX - 4},${GROUND - 20} ${CX + 2},${GROUND - 26}` : `M${CX},${GROUND - 2} C${CX + 3},${GROUND - 20} ${CX - 4},${GROUND - 30} ${CX + 2},${GROUND - 40}`}
              stroke={refined ? '#4E8A3C' : W.leafEdge}
              strokeWidth={refined ? 3.4 : 4.6}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d={stage === 1 ? `M${CX},${GROUND - 2} C${CX + 2},${GROUND - 14} ${CX - 4},${GROUND - 20} ${CX + 2},${GROUND - 26}` : `M${CX},${GROUND - 2} C${CX + 3},${GROUND - 20} ${CX - 4},${GROUND - 30} ${CX + 2},${GROUND - 40}`}
              stroke="#8FD86A"
              strokeWidth={2.6}
              fill="none"
              strokeLinecap="round"
            />
            <Leaf x={CX + 2} y={stage === 1 ? GROUND - 26 : GROUND - 40} s={stage === 1 ? 13 : 18} a={-58} />
            <Leaf x={CX + 2} y={stage === 1 ? GROUND - 26 : GROUND - 40} s={stage === 1 ? 12 : 17} a={52} />
          </G>
        ) : null}

        {trunk ? (
          <G>
            {crown ? (
              <G>
                <Branch d={`M${CX + 1},${GROUND - 92} C${CX - 20},${GROUND - 100} ${CX - 40},${GROUND - 104} ${leftEnd.x},${leftEnd.y}`} w={6} />
                <Branch d={`M${CX + 3},${GROUND - 104} C${CX + 22},${GROUND - 112} ${CX + 40},${GROUND - 118} ${rightEnd.x},${rightEnd.y}`} w={5.5} />
              </G>
            ) : null}
            <Path
              d={trunk.body}
              fill={stage === 3 ? '#7CC95B' : refined ? 'url(#gs-bark)' : W.trunk}
              stroke={refined ? 'none' : stage === 3 ? W.leafEdge : W.trunkLine}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
            <Path d={trunk.shade} fill={stage === 3 ? '#5DAA45' : W.trunkShade} />
            {stage >= 4 ? <Path d={trunk.grooves} stroke={W.trunkLine} strokeWidth={refined ? 1 : 1.4} fill="none" strokeLinecap="round" opacity={refined ? 0.35 : 0.8} /> : null}
          </G>
        ) : null}

        {stage === 3 ? (
          <G>
            <Leaf x={topX - 1} y={topY + 16} s={20} a={-62} />
            <Leaf x={topX + 1} y={topY + 12} s={19} a={60} />
            <Leaf x={topX} y={topY + 2} s={22} a={-14} />
            <Leaf x={topX} y={topY + 2} s={20} a={22} />
          </G>
        ) : null}

        {stage === 4 ? (
          <G>
            <Leaf x={topX} y={topY + 8} s={28} a={-70} />
            <Leaf x={topX} y={topY + 8} s={27} a={68} />
            <Leaf x={topX} y={topY + 2} s={32} a={-28} />
            <Leaf x={topX} y={topY + 2} s={30} a={30} />
            <Leaf x={topX} y={topY} s={30} a={0} />
            <Leaf x={CX - 3} y={GROUND - 60} s={18} a={-80} />
          </G>
        ) : null}

        {crown ? (
          <G>
            {/* Three leaf clusters: left branch, right branch, crown. */}
            {[
              { ...leftEnd, k: 'l' },
              { ...rightEnd, k: 'r' },
              { x: topX, y: topY, k: 't' },
            ].map(({ x, y, k }) => (
              <G key={k}>
                {/* A darker back layer for depth, then the front leaves, each a little different. */}
                {CLUSTER_BACK.map(([a, sz, dy], i) => (
                  <Leaf key={`b${i}`} x={x} y={y + dy} s={sz} a={a + (k === 'r' ? 8 : k === 'l' ? -8 : 0)} back />
                ))}
                {CLUSTER_FRONT.map(([a, sz, dy], i) => (
                  <Leaf key={`f${i}`} x={x} y={y + dy} s={sz} a={a + (k === 'r' ? 6 : k === 'l' ? -6 : 0)} />
                ))}
              </G>
            ))}
          </G>
        ) : null}

        {stage === 6 ? (
          <G>
            <Bell x={leftEnd.x - 18} y={leftEnd.y + 4} />
            <Bell x={leftEnd.x + 16} y={leftEnd.y + 10} s={0.9} />
            <Bell x={rightEnd.x + 20} y={rightEnd.y + 6} />
            <Bell x={rightEnd.x - 14} y={rightEnd.y + 12} s={0.9} />
            <Bell x={topX - 22} y={topY - 4} s={0.95} />
            <Bell x={topX + 20} y={topY - 2} />
          </G>
        ) : null}

        {stage >= 7 ? (
          <G>
            <Bell x={topX + 24} y={topY - 6} s={0.8} />
            <Fruit x={leftEnd.x - 16} y={leftEnd.y + 2} ripe={ripe} />
            <Fruit x={leftEnd.x + 16} y={leftEnd.y + 10} ripe={ripe} />
            <Fruit x={rightEnd.x + 18} y={rightEnd.y + 4} ripe={ripe} />
            <Fruit x={rightEnd.x - 14} y={rightEnd.y + 12} ripe={ripe} />
            <Fruit x={topX - 20} y={topY - 8} ripe={ripe} />
          </G>
        ) : null}
        </Refined.Provider>
      </Svg>
    </Animated.View>
  );
}
