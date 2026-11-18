import { create } from 'zustand';

import type { Summary } from '@/lessons/session';

import type { PlayKind } from './playable';

/** What the results screen needs to know about the thing that was just finished. */
export interface LastResult {
  id: string;
  kind: PlayKind;
  title: string;
  summary: Summary;
  /** XP this earned. */
  xp: number;
  /** The streak after this, in days. */
  streak: number;
  /** For a lesson: skills that need a practice round before the next lesson opens. */
  toPractise: string[];
  /** For a unit test: whether it was passed. */
  passedTest: boolean | null;
  newBadges: string[];
  /** For a lesson: what it taught, in two or three sentences. */
  recap: string[];
  /** The exercises that were not right first time: what was asked, and the idea behind the answer. */
  review: { id: string; prompt: string; explain: string }[];
}

/**
 * Held in memory only, between the lesson and its results screen. If the app is closed
 * on the results screen, everything it showed has already been saved; only the summary is gone.
 */
export const useLastResult = create<{ result: LastResult | null; set: (result: LastResult | null) => void }>()((set) => ({
  result: null,
  set: (result) => set({ result }),
}));
