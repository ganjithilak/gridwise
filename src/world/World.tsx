import { useIsFocused } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { defaultCourse } from '@/content';
import { BASICS, FORMULAS } from '@/content/excel/tips';
import { dayKey } from '@/lib/clock';
import { levelFor } from '@/progress/level';
import { practiceIdFor } from '@/progress/mastery';
import { buildPath, nextUp, type LessonNode } from '@/progress/path';
import { dataOf, useProgress } from '@/progress/store';
import { streakAtRisk, streakToday } from '@/progress/streak';
import PracticeScreen from '@/screens/PracticeScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import { radius, useTheme } from '@/theme';

import { CLOUD_EFFECTS, CLOUD_MOODS, CloudMascot, WanderingCloud, type CloudEffect, type CloudMood } from './CloudMascot';
import { ambientScenes, triggerAmbient } from './env/ambient';
import { Earthworm } from './env/Earthworm';
import { farmGeometry } from './env/Farm';
import { ScarecrowScene } from './env/ScarecrowScene';
import { Goldspire } from './Goldspire';
import { GROWTH_STAGES, growthOf, LAST_STAGE } from './growth';
import { LessonCard } from './LessonCard';
import { W } from './palette';
import { layoutRoots, RootMap, type RootPick } from './RootMap';
import { DriftingCloud, Soil } from './Scenery';
import { useWorldArt } from './theme';
import { display, GlassPanel, GOLD, GoldButton, GoldChip, tagStyle } from './ui/Gold';
import { makeCamera } from './camera';
import { useWorld } from './store';
import { resample, type Pt } from './geometry';
import { R } from './refined/paint';
import { useLessonNav } from './transition/nav';
import { registerWorldStage } from './transition/stage';

/** Above ground takes this share of the farm view; the rest is the soil cross-section. */
const ABOVE = 0.78;
/** In the roots view the soil line sits this far down, so the grass stays in sight. */
const ROOTS_SURFACE = 0.07;
/** Going into a lesson, the camera comes to rest this far down the screen from the top of the farm's sky, with the sky grid's letters in the upper third. */
const LIFT = 0.15;

/**
 * The world (Creative Direction V2, section 4). One camera over one painting:
 *
 *            Sky (Cell)
 *   Games ←  Farm  → Profile
 *            Roots
 *
 * Swipe or drag to move; the bottom bar does the same, so gestures are never required.
 */
