export interface Pt {
  x: number;
  y: number;
}

/** A cubic Bézier, sampled into evenly spaced points (by length, not by t). */
export function sampleCubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, spacing = 6): Pt[] {
  const raw: Pt[] = [];
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    raw.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return resample(raw, spacing);
}

/** Points along a line, re-spaced so they are `spacing` apart. */
export function resample(points: Pt[], spacing: number): Pt[] {
  const out: Pt[] = [points[0]];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    let seg = Math.hypot(b.x - a.x, b.y - a.y);
    let start = 0;
    while (carry + seg - start >= spacing) {
      const need = spacing - carry;
      start += need;
      const t = start / seg;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      carry = 0;
    }
    carry += seg - start;
    seg = 0;
  }
  const last = points[points.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

/** An SVG path through the points. */
export const polyline = (points: Pt[]): string =>
  points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

/** A repeatable random sequence, so the soil's pebbles land in the same places every time. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
