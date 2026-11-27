/**
 * Small, repeatable randomness for games: the same seed gives the same round, so a round
 * can be replayed in a test, and a new seed each go keeps rounds from repeating.
 */
export type Rng = () => number;

/** mulberry32: a tiny generator with a good spread, returning 0 ≤ n < 1. */
export function rng(seed: number): Rng {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const int = (r: Rng, lo: number, hi: number): number => lo + Math.floor(r() * (hi - lo + 1));
export const pick = <T>(r: Rng, items: readonly T[]): T => items[Math.floor(r() * items.length)];

export function shuffle<T>(r: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `n` different items, or all of them if there are fewer. */
export const sample = <T>(r: Rng, items: readonly T[], n: number): T[] => shuffle(r, items).slice(0, n);

/** A fresh seed for a new go. */
export const freshSeed = (): number => Math.floor(Math.random() * 1e9);
