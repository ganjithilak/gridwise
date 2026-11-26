import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { CELL_COLOURS } from '@/components/Mascot';
import { useProgress } from '@/progress/store';

import { useAmbient, type AmbientEvent } from './env/ambient';

export const CLOUD_MOODS = [
  'neutral',
  'happy',
  'excited',
  'thinking',
  'curious',
  'surprised',
  'confused',
  'encouraging',
  'celebrating',
  'sleeping',
  'yawning',
] as const;
export type CloudMood = (typeof CLOUD_MOODS)[number];

export const CLOUD_EFFECTS = ['none', 'rain', 'sunshine', 'rainbow', 'sparkles'] as const;
export type CloudEffect = (typeof CLOUD_EFFECTS)[number];

interface Props {
  mood?: CloudMood;
  effect?: CloudEffect;
  size?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Lets the cloud blink and glance about on its own. Default true. */
  alive?: boolean;
}

interface Tone {
  body: string;
  shade: string;
  light: string;
  shine: string;
  rim: string;
}

/**
 * Cell's own blue, from the original icon (`assets/icon.png`: #2F5BEA with a #1E3FB8 rim),
 * lifted a touch so it still reads as a cloud.
 */
const CELL_BLUE: Tone = { body: '#3B68F0', shade: '#2A51D6', light: '#6E92FF', shine: '#B7CBFF', rim: '#1E3FB8' };

function mix(hex: string, to: string, amount: number): string {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * amount);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

/** The learner's Cell colour, with a subtle shift for mood and weather. */
function toneFor(colour: keyof typeof CELL_COLOURS, mood: CloudMood, effect: CloudEffect): Tone {
  const own = CELL_COLOURS[colour];
  let t: Tone = own
    ? { body: mix(own.body, '#FFFFFF', 0.08), shade: own.edge, light: mix(own.body, '#FFFFFF', 0.32), shine: mix(own.body, '#FFFFFF', 0.62), rim: mix(own.edge, '#000000', 0.15) }
    : CELL_BLUE;
  const shift = (to: string, amount: number): Tone => ({
    body: mix(t.body, to, amount),
    shade: mix(t.shade, to, amount),
    light: mix(t.light, to, amount),
    shine: mix(t.shine, to, amount * 0.6),
    rim: t.rim,
  });
  if (effect === 'rain') t = shift('#7F8CA6', 0.32); // a little grey while it rains
  else if (mood === 'sleeping' || mood === 'yawning') t = shift('#24306B', 0.18); // dusky
  else if (mood === 'celebrating' || mood === 'excited' || effect === 'sunshine') t = shift('#FFFFFF', 0.1); // brighter
  return t;
}

/** The puffs the cloud is made of, in a 120 x 90 box. */
const PUFFS: [number, number, number][] = [
  [26, 58, 18],
  [44, 40, 22],
  [66, 30, 24],
  [88, 40, 20],
  [101, 58, 16],
  [62, 62, 26],
  [36, 68, 15],
  [86, 68, 15],
];

/**
 * Cell, as a cloud (Creative Direction V2, section 6, refined against the original mascot):
 * Cell's blue and deep rim, its arch-ring eyes and half-moon grin, and its little
 * selection handle on the corner, on a fluffier, rounder, shaded body.
 *
 * Reusable: `mood` picks the face, `effect` adds weather or celebration, and the cloud
 * floats, bounces on every change of mood, blinks and looks about by itself.
 *
 * TEMPORARY ARTWORK, built to be swapped for an animated asset with the same moods.
 */
