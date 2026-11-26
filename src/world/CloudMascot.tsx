import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { CELL_COLOURS } from '@/components/Mascot';
import { useProgress } from '@/progress/store';

import { W } from './palette';

export type CloudMood = 'neutral' | 'happy' | 'thinking' | 'cheering' | 'sleepy';

interface Props {
  mood?: CloudMood;
  size?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** The blue the cloud wears when the learner has kept Cell's own colour. */
const SKY_BLUE = { body: '#7FA8FF', edge: '#4C74DB', shade: '#6690F0', light: '#B6CCFF' };

function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** The puffs the cloud is made of, in a 120 x 84 box. */
const PUFFS: [number, number, number][] = [
  [30, 52, 20],
  [52, 36, 25],
  [78, 38, 22],
  [96, 54, 17],
  [62, 58, 24],
  [38, 62, 15],
  [84, 64, 15],
];

/**
 * Cell, grown into a cloud (Creative Direction V2, section 6). Same face, same little
 * selection handle on the corner, same colour the learner chose for Cell. It floats and
 * blinks; nothing else moves it.
 *
 * TEMPORARY ARTWORK: drawn in code to settle size, place and personality.
 */
export function CloudMascot({ mood = 'neutral', size = 120, onPress, accessibilityLabel }: Props) {
  const chosen = useProgress((s) => s.profile.colour);
  const own = CELL_COLOURS[chosen];
  const tone = own ? { body: lighten(own.body, 0.35), edge: own.edge, shade: lighten(own.body, 0.15), light: lighten(own.body, 0.6) } : SKY_BLUE;

  const [float] = useState(() => new Animated.Value(0));
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  useEffect(() => {
    if (mood === 'sleepy') return;
    let shut: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      setBlink(true);
      shut = setTimeout(() => setBlink(false), 140);
    }, 4200);
    return () => {
      clearInterval(timer);
      if (shut) clearTimeout(shut);
    };
  }, [mood]);

  const h = (size * 84) / 120;
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.05] });
  const face = '#FFFFFF';

  const eyes = () => {
    if (mood === 'sleepy' || blink) {
      return (
        <G stroke={face} strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M45,47 q5,4 10,0" />
          <Path d="M67,47 q5,4 10,0" />
        </G>
      );
    }
    if (mood === 'happy' || mood === 'cheering') {
      return (
        <G stroke={face} strokeWidth={3.2} strokeLinecap="round" fill="none">
          <Path d="M45,49 q5,-7 10,0" />
          <Path d="M67,49 q5,-7 10,0" />
        </G>
      );
    }
    const dx = mood === 'thinking' ? 2 : 0;
    const dy = mood === 'thinking' ? -2 : 0;
    return (
      <G fill={face}>
        <Ellipse cx={50 + dx} cy={46 + dy} rx={3.6} ry={4.6} />
        <Ellipse cx={72 + dx} cy={46 + dy} rx={3.6} ry={4.6} />
      </G>
    );
  };

  const mouth = () => {
    switch (mood) {
      case 'cheering':
        return <Path d="M53,55 h16 q0,11 -8,11 q-8,0 -8,-11 z" fill={face} />;
      case 'happy':
        return <Path d="M54,56 q7,8 14,0" stroke={face} strokeWidth={3} strokeLinecap="round" fill="none" />;
      case 'thinking':
        return <Path d="M59,59 h9" stroke={face} strokeWidth={3} strokeLinecap="round" />;
      case 'sleepy':
        return <Ellipse cx={61} cy={59} rx={3} ry={2.4} fill={face} />;
      default:
        return <Path d="M55,56 q6,5 12,0" stroke={face} strokeWidth={3} strokeLinecap="round" fill="none" />;
    }
  };

  const body = (
    <Animated.View style={{ width: size, height: h, transform: [{ translateY }] }}>
      <Svg width={size} height={h} viewBox="0 0 120 84">
        {/* Ink line: every puff a little larger, in the edge colour, underneath. */}
        <G fill={tone.edge}>
          {PUFFS.map(([x, y, r], i) => (
            <Circle key={`o${i}`} cx={x} cy={y} r={r + 2.4} />
          ))}
        </G>
        {/* Cel shadow along the underside. */}
        <G fill={tone.shade}>
          {PUFFS.map(([x, y, r], i) => (
            <Circle key={`s${i}`} cx={x} cy={y} r={r} />
          ))}
        </G>
        <G fill={tone.body}>
          {PUFFS.map(([x, y, r], i) => (
            <Circle key={`b${i}`} cx={x - 1} cy={y - 3.5} r={r - 1.5} />
          ))}
        </G>
        {/* Light catching the top of the puffs. */}
        <G fill={tone.light} opacity={0.9}>
          <Circle cx={46} cy={28} r={9} />
          <Circle cx={74} cy={26} r={6} />
          <Circle cx={26} cy={45} r={5} />
        </G>
        {/* Rosy cheeks for the happy moods. */}
        {mood === 'happy' || mood === 'cheering' ? (
          <G fill="#FF9DB8" opacity={0.55}>
            <Ellipse cx={42} cy={56} rx={4.5} ry={2.8} />
            <Ellipse cx={80} cy={56} rx={4.5} ry={2.8} />
          </G>
        ) : null}
        {eyes()}
        {mouth()}
        {/* Cell's selection handle, kept so the cloud is still recognisably Cell. */}
        <Rect x={98} y={66} width={13} height={13} rx={3} fill={mood === 'cheering' ? W.fruit : tone.edge} stroke="#FFFFFF" strokeWidth={2.4} />
        {mood === 'sleepy' ? (
          <G fill="#FFFFFF" opacity={0.95}>
            <Path d="M100,14 h8 l-8,9 h8" stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinejoin="round" />
          </G>
        ) : null}
      </Svg>
    </Animated.View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? 'Cell, your learning guide'} hitSlop={8}>
      {body}
    </Pressable>
  );
}
