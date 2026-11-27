import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Course } from '@/lessons/types';
import type { Computer } from '@/spreadsheet/shortcuts';

import { gridXp, recordGrid, type GridOutcome } from '@/game/gridMaster';
import { playXp, recordPlay, type PlayOutcome, type PlayResult } from '@/game/records';

import { applyFinish, type Finished, type FinishResult } from './finish';
import {
  emptyProgress,
  migrate,
  NAME_LENGTH,
  STORE_VERSION,
  type Level,
  type Look,
  type ProfileColour,
  type ProgressData,
  type SavedRun,
  type Side,
} from './saved';
import { learnedToday } from './streak';

interface ProgressStore extends ProgressData {
  /** Keeps where a lesson was left. Called on every step, so leaving never loses anything. */
  saveRun: (run: SavedRun) => void;
  /** Forgets a lesson in progress, so it starts from the beginning next time. */
  clearRun: (lessonId: string) => void;
  /** A lesson, unit test or practice round was finished. Returns what that earned. */
  finish: (course: Course, event: Finished) => FinishResult;
  setLevel: (level: Level) => void;
  setComputer: (computer: Computer) => void;
  setFeedback: (on: boolean) => void;
  setName: (name: string) => void;
  setColour: (colour: ProfileColour) => void;
  /** Which half the sheet takes when the phone is on its side. */
  setSheetSide: (side: Side) => void;
  /** The tour has been taken or skipped. */
  setTourSeen: () => void;
  setLook: (look: Look) => void;
  /**
   * A go at one of the core games (or a Speed Trial level) was finished, by the game's ID.
   * Returns how it went against earlier goes.
   */
  finishGame: (id: string, result: PlayResult, today: string) => PlayOutcome & { xp: number };
  /** A level of Grid Master was finished. Returns how it went against earlier goes. */
  finishGrid: (levelIndex: number, result: { ms: number; stars: number }, today: string) => GridOutcome & { xp: number };
  /** Wipes everything and starts the app as new. */
  reset: () => void;
}

const DATA_KEYS: (keyof ProgressData)[] = [
  'runs',
  'finished',
  'toPractise',
  'passed',
  'skills',
  'xp',
  'days',
  'streak',
  'badges',
  'profile',
  'game',
];

/** Just the saved part of the store, without its functions. */
export function dataOf(store: ProgressData): ProgressData {
  const out = {} as Record<string, unknown>;
  for (const key of DATA_KEYS) out[key] = store[key];
  return out as unknown as ProgressData;
}

const without = <T,>(all: Record<string, T>, key: string): Record<string, T> => {
  const rest = { ...all };
  delete rest[key];
  return rest;
};

/**
 * What the learner has done, kept on the device (no account, no server). It is written
 * through AsyncStorage, which is the phone's own storage in Expo Go and the browser's on web.
 */
export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...emptyProgress(),
      saveRun: (run) => set((s) => ({ runs: { ...s.runs, [run.lessonId]: run } })),
      clearRun: (lessonId) => set((s) => (lessonId in s.runs ? { runs: without(s.runs, lessonId) } : s)),
      finish: (course, event) => {
        const result = applyFinish(dataOf(get()), course, event);
        set(result.data);
        return result;
      },
      setLevel: (level) => set((s) => ({ profile: { ...s.profile, level } })),
      setComputer: (computer) => set((s) => ({ profile: { ...s.profile, computer } })),
      setFeedback: (feedback) => set((s) => ({ profile: { ...s.profile, feedback } })),
      setName: (name) => set((s) => ({ profile: { ...s.profile, name: name.trim().slice(0, NAME_LENGTH) } })),
      setColour: (colour) => set((s) => ({ profile: { ...s.profile, colour } })),
      setSheetSide: (sheetSide) => set((s) => ({ profile: { ...s.profile, sheetSide } })),
      setTourSeen: () => set((s) => (s.profile.tourSeen ? s : { profile: { ...s.profile, tourSeen: true } })),
      setLook: (look) => set((s) => ({ profile: { ...s.profile, look } })),
      finishGame: (id, result, today) => {
        const s = get();
        const outcome = recordPlay(s.game, id, result);
        const xp = playXp(outcome.stars);
        // A game counts as learning today, like a practice round does.
        set({
          game: outcome.game,
          xp: s.xp + xp,
          days: { ...s.days, [today]: (s.days[today] ?? 0) + xp },
          streak: learnedToday(s.streak, today),
        });
        return { ...outcome, xp };
      },
      finishGrid: (levelIndex, result, today) => {
        const s = get();
        const outcome = recordGrid(s.game, levelIndex, result);
        const xp = gridXp(result.stars);
        set({
          game: outcome.game,
          xp: s.xp + xp,
          days: { ...s.days, [today]: (s.days[today] ?? 0) + xp },
          streak: learnedToday(s.streak, today),
        });
        return { ...outcome, xp };
      },
      reset: () => set(emptyProgress()),
    }),
    {
      name: 'gridwise.progress',
      version: STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): ProgressData => dataOf(state),
      migrate,
      // A save from this version can still be missing fields added since; fill them in.
      merge: (persisted, current) => ({ ...current, ...migrate(persisted, STORE_VERSION) }),
    },
  ),
);

/**
 * False for the first moment after launch, while saved progress is being read. Screens
 * wait for it, so a lesson is never started afresh on top of one that was in progress.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useProgress.persist.onFinishHydration(onChange),
    () => useProgress.persist.hasHydrated(),
    () => false,
  );
}
