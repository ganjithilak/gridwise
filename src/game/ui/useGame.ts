import { useMemo, useState } from 'react';

import { defaultCourse, skillName } from '@/content';
import { dayKey, now } from '@/lib/clock';
import { buzz } from '@/lib/feedback';
import { dataOf, useHydrated, useProgress } from '@/progress/store';

import { freshSeed } from '../random';
import { tierFor, type PlayOutcome } from '../records';
import { newestTaught, taughtSkills } from '../taught';

/**
 * What every core game needs from the learner's progress: what has been taught (all a
 * game may ask about), the newest of it (what a go leans on), the game's record and how
 * hard it has become, and a way to save a finished go.
 */
export function useGame(id: string) {
  const hydrated = useHydrated();
  const store = useProgress();
  const data = dataOf(store);
  const taught = useMemo(() => taughtSkills(defaultCourse, data), [data.finished, data.passed, data.profile.level]); // eslint-disable-line react-hooks/exhaustive-deps
  const newest = useMemo(() => newestTaught(defaultCourse, taught, 3), [taught]);
  const record = data.game.levels[id];
  return {
    hydrated,
    data,
    taught,
    newest,
    record,
    tier: tierFor(record),
    computer: data.profile.computer,
    setComputer: store.setComputer,
    /** Saves a finished go under the game's ID, or a level's own (Speed Trial keeps one per level). */
    finish: (result: Parameters<typeof store.finishGame>[1], recordId: string = id) => {
      buzz('complete');
      return store.finishGame(recordId, result, dayKey());
    },
  };
}

/** Skill names a game covers now, for its intro. */
export const coverNames = (skills: readonly string[], taught: ReadonlySet<string>): string[] =>
  [...new Set(skills.filter((s) => taught.has(s)))].map(skillName);

/**
 * The bookkeeping of a go: which question, how many were right first time, when it started.
 * `missed` marks the question in hand as no longer first-time.
 */
export function useGo<T>() {
  const [go, setGo] = useState<{ items: T[]; at: number; firstTry: number; missed: boolean; startedAt: number; seed: number } | null>(null);
  const [result, setResult] = useState<(PlayOutcome & { xp: number; ms: number; asked: number; firstTry: number }) | null>(null);
  return {
    go,
    result,
    start: (make: (seed: number) => T[]) => {
      const seed = freshSeed();
      setResult(null);
      setGo({ items: make(seed), at: 0, firstTry: 0, missed: false, startedAt: now(), seed });
    },
    miss: () => setGo((g) => (g ? { ...g, missed: true } : g)),
    /**
     * The question in hand is done: on to the next, or, after the last, the go is saved.
     * `totals` is for a game that counts within a question (Match Pairs counts pairs).
     */
    next: (finish: (r: { ms: number; asked: number; firstTry: number }) => PlayOutcome & { xp: number }, totals?: { asked: number; firstTry: number }) => {
      if (!go) return;
      const firstTry = go.firstTry + (go.missed ? 0 : 1);
      if (go.at + 1 < go.items.length) {
        setGo({ ...go, at: go.at + 1, firstTry, missed: false });
        return;
      }
      const ms = now() - go.startedAt;
      const counted = totals ?? { asked: go.items.length, firstTry };
      const outcome = finish({ ms, ...counted });
      setGo(null);
      setResult({ ...outcome, ms, ...counted });
    },
    stop: () => setGo(null),
    clearResult: () => setResult(null),
  };
}
