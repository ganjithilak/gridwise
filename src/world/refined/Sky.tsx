import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { SkyDome } from '../env/SkyDome';

import { R } from './paint';

/**
 * Refined sky: a deep, clear blue overhead warming to a soft haze at the horizon, the sun as a
 * bloom of light rather than a disc with an edge, and the spreadsheet atmosphere overhead.
 */
export const RefinedSkyBackdrop = memo(function RefinedSkyBackdrop({ width, height, skyPanel, horizon }: { width: number; height: number; skyPanel: number; horizon: number }) {
  const farmStart = skyPanel / height;
  const sunX = width * 0.18;
  const sunY = skyPanel + (height - skyPanel) * 0.2;
  const big = Math.min(width, 520);
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="rf-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={R.skyTop} />
          <Stop offset={String(farmStart * 0.7)} stopColor={R.skyHigh} />
          <Stop offset={String(farmStart + (1 - farmStart) * 0.3)} stopColor={R.skyMid} />
          <Stop offset={String(farmStart + (1 - farmStart) * 0.68)} stopColor={R.skyLow} />
          <Stop offset="1" stopColor={R.haze} />
        </LinearGradient>
        <RadialGradient id="rf-sunbloom" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={R.sun} stopOpacity={1} />
          <Stop offset="0.12" stopColor={R.sun} stopOpacity={0.95} />
          <Stop offset="0.3" stopColor={R.sunGlow} stopOpacity={0.35} />
          <Stop offset="1" stopColor={R.sunGlow} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="rf-ray" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFF4D2" stopOpacity={0.16} />
          <Stop offset="1" stopColor="#FFF4D2" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#rf-sky)" />
      <SkyDome width={width} horizon={horizon} zenith={-skyPanel * 0.15} labelsAt={skyPanel + (height - skyPanel) * 0.17} />
      {/* Soft shafts of light from the sun. */}
      <G>
        <Path d={`M${sunX},${sunY} L${width * 0.7},${height} L${width * 0.95},${height} Z`} fill="url(#rf-ray)" />
        <Path d={`M${sunX},${sunY} L${width * 0.25},${height} L${width * 0.42},${height} Z`} fill="url(#rf-ray)" />
      </G>
      <Circle cx={sunX} cy={sunY} r={big * 0.42} fill="url(#rf-sunbloom)" />
    </Svg>
  );
});

/** A soft, volumetric cloud: no outline, lit from above, cooler and greyer underneath. */
export function RefinedCloudShape({ w }: { w: number }) {
  const h = (w * 80) / 200;
  const puffs: [number, number, number, number][] = [
    [40, 54, 30, 20],
    [70, 40, 34, 28],
    [104, 32, 36, 30],
    [138, 42, 32, 24],
    [164, 56, 26, 16],
    [100, 58, 70, 16],
  ];
  return (
    <Svg width={w} height={h} viewBox="0 0 200 80">
      <Defs>
        <LinearGradient id="rf-cloud" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.6" stopColor="#F4F7FA" />
          <Stop offset="1" stopColor="#C9D6E3" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={102} cy={66} rx={78} ry={9} fill="#B7C7D8" opacity={0.55} />
      <G fill="url(#rf-cloud)">
        {puffs.map(([x, y, rx, ry], i) => (
          <Ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} />
        ))}
      </G>
      <G fill="#FFFFFF" opacity={0.7}>
        <Ellipse cx={96} cy={18} rx={18} ry={7} />
        <Ellipse cx={64} cy={28} rx={12} ry={5} />
      </G>
    </Svg>
  );
}
