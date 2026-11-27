/**
 * The spreadsheet sky's geometry, shared by the drawing (SkyDome) and the lesson transition,
 * which bends this same grid into the lesson's sheet. Keeping one copy is what lets the
 * transition start exactly on the lines the learner is looking at.
 *
 * A camera inside a unit sphere, tilted up by TILT. With f the focal length:
 *   horizon y = cy + f·tan(tilt),  zenith y = cy − f / tan(tilt).
 */

const TILT = (24 * Math.PI) / 180;
/** Degrees of latitude between rows. */
export const DOME_ROW_STEP = 5;
/** Degrees of longitude between columns. */
export const DOME_COL_STEP = 6;
/** The first and last meridian drawn. */
export const DOME_LON_MIN = -84;
export const DOME_LON_MAX = 84;
/** Rows stop short of the zenith, where they would crowd into a point. */
export const DOME_LAT_MAX = 86;

export interface DomeView {
  width: number;
  /** Where the dome meets the far hills, in the sky's own coordinates. */
  horizon: number;
  /** Where the zenith, straight overhead, lands: usually above the top. */
  zenith: number;
  /** The height at which the column letters run across the middle of the view. */
  labelsAt: number;
}

export interface Projected {
  x: number;
  y: number;
  /** Depth: below 0.08 the point is behind the camera or too close to the edge to draw. */
  z: number;
}

const rad = (d: number) => (d * Math.PI) / 180;

/** Latitude and longitude in degrees to a point on screen. */
export function domeProjector(view: DomeView): (latDeg: number, lonDeg: number) => Projected {
  const f = (view.horizon - view.zenith) / (Math.tan(TILT) + 1 / Math.tan(TILT));
  const cy = view.horizon - f * Math.tan(TILT);
  const cx = view.width / 2;
  return (latDeg, lonDeg) => {
    const lat = rad(latDeg);
    const lon = rad(lonDeg);
    const X = Math.cos(lat) * Math.sin(lon);
    const Y = Math.sin(lat);
    const Z = Math.cos(lat) * Math.cos(lon);
    const y2 = Y * Math.cos(TILT) - Z * Math.sin(TILT);
    const z = Y * Math.sin(TILT) + Z * Math.cos(TILT);
    const zz = Math.max(0.08, z);
    return { x: cx + (f * X) / zz, y: cy - (f * y2) / zz, z };
  };
}

export interface DomeGrid {
  /** Latitudes of the row lines, highest (top of the view) first. */
  rowLats: number[];
  /** Longitudes of the column lines, left to right. */
  colLons: number[];
  /** The latitude the letters sit on: the middle of the band between two row lines. */
  letterLat: number;
  /** Index into `colLons` of the left edge of the first column on screen: the row-number column. */
  headerCol: number;
  /** Index into `rowLats` of the line above the letters (the top of the header band). */
  headerRow: number;
}

/** Where the dome's rows and columns fall for this view, lined up so letters sit between two rows. */
export function domeGrid(view: DomeView): DomeGrid {
  const project = domeProjector(view);
  // The latitude whose row crosses the middle of the view at `labelsAt`.
  let lo = 1;
  let hi = 85;
  for (let n = 0; n < 30; n++) {
    const mid = (lo + hi) / 2;
    const p = project(mid, 0);
    if (p.z >= 0.08 && p.y > view.labelsAt) lo = mid;
    else hi = mid;
  }
  const letterLat = (lo + hi) / 2;
  const S = DOME_ROW_STEP;
  const lats: number[] = [];
  for (let lat = letterLat + S / 2 - S * Math.floor((letterLat + S / 2) / S); lat <= DOME_LAT_MAX; lat += S) {
    if (lat >= 1) lats.push(lat);
  }
  const rowLats = lats.reverse();
  const colLons: number[] = [];
  for (let lon = DOME_LON_MIN; lon <= DOME_LON_MAX; lon += DOME_COL_STEP) colLons.push(lon);
  const headerCol = Math.max(
    0,
    colLons.slice(0, -1).findIndex((lon) => {
      const p = project(letterLat, lon + DOME_COL_STEP / 2);
      return p.z >= 0.08 && p.x > 10 && p.x < view.width - 10;
    }),
  );
  const top = letterLat + S / 2;
  const headerRow = Math.max(0, rowLats.findIndex((lat) => Math.abs(lat - top) < 0.01));
  return { rowLats, colLons, letterLat, headerCol, headerRow };
}