export function CloudMascot({ mood = 'neutral', effect = 'none', size = 120, onPress, accessibilityLabel, alive = true }: Props) {
  const colour = useProgress((s) => s.profile.colour);
  const tone = toneFor(colour, mood, effect);
  const [anim] = useState(() => ({ float: new Animated.Value(0), squash: new Animated.Value(1), first: { done: false } }));
  const [blink, setBlink] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });

  // Gentle floating.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim.float, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim.float, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  // A squash-and-stretch bounce whenever the mood changes; excitement bounces more.
  useEffect(() => {
    const big = mood === 'excited' || mood === 'celebrating' || mood === 'surprised';
    anim.squash.setValue(big ? 0.82 : 0.9);
    const a = Animated.spring(anim.squash, { toValue: 1, friction: big ? 3 : 4, tension: 140, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [mood, anim]);

  // Blinking and glancing about, for the faces with open eyes.
  const openEyes = mood === 'neutral' || mood === 'thinking' || mood === 'curious' || mood === 'surprised' || mood === 'confused';
  useEffect(() => {
    if (!alive || !openEyes) return;
    let shut: ReturnType<typeof setTimeout> | undefined;
    const blinker = setInterval(() => {
      setBlink(true);
      shut = setTimeout(() => setBlink(false), 130);
    }, 3600 + Math.random() * 1800);
    const glancer = setInterval(() => {
      const r = Math.random();
      setLook(r < 0.4 ? { x: 0, y: 0 } : { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.6) * 3 });
    }, 2400);
    return () => {
      clearInterval(blinker);
      clearInterval(glancer);
      if (shut) clearTimeout(shut);
    };
  }, [alive, openEyes]);
  const lk = mood === 'thinking' ? { x: 3, y: -3 } : mood === 'neutral' || mood === 'curious' ? look : { x: 0, y: 0 };

  const h = (size * 90) / 120;
  const translateY = anim.float.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.045] });
  const face = '#FFFFFF';

  const archEyes = (wink = false) => (
    <G stroke={face} strokeWidth={4.4} strokeLinecap="butt" fill="none">
      <Path d="M43,53 A6.5,6.5 0 0 1 56,53" />
      {wink ? <Path d="M66,52 q6.5,3 13,0" strokeLinecap="round" strokeWidth={3.6} /> : <Path d="M66,53 A6.5,6.5 0 0 1 79,53" />}
    </G>
  );
  const ovalEyes = (rx = 4, ry = 5.4, left = 1, right = 1) => (
    <G fill={face}>
      <Ellipse cx={49.5 + lk.x} cy={49 + lk.y} rx={rx * left} ry={blink ? 0.8 : ry * left} />
      <Ellipse cx={72.5 + lk.x} cy={49 + lk.y} rx={rx * right} ry={blink ? 0.8 : ry * right} />
    </G>
  );
  const closedEyes = (squeeze = false) => (
    <G stroke={face} strokeWidth={3.2} strokeLinecap="round" fill="none">
      <Path d={squeeze ? 'M43,49 l6,3 l-6,3' : 'M43,50 q6,5 12,0'} />
      <Path d={squeeze ? 'M79,49 l-6,3 l6,3' : 'M67,50 q6,5 12,0'} />
    </G>
  );

  let eyes: ReactNode;
  let mouth: ReactNode;
  let extra: ReactNode = null;
  switch (mood) {
    case 'happy':
      eyes = archEyes();
      mouth = <Path d="M51,60 h20 a10,10 0 0 1 -20,0 z" fill={face} />;
      break;
    case 'excited':
    case 'celebrating':
      eyes = archEyes();
      mouth = (
        <G>
          <Path d="M48,59 h26 a13,13 0 0 1 -26,0 z" fill={face} />
          <Path d="M54,66 q7,5 14,0 q-7,-3 -14,0 z" fill="#FF8FA8" />
        </G>
      );
      break;
    case 'encouraging':
      eyes = archEyes(true);
      mouth = <Path d="M51,60 h20 a10,10 0 0 1 -20,0 z" fill={face} />;
      break;
    case 'thinking':
      eyes = ovalEyes(3.8, 5);
      mouth = <Path d="M58,64 q5,-2 10,1" stroke={face} strokeWidth={3} strokeLinecap="round" fill="none" />;
      extra = <Path d="M66,39 q6,-4 13,-1" stroke={face} strokeWidth={2.6} strokeLinecap="round" fill="none" />;
      break;
    case 'curious':
      eyes = ovalEyes(4, 5.4, 0.85, 1.2);
      mouth = <Ellipse cx={62} cy={64} rx={3.2} ry={3.6} fill={face} />;
      break;
    case 'surprised':
      eyes = ovalEyes(5, 6.6);
      mouth = <Ellipse cx={61} cy={66} rx={5.5} ry={7} fill={face} />;
      extra = (
        <G stroke={face} strokeWidth={2.6} strokeLinecap="round">
          <Path d="M44,38 q5,-4 10,-1" fill="none" />
          <Path d="M68,37 q5,-3 10,1" fill="none" />
        </G>
      );
      break;
    case 'confused':
      eyes = (
        <G>
          <Ellipse cx={49.5} cy={49} rx={4} ry={blink ? 0.8 : 5.2} fill={face} />
          <Path d="M67,50 h11" stroke={face} strokeWidth={3.4} strokeLinecap="round" />
        </G>
      );
      mouth = <Path d="M52,64 q3,-3 6,0 t6,0 t6,0" stroke={face} strokeWidth={2.8} strokeLinecap="round" fill="none" />;
      extra = (
        <SvgText x={96} y={26} fontSize={20} fontWeight="900" fill={face} stroke={tone.rim} strokeWidth={1}>
          ?
        </SvgText>
      );
      break;
    case 'sleeping':
      eyes = closedEyes();
      mouth = <Ellipse cx={61} cy={63} rx={2.6} ry={2} fill={face} />;
      break;
    case 'yawning':
      eyes = closedEyes(true);
      mouth = <Ellipse cx={61} cy={64} rx={6.5} ry={8.5} fill={face} />;
      break;
    default:
      eyes = ovalEyes();
      mouth = <Path d="M53,61 q8,7 16,0" stroke={face} strokeWidth={3.4} strokeLinecap="round" fill="none" />;
  }
  const rosy = mood === 'happy' || mood === 'excited' || mood === 'celebrating' || mood === 'encouraging' || mood === 'sleeping';

  const body = (
    <View style={{ width: size, height: h }}>
      <CloudEffects effect={effect} size={size} height={h} />
      <Animated.View style={{ width: size, height: h, transform: [{ translateY }, { scaleY: anim.squash }, { scaleX: Animated.divide(1, anim.squash) }], transformOrigin: 'bottom' }}>
        <Svg width={size} height={h} viewBox="0 0 120 90">
          <Defs>
            <RadialGradient id="cellGlow" cx="40%" cy="30%" r="70%">
              <Stop offset="0" stopColor={tone.light} stopOpacity={1} />
              <Stop offset="1" stopColor={tone.body} stopOpacity={1} />
            </RadialGradient>
          </Defs>
          {/* Rim: Cell's deep outline. */}
          <G fill={tone.rim}>
            {PUFFS.map(([x, y, r], i) => (
              <Circle key={`o${i}`} cx={x} cy={y} r={r + 2.6} />
            ))}
          </G>
          {/* Underside in shadow. */}
          <G fill={tone.shade}>
            {PUFFS.map(([x, y, r], i) => (
              <Circle key={`s${i}`} cx={x} cy={y} r={r} />
            ))}
          </G>
          {/* Body, lit from above-left. */}
          <G fill="url(#cellGlow)">
            {PUFFS.map(([x, y, r], i) => (
              <Circle key={`b${i}`} cx={x - 1} cy={y - 4} r={r - 2} />
            ))}
          </G>
          {/* Highlights on the top of the puffs: the fluff. */}
          <G fill={tone.shine}>
            <Ellipse cx={58} cy={17} rx={11} ry={5.5} opacity={0.85} />
            <Ellipse cx={38} cy={28} rx={7} ry={4} opacity={0.75} />
            <Ellipse cx={86} cy={27} rx={6} ry={3.4} opacity={0.7} />
            <Ellipse cx={20} cy={48} rx={4} ry={2.6} opacity={0.6} />
          </G>
          <Circle cx={53} cy={15} r={2.4} fill="#FFFFFF" opacity={0.9} />
          {rosy ? (
            <G fill="#FF9DB8" opacity={0.6}>
              <Ellipse cx={39} cy={60} rx={5} ry={3} />
              <Ellipse cx={84} cy={60} rx={5} ry={3} />
            </G>
          ) : null}
          {eyes}
          {mouth}
          {extra}
          {/* Cell's selection handle. */}
          <Rect x={96} y={70} width={15} height={15} rx={3.2} fill={mood === 'celebrating' ? '#FFC93C' : tone.rim} stroke="#FFFFFF" strokeWidth={3} />
        </Svg>
        {mood === 'sleeping' ? <Zzz size={size} /> : null}
      </Animated.View>
    </View>
  );

  const content = body;
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? 'Cell, your learning guide'} hitSlop={8}>
      {content}
    </Pressable>
  );
}

