import { memo } from 'react';
import { Defs, G, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface Props {
  width: number;
  /** Where the dome meets the far hills (the horizon), in the sky's own coordinates. */
  horizon: number;
  /** Where the zenith, straight overhead, lands: usually a little above the top. */
  zenith: number;
  /** The height at which the column letters run across the middle of the view. */
  labelsAt: number;
}

/**
 * The spreadsheet atmosphere (Creative Direction V2 refinements): a fine white grid on the
 * inside of a sphere that surrounds the world, seen from within. It is a real perspective
 * projection, so rows (lines of latitude) bow overhead and flatten into the horizon, and
 * columns (meridians) fan out from the zenith, never a wall standing behind the farm.
 *
 * Later it can become a way in to above-ground Branches and Fruit exercises; for now it is
 * atmosphere only, faint enough to leave the sky and clouds in charge.
 */
export const SkyDome = memo(function SkyDome({ width, horizon, zenith, labelsAt }: Props) {
  // A camera inside a unit sphere, tilted up by `tilt`. With f the focal length:
  //   horizon y = cy + f·tan(tilt),  zenith y = cy − f / tan(tilt).
  const tilt = (24 * Math.PI) / 180;
  const f = (horizon - zenith) / (Math.tan(tilt) + 1 / Math.tan(tilt));
  const cy = horizon - f * Math.tan(tilt);
  const cx = width / 2;
  const project = (lat: number, lon: number): { x: number; y: number } | null => {
    const X = Math.cos(lat) * Math.sin(lon);
    const Y = Math.sin(lat);
    const Z = Math.cos(lat) * Math.cos(lon);
    const y2 = Y * Math.cos(tilt) - Z * Math.sin(tilt);
    const z2 = Y * Math.sin(tilt) + Z * Math.cos(tilt);
    if (z2 < 0.08) return null;
    return { x: cx + (f * X) / z2, y: cy - (f * y2) / z2 };
  };
  const rad = (d: number) => (d * Math.PI) / 180;
  const line = (pts: ({ x: number; y: number } | null)[]) => {
    let d = '';
    let pen = false;
    for (const p of pts) {
      if (!p || p.x < -width || p.x > width * 2) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)} `;
      pen = true;
    }
    return d;
  };

  // The latitude whose row crosses the middle of the view at `labelsAt`: letters sit there.
  let lo = 1;
  let hi = 85;
  for (let n = 0; n < 30; n++) {
    const mid = (lo + hi) / 2;
    const p = project(rad(mid), 0);
    if (p && p.y > labelsAt) lo = mid;
    else hi = mid;
  }
  const letterLat = (lo + hi) / 2;
  const STEP = 5;
  const COL = 6;

  // Rows every 7.5° of latitude, lined up so the letters fall between two of them.
  const rows: string[] = [];
  for (let lat = letterLat + STEP / 2 - STEP * Math.floor((letterLat + STEP / 2) / STEP); lat <= 86; lat += STEP) {
    if (lat < 1) continue;
    const pts = [];
    for (let lon = -88; lon <= 88; lon += 2) pts.push(project(rad(lat), rad(lon)));
    rows.push(line(pts));
  }
  // Columns every 9° of longitude.
  const cols: string[] = [];
  const colLons: number[] = [];
  for (let lon = -84; lon <= 84; lon += COL) {
    colLons.push(lon);
    const pts = [];
    for (let lat = 0; lat <= 86; lat += 2) pts.push(project(rad(lat), rad(lon)));
    cols.push(line(pts));
  }

  // As on a sheet: the first visible column is the row-number header, then A, B, C…
  const cells = colLons.slice(0, -1).map((lon) => ({ lon: lon + COL / 2, p: project(rad(letterLat), rad(lon + COL / 2)) }));
  const onScreen = cells.filter((c) => c.p && c.p.x > 10 && c.p.x < width - 10);
  const letters = onScreen.slice(1).map((c, i) => ({ p: c.p, t: LETTERS[i] }));
  // Row numbers down that header column, one per row below the letters.
  const numLon = onScreen.length > 0 ? onScreen[0].lon : -60;
  const numbers = Array.from({ length: 6 }, (_, i) => ({ p: project(rad(letterLat - STEP * (i + 1)), rad(numLon)), t: String(i + 1) }));

  return (
    <G>
      <Defs>
        <LinearGradient id="domeFade" x1="0" y1={String(zenith)} x2="0" y2={String(horizon)} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.32} />
          <Stop offset="0.75" stopColor="#FFFFFF" stopOpacity={0.4} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <G stroke="url(#domeFade)" strokeWidth={1} fill="none">
        {rows.map((d, i) => (
          <Path key={`r${i}`} d={d} />
        ))}
        {cols.map((d, i) => (
          <Path key={`c${i}`} d={d} />
        ))}
      </G>
      <G fill="#FFFFFF" fontWeight="700" textAnchor="middle" opacity={0.75} fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif">
        {letters.map(({ p, t }) =>
          p ? (
            <SvgText key={t} x={p.x} y={p.y + 4} fontSize={11}>
              {t}
            </SvgText>
          ) : null,
        )}
        {numbers.map(({ p, t }) =>
          p && p.x > 8 ? (
            <SvgText key={t} x={p.x} y={p.y + 4} fontSize={10}>
              {t}
            </SvgText>
          ) : null,
        )}
      </G>
    </G>
  );
});
