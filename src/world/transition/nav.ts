import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { create } from 'zustand';

import { usePrefs } from '../prefs';

export type TransitionMode = 'full' | 'reduced' | 'off';

export interface TransitionRun {
  id: number;
  /** `in`: world → lesson. `out`: lesson → world. */
  dir: 'in' | 'out';
  mode: Exclude<TransitionMode, 'off'>;
  /** Navigates. Called while the overlay covers the screen. */
  mid: () => void;
}

interface TransitionState {
  run: TransitionRun | null;
  start: (run: Omit<TransitionRun, 'id'>) => void;
  end: (id: number) => void;
}

let ids = 0;
export const useTransitionStore = create<TransitionState>((set) => ({
  run: null,
  start: (run) => set({ run: { ...run, id: ++ids } }),
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
export function useLessonNav() {
  const router = useRouter();
  const mode = useTransitionMode();
  const start = useTransitionStore((s) => s.start);
  const go = (dir: 'in' | 'out', mid: () => void) => {
    if (mode === 'off') mid();
    else start({ dir, mode, mid });
  };
  return {
    openLesson: (lessonId: string) => go('in', () => router.push({ pathname: '/lesson/[lessonId]', params: { lessonId } })),
    /** Back to the world: `back` returns to where the learner came from when it can. */
    backToWorld: (how: 'replace' | 'back' = 'replace') => go('out', () => (how === 'back' && router.canGoBack() ? router.back() : router.replace('/'))),
  };
}