/** Floating "z"s while asleep. */
function Zzz({ size }: { size: number }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.Text
      style={[
        styles.zzz,
        {
          fontSize: size * 0.13,
          left: size * 0.8,
          top: -size * 0.02,
          opacity: t.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.18] }) }, { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.06] }) }],
        },
      ]}
    >
      z
    </Animated.Text>
  );
}

/**
 * Weather and celebration around the cloud: rain falling from it, sunshine behind it, a
 * rainbow arcing under it, sparkles round it. Each loops on the native driver and only
 * exists while it is showing.
 */
export function CloudEffects({ effect, size, height }: { effect: CloudEffect; size: number; height: number }) {
  const [t] = useState(() => new Animated.Value(0));
  const [show] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (effect === 'none') return;
    show.setValue(0);
    const fade = Animated.timing(show, { toValue: 1, duration: 500, useNativeDriver: true });
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: effect === 'sunshine' ? 9000 : effect === 'rain' ? 700 : 1600, easing: Easing.linear, useNativeDriver: true }));
    fade.start();
    loop.start();
    return () => {
      fade.stop();
      loop.stop();
      t.setValue(0);
    };
  }, [effect, t, show]);
  if (effect === 'none') return null;

  if (effect === 'rain') {
    const drops = [0.22, 0.36, 0.5, 0.64, 0.78, 0.3, 0.58, 0.72];
    return (
      <Animated.View pointerEvents="none" style={[styles.abs, { left: 0, top: height * 0.78, width: size, height: size * 0.6, opacity: show }]}>
        {drops.map((x, i) => (
          <Animated.View
            key={i}
            style={[
              styles.drop,
              {
                left: x * size,
                width: size * 0.025,
                height: size * 0.07,
                opacity: t.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.9, 0.9, 0] }),
                transform: [{ translateY: Animated.modulo(Animated.add(t, i * 0.37), 1).interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.45] }) }],
              },
            ]}
          />
        ))}
      </Animated.View>
    );
  }

  if (effect === 'sunshine') {
    const r = size * 0.32;
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.abs,
          {
            left: size * 0.62,
            top: -r * 0.9,
            width: r * 2,
            height: r * 2,
            opacity: show,
            transform: [{ rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
          },
        ]}
      >
        <Svg width={r * 2} height={r * 2} viewBox="0 0 100 100">
          <G stroke="#FFD24A" strokeWidth={6} strokeLinecap="round">
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2;
              return <Path key={i} d={`M${50 + Math.cos(a) * 30},${50 + Math.sin(a) * 30} L${50 + Math.cos(a) * 45},${50 + Math.sin(a) * 45}`} />;
            })}
          </G>
          <Circle cx={50} cy={50} r={24} fill="#FFE27A" stroke="#F2A900" strokeWidth={3} />
          <Circle cx={43} cy={43} r={7} fill="#FFF6C8" />
        </Svg>
      </Animated.View>
    );
  }

  if (effect === 'rainbow') {
    const w = size * 1.5;
    const colours = ['#FF5A5A', '#FFA23A', '#FFE04A', '#5FD068', '#4AA8FF', '#7A6BFF'];
    return (
      <Animated.View pointerEvents="none" style={[styles.abs, { left: -size * 0.25, top: height * 0.35, width: w, height: w * 0.5, opacity: show }]}>
        <Svg width={w} height={w * 0.5} viewBox="0 0 150 75">
          {colours.map((c, i) => (
            <Path key={c} d={`M${12 + i * 4},75 A${63 - i * 4},${63 - i * 4} 0 0 1 ${138 - i * 4},75`} stroke={c} strokeWidth={4} fill="none" opacity={0.85} />
          ))}
        </Svg>
      </Animated.View>
    );
  }

  // Sparkles: four stars twinkling in turn.
  const stars = [
    [-0.06, 0.1],
    [0.95, 0.05],
    [1.02, 0.6],
    [-0.04, 0.7],
  ];
  return (
    <Animated.View pointerEvents="none" style={[styles.abs, { left: 0, top: 0, width: size, height, opacity: show }]}>
      {stars.map(([x, y], i) => (
        <Animated.View
          key={i}
          style={[
            styles.abs,
            {
              left: x * size,
              top: y * height,
              transform: [{ scale: Animated.modulo(Animated.add(t, i * 0.25), 1).interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.1, 0.3] }) }],
            },
          ]}
        >
          <Svg width={size * 0.14} height={size * 0.14} viewBox="0 0 20 20">
            <Path d="M10,0 L12.5,7.5 L20,10 L12.5,12.5 L10,20 L7.5,12.5 L0,10 L7.5,7.5 Z" fill="#FFE27A" stroke="#F2A900" strokeWidth={1} />
          </Svg>
        </Animated.View>
      ))}
    </Animated.View>
  );
}

