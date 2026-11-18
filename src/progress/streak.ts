import { daysBetween, weekOf } from '@/lib/clock';

export interface Streak {
  /** Days in a row with something learned. */
  count: number;
  /** The last calendar day something was learned. */
  lastDay: string | null;
  /** The week (by its Monday) in which the free freeze was last used. */
  freezeWeek: string | null;
  best: number;
}

export const NO_STREAK: Streak = { count: 0, lastDay: null, freezeWeek: null, best: 0 };

/** One missed day a week is forgiven without the learner doing anything. */
const freezeAvailable = (streak: Streak, today: string): boolean => streak.freezeWeek !== weekOf(today);

/**
 * The streak after learning something today. A day already counted changes nothing.
 * Yesterday carries it on; one missed day is covered by the week's freeze; anything
 * longer starts again at 1. Nothing here ever scolds: a broken streak just restarts.
 */
export function learnedToday(streak: Streak, today: string): Streak {
  if (streak.lastDay === today) return streak;
  const gap = streak.lastDay ? daysBetween(streak.lastDay, today) : Infinity;
  let count = 1;
  let freezeWeek = streak.freezeWeek;
  if (gap === 1) count = streak.count + 1;
  else if (gap === 2 && freezeAvailable(streak, today)) {
    count = streak.count + 1;
    freezeWeek = weekOf(today);
  }
  return { count, lastDay: today, freezeWeek, best: Math.max(streak.best, count) };
}

/** The streak to show right now: it is still alive today, tomorrow, and for one more day if the freeze is unused. */
export function streakToday(streak: Streak, today: string): number {
  if (!streak.lastDay) return 0;
  const gap = daysBetween(streak.lastDay, today);
  if (gap <= 1) return streak.count;
  if (gap === 2 && freezeAvailable(streak, today)) return streak.count;
  return 0;
}

/** True if nothing has been learned yet today but the streak can still be kept. */
export const streakAtRisk = (streak: Streak, today: string): boolean =>
  streak.lastDay !== today && streakToday(streak, today) > 0;
