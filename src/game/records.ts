import type { GameData, GameLevelRecord } from '@/progress/saved';

/**
 * Scoring shared by the core games. Accuracy comes before speed (the brief): stars are
 * earned by getting answers right first time, never by being quick. Time is kept as a
 * personal best, and only counts as one in a timed go.
 */
export interface PlayResult {
  /** From the first question appearing to the last being answered. */
  ms: number;
  /** Questions in the go. */
  asked: number;
  /** Answered right first time. */
  firstTry: number;
  /** Played against the clock (Speed Trial's timed mode). */
  timed?: boolean;
  /** Speed Trial: the shortcuts answered right first time, once each time, so hints fade. */
  known?: readonly string[];
}

export type NewBest = 'accuracy' | 'time' | null;

export interface PlayOutcome {
  game: GameData;
  stars: 1 | 2 | 3;
  /** 0 to 100. */
  accuracy: number;
  /** Better than every go before. Never said of the very first go. */
  newBest: NewBest;
  first: boolean;
  record: GameLevelRecord;
}

export const accuracyOf = (r: Pick<PlayResult, 'asked' | 'firstTry'>): number => (r.asked === 0 ? 0 : Math.round((100 * r.firstTry) / r.asked));

/** Three stars for every answer right first time, two for three in four, one for finishing. */
export function starsForAccuracy(accuracy: number): 1 | 2 | 3 {
  return accuracy >= 100 ? 3 : accuracy >= 75 ? 2 : 1;
}

/** XP for a go: a little for playing, more for playing well. */
export const playXp = (stars: number): number => stars * 2;

export function recordPlay(game: GameData, id: string, result: PlayResult): PlayOutcome {
  const before = game.levels[id];
  const accuracy = accuracyOf(result);
  const stars = starsForAccuracy(accuracy);
  const bestAccuracy = Math.max(before?.bestAccuracy ?? -1, accuracy);
  const timedBefore = before?.bestTimedMs;
  const bestTimedMs = result.timed ? Math.min(timedBefore ?? Infinity, result.ms) : timedBefore;
  const record: GameLevelRecord = {
    bestMs: before ? Math.min(before.bestMs, result.ms) : result.ms,
    bestStars: Math.max(before?.bestStars ?? 0, stars),
    plays: (before?.plays ?? 0) + 1,
    bestAccuracy,
    ...(bestTimedMs !== undefined ? { bestTimedMs } : {}),
  };
  let newBest: NewBest = null;
  if (before) {
    if (accuracy > (before.bestAccuracy ?? -1)) newBest = 'accuracy';
    else if (result.timed && timedBefore !== undefined && result.ms < timedBefore && accuracy >= (before.bestAccuracy ?? 0)) newBest = 'time';
  }
  const known = { ...game.known };
  for (const k of result.known ?? []) known[k] = (known[k] ?? 0) + 1;
  return { game: { levels: { ...game.levels, [id]: record }, known }, stars, accuracy, newBest, first: !before, record };
}

/** "0:12.4": minutes, seconds and tenths. */
export function clockTime(ms: number): string {
  const tenths = Math.floor(Math.max(0, ms) / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths % 10}`;
}

/**
 * How hard a game gets, 1 to 3, from how often it has been played well. Gives the brief's
 * "gradually reduced assistance": more help and fewer choices at first.
 */
export function tierFor(record: GameLevelRecord | undefined): 1 | 2 | 3 {
  if (!record) return 1;
  if (record.plays >= 6 && record.bestStars >= 2) return 3;
  return record.plays >= 2 ? 2 : 1;
}
