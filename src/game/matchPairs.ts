import { colToLetters } from '@/engine';
import type { Computer } from '@/spreadsheet/shortcuts';

import { int, rng, shuffle, type Rng } from './random';
import { answerLabel, GAME_SHORTCUTS } from './speedTrial';

/**
 * Match Pairs: two columns of tiles, and the learner joins each item to its partner. One
 * game serves every category below; each pair belongs to the skill that teaches it, so a
 * round only holds what the learner has been taught, and rounds lean on what is newest.
 */

const PURPOSE = 'xl.spreadsheet.purpose';
const ADDRESS = 'xl.cell.address';
const TYPE = 'xl.cell.type';
const COLUMN = 'xl.select.column';
const ROW = 'xl.select.row';
const EXTEND = 'xl.select.extend';
const ARITHMETIC = 'xl.formula.arithmetic';
const SUM_RANGE = 'xl.sum.range';
const AVERAGE = 'xl.average';
const MINMAX = 'xl.minmax';
const COUNT = 'xl.count';
const FILL = 'xl.fill';
const ABSOLUTE = 'xl.absolute';
const COMPARE = 'xl.compare';
const IF = 'xl.if';
const COUNTIF = 'xl.countif';
const SUMIF = 'xl.sumif';
const XLOOKUP = 'xl.xlookup';
const VLOOKUP = 'xl.vlookup';
const IFERROR = 'xl.iferror';
const BOLD = 'xl.bold';
const NUMFMT = 'xl.numfmt';

export const CATEGORIES = [
  { id: 'terms', title: 'Spreadsheet words', about: 'Terms and what they mean' },
  { id: 'refs', title: 'Cell references', about: 'Addresses and the cells they name' },
  { id: 'shortcuts', title: 'Shortcuts', about: 'Keys and what they do' },
  { id: 'symbols', title: 'Symbols', about: 'Signs used in formulas' },
  { id: 'functions', title: 'Functions', about: 'Functions and their purposes' },
  { id: 'results', title: 'Formulas and results', about: 'What a formula works out' },
  { id: 'errors', title: 'Error values', about: 'What each error means' },
  { id: 'formats', title: 'Formatting', about: 'Toolbar buttons and what they do' },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]['id'];

/** What a tile shows: words, a formula or keys in a code face, a toolbar button, or a little grid with cells lit. */
export type Face = { text: string; code?: boolean } | { icon: string; label: string } | { cells: string };

export interface Pair {
  id: string;
  category: CategoryId;
  skill: string;
  left: Face;
  right: Face;
  /** Said when this pair's first tile is joined to the wrong partner: a nudge, not the answer. */
  clue: string;
}

type Fixed = Omit<Pair, 'category'>;
const words = (text: string): Face => ({ text });
const code = (text: string): Face => ({ text, code: true });

const TERMS: Fixed[] = [
  { id: 'term.row', skill: PURPOSE, left: words('Row'), right: words('Cells across, numbered 1, 2, 3'), clue: 'Rows run across the sheet, and each has a number.' },
  { id: 'term.column', skill: PURPOSE, left: words('Column'), right: words('Cells down, lettered A, B, C'), clue: 'Columns run down the sheet, and each has a letter.' },
  { id: 'term.cell', skill: PURPOSE, left: words('Cell'), right: words('One box, where a row and column meet'), clue: 'A cell is the smallest part of the grid.' },
  { id: 'term.select', skill: PURPOSE, left: words('Select'), right: words('Make a cell the one you are working on'), clue: 'Selecting comes before typing or copying.' },
  { id: 'term.address', skill: ADDRESS, left: words('Cell address'), right: words('Column letter, then row number'), clue: 'An address such as B3 is how a cell is named.' },
  { id: 'term.active', skill: ADDRESS, left: words('Active cell'), right: words('The outlined cell, where typing goes'), clue: 'Only one cell is active at a time.' },
  { id: 'term.namebox', skill: ADDRESS, left: words('Name Box'), right: words('Shows the address of the active cell'), clue: 'The Name Box sits at the left of the formula bar.' },
  { id: 'term.edit', skill: TYPE, left: words('Edit a cell'), right: words('Change part of what it holds'), clue: 'Editing keeps what is there and changes some of it.' },
  { id: 'term.range', skill: COLUMN, left: words('Range'), right: words('A block of cells, named by its corners'), clue: 'B1:B5 is a range.' },
  { id: 'term.formula', skill: ARITHMETIC, left: words('Formula'), right: words('Starts with = and works out a result'), clue: 'A formula calculates; it always starts the same way.' },
  { id: 'term.function', skill: SUM_RANGE, left: words('Function'), right: words('A named calculation, such as SUM'), clue: 'A function has a name and brackets.' },
  { id: 'term.fill', skill: FILL, left: words('Fill handle'), right: words('The square that copies a formula as you drag'), clue: 'It sits at the bottom-right corner of the selection.' },
  { id: 'term.absolute', skill: ABSOLUTE, left: words('Absolute reference'), right: words('A reference that stays put when filled'), clue: 'The $ sign is what keeps it in place.' },
  { id: 'term.logical', skill: COMPARE, left: words('TRUE or FALSE'), right: words('What a comparison returns'), clue: 'Think of what =B2>10 shows.' },
];

