import { useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { W } from '../palette';

import { between, play, useAmbient, type AmbientEvent } from './ambient';
import { Bird, makeBirdRig, type BirdMode, type BirdRig } from './Bird';

interface Props {
  width: number;
  /** The farm's above-ground height. */
  ground: number;
  /** Where the scarecrow's pole meets the field (behind the fence). */
  at: { x: number; base: number };
  active: boolean;
  /** Drawn between the scarecrow and the birds: the fence and field go here. */
  children?: ReactNode;
}

const BIRDS = 6;
/** The scarecrow is drawn in a 100 x 130 box, pole foot at (50, 130). */
const VB_W = 100;
const VB_H = 130;

type Pt = { x: number; y: number };

/**
 * The scarecrow behind the fence and the birds that visit it (Creative Direction V2
 * refinements). It is one component because the birds land on the scarecrow, steal its hat
 * and so on; the fence and field are passed in as `children` so they sit between them.
 *
 * Events (intermittent, one at a time, only while the farm is on screen):
 *   flyby, flock, perch, circle, gather (then scatter), hatSteal, hatBlow, dropping.
 *
 * Each event is an async script over plain Animated values on the native driver, so adding
 * one is a matter of writing another script. TEMPORARY ARTWORK.
 */
export function ScarecrowScene({ width, ground, at, active, children }: Props) {
  const S = Math.min(ground * 0.22, 140); // the scarecrow's height
  const k = S / VB_H;
  const left = at.x - (VB_W / 2) * k;
  const top = at.base - S;
  const P = (x: number, y: number): Pt => ({ x: left + x * k, y: top + y * k });
  const spots = { leftArm: P(13, 46), rightArm: P(87, 46), leftArmIn: P(28, 44), hat: P(52, 4), head: P(50, 30) };
  const birdSize = Math.max(16, S * 0.15);

  const [rig] = useState(() => ({
    birds: Array.from({ length: BIRDS }, makeBirdRig),
    where: Array.from({ length: BIRDS }, () => ({ x: -60, y: -60 })),
    wobble: new Animated.Value(0),
    alarm: new Animated.Value(0),
    hat: new Animated.ValueXY({ x: 0, y: 0 }),
    hatSpin: new Animated.Value(0),
    splat: new Animated.Value(0),
    drop: new Animated.ValueXY({ x: -20, y: -20 }),
    dropShow: new Animated.Value(0),
  }));
  const [modes, setModes] = useState<BirdMode[]>(() => Array(BIRDS).fill('hidden'));

  const events = scarecrowEvents({ rig, setModes, width, ground, S, spots, birdSize });
  useAmbient('scarecrow', active && width > 0, events, [6000, 15000], 2500);

  const rotate = rig.wobble.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] });
  const hatW = 46 * k;
  const hatH = 26 * k;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill]}>
      {/* The scarecrow, rocking on its pole. */}
      <Animated.View style={[styles.abs, { left, top, width: VB_W * k, height: S, transformOrigin: 'bottom', transform: [{ rotate }] }]}>
        <Svg width={VB_W * k} height={S} viewBox={`0 0 ${VB_W} ${VB_H}`}>
          <ScarecrowBody />
        </Svg>
        {/* The hat: its own piece, so birds can take it. */}
        <Animated.View
          style={[
            styles.abs,
            {
              left: (50 - 23) * k,
              top: -6 * k,
              width: hatW,
              height: hatH,
              transform: [
                { translateX: rig.hat.x },
                { translateY: rig.hat.y },
                { rotate: rig.hatSpin.interpolate({ inputRange: [-1, 1], outputRange: ['-360deg', '360deg'] }) },
              ],
            },
          ]}
        >
          <Svg width={hatW} height={hatH} viewBox="0 0 46 26">
            <Ellipse cx={23} cy={20} rx={22} ry={4.6} fill="#E3AE36" stroke={W.ink} strokeWidth={1.2} />
            <Path d="M10,20 Q10,4 23,4 Q36,4 36,20 Z" fill="#F0C14B" stroke={W.ink} strokeWidth={1.2} strokeLinejoin="round" />
            <Path d="M27,5 Q36,6 36,20 L29,20 Q31,10 27,5 Z" fill="#D49B24" />
            <Rect x={10.5} y={14} width={25} height={4} fill="#C8432F" />
            <Path d="M14,8 q3,-2 6,0" stroke="#FFF1B8" strokeWidth={1.4} strokeLinecap="round" fill="none" />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: rig.splat }]}>
            <Svg width={hatW} height={hatH} viewBox="0 0 46 26">
              <Path d="M20,5 q3,-3 6,0 q3,2 0,4 l1,4 q-2,1 -2,-2 l-1,3 q-2,0 -1,-3 l-2,2 q-2,-1 0,-3 q-3,-2 -1,-5 z" fill="#FFFFFF" stroke="#C9C2B0" strokeWidth={0.6} />
            </Svg>
          </Animated.View>
        </Animated.View>
        {/* "!" when startled. */}
        <Animated.View
          style={[
            styles.abs,
            styles.alarm,
            {
              left: 70 * k,
              top: -2 * k,
              opacity: rig.alarm,
              transform: [{ scale: rig.alarm.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
            },
          ]}
        >
          <Svg width={22 * k} height={26 * k} viewBox="0 0 22 26">
            <Path d="M4,4 L9,15 M13,2 L13,14 M19,6 L15,15" stroke={W.fruit} strokeWidth={3.4} strokeLinecap="round" />
            <Path d="M4,4 L9,15 M13,2 L13,14 M19,6 L15,15" stroke={W.ink} strokeWidth={1} strokeLinecap="round" opacity={0.5} />
          </Svg>
        </Animated.View>
      </Animated.View>

      {children}

      {/* Birds fly in front of everything above ground. */}
      {rig.birds.map((bird, i) => (
        <Bird key={i} rig={bird} mode={modes[i]} size={birdSize} />
      ))}
      <Animated.View
        style={[
          styles.abs,
          styles.drop,
          { opacity: rig.dropShow, transform: [{ translateX: rig.drop.x }, { translateY: rig.drop.y }] },
        ]}
      />
    </View>
  );
}


