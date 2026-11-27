import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { useTheme, type Palette } from '@/theme';

import { polyline, type Pt } from '../geometry';

import { alongRoute, buildMorph, easeInOut, lengths, smooth, type MeshFrame, type PlacedDome, type SheetTarget } from './morph';
import { useTransitionStore, type TransitionRun } from './nav';
import { currentSheet, worldStage, type WorldStage } from './stage';

const REDUCED_MS = 320;
const ENTER_MS = 300;
const MORPH_MS = 720;
const REVEAL_MS = 260;
/** How long to wait for the lesson's sheet to be laid out before landing on a stand-in. */
const LANDING_WAIT_MS = 700;

/** Everything the overlay draws in one frame. */
interface Scene {
  bg: { opacity: number; top: string; bottom: string };
  mesh: { frame: MeshFrame; opacity: number; line: string; lineOpacity: number; ink: string; /** How visible the sky beyond the sheet is, 0..1. */ beyond: number } | null;
  beam: { d: string; head: Pt; opacity: number; glow: number } | null;
}

const EMPTY: Scene = { bg: { opacity: 0, top: '#000000', bottom: '#000000' }, mesh: null, beam: null };

/**
 * Gridwise's way into a lesson, as one continuous move (Stage 3 of the development plan):
 *
 * 1. From the roots, a beam of light rises from the lesson along its root, up the taproot and
 *    the plant's stem, and out into the sky. The World's own camera follows it, so this is the
 *    real farm moving, not a picture of it. From the farm, the beam starts at the foot of the plant.
 * 2. The sky's grid brightens and the sky deepens around it.
 * 3. The grid bends: its rows and columns straighten, the view pushes in, and they come to rest
 *    on the lesson's actual sheet, letters on letters, as the lesson appears around it.
 *
 * Leaving runs it backwards: the sheet lifts off and curves back into the sky over the farm,
 * and the light drains back down to the lesson's place in the roots.
 *
 * Full mode runs on the JavaScript thread (each frame is a blend of precomputed points), about
 * 1.6–2.4 s in all. Reduced is a 0.3 s fade on the native driver; Off navigates directly.
 */
