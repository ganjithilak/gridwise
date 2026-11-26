import { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { R } from './paint';

/**
 * The Refined scarecrow, in the same 100 x 130 box as the Classic one (so the birds' perches
 * and the hat still line up): a tall, slim frame, a small burlap head tied at the neck with a
 * quiet stitched face, a patched work coat over a muted plaid shirt, straw at the cuffs.
 * Charming rather than comic; painted, not outlined.
 */
export function RefinedScarecrowBody() {
  return (
    <G>
      <Defs>
        <LinearGradient id="rf-coat" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#8C6A4A" />
          <Stop offset="1" stopColor="#5E4630" />
        </LinearGradient>
        <LinearGradient id="rf-sleeve" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={R.plaid} />
          <Stop offset="1" stopColor={R.plaidDark} />
        </LinearGradient>
        <RadialGradient id="rf-sack" cx="38%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#E3CDA0" />
          <Stop offset="1" stopColor={R.burlapDark} />
        </RadialGradient>
        <LinearGradient id="rf-trousers" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={R.denim} />
          <Stop offset="1" stopColor={R.denimDark} />
        </LinearGradient>
      </Defs>
      {/* Pole and crossbar. */}
      <Rect x={48} y={38} width={4.5} height={92} fill="url(#rf-wood)" />
      <Rect x={12} y={45} width={76} height={3.6} fill="url(#rf-wood-v)" />
      {/* Sleeves hang a little from the bar, with straw at the cuffs. */}
      <Path d="M30,44 C22,44 16,45 11,47 L11,56 C17,55 23,55 31,56 Z" fill="url(#rf-sleeve)" />
      <Path d="M70,44 C78,44 84,45 89,47 L89,56 C83,55 77,55 69,56 Z" fill="url(#rf-sleeve)" />
      <Path d="M14,47 v8 M20,46 v9 M80,46 v9 M86,47 v8" stroke={R.plaidDark} strokeWidth={0.8} opacity={0.6} />
      <Path d="M11,50.5 H31 M69,50.5 H89" stroke="#C9A35E" strokeWidth={0.5} opacity={0.6} />
      {[
        [11, -1],
        [89, 1],
      ].map(([x, d]) => (
        <G key={x} stroke={R.straw} strokeWidth={0.9} strokeLinecap="round">
          <Path d={`M${x},48 l${d * 5},-2`} />
          <Path d={`M${x},50.5 l${d * 6},0.5`} />
          <Path d={`M${x},53 l${d * 5},2.5`} />
          <Path d={`M${x},55 l${d * 3},4`} stroke={R.strawDark} />
        </G>
      ))}
      {/* Coat. */}
      <Path d="M36,43 C42,41 58,41 64,43 L67,92 C60,95 40,95 33,92 Z" fill="url(#rf-coat)" />
      <Path d="M50,44 L48,92" stroke="#4A3726" strokeWidth={0.8} opacity={0.7} />
      <Path d="M38,43 L46,58 L50,44 L54,58 L62,43" fill={R.plaid} opacity={0.9} />
      <Rect x={53} y={70} width={8} height={9} rx={1} fill="#7C8A5C" opacity={0.9} />
      <Path d="M53.5,70.5 h7 M53.5,78.5 h7" stroke="#E9DDBF" strokeWidth={0.5} strokeDasharray="1 1" />
      <Circle cx={47} cy={64} r={1} fill="#3E2C1C" />
      <Circle cx={47} cy={74} r={1} fill="#3E2C1C" />
      <Path d="M36,43 C42,41 50,41 50,41 L48,92 C42,94 37,93 33,92 Z" fill="#FFFFFF" opacity={0.06} />
      {/* Trousers, tied off with straw. */}
      <Path d="M38,92 L37,112 L48,112 L50,98 L52,112 L63,112 L62,92 Z" fill="url(#rf-trousers)" />
      <G stroke={R.straw} strokeWidth={0.9} strokeLinecap="round">
        <Path d="M39,112 l-1.5,5 M42,112 l0,5.5 M45,112 l1.5,5 M55,112 l-1.5,5 M58,112 l0,5.5 M61,112 l1.5,5" />
      </G>
      {/* Burlap head, tied at the neck: small, with a quiet stitched face. */}
      <Path d="M44,40 Q50,44 56,40 L55,44 Q50,46 45,44 Z" fill="#9C7E52" />
      <Ellipse cx={50} cy={29} rx={11} ry={12} fill="url(#rf-sack)" />
      <Path d="M41,24 q9,-3 18,0 M40,30 q10,-2 20,0 M41,36 q9,-2 18,0" stroke={R.burlapDark} strokeWidth={0.4} opacity={0.6} fill="none" />
      <Path d="M45.5,27 l2.2,2.2 M47.7,27 l-2.2,2.2 M52.3,27 l2.2,2.2 M54.5,27 l-2.2,2.2" stroke="#4A3726" strokeWidth={0.9} strokeLinecap="round" />
      <Path d="M45.5,34 Q50,36.5 54.5,34" stroke="#4A3726" strokeWidth={0.8} fill="none" strokeLinecap="round" />
      <Path d="M47,34.6 v1.4 M50,35.4 v1.4 M53,34.6 v1.4" stroke="#4A3726" strokeWidth={0.5} />
      {/* Straw at the temples, under the hat. */}
      <G stroke={R.straw} strokeWidth={0.9} strokeLinecap="round">
        <Path d="M39.5,22 l-3,2.5 M40.5,20.5 l-4,0 M60.5,22 l3,2.5 M59.5,20.5 l4,0" />
      </G>
    </G>
  );
}

/** A wide-brimmed, weathered straw hat, drawn in the Classic hat's 46 x 26 box. */
export function RefinedHat() {
  return (
    <G>
      <Defs>
        <LinearGradient id="rf-straw" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E2C77E" />
          <Stop offset="1" stopColor="#B4924C" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={23} cy={21} rx={22.5} ry={4.2} fill="url(#rf-straw)" />
      <Ellipse cx={23} cy={21.8} rx={22.5} ry={3} fill="#000000" opacity={0.12} />
      <Path d="M13,21 Q12.5,8 23,7 Q33.5,8 33,21 Z" fill="url(#rf-straw)" />
      <Path d="M28,8 Q33.5,9 33,21 L28,21 Q29.5,13 28,8 Z" fill="#000000" opacity={0.12} />
      <Rect x={13} y={16} width={20} height={3} fill="#6E4B3A" />
      <Path d="M15,12 q2,-2 5,-2" stroke="#F3E2AE" strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.8} />
      <Path d="M4,22 l-2,2 M42,22 l2,2" stroke={R.strawDark} strokeWidth={0.7} />
    </G>
  );
}