const SYMBOLS: Fixed[] = [
  { id: 'sym.equals', skill: ARITHMETIC, left: code('='), right: words('Starts every formula'), clue: 'This sign comes first in a formula.' },
  { id: 'sym.plus', skill: ARITHMETIC, left: code('+'), right: words('Add'), clue: 'The same sign as on paper.' },
  { id: 'sym.minus', skill: ARITHMETIC, left: code('-'), right: words('Subtract'), clue: 'The same sign as on paper.' },
  { id: 'sym.times', skill: ARITHMETIC, left: code('*'), right: words('Multiply'), clue: 'Spreadsheets use the asterisk instead of ×.' },
  { id: 'sym.divide', skill: ARITHMETIC, left: code('/'), right: words('Divide'), clue: 'Spreadsheets use the slash instead of ÷.' },
  { id: 'sym.colon', skill: COLUMN, left: code(':'), right: words('“To”, between the corners of a range'), clue: 'B1:B5 reads “B1 to B5”.' },
  { id: 'sym.dollar', skill: ABSOLUTE, left: code('$'), right: words('Locks a column or row in a reference'), clue: 'It appears in references such as $B$1.' },
  { id: 'sym.gt', skill: COMPARE, left: code('>'), right: words('Greater than'), clue: 'The wide end faces the bigger number.' },
  { id: 'sym.lt', skill: COMPARE, left: code('<'), right: words('Less than'), clue: 'The point faces the smaller number.' },
  { id: 'sym.gte', skill: COMPARE, left: code('>='), right: words('Greater than or equal to'), clue: 'Two signs: one compares, one allows equal.' },
  { id: 'sym.ne', skill: COMPARE, left: code('<>'), right: words('Not equal to'), clue: 'Less than or greater than: anything but equal.' },
];

const FUNCTIONS: Fixed[] = [
  { id: 'fn.sum', skill: SUM_RANGE, left: code('SUM'), right: words('Adds the numbers'), clue: 'The function for a total.' },
  { id: 'fn.average', skill: AVERAGE, left: code('AVERAGE'), right: words('The total divided by how many'), clue: 'The typical value of a list.' },
  { id: 'fn.min', skill: MINMAX, left: code('MIN'), right: words('The smallest number'), clue: 'Short for minimum.' },
  { id: 'fn.max', skill: MINMAX, left: code('MAX'), right: words('The largest number'), clue: 'Short for maximum.' },
  { id: 'fn.count', skill: COUNT, left: code('COUNT'), right: words('How many cells hold numbers'), clue: 'It counts cells, and only cells with numbers.' },
  { id: 'fn.if', skill: IF, left: code('IF'), right: words('One result if a test is true, another if not'), clue: 'It makes a decision.' },
  { id: 'fn.countif', skill: COUNTIF, left: code('COUNTIF'), right: words('How many cells match a condition'), clue: 'COUNT, but only what matches.' },
  { id: 'fn.sumif', skill: SUMIF, left: code('SUMIF'), right: words('Adds only the cells that match'), clue: 'SUM, but only what matches.' },
  { id: 'fn.xlookup', skill: XLOOKUP, left: code('XLOOKUP'), right: words('Finds a value, returns its partner from another list'), clue: 'The newer lookup: a list to search and a list to return.' },
  { id: 'fn.vlookup', skill: VLOOKUP, left: code('VLOOKUP'), right: words('Searches a table’s first column, returns from further right'), clue: 'V is for vertical: it looks down a column.' },
  { id: 'fn.iferror', skill: IFERROR, left: code('IFERROR'), right: words('Shows something else when a formula fails'), clue: 'It catches error values.' },
];

const ERRORS: Fixed[] = [
  { id: 'err.div0', skill: IFERROR, left: code('#DIV/0!'), right: words('A number was divided by zero'), clue: 'DIV is short for divide.' },
  { id: 'err.name', skill: IFERROR, left: code('#NAME?'), right: words('A name in the formula is misspelt'), clue: 'The spreadsheet did not recognise a word.' },
  { id: 'err.na', skill: IFERROR, left: code('#N/A'), right: words('A lookup found no match'), clue: 'N/A: not available.' },
];

