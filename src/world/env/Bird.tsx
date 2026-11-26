import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { W } from '../palette';

export type BirdMode = 'hidden' | 'flying' | 'perched';

/** One bird's moving parts. A scene owns these and animates them; `Bird` only draws. */
export interface BirdRig {
  /** Centre of the bird, in the scene's coordinates. */
  pos: Animated.ValueXY;
  /** 1 faces right, −1 faces left. */
  face: Animated.Value;
  show: Animated.Value;
  /** A little hop while perched. */
  hop: Animated.Value;
}

export const makeBirdRig = (): BirdRig => ({
  pos: new Animated.ValueXY({ x: -60, y: -60 }),
  face: new Animated.Value(1),
  show: new Animated.Value(0),
  hop: new Animated.Value(0),
});

const BODY = '#3D4C6B';
const BODY_SHADE = '#2B3752';
const BELLY = '#F4F1E6';
const BEAK = '#F5A524';

/**
 * A small original songbird (slate blue, cream belly, orange beak). Flying, it flaps (two
 * wing drawings crossfaded on the native driver); perched, its wings fold. Facing right;
 * the rig's `face` flips it.
 */
export function Bird({ rig, mode, size = 20 }: { rig: BirdRig; mode: BirdMode; size?: number }) {
  const [flap] = useState(() => new Animated.Value(0));
  const flying = mode === 'flying';
  useEffect(() => {
    if (!flying) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flap, { toValue: 1, duration: 110, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(flap, { toValue: 0, duration: 130, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flying, flap]);

  if (mode === 'hidden') return null;
  const box = size * 1.6;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bird,
        {
          left: -box / 2,
          top: -box / 2,
          width: box,
          height: box,
          opacity: rig.show,
          transform: [
            { translateX: rig.pos.x },
            { translateY: Animated.add(rig.pos.y, rig.hop) },
            { scaleX: rig.face },
          ],
        },
      ]}
    >
      <Svg width={box} height={box} viewBox="0 0 32 32" style={StyleSheet.absoluteFill}>
        {/* Tail, body, belly, head, beak, eye. */}
        <Path d="M7,17 L1,14 L3,19 L1,22 L8,20 Z" fill={BODY_SHADE} stroke={W.ink} strokeWidth={0.8} strokeLinejoin="round" />
        <Ellipse cx={14} cy={18} rx={8.5} ry={6.5} fill={BODY} stroke={W.ink} strokeWidth={0.9} />
        <Ellipse cx={16} cy={20.5} rx={5.5} ry={3.6} fill={BELLY} />
        <Circle cx={21} cy={13} r={5} fill={BODY} stroke={W.ink} strokeWidth={0.9} />
        <Path d="M25.5,12 L30,13.5 L25.5,15 Z" fill={BEAK} stroke={W.ink} strokeWidth={0.7} strokeLinejoin="round" />
        <Circle cx={22.2} cy={12} r={1.6} fill="#FFFFFF" />
        <Circle cx={22.7} cy={12.1} r={0.9} fill={W.ink} />
        {mode === 'perched' ? (
          <G>
            <Path d="M9,16 Q14,12 19,17 Q14,21 9,16 Z" fill={BODY_SHADE} stroke={W.ink} strokeWidth={0.7} />
            <Path d="M13,24 v4 m3,-4 v4" stroke={BEAK} strokeWidth={1.2} strokeLinecap="round" />
          </G>
        ) : null}
      </Svg>
      {flying ? (
        <>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: flap }]}>
            <Svg width={box} height={box} viewBox="0 0 32 32">
              <Path d="M11,15 Q9,4 17,2 Q16,10 18,15 Z" fill={BODY_SHADE} stroke={W.ink} strokeWidth={0.8} strokeLinejoin="round" />
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: flap.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
            <Svg width={box} height={box} viewBox="0 0 32 32">
              <Path d="M11,18 Q8,28 16,30 Q16,23 18,18 Z" fill={BODY_SHADE} stroke={W.ink} strokeWidth={0.8} strokeLinejoin="round" />
            </Svg>
          </Animated.View>
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bird: { position: 'absolute' },
});
