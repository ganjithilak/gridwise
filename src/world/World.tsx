import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
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

import { CloudMascot } from './CloudMascot';
import { Goldspire } from './Goldspire';
import { GROWTH_STAGES, growthOf, LAST_STAGE } from './growth';
import { LessonCard } from './LessonCard';
import { W } from './palette';
import { layoutRoots, RootMap, type RootPick } from './RootMap';
import { DriftingCloud, FarmScene, SkyBackdrop, Soil } from './Scenery';
import { makeCamera } from './camera';
import { useWorld } from './store';

/** Above ground takes this share of the farm view; the rest is the soil cross-section. */
const ABOVE = 0.78;
/** In the roots view the soil line sits this far down, so the grass stays in sight. */
const ROOTS_SURFACE = 0.07;

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
  const router = useRouter();
  const theme = useTheme();
  const store = useProgress();
  const data = dataOf(store);
  const today = dayKey();
  const { col, row, go, previewStage, setPreviewStage } = useWorld();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [pick, setPick] = useState<RootPick | null>(null);

  const path = buildPath(defaultCourse, data);
  const next = nextUp(path);
  const real = growthOf(path);
  const growth = previewStage === null ? real : { stage: previewStage, ripe: previewStage === LAST_STAGE };

  // The roots only need laying out again when a lesson's state changes, not on every render.
  const shape = path.map((u) => `${u.complete}:${u.testOut?.id ?? ''}:${u.lessons.map((l) => l.state + (l.inProgress ? '*' : '')).join(',')}`).join('|');
  const w = size?.w ?? 0;
  const h = size?.h ?? 0;
  const ground = h + h * ABOVE; // the soil line, in the painting's own coordinates
  const layout = useMemo(() => (w > 0 ? layoutRoots(path, w, Math.max(h * 0.3, 190)) : null), [w, h, shape]); // eslint-disable-line react-hooks/exhaustive-deps
  const soilH = Math.max(layout?.height ?? 0, h);
  const rootsTop = ground - h * ROOTS_SURFACE;
  const maxOffset = Math.max(0, ground + soilH - (rootsTop + h));

  // Where the next lesson is, so arriving at the roots lands with it in view.
  const nextAt = layout?.units.flatMap((u) => u.lessons).find((l) => l.node.lesson.id === next?.lesson.id)?.at ?? null;
  const autoOffset = nextAt ? Math.min(maxOffset, Math.max(0, ground + nextAt.y - rootsTop - h * 0.42)) : 0;

  const [cam] = useState(makeCamera);

  // Effects run in order: the camera learns the new frame before it is asked to move.
  useEffect(() => cam.setFrame({ col, row, w, h, rootsTop, maxOffset }));

  useEffect(() => {
    if (size && layout) cam.arrive(col, row, autoOffset);
  }, [col, row, size, layout]); // eslint-disable-line react-hooks/exhaustive-deps

  const wheelProps = Platform.OS === 'web' ? ({ onWheel: cam.onWheel } as object) : {};

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || Math.abs(size.w - width) > 1 || Math.abs(size.h - height) > 1) {
      cam.reset();
      setSize({ w: width, h: height });
    }
  };

  const openLesson = (node: LessonNode) =>
    router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: node.state === 'practice' ? practiceIdFor(node.lesson.id) : node.lesson.id } });
  const openPick = () => {
    if (!pick) return;
    if (pick.kind === 'test') router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: pick.checkpoint.id } });
    else openLesson(pick.node);
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
    <View style={styles.viewport} onLayout={onLayout} {...cam.pan.panHandlers} {...wheelProps}>
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
                <SkyBackdrop width={w} height={ground} skyPanel={h} />
              </View>
              <DriftingCloud y={h * 0.62} size={Math.min(w * 0.42, 200)} width={w} seconds={110} start={0.55} />
              <DriftingCloud y={h * 0.16} size={Math.min(w * 0.3, 150)} width={w} seconds={140} start={0.05} />
              <DriftingCloud y={h + h * 0.33} size={Math.min(w * 0.34, 170)} width={w} seconds={95} start={0.62} />
              <DriftingCloud y={h + h * 0.46} size={Math.min(w * 0.22, 110)} width={w} seconds={150} start={0.12} />

              {/* Above: Cell's sky. */}
              <View style={[styles.abs, styles.sky, { top: 0, width: w, height: h, paddingTop: insets.top + 24 }]} testID="world-sky">
                <View style={styles.skyColumn}>
                  <CloudMascot mood={next ? 'happy' : 'cheering'} size={Math.min(w * 0.52, 230)} />
                  <View style={styles.bubble}>
                    <Text style={styles.bubbleTitle}>
                      {hello}
                      {name ? `, ${name}` : ''}!
                    </Text>
                    <Text style={styles.bubbleText}>
                      {next ? `Next up is “${next.lesson.title}”. Every lesson you finish grows your roots a little deeper.` : 'Every root is grown. Games keep the skills fresh.'}
                    </Text>
                    {next ? <Button testID="sky-next" label="Show me my roots" onPress={() => go(0, 1)} /> : null}
                  </View>
                  <View style={styles.tip}>
                    <Text style={styles.tipTag}>QUICK TIP</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                </View>
                <Pressable onPress={() => go(0, 0)} style={styles.downHint} accessibilityRole="button" accessibilityLabel="Back down to the farm">
                  <Text style={styles.hintText}>Back down to the farm ↓</Text>
                </Pressable>
              </View>

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

              {/* The farm, and the plant standing on the soil line. */}
              <View pointerEvents="none" style={[styles.abs, { top: h, width: w, height: h * ABOVE + 20 }]}>
                <FarmScene width={w} ground={h * ABOVE} lip={20} />
              </View>
              <PlantOnGround stage={growth.stage} ripe={growth.ripe} ground={ground} w={w} h={h} />

              {/* Main 1's own controls, painted into the farm's sky and soil. */}
              <View pointerEvents="box-none" style={[styles.abs, { top: h, width: w, height: h }]} testID="world-farm">
                <WorldHud
                  top={insets.top + 8}
                  name={data.profile.name}
                  xp={data.xp}
                  streak={streakToday(data.streak, today)}
                  atRisk={streakAtRisk(data.streak, today)}
                  todayXp={data.days[today] ?? 0}
                  goal={data.profile.dailyGoal}
                />

                <View style={[styles.cloudSpot, { left: w * 0.6, top: insets.top + h * 0.25 }]}>
                  <CloudMascot mood="neutral" size={Math.min(w * 0.27, 120)} onPress={() => go(0, -1)} accessibilityLabel="Cell. Tap to go up to the sky for help" />
                </View>

                {__DEV__ ? (
                  <Pressable
                    testID="stage-preview"
                    onPress={() => setPreviewStage(previewStage === null ? 0 : previewStage >= LAST_STAGE ? null : previewStage + 1)}
                    style={[styles.chip, styles.devChip, { top: insets.top + h * 0.25 + Math.min(w * 0.27, 120) * 0.75 + 14, right: 12 }]}
                  >
                    <Text style={styles.chipText}>
                      {previewStage === null ? `Stage: ${GROWTH_STAGES[real.stage]} · preview ▸` : `Preview ${previewStage}: ${GROWTH_STAGES[previewStage]} ▸`}
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable onPress={() => go(-1)} style={[styles.chip, styles.edgeLeft, { top: h * 0.55 }]} accessibilityRole="button" accessibilityLabel="Games">
                  <Text style={styles.chipText}>‹ Games</Text>
                </Pressable>
                <Pressable onPress={() => go(1)} style={[styles.chip, styles.edgeRight, { top: h * 0.55 }]} accessibilityRole="button" accessibilityLabel="Profile">
                  <Text style={styles.chipText}>Profile ›</Text>
                </Pressable>

                <View pointerEvents={row === 1 ? 'none' : 'auto'} style={[styles.next, { opacity: row === 1 ? 0 : 1, top: h * ABOVE + (h * (1 - ABOVE) - 64) / 2 + 10 }]}>
                  {next ? (
                    <>
                      <View style={styles.nextWords}>
                        <Text style={styles.nextTag}>{next.state === 'practice' ? 'PRACTICE ROUND' : 'UP NEXT'}</Text>
                        <Text style={styles.nextTitle} numberOfLines={1}>
                          {next.lesson.title}
                        </Text>
                      </View>
                      <Button testID="start-lesson-farm" label={mainLabel} onPress={() => openLesson(next)} style={styles.nextButton} />
                    </>
                  ) : (
                    <>
                      <Text style={[styles.nextTitle, styles.nextWords]}>Every lesson is done.</Text>
                      <Button testID="go-practice" label="Games" onPress={() => go(-1)} style={styles.nextButton} />
                    </>
                  )}
                </View>
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
    <View style={[styles.hud, { marginTop: top }]} testID="level-bar" accessibilityLabel={`Level ${level}, ${into} of ${needed} XP to the next. ${streak} days in a row. ${todayXp} of ${goal} XP today.`}>
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
  );
}