const FORMATS: Fixed[] = [
  { id: 'fmt.bold', skill: BOLD, left: { icon: 'B', label: 'Bold button' }, right: words('Makes text heavier, for headings'), clue: 'B for Bold.' },
  { id: 'fmt.currency', skill: NUMFMT, left: { icon: '$', label: 'Currency button' }, right: words('Shows a number as money'), clue: 'The dollar sign: for prices.' },
  { id: 'fmt.percent', skill: NUMFMT, left: { icon: '%', label: 'Percent button' }, right: words('Shows 0.25 as 25%'), clue: 'Per cent: out of a hundred.' },
];

/** Shortcuts come from Speed Trial's list, so the two games always agree, in Ctrl or Cmd. */
function shortcutPairs(computer: Computer): Pair[] {
  return GAME_SHORTCUTS.map((s) => ({
    id: `key.${s.id}`,
    category: 'shortcuts' as const,
    skill: s.skill,
    left: code(answerLabel(s, computer)),
    right: words(s.task),
    clue: `${s.cue.charAt(0).toUpperCase()}${s.cue.slice(1)}.`,
  }));
}

/**
 * References: made fresh each round, so the same addresses do not keep coming up. Single
 * cells once addresses are taught; whole rows and columns, and blocks, as those are.
 */
function referencePairs(r: Rng, taught: ReadonlySet<string>): Pair[] {
  const out: Pair[] = [];
  const used = new Set<string>();
  const add = (skill: string, ref: string, clue: string) => {
    if (used.has(ref)) return;
    used.add(ref);
    out.push({ id: `ref.${ref}`, category: 'refs', skill, left: code(ref), right: { cells: ref }, clue });
  };
  const letter = (lo: number, hi: number) => colToLetters(int(r, lo, hi));
  if (taught.has(ADDRESS)) {
    for (let i = 0; i < 8; i++) add(ADDRESS, `${letter(0, 4)}${int(r, 1, 5)}`, 'The letter is the column, counted across; the number is the row, counted down.');
  }
  if (taught.has(COLUMN)) {
    const col = letter(0, 4);
    add(COLUMN, `${col}1:${col}5`, 'Same letter at both ends: one column, top to bottom.');
  }
  if (taught.has(ROW)) {
    const row = int(r, 1, 5);
    add(ROW, `A${row}:E${row}`, 'Same number at both ends: one row, left to right.');
  }
  if (taught.has(EXTEND)) {
    for (let i = 0; i < 3; i++) {
      const c0 = int(r, 0, 2);
      const r0 = int(r, 1, 3);
      add(EXTEND, `${colToLetters(c0)}${r0}:${colToLetters(c0 + int(r, 1, 2))}${r0 + int(r, 1, 2)}`, 'A block is named by its top-left and bottom-right corners.');
    }
  }
  return out;
}

/** Formulas and what they return. Plain arithmetic, so nothing depends on a sheet. */
function resultPairs(r: Rng, taught: ReadonlySet<string>): Pair[] {
  const out: Pair[] = [];
  const seen = new Set<string>();
  const add = (skill: string, formula: string, result: string, clue: string) => {
    if (seen.has(result)) return;
    seen.add(result);
    out.push({ id: `res.${formula}`, category: 'results', skill, left: code(formula), right: code(result), clue });
  };
  if (taught.has(ARITHMETIC)) {
    const a = int(r, 2, 9);
    const b = int(r, 2, 6);
    const c = int(r, 2, 5);
    add(ARITHMETIC, `=${a}+${b}*${c}`, String(a + b * c), 'Multiplying comes before adding.');
    add(ARITHMETIC, `=(${a}+${b})*${c}`, String((a + b) * c), 'Brackets are worked out first.');
    const d = int(r, 2, 5) * 2;
    add(ARITHMETIC, `=${d * 3}/${d}`, '3', 'The slash divides.');
    const e = int(r, 10, 40);
    const f = int(r, 1, 9);
    add(ARITHMETIC, `=${e}-${f}`, String(e - f), 'The minus sign subtracts.');
  }
  if (taught.has(COMPARE)) {
    const x = int(r, 5, 20);
    add(COMPARE, `=${x}>${x - int(r, 1, 4)}`, 'TRUE', 'A comparison answers TRUE or FALSE.');
    add(COMPARE, `=${x}<${x - int(r, 1, 4)}`, 'FALSE', 'A comparison answers TRUE or FALSE.');
  }
  if (taught.has(IF)) {
    const y = int(r, 30, 80);
    add(IF, `=IF(${y}>=50,"Keep","Reorder")`, y >= 50 ? '“Keep”' : '“Reorder”', 'IF gives its first answer when the test is true.');
  }
  return out;
}

