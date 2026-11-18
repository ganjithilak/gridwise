import { ERROR_CODES, FormulaSyntaxError } from './errors';
import { isRefText } from './refs';

export type TokenType =
  | 'num'
  | 'str'
  | 'ident'
  | 'ref'
  | 'err'
  | 'op'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'colon';

export interface Token {
  type: TokenType;
  /** Exactly as written in the formula. */
  text: string;
  start: number;
  end: number;
}

const isDigit = (ch: string | undefined): boolean => ch !== undefined && ch >= '0' && ch <= '9';
const isIdentStart = (ch: string): boolean => /[A-Za-z_$]/.test(ch);
const isIdentPart = (ch: string | undefined): boolean => ch !== undefined && /[A-Za-z0-9_.$]/.test(ch);
const isSpace = (ch: string | undefined): boolean =>
  ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === ' ';

const TWO_CHAR_OPS = ['<=', '>=', '<>'];
const ONE_CHAR_OPS = '+-*/^&=<>%';

/** Splits a formula body (the part after `=`) into tokens. */
export function tokenize(src: string): Token[] {
  const out: Token[] = [];
  const n = src.length;
  let i = 0;

  const push = (type: TokenType, start: number, end: number) => {
    out.push({ type, text: src.slice(start, end), start, end });
  };

  while (i < n) {
    const ch = src[i];
    if (isSpace(ch)) {
      i++;
      continue;
    }
    const start = i;

    if (isDigit(ch) || (ch === '.' && isDigit(src[i + 1]))) {
      while (isDigit(src[i])) i++;
      if (src[i] === '.') {
        i++;
        while (isDigit(src[i])) i++;
      }
      if (src[i] === 'E' || src[i] === 'e') {
        const sign = src[i + 1] === '+' || src[i + 1] === '-' ? 1 : 0;
        if (isDigit(src[i + 1 + sign])) {
          i += 1 + sign;
          while (isDigit(src[i])) i++;
        }
      }
      push('num', start, i);
      continue;
    }

    if (ch === '"') {
      i++;
      let closed = false;
      while (i < n) {
        if (src[i] === '"') {
          if (src[i + 1] === '"') {
            i += 2;
            continue;
          }
          closed = true;
          i++;
          break;
        }
        i++;
      }
      if (!closed) throw new FormulaSyntaxError('Text inside a formula needs a closing quote ".', start);
      push('str', start, i);
      continue;
    }

    if (ch === '#') {
      const rest = src.slice(i).toUpperCase();
      const code = ERROR_CODES.find((c) => rest.startsWith(c));
      if (!code) throw new FormulaSyntaxError('A # can only be used in an error value such as #N/A.', start);
      i += code.length;
      push('err', start, i);
      continue;
    }

    if (isIdentStart(ch)) {
      while (isIdentPart(src[i])) i++;
      let look = i;
      while (isSpace(src[look])) look++;
      const text = src.slice(start, i);
      const isCall = src[look] === '(';
      push(!isCall && isRefText(text) ? 'ref' : 'ident', start, i);
      continue;
    }

    const two = src.slice(i, i + 2);
    if (TWO_CHAR_OPS.includes(two)) {
      i += 2;
      push('op', start, i);
      continue;
    }
    if (ONE_CHAR_OPS.includes(ch)) {
      i++;
      push('op', start, i);
      continue;
    }
    if (ch === '(') {
      i++;
      push('lparen', start, i);
      continue;
    }
    if (ch === ')') {
      i++;
      push('rparen', start, i);
      continue;
    }
    if (ch === ',') {
      i++;
      push('comma', start, i);
      continue;
    }
    if (ch === ':') {
      i++;
      push('colon', start, i);
      continue;
    }
    if (ch === ';') {
      throw new FormulaSyntaxError('Use a comma , to separate the parts of a function, not a semicolon.', start);
    }
    throw new FormulaSyntaxError(`A formula can't contain "${ch}" here.`, start);
  }
  return out;
}
