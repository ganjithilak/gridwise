import { useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';

import { W } from '../palette';

import { useAmbient, type AmbientEvent } from './ambient';

interface Props {
  /** Centre of the worm's hole, and the soil line, in the parent's coordinates. */
  x: number;
  ground: number;
  /** Only plays while the farm is on screen. */
  active: boolean;
  scale?: number;
  /** Refined theme: a muted, painted worm with small eyes and no outline. */
  refined?: boolean;
}

const BOX_W = 34;
const BOX_H = 44;

/**
 * A small earthworm that now and then pokes out of the soil near the seed, looks about,
 * wiggles and goes back down. Reusable: drop it at any soil line.
 *
 * Events: `peek` (halfway up, a quick look), `emerge` (all the way, looks both ways,
 * wiggles), `wave` (up, a happy wiggle at the learner).
 *
 * All motion is on the native driver; nothing re-renders while it plays.
 */
export function Earthworm({ x, ground, active, scale = 1, refined = false }: Props) {
  const [anim] = useState(() => ({ rise: new Animated.Value(0), sway: new Animated.Value(0), look: new Animated.Value(1) }));
  const { rise, sway, look } = anim;
  const t = (v: Animated.Value, toValue: number, duration: number, easing = Easing.inOut(Easing.quad)) =>
    Animated.timing(v, { toValue, duration, easing, useNativeDriver: true });
  const wiggle = (n: number, amp = 1) =>
    Animated.sequence(Array.from({ length: n }, (_, i) => t(sway, i % 2 === 0 ? amp : -amp, 160)).concat([t(sway, 0, 140)]));

  const events: AmbientEvent[] = [
    {
      name: 'peek',
      weight: 2,
      run: (done) => {
        const a = Animated.sequence([t(rise, 0.5, 500, Easing.out(Easing.back(1.4))), Animated.delay(500), t(look, -1, 120), Animated.delay(600), t(look, 1, 120), Animated.delay(300), t(rise, 0, 400)]);
        a.start(() => done());
        return () => a.stop();
      },
    },
    {
      name: 'emerge',
      weight: 2,
      run: (done) => {
        const a = Animated.sequence([
          t(rise, 1, 700, Easing.out(Easing.back(1.6))),
          wiggle(4, 0.6),
          Animated.delay(500),
          t(look, -1, 140),
          Animated.delay(900),
          t(look, 1, 140),
          Animated.delay(700),
          wiggle(2, 0.4),
          t(rise, 0, 600, Easing.in(Easing.quad)),
        ]);
        a.start(() => done());
        return () => a.stop();
      },
    },
    {
      name: 'wave',
      run: (done) => {
        const a = Animated.sequence([t(rise, 1, 600, Easing.out(Easing.back(2))), wiggle(8, 1), Animated.delay(400), t(rise, 0, 500)]);
        a.start(() => done());
        return () => a.stop();
      },
    },
  ];
  useAmbient('earthworm', active, events, [9000, 22000], 3500);

  const s = scale;
  return (
    <View pointerEvents="none" style={[styles.box, { left: x - (BOX_W * s) / 2, top: ground - BOX_H * s + 3, width: BOX_W * s, height: BOX_H * s + 6 }]}>
      {/* The hole, only there while the worm is out. */}
      <Animated.View style={[styles.hole, { opacity: rise.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 1] }) }]}>
        <Svg width={BOX_W * s} height={8 * s}>
          <Ellipse cx={(BOX_W * s) / 2} cy={4 * s} rx={10 * s} ry={3 * s} fill={W.soilDeepest} />
          <Ellipse cx={(BOX_W * s) / 2 - 8 * s} cy={3 * s} rx={2.4 * s} ry={1.4 * s} fill={W.soilTop} />
          <Ellipse cx={(BOX_W * s) / 2 + 9 * s} cy={3.5 * s} rx={2 * s} ry={1.2 * s} fill={W.soilTop} />
        </Svg>
      </Animated.View>
      <View style={[styles.clip, { height: BOX_H * s }]}>
        <Animated.View
          style={{
            width: BOX_W * s,
            height: BOX_H * s,
            transformOrigin: 'bottom',
            transform: [
              { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [BOX_H * s, 0] }) },
              { rotate: sway.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] }) },
              { scaleX: look },
            ],
          }}
        >
          <Svg width={BOX_W * s} height={BOX_H * s} viewBox={`0 0 ${BOX_W} ${BOX_H}`}>
            {refined ? (
              <>
                <Defs>
                  <LinearGradient id="rf-worm" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#E3A79D" />
                    <Stop offset="1" stopColor="#B9776E" />
                  </LinearGradient>
                </Defs>
                <Path d="M17,46 C17,36 15,30 16,22 C17,14 19,10 18,8" stroke="url(#rf-worm)" strokeWidth={7.5} strokeLinecap="round" fill="none" />
                <G stroke="#A56A62" strokeWidth={0.7} strokeLinecap="round" opacity={0.6}>
                  <Path d="M13.5,30 q3,1.2 6,0" />
                  <Path d="M13,35 q3,1.2 6,0" />
                  <Path d="M13.5,40 q3,1.2 6,0" />
                </G>
                <Path d="M13.6,24 q3.5,1.6 7,0 v2.4 q-3.5,1.6 -7,0 z" fill="#C98A80" />
                <Circle cx={18.6} cy={8.6} r={0.9} fill="#2B211B" />
                <Circle cx={21.2} cy={9} r={0.85} fill="#2B211B" />
                <Path d="M15.5,12 q1,-3 3,-4" stroke="#F3D0C8" strokeWidth={1} strokeLinecap="round" opacity={0.7} fill="none" />
              </>
            ) : (
              <>
                <Path d="M17,46 C17,36 15,30 16,22 C17,14 19,10 18,7" stroke={W.ink} strokeWidth={11.5} strokeLinecap="round" fill="none" />
                <Path d="M17,46 C17,36 15,30 16,22 C17,14 19,10 18,7" stroke="#F3A2A6" strokeWidth={9} strokeLinecap="round" fill="none" />
                <Path d="M20,44 C20,36 18,30 19,22 C20,15 21,12 21,9" stroke="#D97C85" strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.7} />
                <G stroke="#D97C85" strokeWidth={1.2} strokeLinecap="round">
                  <Path d="M12.5,30 q3.5,1.5 7,0" />
                  <Path d="M12,35 q3.5,1.5 7,0" />
                  <Path d="M12.5,40 q3.5,1.5 7,0" />
                </G>
                <Path d="M12.5,24 q4,2 8,0 v3 q-4,2 -8,0 z" fill="#E7848E" />
                {/* Face, looking the way it faces. */}
                <Circle cx={18.5} cy={7.5} r={2.3} fill="#FFFFFF" stroke={W.ink} strokeWidth={0.5} />
                <Circle cx={22.5} cy={8} r={2} fill="#FFFFFF" stroke={W.ink} strokeWidth={0.5} />
                <Circle cx={19.3} cy={7.7} r={1.1} fill={W.ink} />
                <Circle cx={23.1} cy={8.2} r={1} fill={W.ink} />
                <Path d="M18.5,12 q2,1.6 4,0" stroke={W.ink} strokeWidth={0.8} fill="none" strokeLinecap="round" />
                <Circle cx={16} cy={11} r={1.2} fill="#FF7A90" opacity={0.6} />
              </>
            )}
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute' },
  clip: { overflow: 'hidden' },
  hole: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
