import { isError, type Scalar } from './errors';

export type NumFmt = 'general' | 'currency' | 'percent' | 'date';

/**
 * Rounds half away from zero, treating the number as the decimal it prints as.
 * Math.round and toFixed get both of these wrong: -2.5 must give -3, and 2.675 to
 * two places must give 2.68.
 */
export function roundHalfAway(n: number, digits: number): number {
  if (!Number.isFinite(n) || n === 0) return n;
  const sign = n < 0 ? -1 : 1;
  const abs = Number(Math.abs(n).toPrecision(15));
  const text = String(abs);
  if (text.includes('e')) {
    const factor = 10 ** digits;
    return (sign * Math.round(abs * factor)) / factor;
  }
  // Shift the decimal point as text so no binary multiplication error creeps in.
  const shifted = Number(`${text}e${digits}`);
  const rounded = Math.round(shifted);
  const result = Number(`${rounded}e${-digits}`);
  return result === 0 ? 0 : sign * result;
}

const group = (digits: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Longest plain-decimal text Excel will write before switching to scientific notation. */
const MAX_PLAIN_CHARS = 20;

/**
 * A number as Excel writes it when it becomes text (General format): at most 15
 * significant digits and no thousands separators. It stays a plain decimal while that
 * takes 20 characters or fewer (not counting a minus sign), and otherwise switches to
 * scientific notation with a two-digit exponent. Both limits come from the parity workbook.
 */
export function formatGeneral(n: number): string {
  if (!Number.isFinite(n)) return '#NUM!';
  if (n === 0) return '0';
  const sign = n < 0 ? '-' : '';
  const [mantissa, expText] = Math.abs(n).toExponential(14).split('e');
  const exp = Number(expText);
  const digits = mantissa.replace('.', '').replace(/0+$/, '') || '0';

  let plain: string;
  if (exp < 0) plain = `0.${'0'.repeat(-exp - 1)}${digits}`;
  else if (digits.length <= exp + 1) plain = digits + '0'.repeat(exp + 1 - digits.length);
  else plain = `${digits.slice(0, exp + 1)}.${digits.slice(exp + 1)}`;
  if (plain.length <= MAX_PLAIN_CHARS) return sign + plain;

  const lead = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits;
  const size = Math.abs(exp);
  return `${sign}${lead}E${exp < 0 ? '-' : '+'}${size < 10 ? '0' : ''}${size}`;
}

export function formatCurrency(n: number): string {
  const rounded = roundHalfAway(Math.abs(n), 2);
  const [whole, cents] = rounded.toFixed(2).split('.');
  const sign = n < 0 && rounded !== 0 ? '-' : '';
  return `${sign}$${group(whole)}.${cents}`;
}

export function formatPercent(n: number): string {
  return `${formatGeneral(roundHalfAway(n * 100, 0))}%`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A day number as a date, written so nobody has to guess which part is the month:
 * 16 Mar 2026. Excel's own short date depends on the computer's region.
 */
export function formatDate(serial: number): string {
  if (!Number.isFinite(serial) || serial < 0) return '#'.repeat(8);
  const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatNumber(n: number, fmt: NumFmt = 'general'): string {
  if (fmt === 'currency') return formatCurrency(n);
  if (fmt === 'percent') return formatPercent(n);
  if (fmt === 'date') return formatDate(n);
  return formatGeneral(n);
}

/** What a value looks like as text, e.g. in the result of `&` or in feedback messages. */
export function formatScalar(v: Scalar, fmt: NumFmt = 'general'): string {
  if (v === null) return '';
  if (isError(v)) return v.code;
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return formatNumber(v, fmt);
  return v;
}

/**
 * A number as it appears in a cell that is `maxChars` wide. Like Excel, decimals are
 * rounded to fit, and a number whose whole part can't fit shows as ####.
 */
export function fitNumber(n: number, fmt: NumFmt, maxChars: number): string {
  const full = formatNumber(n, fmt);
  if (full.length <= maxChars) return full;
  const hashes = '#'.repeat(Math.max(1, maxChars));
  if (fmt !== 'general' || full.includes('E')) return hashes;
  const dot = full.indexOf('.');
  if (dot === -1) return hashes;
  if (dot > maxChars) return hashes;
  const decimals = maxChars - dot - 1;
  const fitted = formatGeneral(roundHalfAway(n, Math.max(0, decimals)));
  return fitted.length <= maxChars ? fitted : hashes;
}

export type CellAlign = 'left' | 'right' | 'center';

/** Excel's default alignment: numbers right, text left, TRUE/FALSE and errors centred. */
export function alignFor(v: Scalar): CellAlign {
  if (typeof v === 'number') return 'right';
  if (typeof v === 'boolean' || isError(v)) return 'center';
  return 'left';
}
