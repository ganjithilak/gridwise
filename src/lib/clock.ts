/**
 * The app's only source of "now". Tests fake it, and a debug menu can shift it,
 * so streaks and review dates can be tried out without waiting a day.
 */
let offsetMs = 0;
let frozenAt: number | null = null;

export const now = (): number => (frozenAt ?? Date.now()) + offsetMs;

export const today = (): Date => new Date(now());

/** Moves the app's clock forwards or backwards. */
export function shiftClock(ms: number): void {
  offsetMs += ms;
}

/** Tests: stop time at a known instant. Pass null to let it run again. */
export function freezeClock(at: number | null): void {
  frozenAt = at;
  if (at === null) offsetMs = 0;
}

const two = (n: number): string => String(n).padStart(2, '0');

/** The learner's own calendar day for a moment in time, as "2026-11-14". Streaks turn over at local midnight. */
export function dayKey(ms: number = now()): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

const asDate = (day: string): Date => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

/** The day `n` days after `day` (or before it, if `n` is negative). */
export function addDays(day: string, n: number): string {
  const d = asDate(day);
  d.setDate(d.getDate() + n);
  return dayKey(d.getTime());
}

/** How many days `to` is after `from`. */
export function daysBetween(from: string, to: string): number {
  return Math.round((asDate(to).getTime() - asDate(from).getTime()) / 86_400_000);
}

/** The Monday that starts the week `day` is in. */
export function weekOf(day: string): string {
  const d = asDate(day);
  return addDays(day, -((d.getDay() + 6) % 7));
}