/** The plant, its base on the soil line, sized to the farm. */
function PlantOnGround({ stage, ripe, ground, w, h }: { stage: number; ripe: boolean; ground: number; w: number; h: number }) {
  const ph = Math.min(h * ABOVE * 0.66, w * 1.15);
  const pw = (ph * 200) / 280;
  return (
    <View pointerEvents="none" style={[styles.abs, { left: w / 2 - pw / 2, top: ground - ph * (258 / 280) }]} testID="world-plant">
      <Goldspire stage={stage} ripe={ripe} height={ph} />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden', backgroundColor: W.skyMid, touchAction: 'none' } as object,
  row: { flexDirection: 'row' },
  abs: { position: 'absolute', left: 0 },
  sky: { alignItems: 'center', justifyContent: 'center', paddingBottom: 64 },
  skyColumn: { width: '100%', maxWidth: 440, paddingHorizontal: 16, alignItems: 'center', gap: 14 },
  bubble: { alignSelf: 'stretch', backgroundColor: W.card, borderRadius: 20, padding: 16, gap: 10, borderWidth: 2, borderColor: W.cardLine },
  bubbleTitle: { color: W.cardInk, fontSize: 20, fontWeight: '800' },
  bubbleText: { color: W.cardSoft, fontSize: 15, lineHeight: 21 },
  tip: { alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 16, padding: 14, gap: 4 },
  tipTag: { color: '#1E5FA8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  tipText: { color: '#173A63', fontSize: 15, lineHeight: 21, fontWeight: '600' },
  downHint: { position: 'absolute', bottom: 16, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.6)' },
  hintText: { color: '#173A63', fontWeight: '800', fontSize: 13 },
  hud: {
    alignSelf: 'center',
    width: '94%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: W.chip,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  ring: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, borderColor: W.gold, backgroundColor: W.card, alignItems: 'center', justifyContent: 'center' },
  ringText: { color: W.cardInk, fontSize: 14, fontWeight: '900' },
  hudWords: { flex: 1, gap: 4 },
  hudName: { color: W.cardInk, fontSize: 14, fontWeight: '800' },
  track: { height: 7, borderRadius: 4, backgroundColor: W.cardLine, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: W.gold },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: W.card, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  statWarn: { borderWidth: 1.5, borderColor: W.fruitShade },
  statIcon: { color: W.fruitShade, fontSize: 13, fontWeight: '900' },
  statText: { color: W.cardInk, fontSize: 13, fontWeight: '800' },
  goalTrack: { width: 22, height: 6, borderRadius: 3, backgroundColor: W.cardLine, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: '#3FAE5A' },
  cloudSpot: { position: 'absolute' },
  chip: { position: 'absolute', backgroundColor: W.chip, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { color: W.chipInk, fontSize: 12, fontWeight: '800' },
  devChip: { borderWidth: 1.5, borderColor: W.awning, borderStyle: 'dashed' },
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
    backgroundColor: W.soilChip,
    borderRadius: 18,
    padding: 8,
    paddingLeft: 14,
  },
  nextWords: { flex: 1 },
  nextTag: { color: W.fruit, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  nextTitle: { color: W.soilInk, fontSize: 16, fontWeight: '800' },
  nextButton: { minWidth: 118 },
});