const FIXED: Record<Exclude<CategoryId, 'shortcuts' | 'refs' | 'results'>, Fixed[]> = {
  terms: TERMS,
  symbols: SYMBOLS,
  functions: FUNCTIONS,
  errors: ERRORS,
  formats: FORMATS,
};

/** Every pair the learner could be given now, in all categories. */
export function availablePairs(taught: ReadonlySet<string>, computer: Computer, seed: number): Pair[] {
  const r = rng(seed);
  const fixed = (Object.keys(FIXED) as (keyof typeof FIXED)[]).flatMap((category) => FIXED[category].map((p) => ({ ...p, category })));
  return [...fixed, ...shortcutPairs(computer), ...referencePairs(r, taught), ...resultPairs(r, taught)].filter((p) => taught.has(p.skill));
}

/** A category needs this many pairs before it can be played on its own. */
export const MIN_PAIRS = 3;

/** Pairs on a board, by how hard the game has become. */
export const boardSize = (tier: 1 | 2 | 3): number => (tier === 1 ? 4 : tier === 2 ? 5 : 6);

/** How many boards one go has. */
export const BOARDS = 2;

/** Two tiles in one round may not look the same, or a pair would be ambiguous ($ for money and $ for locking). */
const faceKey = (f: Face): string => ('text' in f ? f.text : 'icon' in f ? f.icon : f.cells);

/**
 * The boards for one go: `category` or a mix of everything taught. Up to half of each
 * board is drawn from the newest skills, so the game reinforces what was just learned.
 */
export function buildBoards(pairs: readonly Pair[], category: CategoryId | 'mixed', tier: 1 | 2 | 3, newest: readonly string[], seed: number): Pair[][] {
  const r = rng(seed + 7);
  const pool = category === 'mixed' ? pairs : pairs.filter((p) => p.category === category);
  const size = Math.min(boardSize(tier), pool.length);
  const used = new Set<string>();
  const boards: Pair[][] = [];
  for (let b = 0; b < BOARDS; b++) {
    const board: Pair[] = [];
    const faces = new Set<string>();
    const fits = (p: Pair) => !board.includes(p) && !faces.has(faceKey(p.left)) && !faces.has(faceKey(p.right));
    const take = (p: Pair) => {
      board.push(p);
      faces.add(faceKey(p.left));
      faces.add(faceKey(p.right));
      used.add(p.id);
    };
    // Fresh pairs before repeats, newest skills first, then anything.
    const fresh = shuffle(r, pool.filter((p) => !used.has(p.id)));
    const ordered = [...fresh.filter((p) => newest.includes(p.skill)).slice(0, Math.ceil(size / 2)), ...fresh, ...shuffle(r, pool)];
    // A mixed board spreads across categories rather than filling up with one.
    if (category === 'mixed') {
      for (const c of shuffle(r, [...new Set(ordered.map((p) => p.category))])) {
        const first = ordered.find((p) => p.category === c && fits(p));
        if (first && board.length < size) take(first);
      }
    }
    for (const p of ordered) if (board.length < size && fits(p)) take(p);
    if (board.length >= 2) boards.push(board);
  }
  return boards;
}

/** Which categories can be played now, and how many pairs each has. */
export function categoryCounts(pairs: readonly Pair[]): Record<CategoryId, number> {
  const out = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0])) as Record<CategoryId, number>;
  for (const p of pairs) out[p.category]++;
  return out;
}

/** The skill whose lesson opens a category first, for "Opens after …". */
export function firstSkillOf(category: CategoryId): string {
  const sample1: Record<CategoryId, string> = {
    terms: PURPOSE,
    refs: ADDRESS,
    shortcuts: TYPE,
    symbols: ARITHMETIC,
    functions: SUM_RANGE,
    results: ARITHMETIC,
    errors: IFERROR,
    formats: BOLD,
  };
  return sample1[category];
}

/** The right-hand tiles in a shuffled order, so partners never sit side by side. */
export function rightOrder(board: readonly Pair[], seed: number): Pair[] {
  const r = rng(seed + 31);
  for (let tries = 0; tries < 8; tries++) {
    const order = shuffle(r, board);
    if (board.length < 3 || order.every((p, i) => p !== board[i])) return order;
  }
  return shuffle(r, board);
}

