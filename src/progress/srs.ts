import { addDays, daysBetween } from '@/lib/clock';
import type { SkillResult } from '@/lessons/session';

/**
 * How well one skill is known. Skills sit in boxes 1 to 5: a higher box means it comes
 * back for review less often. Getting it right first time moves it up a box; needing
 * "Show me" sends it back to box 1.
 */
export interface SkillState {
  box: number;
  /** The calendar day it is next due for review. */
  due: string;
  /** Missed recently. Weak skills are offered in Practice straight away, whatever their due day. */
  weak: boolean;
}

/** Days until the next review, by box. */
export const INTERVALS = [1, 2, 4, 8, 16] as const;
export const TOP_BOX = INTERVALS.length;

const interval = (box: number): number => INTERVALS[Math.max(1, Math.min(TOP_BOX, box)) - 1];

/** Moves a skill between boxes after a lesson or a practice round, and sets when it is next due. */
export function review(previous: SkillState | undefined, result: SkillResult, today: string): SkillState {
  const from = previous?.box ?? 1;
  let box: number;
  let weak: boolean;
  if (result.shown) {
    box = 1;
    weak = true;
  } else if (result.missed > 0) {
    // Got there, but not first time: no promotion, and it stays on the practice list.
    box = Math.max(1, from - (result.missed > result.firstTry ? 1 : 0));
    weak = true;
  } else {
    box = Math.min(TOP_BOX, previous ? from + 1 : 2);
    weak = false;
  }
  return { box, due: addDays(today, interval(box)), weak };
}

/** The skills to practise now: weak ones first, then those whose review day has come, oldest first. */
export function dueSkills(skills: Record<string, SkillState>, today: string): string[] {
  const overdue = (skill: string) => daysBetween(skills[skill].due, today);
  const ids = Object.keys(skills).filter((skill) => skills[skill].weak || overdue(skill) >= 0);
  return ids.sort((a, b) => Number(skills[b].weak) - Number(skills[a].weak) || overdue(b) - overdue(a) || a.localeCompare(b));
}
