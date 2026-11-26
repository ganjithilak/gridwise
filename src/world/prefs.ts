import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** The world's art direction. `refined` is the app's own; `classic` is the first Classic Farm prototype. */
export const WORLD_THEMES = ['refined', 'classic'] as const;
export type WorldThemeId = (typeof WORLD_THEMES)[number];

/** How much the app animates between places: the lesson transition, mainly. */
export const MOTIONS = ['full', 'reduced', 'off'] as const;
export type Motion = (typeof MOTIONS)[number];

interface Prefs {
  theme: WorldThemeId;
  motion: Motion;
  setTheme: (theme: WorldThemeId) => void;
  setMotion: (motion: Motion) => void;
}

/**
 * Look-and-feel choices, saved on the device apart from learning progress, so changing the
 * art never touches (or migrates) progress data.
 */
export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      theme: 'refined',
      motion: 'full',
      setTheme: (theme) => set({ theme }),
      setMotion: (motion) => set({ motion }),
    }),
    {
      name: 'gridwise.prefs',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ theme: s.theme, motion: s.motion }),
      merge: (saved, current) => {
        const s = (saved ?? {}) as Partial<Prefs>;
        return {
          ...current,
          theme: (WORLD_THEMES as readonly unknown[]).includes(s.theme) ? (s.theme as WorldThemeId) : current.theme,
          motion: (MOTIONS as readonly unknown[]).includes(s.motion) ? (s.motion as Motion) : current.motion,
        };
      },
    },
  ),
);
