import { COL_HEADER_H, ROW_HEADER_W } from '@/spreadsheet/layout';

import { domeGrid } from '../../env/domeGeometry';
import { alongRoute, buildMorph, lengths, type PlacedDome, type SheetTarget } from '../morph';

const dome: PlacedDome = { width: 375, horizon: 812 * 0.85 + 812 * 0.78 * 0.6 - 812 * 0.85, zenith: -812 * 0.15 - 812 * 0.85, labelsAt: 812 * 0.15 + 812 * 0.78 * 0.17, origin: { x: 0, y: 0 } };
const target: SheetTarget = { x: 16, y: 180, w: 343, h: 420, colX: [0, 100, 200], colW: [100, 100, 110], rowH: 44 };

/** Every point of a path string. */
const points = (d: string) => [...d.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));

describe('the sky grid bending into the sheet', () => {
  it('finds the letter band and the first column on screen', () => {
    const g = domeGrid(dome);
    expect(g.rowLats[g.headerRow]).toBeCloseTo(g.letterLat + 2.5, 5);
    expect(g.rowLats[0]).toBeGreaterThan(g.rowLats[g.rowLats.length - 1]);
  });

  it('lands every line inside the sheet, spread over its whole height and width', () => {
    const frame = buildMorph(dome, target)(0);
    const all = [...points(frame.rows), ...points(frame.cols)];
    for (const p of all) {
      expect(p.x).toBeGreaterThanOrEqual(target.x - 0.1);
      expect(p.x).toBeLessThanOrEqual(target.x + target.w + 0.1);
      expect(p.y).toBeGreaterThanOrEqual(target.y - 0.1);
      expect(p.y).toBeLessThanOrEqual(target.y + target.h + 0.1);
    }
    const ys = new Set(points(frame.rows).map((p) => Math.round(p.y)));
    expect(ys.has(target.y + COL_HEADER_H)).toBe(true);
    expect(ys.has(target.y + COL_HEADER_H + target.rowH)).toBe(true);
    const xs = new Set(points(frame.cols).map((p) => Math.round(p.x)));
    expect(xs.has(target.x + ROW_HEADER_W)).toBe(true);
    expect(xs.has(target.x + ROW_HEADER_W + 100)).toBe(true);
  });

  it('puts the letters on the column headings and the numbers on the row headings', () => {
    const labels = buildMorph(dome, target)(0).labels;
    const a = labels.find((l) => l.t === 'A');
    expect(a?.x).toBeCloseTo(target.x + ROW_HEADER_W + 50, 1);
    const one = labels.find((l) => l.t === '1');
    expect(one?.x).toBeCloseTo(target.x + ROW_HEADER_W / 2, 1);
    // A letter the sheet has no column for fades out as it lands.
    expect(labels.find((l) => l.t === 'E')?.o ?? 0).toBe(0);
  });

  it('starts exactly on the dome', () => {
    const frame = buildMorph(dome, target)(1);
    expect(points(frame.rows).length).toBeGreaterThan(50);
    // Rows of the dome curve: the same row is not at one height across the screen.
    const first = frame.rows.split('M')[3];
    const ys = points(`M${first}`).map((p) => p.y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(5);
  });
});

describe('the beam', () => {
  const route = [
    { x: 0, y: 100 },
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ];
  it('lights the route up to where its head is', () => {
    const lens = lengths(route);
    expect(alongRoute(route, lens, 50).head).toEqual({ x: 0, y: 50 });
    expect(alongRoute(route, lens, 150).head).toEqual({ x: 50, y: 0 });
    expect(alongRoute(route, lens, 150).lit).toHaveLength(3);
    expect(alongRoute(route, lens, 999).head).toEqual({ x: 100, y: 0 });
  });
});
