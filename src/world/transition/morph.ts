/**
 * The arithmetic of the lesson transition, kept apart from drawing so it can be tested.
 *
 * Two pieces:
 * - `buildMorph`: the sky's grid (the dome, seen from the farm) bent into the lesson's own
 *   sheet. Every line of the sky is a row or column of the sheet: the dome's letter band is
 *   the column headings, its first column on screen the row numbers, so A in the sky lands
 *   on A in the lesson. `bend` 1 is the sky, 0 is the sheet exactly where it is on screen.
 * - `alongRoute`: where the beam of light is, a distance along its route up the roots and stem.
 */

import { COL_HEADER_H, EMPTY_COL_W, ROW_HEADER_W } from '@/spreadsheet/layout';

import { DOME_COL_STEP, DOME_LAT_MAX, DOME_LON_MAX, DOME_LON_MIN, DOME_ROW_STEP, domeGrid, domeProjector, type DomeView } from '../env/domeGeometry';
import type { Pt } from '../geometry';

/** The lesson's sheet as it sits on screen (window coordinates), reported by the Grid. */
export interface SheetTarget {
  x: number;
  y: number;
  w: number;
  h: number;
  colX: number[];
  colW: number[];
  rowH: number;
}

/** A dome drawn at `origin` on screen: the World's sky, or a screen's own sky. */
export interface PlacedDome extends DomeView {
  origin: Pt;
}

export interface MeshLabel {
  x: number;
  y: number;
  t: string;
  /** 0..1: letters for columns the sheet does not have fade out as it flattens. */
  o: number;
  size: number;
}