export function GridTransition() {
  const run = useTransitionStore((s) => s.run);
  const end = useTransitionStore((s) => s.end);
  const c = useTheme();
  const { width, height } = useWindowDimensions();
  const [scene, setScene] = useState<Scene>(EMPTY);
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!run) return;
    if (run.mode === 'reduced') {
      fade.setValue(0);
      const nav = setTimeout(run.mid, REDUCED_MS / 2);
      const anim = Animated.timing(fade, { toValue: 1, duration: REDUCED_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
      anim.start(() => end(run.id));
      return () => {
        clearTimeout(nav);
        anim.stop();
      };
    }
    const clock = makeClock();
    const direct = run.dir === 'in' ? goIn : goOut;
    direct(run, clock, setScene, c, width, height)
      .catch(() => undefined)
      .finally(() => {
        if (!clock.stopped()) {
          setScene(EMPTY);
          end(run.id);
        }
      });
    return () => clock.stop();
    // The theme and screen size are read when the journey starts; it does not restart for them.
  }, [run, end, fade]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!run) return null;

  if (run.mode === 'reduced') {
    const opacity = fade.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
    return <Animated.View pointerEvents="auto" style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, opacity }]} />;
  }

  const { bg, mesh, beam } = scene;
  return (
    <View pointerEvents="auto" style={StyleSheet.absoluteFill} testID="grid-transition">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gt-bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={bg.top} />
            <Stop offset="1" stopColor={bg.bottom} />
          </LinearGradient>
          <RadialGradient id="gt-head" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="0.25" stopColor="#FFF1C4" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#F2C14E" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {beam ? (
          <G opacity={beam.opacity}>
            <Path d={beam.d} stroke="#F2C14E" strokeOpacity={0.22} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d={beam.d} stroke="#FFF1C4" strokeOpacity={0.55} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d={beam.d} stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Circle cx={beam.head.x} cy={beam.head.y} r={14 + 22 * beam.glow} fill="url(#gt-head)" />
            <Circle cx={beam.head.x} cy={beam.head.y} r={4 + 2 * beam.glow} fill="#FFFFFF" />
          </G>
        ) : null}
        {bg.opacity > 0 ? <Rect x={0} y={0} width={width} height={height} fill="url(#gt-bg)" opacity={bg.opacity} /> : null}
        {mesh ? (
          <G opacity={mesh.opacity}>
            <Path d={mesh.frame.rows} stroke={mesh.line} strokeOpacity={mesh.lineOpacity} strokeWidth={1} fill="none" />
            <Path d={mesh.frame.cols} stroke={mesh.line} strokeOpacity={mesh.lineOpacity} strokeWidth={1} fill="none" />
            <Path d={mesh.frame.beyond} stroke={mesh.line} strokeOpacity={mesh.lineOpacity * mesh.beyond} strokeWidth={1} fill="none" />
            <G fill={mesh.ink} fontWeight="700" textAnchor="middle" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif">
              {mesh.frame.labels.map((l) =>
                l.o > 0.02 ? (
                  <SvgText key={l.t} x={l.x} y={l.y} fontSize={l.size} opacity={l.o}>
                    {l.t}
                  </SvgText>
                ) : null,
              )}
            </G>
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// The two journeys.

type SetScene = (scene: Scene) => void;

async function goIn(run: TransitionRun, clock: Clock, show: SetScene, c: Palette, width: number, height: number) {
  const stage = worldStage();
  const ride = stage && run.route && stage.showingCentre() ? stage : null;
  const sky = ride ? ride.sky : DUSK;
  let beam: Scene['beam'] = null;
  if (ride && run.route) beam = await rideUp(ride, run.route, clock, show);
  const dome = ride ? ride.dome(ride.liftTop) : screenDome(width, height);

  // The sky takes over: its grid brightens as the farm falls away behind it.
  const skyFrame = buildMorph(dome, standIn(width, height))(1);
  await clock.tween(ENTER_MS, (t) => {
    const e = smooth(t);
    show({
      bg: { opacity: e, top: sky[0], bottom: sky[1] },
      mesh: { frame: skyFrame, opacity: 1, line: '#FFFFFF', lineOpacity: 0.35 + 0.35 * e, ink: '#FFFFFF', beyond: 1 },
      beam: beam ? { ...beam, opacity: 1 - e } : null,
    });
  });

  // The lesson opens underneath, and lays out its sheet.
  const opened = Date.now();
  run.mid();
  if (ride) ride.setSkyPanel(1);
  const target = (await clock.until(() => currentSheet(opened), LANDING_WAIT_MS)) ?? standIn(width, height);
  const frameAt = buildMorph(dome, target);

  await clock.tween(MORPH_MS, (t) => {
    const bend = 1 - easeInOut(t);
    show({
      bg: { opacity: 1 - smooth(t, 0.55, 1), top: mix(sky[0], c.bg, smooth(t, 0.1, 0.7)), bottom: mix(sky[1], c.bg, smooth(t, 0.1, 0.7)) },
      mesh: { frame: frameAt(bend), opacity: 1, line: mix('#FFFFFF', c.accent, smooth(t, 0.5, 1)), lineOpacity: 0.7 - 0.3 * smooth(t, 0.6, 1), ink: mix('#FFFFFF', c.inkSoft, smooth(t, 0.4, 0.9)), beyond: 1 - smooth(t, 0, 0.6) },
      beam: null,
    });
  });
  const last = frameAt(0);
  await clock.tween(REVEAL_MS, (t) => {
    show({ bg: { ...EMPTY.bg }, mesh: { frame: last, opacity: 1 - smooth(t), line: c.accent, lineOpacity: 0.4, ink: c.inkSoft, beyond: 0 }, beam: null });
  });
}

async function goOut(run: TransitionRun, clock: Clock, show: SetScene, c: Palette, width: number, height: number) {
  const stage = worldStage();
  const target = currentSheet();
  const sky = stage ? stage.sky : DUSK;
  const ride = stage && run.route ? stage : null;
  const dome = ride ? ride.dome(ride.liftTop) : stage ? stage.dome(stage.cameraTop()) : screenDome(width, height);
  const frameAt = buildMorph(dome, target ?? standIn(width, height));

  // The lesson's sheet lifts off and the lesson fades behind it.
  const startBend = target ? 0 : 1;
  await clock.tween(ENTER_MS, (t) => {
    const e = smooth(t);
    show({
      bg: { opacity: e, top: target ? c.bg : sky[0], bottom: target ? c.bg : sky[1] },
      mesh: { frame: frameAt(startBend), opacity: e, line: target ? c.accent : '#FFFFFF', lineOpacity: 0.6, ink: target ? c.inkSoft : '#FFFFFF', beyond: target ? 0 : 1 },
      beam: null,
    });
  });
  if (target) {
    await clock.tween(MORPH_MS, (t) => {
      const e = easeInOut(t);
      show({
        bg: { opacity: 1, top: mix(c.bg, sky[0], smooth(t, 0.2, 0.9)), bottom: mix(c.bg, sky[1], smooth(t, 0.2, 0.9)) },
        mesh: { frame: frameAt(e), opacity: 1, line: mix(c.accent, '#FFFFFF', smooth(t, 0, 0.5)), lineOpacity: 0.6, ink: mix(c.inkSoft, '#FFFFFF', smooth(t, 0, 0.6)), beyond: smooth(t, 0.4, 1) },
        beam: null,
      });
    });
  }

  // Back to the World, which has been waiting underneath with the camera over its sky.
  run.mid();
  if (ride) {
    ride.setSkyPanel(0);
    ride.setCameraTop(ride.liftTop);
  }
  await clock.frames(2);
  const skyFrame = frameAt(1);
  await clock.tween(ENTER_MS, (t) => {
    const e = smooth(t);
    show({ bg: { opacity: 1 - e, top: sky[0], bottom: sky[1] }, mesh: { frame: skyFrame, opacity: 1 - e, line: '#FFFFFF', lineOpacity: 0.6, ink: '#FFFFFF', beyond: 1 }, beam: null });
  });
  if (ride && run.route) await rideDown(ride, run.route, clock, show);
  ride?.setSkyPanel(1);
}

/** The beam up the roots and stem, with the World's camera following it up to the farm's sky. */
async function rideUp(stage: WorldStage, route: Pt[], clock: Clock, show: SetScene): Promise<Scene['beam']> {
  const lens = lengths(route);
  const total = lens[lens.length - 1];
  const startTop = stage.cameraTop();
  const endTop = Math.min(startTop, stage.liftTop);
  const o = stage.origin();
  const h = stage.height;
  // The light starts where the lesson is on screen and moves to just below the middle as it climbs.
  const a0 = route[0].y - startTop;
  const ms = Math.max(900, Math.min(1600, 650 + total * 0.2));
  let top = startTop;
  let beam: Scene['beam'] = null;
  await clock.tween(ms, (t) => {
    const { lit, head } = alongRoute(route, lens, easeInOut(t) * total);
    const anchor = a0 + (h * 0.45 - a0) * smooth(t, 0, 0.35);
    top = Math.min(top, Math.max(endTop, Math.min(startTop, head.y - anchor)));
    stage.setCameraTop(top);
    stage.setSkyPanel(1 - smooth(t, 0.5, 0.85));
    beam = { d: polyline(lit.map((p) => ({ x: p.x + o.x, y: p.y + o.y - top }))), head: { x: head.x + o.x, y: head.y + o.y - top }, opacity: 1, glow: smooth(t, 0, 0.12) };
    show({ ...EMPTY, beam });
  });
  stage.setCameraTop(endTop);
  return beam;
}

/** Coming home: the light drains back down the stem to the lesson, the camera following it. */
async function rideDown(stage: WorldStage, route: Pt[], clock: Clock, show: SetScene) {
  const lens = lengths(route);
  const total = lens[lens.length - 1];
  const startTop = stage.cameraTop();
  const endTop = Math.max(startTop, stage.homeTop());
  const o = stage.origin();
  const h = stage.height;
  const aEnd = route[0].y - endTop;
  const ms = Math.max(800, Math.min(1400, 550 + total * 0.18));
  let top = startTop;
  const draw = (s: number, opacity: number, glow: number) => {
    const { lit, head } = alongRoute(route, lens, s);
    return { d: polyline(lit.map((p) => ({ x: p.x + o.x, y: p.y + o.y - top }))), head: { x: head.x + o.x, y: head.y + o.y - top }, opacity, glow };
  };
  await clock.tween(ms, (t) => {
    const s = (1 - easeInOut(t)) * total;
    const { head } = alongRoute(route, lens, s);
    const anchor = h * 0.45 + (aEnd - h * 0.45) * smooth(t, 0.6, 1);
    top = Math.max(top, Math.min(endTop, Math.max(startTop, head.y - anchor)));
    stage.setCameraTop(top);
    show({ ...EMPTY, beam: draw(s, smooth(t, 0, 0.1), 1) });
  });
  top = endTop;
  stage.setCameraTop(endTop);
  await clock.tween(320, (t) => show({ ...EMPTY, beam: draw(0, 1 - smooth(t), 1 - t) }));
}

// ---------------------------------------------------------------------------------------------
// Stand-ins, for journeys that start or end away from the World or a sheet.

/** The dusk sky of every other screen (ScreenSky). */
const DUSK = ['#1F3D5A', '#2C5C8F'] as const;

/** The dome as ScreenSky draws it on an open screen such as Games. */
function screenDome(width: number, height: number): PlacedDome {
  return { width, horizon: height * 0.62, zenith: -height * 0.2, labelsAt: height * 0.16, origin: { x: 0, y: 0 } };
}

/** A sheet in the middle of the screen, for a lesson that opens without one (a question first). */
function standIn(width: number, height: number): SheetTarget {
  const w = Math.min(width - 32, 520);
  const n = 5;
  const colW = Array.from({ length: n }, () => (w - 32) / n);
  return { x: (width - w) / 2, y: height * 0.3, w, h: height * 0.45, colX: colW.map((cw, i) => i * cw), colW, rowH: 36 };
}

/** Blends two #RRGGBB colours. */
function mix(a: string, b: string, t: number): string {
  const p = (s: string, i: number) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16);
  const ch = (i: number) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t);
  return `#${[0, 1, 2].map((i) => ch(i).toString(16).padStart(2, '0')).join('')}`;
}

