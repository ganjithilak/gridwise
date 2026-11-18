/** XP needed to go up one level. The same for every level, so the bar is easy to read. */
export const XP_PER_LEVEL = 100;

export interface LevelInfo {
  /** 1 to begin with. */
  level: number;
  /** XP earned since this level began. */
  into: number;
  /** XP this level takes from start to finish. */
  needed: number;
}

/** Which level a total of XP comes to, and how far through it the learner is. */
export function levelFor(xp: number): LevelInfo {
  const total = Math.max(0, Math.floor(xp));
  return { level: Math.floor(total / XP_PER_LEVEL) + 1, into: total % XP_PER_LEVEL, needed: XP_PER_LEVEL };
}