interface Rig {
  birds: BirdRig[];
  where: Pt[];
  wobble: Animated.Value;
  alarm: Animated.Value;
  hat: Animated.ValueXY;
  hatSpin: Animated.Value;
  splat: Animated.Value;
  drop: Animated.ValueXY;
  dropShow: Animated.Value;
}

interface Env {
  rig: Rig;
  setModes: (update: (all: BirdMode[]) => BirdMode[]) => void;
  width: number;
  ground: number;
  /** The scarecrow's height. */
  S: number;
  spots: { leftArm: Pt; rightArm: Pt; leftArmIn: Pt; hat: Pt; head: Pt };
  birdSize: number;
}

/**
 * The scarecrow's events, as scripts. Kept outside the component: they only ever run later,
 * from the ambient clock, never while rendering.
 */
function scarecrowEvents({ rig, setModes, width, ground, S, spots, birdSize }: Env): AmbientEvent[] {
  const setMode = (i: number, m: BirdMode) => setModes((all) => (all[i] === m ? all : all.map((v, j) => (j === i ? m : v))));
  const T = (v: Animated.Value | Animated.ValueXY, toValue: number | Pt, duration: number, easing = Easing.inOut(Easing.sin)) =>
    Animated.timing(v as Animated.Value, { toValue: toValue as number, duration, easing, useNativeDriver: true });

  // ----- Bird moves -------------------------------------------------------------------
  const b = (i: number): BirdRig => rig.birds[i];
  const appear = (i: number, p: Pt) => {
    b(i).pos.setValue(p);
    b(i).face.setValue(p.x < width / 2 ? 1 : -1);
    rig.where[i] = p;
    b(i).show.setValue(1);
    setMode(i, 'flying');
  };
  const flyTo = (i: number, to: Pt, ms: number, easing = Easing.inOut(Easing.sin)) => {
    const from = rig.where[i];
    rig.where[i] = to;
    const move = T(b(i).pos, to, ms, easing);
    if (Math.abs(to.x - from.x) <= 2) return move;
    // Turn to face the way it is going as this leg starts, not when the flight is planned.
    return Animated.sequence([Animated.timing(b(i).face, { toValue: to.x > from.x ? 1 : -1, duration: 0, useNativeDriver: true }), move]);
  };
  /** A flight through points, each leg timed by its length. */
  const flyPath = (i: number, pts: Pt[], speed = 0.16) => {
    let from = rig.where[i];
    const legs = pts.map((p) => {
      const ms = Math.max(120, Math.hypot(p.x - from.x, p.y - from.y) / speed);
      from = p;
      return flyTo(i, p, ms, Easing.linear);
    });
    return Animated.sequence(legs);
  };
  /** Perching places the bird's feet on the spot. */
  const perchAt = (p: Pt): Pt => ({ x: p.x, y: p.y - birdSize * 0.55 });
  const offLeft = (y: number): Pt => ({ x: -birdSize * 2, y });
  const offRight = (y: number): Pt => ({ x: width + birdSize * 2, y });
  const skyY = () => between(ground * 0.1, ground * 0.42);
  const land = (i: number) => setMode(i, 'perched');
  const takeOff = (i: number) => setMode(i, 'flying');
  const hop = (i: number) => Animated.sequence([T(b(i).hop, -birdSize * 0.35, 120, Easing.out(Easing.quad)), T(b(i).hop, 0, 140, Easing.in(Easing.quad))]);

  // ----- Scarecrow reactions ----------------------------------------------------------
  const wobble = (n = 3, amp = 1) =>
    Animated.sequence(Array.from({ length: n }, (_, j) => T(rig.wobble, j % 2 === 0 ? amp : -amp, 140)).concat([T(rig.wobble, 0, 220)]));
  const startle = () => Animated.parallel([wobble(4, 1), Animated.sequence([T(rig.alarm, 1, 140, Easing.out(Easing.back(3))), Animated.delay(700), T(rig.alarm, 0, 200)])]);

  /** Wraps an async script as an event that stops cleanly and resets everything. */
  const script = (name: string, weight: number, body: (ok: () => boolean) => Promise<void>): AmbientEvent => ({
    name,
    weight,
    run: (done) => {
      let alive = true;
      body(() => alive)
        .catch(() => undefined)
        .finally(() => {
          if (alive) reset();
          done();
        });
      return () => {
        alive = false;
        reset();
      };
    },
  });
  const reset = () => {
    rig.birds.forEach((bird, i) => {
      bird.pos.stopAnimation();
      bird.hop.setValue(0);
      bird.show.setValue(0);
      rig.where[i] = { x: -60, y: -60 };
    });
    setModes(() => Array(BIRDS).fill('hidden'));
    rig.wobble.setValue(0);
    rig.alarm.setValue(0);
    rig.hat.setValue({ x: 0, y: 0 });
    rig.hatSpin.setValue(0);
    rig.dropShow.setValue(0);
  };
  const go = async (ok: () => boolean, anim: Animated.CompositeAnimation) => {
    if (!ok()) throw new Error('stopped');
    await play(anim);
    if (!ok()) throw new Error('stopped');
  };

  const events: AmbientEvent[] = [
    script('flyby', 3, async (ok) => {
      const fromLeft = Math.random() > 0.5;
      const y = skyY();
      appear(0, fromLeft ? offLeft(y) : offRight(y));
      const end = fromLeft ? offRight(y - 20) : offLeft(y - 20);
      const mid = { x: width / 2, y: y + 18 };
      await go(ok, flyPath(0, [mid, end], 0.12));
    }),
    script('flock', 2, async (ok) => {
      const fromLeft = Math.random() > 0.5;
      const y = between(ground * 0.08, ground * 0.22);
      const n = 5;
      const flights = Array.from({ length: n }, (_, i) => {
        const back = Math.ceil(i / 2) * birdSize * 1.6;
        const side = (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * birdSize * 0.9;
        const dir = fromLeft ? 1 : -1;
        const start = { x: (fromLeft ? -birdSize * 2 : width + birdSize * 2) - dir * back, y: y + side };
        appear(i, start);
        const end = { x: start.x + dir * (width + birdSize * 8 + back), y: start.y - 26 };
        return Animated.sequence([Animated.delay(i * 60), flyTo(i, end, 6200, Easing.linear)]);
      });
      await go(ok, Animated.parallel(flights));
    }),
    script('perch', 3, async (ok) => {
      const spot = Math.random() > 0.5 ? spots.leftArm : spots.rightArm;
      const fromLeft = spot === spots.leftArm;
      appear(0, fromLeft ? offLeft(skyY()) : offRight(skyY()));
      await go(ok, flyPath(0, [{ x: spot.x + (fromLeft ? -40 : 40), y: spot.y - 50 }, perchAt(spot)], 0.14));
      land(0);
      await go(ok, Animated.sequence([wobble(1, 0.4), Animated.delay(between(1200, 2200)), hop(0), Animated.delay(900), hop(0), Animated.delay(between(800, 1600))]));
      if (Math.random() > 0.5) {
        // Hops up onto the hat for a better look.
        takeOff(0);
        await go(ok, flyPath(0, [{ x: spots.hat.x, y: spots.hat.y - 30 }, perchAt(spots.hat)], 0.1));
        land(0);
        await go(ok, Animated.sequence([Animated.delay(1400), hop(0), Animated.delay(900)]));
      }
      takeOff(0);
      await go(ok, flyPath(0, [{ x: spots.head.x + 30, y: spots.head.y - 70 }, Math.random() > 0.5 ? offRight(skyY()) : offLeft(skyY())], 0.16));
    }),
    script('circle', 2, async (ok) => {
      const r = S * 0.42;
      const c = { x: spots.head.x, y: spots.head.y - S * 0.1 };
      const ring = (phase: number, laps: number) =>
        Array.from({ length: 16 * laps + 1 }, (_, n) => {
          const a = phase + (n / 16) * Math.PI * 2;
          return { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r * 0.45 };
        });
      appear(0, offLeft(c.y - 60));
      appear(1, offRight(c.y - 80));
      const one = Animated.sequence([flyPath(0, ring(Math.PI, 2), 0.13), flyPath(0, [offRight(c.y - 90)], 0.18)]);
      const two = Animated.sequence([Animated.delay(300), flyPath(1, ring(0, 2), 0.13), flyPath(1, [offLeft(c.y - 100)], 0.18)]);
      await go(ok, Animated.parallel([one, two, Animated.sequence([Animated.delay(1400), wobble(2, 0.5)])]));
    }),
    script('gather', 2, async (ok) => {
      const seats = [spots.leftArm, spots.rightArm, spots.hat, spots.leftArmIn];
      for (let i = 0; i < seats.length; i++) {
        const fromLeft = seats[i].x < spots.head.x;
        appear(i, fromLeft ? offLeft(skyY()) : offRight(skyY()));
        await go(ok, flyPath(i, [{ x: seats[i].x + (fromLeft ? -30 : 30), y: seats[i].y - 46 }, perchAt(seats[i])], 0.15));
        land(i);
        await go(ok, Animated.sequence([wobble(1, 0.3), Animated.delay(between(500, 1300))]));
      }
      await go(ok, Animated.sequence([hop(0), Animated.delay(500), hop(2), Animated.delay(900)]));
      // Too many: the scarecrow twitches and they all scatter at once.
      for (let i = 0; i < seats.length; i++) takeOff(i);
      await go(
        ok,
        Animated.parallel([
          startle(),
          ...seats.map((_, i) => {
            const away = i % 2 === 0 ? offLeft(between(0, ground * 0.25)) : offRight(between(0, ground * 0.25));
            return flyPath(i, [{ x: rig.where[i].x + (i % 2 === 0 ? -20 : 20), y: rig.where[i].y - 40 }, away], 0.3);
          }),
        ]),
      );
    }),
    script('hatSteal', 1, async (ok) => {
      appear(0, offRight(skyY()));
      await go(ok, flyPath(0, [{ x: spots.hat.x + 40, y: spots.hat.y - 50 }, perchAt(spots.hat)], 0.14));
      land(0);
      await go(ok, Animated.sequence([Animated.delay(900), hop(0), Animated.delay(500)]));
      // Off it goes, hat and all.
      takeOff(0);
      const grab = { x: spots.hat.x - S * 0.9, y: spots.hat.y - S * 0.55 };
      const lift = perchAt(spots.hat);
      await go(
        ok,
        Animated.parallel([
          flyTo(0, grab, 1300),
          T(rig.hat, { x: grab.x - lift.x, y: grab.y - lift.y + birdSize * 0.5 }, 1300),
          T(rig.hatSpin, -0.15, 1300),
          startle(),
        ]),
      );
      // Too heavy: the hat drops and spins back down onto the scarecrow's head.
      await go(
        ok,
        Animated.parallel([
          flyPath(0, [offLeft(between(0, ground * 0.2))], 0.22),
          Animated.sequence([
            Animated.delay(150),
            Animated.parallel([T(rig.hat, { x: 0, y: 0 }, 900, Easing.in(Easing.quad)), T(rig.hatSpin, 2, 900, Easing.linear)]),
            Animated.timing(rig.hatSpin, { toValue: 0, duration: 0, useNativeDriver: true }),
            wobble(3, 0.8),
          ]),
        ]),
      );
    }),
    script('hatBlow', 1, async () => {
      await play(
        Animated.sequence([
          Animated.parallel([T(rig.hat, { x: S * 0.25, y: -S * 0.35 }, 700, Easing.out(Easing.quad)), T(rig.hatSpin, 0.35, 700), wobble(2, 0.6)]),
          Animated.parallel([T(rig.hat, { x: S * 0.45, y: -S * 0.3 }, 600), T(rig.hatSpin, -0.2, 600)]),
          Animated.parallel([T(rig.hat, { x: 0, y: 0 }, 1100, Easing.inOut(Easing.quad)), T(rig.hatSpin, 0, 1100)]),
          wobble(2, 0.4),
        ]),
      );
    }),
    script('dropping', 1, async (ok) => {
      const y = spots.hat.y - S * 0.7;
      appear(0, offLeft(y));
      const over = { x: spots.hat.x, y };
      await go(ok, flyTo(0, over, Math.max(400, over.x / 0.16), Easing.linear));
      rig.drop.setValue({ x: over.x, y: over.y + birdSize * 0.3 });
      rig.dropShow.setValue(1);
      await go(
        ok,
        Animated.parallel([
          flyPath(0, [offRight(y - 30)], 0.18),
          Animated.sequence([
            T(rig.drop, { x: spots.hat.x, y: spots.hat.y + 2 }, 520, Easing.in(Easing.quad)),
            Animated.timing(rig.dropShow, { toValue: 0, duration: 0, useNativeDriver: true }),
            T(rig.splat, 1, 80),
            startle(),
          ]),
        ]),
      );
      // The scarecrow is not amused; the rain (or time) washes it off.
      await go(ok, Animated.sequence([Animated.delay(3500), T(rig.splat, 0, 1200)]));
    }),
  ];
  return events;
}

/** The scarecrow itself, in its 100 x 130 box: pole, plaid shirt on a crossbar, overalls, sack head. */
function ScarecrowBody() {
  const plaid = '#D8483B';
  const plaidDark = '#A52F26';
  return (
    <G>
      {/* Pole and crossbar. */}
      <Rect x={47} y={40} width={6} height={90} fill={W.wood} stroke={W.ink} strokeWidth={1.2} />
      <Rect x={50.5} y={40} width={2.5} height={90} fill={W.woodDark} opacity={0.6} />
      {/* Sleeves along the crossbar, straw at the cuffs. */}
      <Path d="M8,42 L92,42 L92,55 L8,55 Z" fill={plaid} stroke={W.ink} strokeWidth={1.3} strokeLinejoin="round" />
      <G stroke={plaidDark} strokeWidth={1.4} opacity={0.75}>
        {[16, 26, 36, 64, 74, 84].map((x) => (
          <Path key={x} d={`M${x},42 V55`} />
        ))}
        <Path d="M8,48.5 H92" />
      </G>
      <Path d="M8,52 H92" stroke="#F3D36B" strokeWidth={0.8} opacity={0.6} />
      <Path d="M8,42 L92,42 L92,46 L8,46 Z" fill="#FFFFFF" opacity={0.12} />
      {[
        [8, -1],
        [92, 1],
      ].map(([x, d]) => (
        <G key={x} stroke="#E8C55A" strokeWidth={1.6} strokeLinecap="round">
          <Path d={`M${x},45 l${d * 7},-3`} />
          <Path d={`M${x},48 l${d * 8},0`} />
          <Path d={`M${x},51 l${d * 7},3`} />
          <Path d={`M${x},54 l${d * 5},5`} />
        </G>
      ))}
      {/* Shirt body and overalls. */}
      <Path d="M32,44 L68,44 L66,84 L34,84 Z" fill={plaid} stroke={W.ink} strokeWidth={1.3} strokeLinejoin="round" />
      <G stroke={plaidDark} strokeWidth={1.4} opacity={0.75}>
        <Path d="M40,44 V84 M50,44 V84 M60,44 V84 M33,56 H67" />
      </G>
      <Path d="M36,62 L64,62 L66,84 L64,104 L53,104 L50,88 L47,104 L36,104 L34,84 Z" fill="#3C6BB0" stroke={W.ink} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M36,62 L40,44 M64,62 L60,44" stroke="#2E528A" strokeWidth={2.4} />
      <Circle cx={40} cy={63} r={1.6} fill="#F3D36B" stroke={W.ink} strokeWidth={0.5} />
      <Circle cx={60} cy={63} r={1.6} fill="#F3D36B" stroke={W.ink} strokeWidth={0.5} />
      <Rect x={53} y={70} width={8} height={8} fill="#E5B65A" stroke={W.ink} strokeWidth={0.7} />
      <Path d="M53,70 l8,8 M61,70 l-8,8" stroke={W.woodDark} strokeWidth={0.5} strokeDasharray="1 1" />
      <Path d="M58,62 L64,62 L66,84 L64,104 L58,104 Z" fill="#2E528A" opacity={0.5} />
      <G stroke="#E8C55A" strokeWidth={1.6} strokeLinecap="round">
        <Path d="M38,104 l-2,6 M42,104 l0,7 M45,104 l2,6 M55,104 l-2,6 M59,104 l0,7 M62,104 l2,6" />
        <Path d="M44,42 l-3,-4 M50,42 l0,-5 M56,42 l3,-4" />
      </G>
      {/* Sack head: button eyes, stitched smile. */}
      <Circle cx={50} cy={28} r={15} fill="#E9CF94" stroke={W.ink} strokeWidth={1.3} />
      <Path d="M58,15.5 A15,15 0 0 1 52,43 A17,17 0 0 0 58,15.5 Z" fill="#C9AC6E" />
      <Circle cx={44} cy={26} r={2.8} fill={W.ink} />
      <Circle cx={56} cy={26} r={2.8} fill={W.ink} />
      <Circle cx={43.2} cy={25.2} r={0.9} fill="#FFFFFF" />
      <Circle cx={55.2} cy={25.2} r={0.9} fill="#FFFFFF" />
      <Path d="M42,33 Q50,39 58,33" stroke={W.ink} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Path d="M44,33.5 l0,2.5 M48,35.5 l0,2.5 M52,35.5 l0,2.5 M56,33.5 l0,2.5" stroke={W.ink} strokeWidth={0.8} />
      <Circle cx={40} cy={31} r={2.2} fill="#F08E7A" opacity={0.55} />
      <Circle cx={60} cy={31} r={2.2} fill="#F08E7A" opacity={0.55} />
      {/* Straw hair under the hat. */}
      <G stroke="#E8C55A" strokeWidth={1.8} strokeLinecap="round">
        <Path d="M36,18 l-4,3 M38,16 l-5,0 M64,18 l4,3 M62,16 l5,0" />
      </G>
    </G>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  alarm: {},
  drop: { left: -3, top: -4, width: 6, height: 8, borderRadius: 3, backgroundColor: '#FFFFFF', borderWidth: 0.6, borderColor: '#C9C2B0' },
});