export function World() {
  const insets = useSafeAreaInsets();
  const nav = useLessonNav();
  const theme = useTheme();
  const store = useProgress();
  const data = dataOf(store);
  const today = dayKey();
  const { col, row, go, previewStage, setPreviewStage } = useWorld();
  const art = useWorldArt();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [pick, setPick] = useState<RootPick | null>(null);
  const [skyMood, setSkyMood] = useState<CloudMood>('happy');
  const [skyEffect, setSkyEffect] = useState<CloudEffect>('none');
  // Ambient events wait while a lesson is open over the World; the loops underneath simply carry on.
  const focused = useIsFocused();
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [eventTurn, setEventTurn] = useState(0);

  const path = buildPath(defaultCourse, data);
  const next = nextUp(path);
  const real = growthOf(path);
  const growth = previewStage === null ? real : { stage: previewStage, ripe: previewStage === LAST_STAGE };

  // The roots only need laying out again when a lesson's state changes, not on every render.
  const shape = path.map((u) => `${u.complete}:${u.testOut?.id ?? ''}:${u.lessons.map((l) => l.state + (l.inProgress ? '*' : '')).join(',')}`).join('|');
  const w = size?.w ?? 0;
  const h = size?.h ?? 0;
  const farmH = h * ABOVE; // the farm's above-ground height
  const ground = h + farmH; // the soil line, in the painting's own coordinates
  const geo = farmGeometry(w, farmH);
  const plantW = (Math.min(farmH * 0.66, w * 1.15) * 200) / 280;
  const cloudSize = Math.min(w * 0.27, 120);
  // Ambient life (birds, worm, Cell wandering) only runs while the farm is what you see.
  const onFarm = col === 0 && row === 0 && focused;
  const layout = useMemo(() => (w > 0 ? layoutRoots(path, w, Math.max(h * 0.3, 190)) : null), [w, h, shape]); // eslint-disable-line react-hooks/exhaustive-deps
  const soilH = Math.max(layout?.height ?? 0, h);
  const rootsTop = ground - h * ROOTS_SURFACE;
  const maxOffset = Math.max(0, ground + soilH - (rootsTop + h));

  // Where the next lesson is, so arriving at the roots lands with it in view.
  const nextAt = layout?.units.flatMap((u) => u.lessons).find((l) => l.node.lesson.id === next?.lesson.id)?.at ?? null;
  const autoOffset = nextAt ? Math.min(maxOffset, Math.max(0, ground + nextAt.y - rootsTop - h * 0.42)) : 0;

  const [cam] = useState(makeCamera);
  const [skyPanel] = useState(() => new Animated.Value(1));
  const viewport = useRef<ComponentRef<typeof View>>(null);
  const [origin, setOrigin] = useState<Pt>({ x: 0, y: 0 });

  // Effects run in order: the camera learns the new frame before it is asked to move.
  useEffect(() => cam.setFrame({ col, row, w, h, rootsTop, maxOffset }));

  useEffect(() => {
    if (size && layout) cam.arrive(col, row, autoOffset);
  }, [col, row, size, layout]); // eslint-disable-line react-hooks/exhaustive-deps

  const wheelProps = Platform.OS === 'web' ? ({ onWheel: cam.onWheel } as object) : {};

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    // Hidden under a lesson, the World can be measured as nothing. Keep everything as it was,
    // so the clouds, the plant and the camera carry on rather than being rebuilt on return.
    if (width < 1 || height < 1) return;
    if (!size || Math.abs(size.w - width) > 1 || Math.abs(size.h - height) > 1) {
      cam.reset();
      setSize({ w: width, h: height });
    }
    viewport.current?.measureInWindow((x, y) => setOrigin((o) => (o.x === x && o.y === y ? o : { x, y })));
  };

  // The lesson transition borrows the camera and the sky (see transition/stage.ts).
  const camTop = useRef(0);
  const skyColours: [string, string] = art.refined ? [R.skyHigh, R.skyMid] : [W.skyHigh, W.skyMid];
  useEffect(() =>
    registerWorldStage({
      cameraTop: () => {
        cam.y.stopAnimation((v) => (camTop.current = -v));
        return camTop.current;
      },
      setCameraTop: (y) => {
        camTop.current = y;
        cam.y.setValue(-y);
      },
      homeTop: () => (cam.frame.row === 1 ? cam.frame.rootsTop + cam.offset : cam.frame.row === 0 ? h : 0),
      dome: (top) => ({ width: w, horizon: h + farmH * 0.6, zenith: -h * 0.15, labelsAt: h + farmH * 0.17, origin: { x: origin.x, y: origin.y - top } }),
      origin: () => origin,
      sky: skyColours,
      setSkyPanel: (v) => skyPanel.setValue(v),
      showingCentre: () => cam.frame.col === 0 && w > 0,
      height: h,
      liftTop: h * (1 - LIFT),
    }),
  );

  /**
   * The beam's route, in the painting's coordinates: from the lesson's place on its root back
   * to the taproot, up the taproot to the surface, up the plant's stem and out through the top
   * of the farm's sky. From the farm it starts at the foot of the plant.
   */
  const routeFrom = (lessonId: string | null, junctionOf: string | null = null): Pt[] => {
    const up: Pt[] = [];
    const units = layout?.units ?? [];
    const unit = units.find((u) => (lessonId && u.lessons.some((l) => l.node.lesson.id === lessonId)) || (junctionOf && u.unit.testOut?.id === junctionOf));
    if (unit && row === 1) {
      const placed = lessonId ? unit.lessons.find((l) => l.node.lesson.id === lessonId) : undefined;
      if (placed) {
        // Along the root from the lesson back to where it leaves the taproot.
        let run = 0;
        const back: Pt[] = [unit.root[0]];
        for (let i = 1; i < unit.root.length && run < placed.along; i++) {
          run += Math.hypot(unit.root[i].x - unit.root[i - 1].x, unit.root[i].y - unit.root[i - 1].y);
          if (run < placed.along) back.push(unit.root[i]);
        }
        back.push(placed.at);
        up.push(...back.reverse());
      } else up.push(unit.junction);
      // Up the taproot to the soil line.
      const tap = (layout?.taproot ?? []).filter((p) => p.y < unit.junction.y).reverse();
      up.push(...tap);
    }
    const soil = up.map((p) => ({ x: p.x, y: p.y + ground }));
    const stemTop = ground - Math.min(h * ABOVE * 0.66, w * 1.15) * 0.8;
    soil.push({ x: w / 2, y: ground }, { x: w / 2, y: stemTop }, { x: w / 2, y: h * (1 - LIFT) - h * 0.25 });
    return resample(soil, 10);
  };

  // Into a lesson through the spreadsheet sky (see transition/GridTransition).
  const openLesson = (node: LessonNode) => {
    setPick(null);
    nav.openLesson(node.state === 'practice' ? practiceIdFor(node.lesson.id) : node.lesson.id, routeFrom(node.lesson.id));
  };
  const openPick = () => {
    if (!pick) return;
    if (pick.kind === 'test') {
      setPick(null);
      nav.openLesson(pick.checkpoint.id, routeFrom(null, pick.checkpoint.id));
    } else openLesson(pick.node);
  };

  /** Development only: plays every ambient event in turn, for review. */
  const fireNextEvent = () => {
    const all = ambientScenes().flatMap(({ scene, events }) => events.map((event) => ({ scene, event })));
    if (all.length === 0) return;
    const { scene, event } = all[eventTurn % all.length];
    triggerAmbient(scene, event);
    setLastEvent(`${scene}: ${event}`);
    setEventTurn(eventTurn + 1);
  };

  let mainLabel = 'Start';
  if (next?.state === 'practice') mainLabel = 'Practise';
  else if (next?.inProgress) mainLabel = 'Continue';

  const tips = Object.values({ ...BASICS, ...FORMULAS });
  const tip = tips[[...today].reduce((n, ch) => n + ch.charCodeAt(0), 0) % tips.length];
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = data.profile.name.trim();

  return (
    <View ref={viewport} style={styles.viewport} onLayout={onLayout} {...cam.pan.panHandlers} {...wheelProps}>
      {size && layout ? (
        <Animated.View style={[styles.row, { width: w * 3, height: h, transform: [{ translateX: cam.x }] }]}>
          {/* Left: Games and practice. */}
          <View style={{ width: w, height: h, backgroundColor: theme.bg }} testID="world-games">
            <PracticeScreen />
          </View>

          {/* Centre: the sky, the farm and the roots, one painting under one camera. */}
          <View style={{ width: w, height: h, overflow: 'hidden' }} testID="world-centre">
            <Animated.View style={{ width: w, height: ground + soilH, transform: [{ translateY: cam.y }] }}>
              <View style={[styles.abs, { top: 0, width: w, height: ground }]}>
                <art.SkyBackdrop width={w} height={ground} skyPanel={h} horizon={h + farmH * 0.6} />
              </View>
              <DriftingCloud y={h * 0.62} size={Math.min(w * 0.42, 200)} width={w} seconds={110} start={0.55} Shape={art.CloudShape} />
              <DriftingCloud y={h * 0.16} size={Math.min(w * 0.3, 150)} width={w} seconds={140} start={0.05} Shape={art.CloudShape} />
              <DriftingCloud y={h + h * 0.33} size={Math.min(w * 0.34, 170)} width={w} seconds={95} start={0.62} Shape={art.CloudShape} />
              <DriftingCloud y={h + h * 0.46} size={Math.min(w * 0.22, 110)} width={w} seconds={150} start={0.12} Shape={art.CloudShape} />

              {/* Above: Cell's sky. */}
              <Animated.View style={[styles.abs, styles.sky, { top: 0, width: w, height: h, paddingTop: insets.top + 24, opacity: skyPanel }]} testID="world-sky">
                <View style={styles.skyColumn}>
                  <CloudMascot mood={skyMood} effect={skyEffect} size={Math.min(w * 0.5, 220)} alive={row === -1} />
                  <GlassPanel tone="light" glow style={styles.bubble}>
                    <Text style={styles.bubbleTitle}>
                      {hello}
                      {name ? `, ${name}` : ''}!
                    </Text>
                    <Text style={styles.bubbleText}>
                      {next ? `Your next lesson is “${next.lesson.title}”. Each one builds on what you have already learned.` : 'You have completed every lesson. The games will help keep your skills sharp.'}
                    </Text>
                    {next ? <GoldButton testID="sky-next" label="Show me my roots" onPress={() => go(0, 1)} /> : null}
                  </GlassPanel>
                  <GlassPanel tone="light" style={styles.tip}>
                    <Text style={[styles.tipTag, tagStyle]}>QUICK TIP</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </GlassPanel>
                  {__DEV__ ? (
                    <View style={styles.devRow}>
                      <Pressable testID="mood-preview" onPress={() => setSkyMood(CLOUD_MOODS[(CLOUD_MOODS.indexOf(skyMood) + 1) % CLOUD_MOODS.length])} style={[styles.devChip, styles.devInline]}>
                        <Text style={styles.devText}>Mood: {skyMood} ▸</Text>
                      </Pressable>
                      <Pressable testID="effect-preview" onPress={() => setSkyEffect(CLOUD_EFFECTS[(CLOUD_EFFECTS.indexOf(skyEffect) + 1) % CLOUD_EFFECTS.length])} style={[styles.devChip, styles.devInline]}>
                        <Text style={styles.devText}>Effect: {skyEffect} ▸</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
                <GoldChip label="Back down to the farm ↓" onPress={() => go(0, 0)} style={styles.downHint} />
              </Animated.View>

              {/* Below: the soil and its roots. */}
              <View style={[styles.abs, { top: ground, width: w, height: soilH }]}>
                <Soil width={w} height={soilH} />
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setPick(null)} accessible={false} />
                <RootMap
                  layout={layout}
                  width={w}
                  stage={growth.stage}
                  nextId={next?.lesson.id ?? null}
                  picked={pick ? (pick.kind === 'test' ? pick.checkpoint.id : pick.node.lesson.id) : null}
                  onPick={(p) => {
                    setPick(p);
                    if (row !== 1) go(0, 1);
                  }}
                />
              </View>

              {/* The farm: hills behind, the scarecrow and its birds, the fence and field in front. */}
              <View pointerEvents="none" style={[styles.abs, { top: h, width: w, height: farmH + 20 }]}>
                <art.FarmBackdrop width={w} ground={farmH} />
                <ScarecrowScene width={w} ground={farmH} at={geo.scarecrow} active={onFarm} refined={art.refined}>
                  <art.FarmForeground width={w} ground={farmH} lip={20} />
                </ScarecrowScene>
              </View>
              <PlantOnGround stage={growth.stage} ripe={growth.ripe} ground={ground} w={w} h={h} refined={art.refined} />
              <Earthworm x={w / 2 + plantW * 0.33} ground={ground} active={onFarm} scale={Math.min(1.2, h / 700)} refined={art.refined} />

              {/* Main 1's own controls, painted into the farm's sky and soil. */}
              <View pointerEvents="box-none" style={[styles.abs, { top: h, width: w, height: h }]} testID="world-farm">
                <WanderingCloud
                  size={cloudSize}
                  active={onFarm}
                  onPress={() => go(0, -1)}
                  area={{ x0: 10, x1: Math.max(12, w - cloudSize - 10), y0: insets.top + 66, y1: Math.max(insets.top + 70, h * 0.3) }}
                />

                <WorldHud
                  top={insets.top + 8}
                  name={data.profile.name}
                  xp={data.xp}
                  streak={streakToday(data.streak, today)}
                  atRisk={streakAtRisk(data.streak, today)}
                  todayXp={data.days[today] ?? 0}
                  goal={data.profile.dailyGoal}
                />

                {__DEV__ ? (
                  <View style={[styles.devColumn, { top: insets.top + 64 }]}>
                    <Pressable testID="stage-preview" onPress={() => setPreviewStage(previewStage === null ? 0 : previewStage >= LAST_STAGE ? null : previewStage + 1)} style={styles.devChip}>
                      <Text style={styles.devText}>{previewStage === null ? `Stage: ${GROWTH_STAGES[real.stage]} ▸` : `Preview ${previewStage}: ${GROWTH_STAGES[previewStage]} ▸`}</Text>
                    </Pressable>
                    <Pressable testID="event-preview" onPress={fireNextEvent} style={styles.devChip}>
                      <Text style={styles.devText}>▶ {lastEvent ?? 'Play an event'}</Text>
                    </Pressable>
                  </View>
                ) : null}

                <GoldChip label="‹ Games" onPress={() => go(-1)} style={[styles.edgeLeft, { top: h * 0.5 }]} accessibilityLabel="Games" />
                <GoldChip label="Profile ›" onPress={() => go(1)} style={[styles.edgeRight, { top: h * 0.5 }]} accessibilityLabel="Profile" />

                <GlassPanel
                  glow
                  pointerEvents={row === 1 ? 'none' : 'auto'}
                  style={[styles.next, { opacity: row === 1 ? 0 : 1, top: farmH + (h * (1 - ABOVE) - 66) / 2 + 8 }]}
                >
                  {next ? (
                    <>
                      <View style={styles.nextWords}>
                        <Text style={[styles.nextTag, tagStyle]}>{next.state === 'practice' ? 'PRACTICE ROUND' : 'UP NEXT'}</Text>
                        <Text style={[styles.nextTitle, display]} numberOfLines={2}>
                          {next.lesson.title}
                        </Text>
                      </View>
                      <GoldButton testID="start-lesson-farm" label={mainLabel} onPress={() => openLesson(next)} small={w < 400} />
                    </>
                  ) : (
                    <>
                      <Text style={[styles.nextTitle, styles.nextWords, display]}>Every lesson is done.</Text>
                      <GoldButton testID="go-practice" label="Games" onPress={() => go(-1)} />
                    </>
                  )}
                </GlassPanel>
              </View>
            </Animated.View>

            {row === 1 && pick ? (
              <LessonCard
                pick={pick}
                bottom={12}
                onClose={() => setPick(null)}
                onOpen={openPick}
                onRestart={(id) => {
                  store.clearRun(id);
                  if (pick.kind === 'lesson') openLesson({ ...pick.node, inProgress: false });
                }}
              />
            ) : null}
          </View>

          {/* Right: Profile and, later, the collection. */}
          <View style={{ width: w, height: h, backgroundColor: theme.bg }} testID="world-profile">
            <ProfileScreen />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

interface HudProps {
  top: number;
  name: string;
  xp: number;
  streak: number;
  atRisk: boolean;
  todayXp: number;
  goal: number;
}

/**
 * The farm's heads-up line: level and XP bar, streak, and today's goal. The same numbers
 * the old Learn screen led with (LevelBar and StatsRow), slimmed to one row so the sky
 * stays the picture.
 */
function WorldHud({ top, name, xp, streak, atRisk, todayXp, goal }: HudProps) {
  const { level, into, needed } = levelFor(xp);
  const share = Math.min(1, goal > 0 ? todayXp / goal : 0);
  return (
    <GlassPanel tone="light" style={[styles.hud, { marginTop: top }]} testID="level-bar">
      <View style={styles.hudRow} accessible accessibilityLabel={`Level ${level}, ${into} of ${needed} XP to the next. ${streak} days in a row. ${todayXp} of ${goal} XP today.`}>
      <View style={styles.ring}>
        <Text style={styles.ringText}>{level}</Text>
      </View>
      <View style={styles.hudWords}>
        <Text style={styles.hudName} numberOfLines={1}>
          {name.trim() || 'Gridwise'}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round((into / needed) * 100)}%` }]} />
        </View>
      </View>
      <View style={[styles.stat, atRisk && streak > 0 ? styles.statWarn : null]} testID="stats">
        <Text style={styles.statIcon}>✦</Text>
        <Text style={styles.statText}>{streak}</Text>
      </View>
      <View style={styles.stat}>
        <View style={styles.goalTrack}>
          <View style={[styles.goalFill, { width: `${Math.round(share * 100)}%` }]} />
        </View>
        <Text style={styles.statText}>
          {todayXp}/{goal}
        </Text>
      </View>
      </View>
    </GlassPanel>
  );
}

/** The plant, its base on the soil line, sized to the farm. */
function PlantOnGround({ stage, ripe, ground, w, h, refined }: { stage: number; ripe: boolean; ground: number; w: number; h: number; refined: boolean }) {
  const ph = Math.min(h * ABOVE * 0.66, w * 1.15);
  const pw = (ph * 200) / 280;
  return (
    <View pointerEvents="none" style={[styles.abs, { left: w / 2 - pw / 2, top: ground - ph * (258 / 280) }]} testID="world-plant">
      <Goldspire stage={stage} ripe={ripe} height={ph} refined={refined} />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden', backgroundColor: W.skyMid, touchAction: 'none' } as object,
  row: { flexDirection: 'row' },
  abs: { position: 'absolute', left: 0 },
  sky: { alignItems: 'center', justifyContent: 'center', paddingBottom: 64 },
  skyColumn: { width: '100%', maxWidth: 440, paddingHorizontal: 16, alignItems: 'center', gap: 14 },
  bubble: { alignSelf: 'stretch', padding: 16, gap: 10 },
  bubbleTitle: { ...display, color: GOLD.onLight, fontSize: 23 },
  bubbleText: { color: GOLD.onLightSoft, fontSize: 15, lineHeight: 21 },
  tip: { alignSelf: 'stretch', padding: 14, gap: 4 },
  tipTag: { color: GOLD.tagOnLight },
  tipText: { color: GOLD.onLight, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  downHint: { bottom: 16, alignSelf: 'center' },
  hud: { alignSelf: 'center', width: '94%', maxWidth: 460, borderRadius: 999, paddingVertical: 6, paddingLeft: 6, paddingRight: 8 },
  hudRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ring: { width: 34, height: 34, borderRadius: 17, borderWidth: 2.5, borderColor: GOLD.edge, backgroundColor: W.card, alignItems: 'center', justifyContent: 'center' },
  ringText: { color: W.cardInk, fontSize: 14, fontWeight: '900' },
  hudWords: { flex: 1, gap: 4 },
  hudName: { color: W.cardInk, fontSize: 14, fontWeight: '800' },
  track: { height: 7, borderRadius: 4, backgroundColor: W.cardLine, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: W.gold },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(242,193,78,0.6)' },
  statWarn: { borderWidth: 1.5, borderColor: W.fruitShade },
  statIcon: { color: W.fruitShade, fontSize: 13, fontWeight: '900' },
  statText: { color: W.cardInk, fontSize: 13, fontWeight: '800' },
  goalTrack: { width: 22, height: 6, borderRadius: 3, backgroundColor: W.cardLine, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: '#3FAE5A' },
  devColumn: { position: 'absolute', right: 10, alignItems: 'flex-end', gap: 6 },
  devRow: { flexDirection: 'row', gap: 6 },
  devChip: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1.5, borderColor: W.awning, borderStyle: 'dashed' },
  devInline: {},
  devText: { color: W.chipInk, fontSize: 11, fontWeight: '800' },
  edgeLeft: { left: 6 },
  edgeRight: { right: 6 },
  next: {
    position: 'absolute',
    alignSelf: 'center',
    width: '92%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 22,
    padding: 9,
    paddingLeft: 16,
  },
  nextWords: { flex: 1 },
  nextTag: { color: GOLD.tag },
  nextTitle: { color: GOLD.onDark, fontSize: 17, lineHeight: 21, marginTop: 1 },
});