export interface MeshFrame {
  /** Lines that become rows and columns of the sheet. */
  rows: string;
  cols: string;
  /** Lines of sky beyond the sheet's edges: they fold onto its border and fade as it flattens. */
  beyond: string;
  labels: MeshLabel[];
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/** How much the view pushes in while the grid straightens: the camera swooping into it. */
const SWOOP = 0.16;
/** Row numbers drawn on the dome, as in SkyDome. */
const DOME_NUMBERS = 6;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** A vertical line of the sheet: 0 is the left of the row numbers, 1 the left of A, and so on. */
function sheetX(t: SheetTarget, i: number): number {
  return clamp(rawX(t, i), t.x, t.x + t.w);
}

function rawX(t: SheetTarget, i: number): number {
  let x: number;
  if (i <= 1) x = t.x + i * ROW_HEADER_W;
  else {
    const n = i - 1;
    const k = Math.floor(n);
    const f = n - k;
    const left = (j: number) => (j < t.colX.length ? t.colX[j] : t.colX[t.colX.length - 1] + t.colW[t.colW.length - 1] + (j - t.colX.length) * EMPTY_COL_W);
    const width = (j: number) => (j < t.colW.length ? t.colW[j] : EMPTY_COL_W);
    x = t.x + ROW_HEADER_W + left(k) + f * width(k);
  }
  return x;
}

/** A horizontal line of the sheet: 0 is the top of the column headings, 1 the top of row 1. */
function sheetY(t: SheetTarget, k: number): number {
  const y = k <= 1 ? t.y + k * COL_HEADER_H : t.y + COL_HEADER_H + (k - 1) * t.rowH;
  return clamp(y, t.y, t.y + t.h);
}

/**
 * Precomputes both ends of every point once; each frame is then only a blend, cheap enough to
 * run sixty times a second on the JavaScript thread.
 */
export function buildMorph(dome: PlacedDome, target: SheetTarget): (bend: number) => MeshFrame {
  const project = domeProjector(dome);
  const g = domeGrid(dome);
  const lon0 = g.colLons[g.headerCol];
  const lat0 = g.rowLats[g.headerRow];
  const colIndex = (lon: number) => (lon - lon0) / DOME_COL_STEP;
  const rowIndex = (lat: number) => (lat0 - lat) / DOME_ROW_STEP;

  type Pair = { ax: number; ay: number; bx: number; by: number; ok: boolean };
  const pair = (lat: number, lon: number): Pair => {
    const p = project(lat, lon);
    const ok = p.z >= 0.08 && p.x >= -dome.width && p.x <= dome.width * 2;
    return { ax: dome.origin.x + p.x, ay: dome.origin.y + p.y, bx: sheetX(target, colIndex(lon)), by: sheetY(target, rowIndex(lat)), ok };
  };

  const rowLines: Pair[][] = [];
  const colLines: Pair[][] = [];
  const beyondLines: Pair[][] = [];
  for (const lat of g.rowLats) {
    const pts: Pair[] = [];
    for (let lon = DOME_LON_MIN - 4; lon <= DOME_LON_MAX + 4; lon += 3) pts.push(pair(lat, lon));
    const k = rowIndex(lat);
    const inside = k > -0.01 && target.y + COL_HEADER_H + (k - 1) * target.rowH < target.y + target.h - 1;
    (inside ? rowLines : beyondLines).push(pts);
  }
  for (const lon of g.colLons) {
    const pts: Pair[] = [];
    for (let lat = 0; lat <= DOME_LAT_MAX; lat += 3) pts.push(pair(lat, lon));
    const i = colIndex(lon);
    const inside = i > -0.01 && rawX(target, i) < target.x + target.w - 1;
    (inside ? colLines : beyondLines).push(pts);
  }

  type LabelPair = Pair & { t: string; keep: boolean };
  const labels: LabelPair[] = [];
  const cells = g.colLons.slice(g.headerCol + 1, -1);
  cells.slice(0, 26).forEach((lon, n) => {
    const p = project(g.letterLat, lon + DOME_COL_STEP / 2);
    // Letters off the side of the view still travel: they come in from off screen to land.
    if (p.z < 0.08) return;
    const keep = n < target.colW.length;
    const bx = keep ? target.x + ROW_HEADER_W + target.colX[n] + target.colW[n] / 2 : sheetX(target, n + 1.5);
    labels.push({ ax: dome.origin.x + p.x, ay: dome.origin.y + p.y + 4, bx, by: target.y + COL_HEADER_H / 2 + 4, ok: true, t: LETTERS[n], keep });
  });
  for (let i = 0; i < DOME_NUMBERS; i++) {
    const p = project(g.letterLat - DOME_ROW_STEP * (i + 1), lon0 + DOME_COL_STEP / 2);
    if (p.z < 0.08) continue;
    const by = target.y + COL_HEADER_H + i * target.rowH + target.rowH / 2 + 4;
    labels.push({ ax: dome.origin.x + p.x, ay: dome.origin.y + p.y + 4, bx: target.x + ROW_HEADER_W / 2, by, ok: true, t: String(i + 1), keep: by < target.y + target.h });
  }

  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;

  return (bend: number) => {
    const b = clamp(bend, 0, 1);
    // Push in mid-way, settle back to exactly the sheet's size at the end.
    const zoom = 1 + SWOOP * Math.sin(Math.PI * b);
    const at = (p: { ax: number; ay: number; bx: number; by: number }) => ({
      x: cx + (lerp(p.bx, p.ax, b) - cx) * zoom,
      y: cy + (lerp(p.by, p.ay, b) - cy) * zoom,
    });
    const path = (lines: Pair[][]) => {
      let d = '';
      for (const line of lines) {
        let pen = false;
        for (const p of line) {
          if (!p.ok) {
            pen = false;
            continue;
          }
          const q = at(p);
          d += `${pen ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`;
          pen = true;
        }
      }
      return d;
    };
    return {
      rows: path(rowLines),
      cols: path(colLines),
      beyond: path(beyondLines),
      labels: labels.map((l) => {
        const q = at(l);
        return { x: q.x, y: q.y, t: l.t, o: l.keep ? 1 : clamp((b - 0.5) * 2, 0, 1), size: lerp(12, /\d/.test(l.t) ? 10 : 11, b) };
      }),
    };
  };
}

/** Arc length up to each point. */
export function lengths(points: readonly Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < points.length; i++) out.push(out[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  return out;
}

/** The route up to `s` along it: the lit part of the beam, and where its head is. */
export function alongRoute(points: readonly Pt[], lens: readonly number[], s: number): { lit: Pt[]; head: Pt } {
  if (points.length === 0) return { lit: [], head: { x: 0, y: 0 } };
  const total = lens[lens.length - 1];
  const d = clamp(s, 0, total);
  let i = 1;
  while (i < lens.length - 1 && lens[i] < d) i++;
  const a = points[i - 1];
  const b = points[Math.min(i, points.length - 1)];
  const seg = lens[i] - lens[i - 1] || 1;
  const f = clamp((d - lens[i - 1]) / seg, 0, 1);
  const head = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) };
  return { lit: [...points.slice(0, i), head], head };
}

/** Eases in and out: slow away, quick through the middle, slow to arrive. */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** A soft step from 0 to 1 between `a` and `b`. */
export const smooth = (t: number, a = 0, b = 1) => {
  const x = clamp((t - a) / (b - a || 1), 0, 1);
  return x * x * (3 - 2 * x);
};