// ---------------------------------------------------------------------------------------------
// A frame clock that stops cleanly if the screen goes away mid-journey.

interface Clock {
  tween: (ms: number, frame: (t: number) => void) => Promise<void>;
  until: <T>(get: () => T | null, maxMs: number) => Promise<T | null>;
  frames: (n: number) => Promise<void>;
  stop: () => void;
  stopped: () => boolean;
}

function makeClock(): Clock {
  let alive = true;
  let raf = 0;
  const next = (fn: () => void) => {
    raf = requestAnimationFrame(() => alive && fn());
  };
  return {
    tween: (ms, frame) =>
      new Promise((resolve) => {
        const t0 = Date.now();
        const step = () => {
          const t = Math.min(1, (Date.now() - t0) / ms);
          frame(t);
          if (t < 1) next(step);
          else resolve();
        };
        step();
      }),
    until: (get, maxMs) =>
      new Promise((resolve) => {
        const t0 = Date.now();
        const step = () => {
          const v = get();
          if (v !== null || Date.now() - t0 > maxMs) resolve(v);
          else next(step);
        };
        step();
      }),
    frames: (n) =>
      new Promise((resolve) => {
        let left = n;
        const step = () => (--left <= 0 ? resolve() : next(step));
        next(step);
      }),
    stop: () => {
      alive = false;
      cancelAnimationFrame(raf);
    },
    stopped: () => !alive,
  };
}
