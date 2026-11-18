/** Zero-based position: A1 is { col: 0, row: 0 }. */
export interface CellAddr {
  col: number;
  row: number;
}

/** A reference as written in a formula, remembering which parts are locked with `$`. */
export interface CellRef extends CellAddr {
  absCol: boolean;
  absRow: boolean;
}

/** A rectangle of cells. Always normalised: `start` is top-left, `end` is bottom-right. */
export interface RangeAddr {
  start: CellAddr;
  end: CellAddr;
}

const REF_PATTERN = '(\\$?)([A-Za-z]{1,3})(\\$?)([1-9][0-9]*)';
const REF_RE = new RegExp(`^${REF_PATTERN}$`);

export function colToLetters(col: number): string {
  let n = col + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export function lettersToCol(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function isRefText(text: string): boolean {
  return REF_RE.test(text);
}

export function parseRef(text: string): CellRef | null {
  const m = REF_RE.exec(text.trim());
  if (!m) return null;
  return {
    absCol: m[1] === '$',
    col: lettersToCol(m[2]),
    absRow: m[3] === '$',
    row: Number(m[4]) - 1,
  };
}

/** Parses "B2" (any `$` signs are accepted and ignored). */
export function parseA1(text: string): CellAddr | null {
  const ref = parseRef(text);
  return ref ? { col: ref.col, row: ref.row } : null;
}

/** Like parseA1, for addresses written by us in content and tests. Throws on a typo. */
export function a1(text: string): CellAddr {
  const addr = parseA1(text);
  if (!addr) throw new Error(`Not a cell address: "${text}"`);
  return addr;
}

export function toA1(addr: CellAddr): string {
  return `${colToLetters(addr.col)}${addr.row + 1}`;
}

export function refToString(ref: CellRef): string {
  return `${ref.absCol ? '$' : ''}${colToLetters(ref.col)}${ref.absRow ? '$' : ''}${ref.row + 1}`;
}

export function normalizeRange(a: CellAddr, b: CellAddr): RangeAddr {
  return {
    start: { col: Math.min(a.col, b.col), row: Math.min(a.row, b.row) },
    end: { col: Math.max(a.col, b.col), row: Math.max(a.row, b.row) },
  };
}

export const singleCell = (addr: CellAddr): RangeAddr => ({ start: { ...addr }, end: { ...addr } });

/** Parses "B2:B6" or a single "B2". Reversed ranges ("B6:B2") come back in order. */
export function parseRange(text: string): RangeAddr | null {
  const parts = text.trim().split(':');
  if (parts.length === 1) {
    const one = parseA1(parts[0]);
    return one ? singleCell(one) : null;
  }
  if (parts.length !== 2) return null;
  const a = parseA1(parts[0]);
  const b = parseA1(parts[1]);
  return a && b ? normalizeRange(a, b) : null;
}

export function range(text: string): RangeAddr {
  const r = parseRange(text);
  if (!r) throw new Error(`Not a range: "${text}"`);
  return r;
}

export function rangeToA1(r: RangeAddr): string {
  const a = toA1(r.start);
  const b = toA1(r.end);
  return a === b ? a : `${a}:${b}`;
}

export const sameCell = (a: CellAddr, b: CellAddr): boolean => a.col === b.col && a.row === b.row;

export const sameRange = (a: RangeAddr, b: RangeAddr): boolean =>
  sameCell(a.start, b.start) && sameCell(a.end, b.end);

export const inRange = (addr: CellAddr, r: RangeAddr): boolean =>
  addr.col >= r.start.col && addr.col <= r.end.col && addr.row >= r.start.row && addr.row <= r.end.row;

export const rangeCols = (r: RangeAddr): number => r.end.col - r.start.col + 1;
export const rangeRows = (r: RangeAddr): number => r.end.row - r.start.row + 1;

/** Every cell in the range, row by row. */
export function cellsInRange(r: RangeAddr): CellAddr[] {
  const out: CellAddr[] = [];
  for (let row = r.start.row; row <= r.end.row; row++) {
    for (let col = r.start.col; col <= r.end.col; col++) out.push({ col, row });
  }
  return out;
}

export interface RefSpan {
  range: RangeAddr;
  /** Position in the scanned text. */
  start: number;
  end: number;
  text: string;
}

const SCAN_RE = new RegExp(`${REF_PATTERN}(?::${REF_PATTERN})?`, 'g');

/**
 * Finds cell and range references in formula text, including text that is only half typed
 * (so it can't be parsed yet). Used to colour references while the learner is editing.
 */
export function scanRefs(text: string): RefSpan[] {
  const out: RefSpan[] = [];
  let inString = false;
  let clean = '';
  // Blank out quoted text so "A1" inside a string isn't treated as a reference.
  for (const ch of text) {
    if (ch === '"') {
      inString = !inString;
      clean += ' ';
    } else {
      clean += inString ? ' ' : ch;
    }
  }
  SCAN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SCAN_RE.exec(clean)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    const before = start > 0 ? clean[start - 1] : '';
    const after = end < clean.length ? clean[end] : '';
    // Part of a longer name (e.g. LOG10, or SUM2x) or a function call: not a reference.
    if (/[A-Za-z0-9_.$]/.test(before) || /[A-Za-z0-9_.(]/.test(after)) continue;
    const r = parseRange(m[0]);
    if (r) out.push({ range: r, start, end, text: m[0] });
  }
  return out;
}

/**
 * A formula as it reads after being filled or copied `dCol` columns across and `dRow`
 * rows down. Plain references move with it; a `$` pins that part in place, which is the
 * whole point of `$`. A reference pushed off the edge of the sheet becomes #REF!.
 */
export function shiftFormula(raw: string, dCol: number, dRow: number): string {
  if (!raw.startsWith('=') || (dCol === 0 && dRow === 0)) return raw;
  let out = '';
  let at = 0;
  for (const span of scanRefs(raw)) {
    const parts = span.text.split(':').map((part) => {
      const ref = parseRef(part) as CellRef;
      const col = ref.absCol ? ref.col : ref.col + dCol;
      const row = ref.absRow ? ref.row : ref.row + dRow;
      return col < 0 || row < 0 ? null : refToString({ ...ref, col, row });
    });
    out += raw.slice(at, span.start) + (parts.includes(null) ? '#REF!' : parts.join(':'));
    at = span.end;
  }
  return out + raw.slice(at);
}
