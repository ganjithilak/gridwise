import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { create } from 'zustand';

import type { Pt } from '../geometry';
import { usePrefs } from '../prefs';

export type TransitionMode = 'full' | 'reduced' | 'off';

export interface TransitionRun {
  id: number;
  /** `in`: world → lesson. `out`: lesson → world. */
  dir: 'in' | 'out';
  mode: Exclude<TransitionMode, 'off'>;
  /** Navigates. Called while the overlay covers the screen. */
  mid: () => void;
  /**
   * The beam's route through the World painting, from the lesson's place in the roots (or the
   * foot of the plant) up the stem and out of the top of the sky. None when the lesson was
   * opened from somewhere the World is not showing.
   */
  route: Pt[] | null;
}

interface TransitionState {
  run: TransitionRun | null;
  start: (run: Omit<TransitionRun, 'id'>) => void;
  end: (id: number) => void;
}

let ids = 0;
export const useTransitionStore = create<TransitionState>((set) => ({
  run: null,
  // One journey at a time: a second tap while one is under way is ignored.
  start: (run) => set((s) => (s.run ? s : { run: { ...run, id: ++ids } })),
  end: (id) => set((s) => (s.run?.id === id ? { run: null } : s)),
}));

/** True when the phone asks for less motion; it turns Full transitions into Reduced. */
function useSystemReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/** The transition this learner gets: their setting, softened by the phone's own. */
export function useTransitionMode(): TransitionMode {
  const motion = usePrefs((s) => s.motion);
  const reduce = useSystemReduceMotion();
  if (motion === 'off') return 'off';
  return motion === 'reduced' || reduce ? 'reduced' : 'full';
}

/**
 * Going into a lesson and back out to the world, with the spreadsheet-sky transition
 * (`GridTransition`). Use these instead of `router.push` / `router.replace('/')` for those two
 * journeys; everything else navigates as before.
 */
/** The route the last lesson was entered by, so leaving it follows the light back down. */
let lastRoute: Pt[] | null = null;

export function useLessonNav() {
  const router = useRouter();
  const mode = useTransitionMode();
  const start = useTransitionStore((s) => s.start);
  const go = (dir: 'in' | 'out', mid: () => void, route: Pt[] | null) => {
    if (mode === 'off') mid();
    else start({ dir, mode, mid, route });
  };
  // The World is always at the bottom of the stack (welcome replaces itself with it), so
  // going back to it pops down to that same World rather than opening a second one: its
  // clouds, plant and camera carry on from where they were.
  const toWorld = () => {
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/');
  };
  return {
    openLesson: (lessonId: string, route: Pt[] | null = null) => {
      lastRoute = route;
      go('in', () => router.push({ pathname: '/lesson/[lessonId]', params: { lessonId } }), route);
    },
    /** Back to the world, following the light back down to where the lesson was opened. */
    backToWorld: () => go('out', toWorld, lastRoute),
  };
}