interface WanderProps {
  /** Where it may roam, in the parent's coordinates (its top-left corner stays inside). */
  area: { x0: number; x1: number; y0: number; y1: number };
  size: number;
  active: boolean;
  onPress?: () => void;
}

/**
 * Cell living in the farm's sky: it drifts to a new spot every so often, and now and then
 * something happens (a glance round, a yawn, a short shower that ends in a rainbow, a burst
 * of sunshine). Uses the world's ambient event clock, so it rests while off screen.
 */
export function WanderingCloud({ area, size, active, onPress }: WanderProps) {
  const [pos] = useState(() => new Animated.ValueXY({ x: area.x0 + (area.x1 - area.x0) * 0.75, y: area.y0 + (area.y1 - area.y0) * 0.3 }));
  const [mood, setMood] = useState<CloudMood>('neutral');
  const [effect, setEffect] = useState<CloudEffect>('none');

  // Drifting about.
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    let anim: Animated.CompositeAnimation | undefined;
    const next = () => {
      timer = setTimeout(
        () => {
          const to = { x: area.x0 + Math.random() * (area.x1 - area.x0), y: area.y0 + Math.random() * (area.y1 - area.y0) };
          anim = Animated.timing(pos, { toValue: to, duration: 4500 + Math.random() * 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
          anim.start(() => next());
        },
        6000 + Math.random() * 7000,
      );
    };
    next();
    return () => {
      clearTimeout(timer);
      anim?.stop();
    };
  }, [active, area.x0, area.x1, area.y0, area.y1, pos]);

  const moment = (m: CloudMood, e: CloudEffect, ms: number): AmbientEvent['run'] => (done) => {
    setMood(m);
    setEffect(e);
    const t = setTimeout(() => {
      setMood('neutral');
      setEffect('none');
      done();
    }, ms);
    return () => {
      clearTimeout(t);
      setMood('neutral');
      setEffect('none');
    };
  };
  const events: AmbientEvent[] = [
    { name: 'curious', weight: 3, run: moment('curious', 'none', 3000) },
    { name: 'happy', weight: 3, run: moment('happy', 'none', 2600) },
    { name: 'thinking', weight: 2, run: moment('thinking', 'none', 3200) },
    { name: 'yawn', weight: 1, run: moment('yawning', 'none', 1800) },
    { name: 'sunshine', weight: 1, run: moment('happy', 'sunshine', 4500) },
    {
      name: 'shower',
      weight: 1,
      run: (done) => {
        // A short shower, then a rainbow.
        setMood('neutral');
        setEffect('rain');
        const a = setTimeout(() => {
          setMood('excited');
          setEffect('rainbow');
        }, 3500);
        const b = setTimeout(() => {
          setMood('neutral');
          setEffect('none');
          done();
        }, 7500);
        return () => {
          clearTimeout(a);
          clearTimeout(b);
          setMood('neutral');
          setEffect('none');
        };
      },
    },
  ];
  useAmbient('cloud', active, events, [7000, 16000], 5000);

  return (
    <Animated.View style={[styles.abs, { left: 0, top: 0, transform: [{ translateX: pos.x }, { translateY: pos.y }] }]}>
      <CloudMascot mood={mood} effect={effect} size={size} onPress={onPress} accessibilityLabel="Cell. Tap to go up to the sky for help" alive={active} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  drop: { position: 'absolute', top: 0, borderRadius: 4, backgroundColor: '#8EC9FF' },
  zzz: { position: 'absolute', color: '#FFFFFF', fontWeight: '900' },
});
