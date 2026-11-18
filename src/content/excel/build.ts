import type { CellInput, SheetSpec } from '@/engine';
import type {
  ChoiceExercise,
  DemoExercise,
  Exercise,
  FixFormulaExercise,
  GridTaskExercise,
  Hints,
  PredictExercise,
  ScriptStep,
} from '@/lessons/types';
import { SheetController, type ToolId } from '@/spreadsheet/controller';

/**
 * Helpers for writing lessons. A lesson says what the learner should end up with
 * ("=AVERAGE(B2:B5) in B6"); these work out the taps that get there, so the worked
 * solution can never drift out of step with the answer.
 */

const TOKEN = /"[^"]*"|\$?[A-Z]{1,3}\$?[1-9][0-9]*|[A-Z][A-Z0-9]*\(|TRUE|FALSE|\d+(?:\.\d+)?|<=|>=|<>|[=+\-*/(),:<>&]/g;
const REF = /^(\$?)([A-Z]{1,3})(\$?)([1-9][0-9]*)$/;
const KEYPAD = new Set(['=', '+', '-', '*', '/', '(', ')', ':', ',']);

const tokensOf = (formula: string): string[] => formula.match(TOKEN) ?? [];

/** The ready-made pieces a formula needs that the keypad has no key for, in the order they appear. */
export function chipsIn(formula: string): string[] {
  const out: string[] = [];
  tokensOf(formula).forEach((token, i) => {
    let chip: string | null = null;
    if (token.endsWith('(')) chip = token === 'SUM(' ? null : token.slice(0, -1);
    else if (token.startsWith('"') || token === 'TRUE' || token === 'FALSE' || token === '&') chip = token;
    else if (['<', '>', '<=', '>=', '<>'].includes(token)) chip = token;
    else if (token === '=' && i > 0) chip = null;
    if (chip && !out.includes(chip)) out.push(chip);
  });
  return out;
}

/** How many presses of delete it takes to empty a cell holding `raw`, pieces coming out whole. */
function deletesFor(raw: string): number {
  const controller = new SheetController({ cols: 1, rows: 1, cells: { A1: raw } }, 'A1');
  controller.startEdit();
  let n = 0;
  while ((controller.getState().editing?.text ?? '') !== '' && n < 200) {
    controller.pressKey('backspace');
    n++;
  }
  return n;
}

interface TypingOptions {
  /** What is already in the cell and has to be deleted first. */
  replacing?: string;
  /**
   * Words for the steps that get a caption, in order: the first tap, each function,
   * each cell tapped, each ready-made word, and Enter. Leave out to use plain ones.
   * A null keeps that step silent.
   */
  says?: (string | null)[];
  /** Ranges are picked by dragging across them instead of tap, colon, tap. */
  drag?: boolean;
}

/** The taps and key presses that put `formula` into `cell`, exactly as a learner would make them. */
export function typing(cell: string, formula: string, opts: TypingOptions = {}): ScriptStep[] {
  const steps: ScriptStep[] = [];
  let slot = 0;
  const say = (plain: string): { say?: string } => {
    const given = opts.says ? opts.says[slot] : undefined;
    slot++;
    const words = opts.says ? (given ?? undefined) : plain;
    return words ? { say: words } : {};
  };

  steps.push({ tap: cell, ...say(`Tap ${cell}, then tap it again to type.`) });
  steps.push({ tap: cell });
  if (opts.replacing) {
    const n = deletesFor(opts.replacing);
    for (let i = 0; i < n; i++) steps.push(i === 0 ? { key: 'backspace', ...say('Delete what is there.') } : { key: 'backspace' });
  }

  const tokens = tokensOf(formula);
  // Brackets left open at the end are closed by Enter, so they are never typed.
  let last = tokens.length;
  while (last > 0 && tokens[last - 1] === ')') last--;

  for (let i = 0; i < last; i++) {
    const token = tokens[i];
    const next = tokens[i + 1];
    if (i === 0 && token === '=') {
      // A function key brings its own =.
      if (!next?.endsWith('(')) steps.push({ key: '=', ...say('Start with =') });
    } else if (token.endsWith('(')) {
      const name = token.slice(0, -1);
      steps.push(name === 'SUM' ? { key: 'SUM', ...say('Tap SUM.') } : { chip: name, ...say(`Tap ${name}.`) });
    } else if (REF.test(token)) {
      const m = REF.exec(token) as RegExpExecArray;
      const plain = `${m[2]}${m[4]}`;
      const end = tokens[i + 1] === ':' && REF.test(tokens[i + 2] ?? '') ? tokens[i + 2] : null;
      if (opts.drag && end && !token.includes('$') && !end.includes('$')) {
        steps.push({ drag: `${plain}:${end}`, ...say(`Drag from ${plain} to ${end}.`) });
        i += 2;
        continue;
      }
      steps.push({ tap: plain, ...say(`Tap ${plain}.`) });
      // $B$2 is one press of $ after the tap; B$2 two; $B2 three.
      const locks = m[1] && m[3] ? 1 : m[3] ? 2 : m[1] ? 3 : 0;
      for (let k = 0; k < locks; k++) steps.push(k === 0 ? { key: '$', ...say(`$ locks ${plain} in place.`) } : { key: '$' });
    } else if (/^\d/.test(token)) {
      for (const ch of token) steps.push({ key: ch as '0' });
    } else if (KEYPAD.has(token)) {
      steps.push({ key: token as '=' });
    } else if (token.startsWith('"') || token === 'TRUE' || token === 'FALSE') {
      steps.push({ chip: token, ...say(`Then ${token}.`) });
    } else {
      steps.push({ chip: token });
    }
  }
  steps.push({ key: 'enter', ...say('Enter.') });
  return steps;
}

interface Common {
  id: string;
  skill: string;
  prompt: string;
  explain: string;
  tips: string[];
  sheet: SheetSpec;
  /** A practical task set in a real situation: the "Apply" step. */
  apply?: boolean;
  praise?: string;
}

interface FormulaTask extends Common {
  /** Where the answer goes. */
  cell: string;
  /** A formula that is right. Any formula that gives the same answers passes too. */
  formula: string;
  /** Set when the task is about this function, so a different route to the right number is sent back. */
  uses?: string;
  /** The first two hints: a nudge, then the shape. The third is the formula itself. */
  hints: [string, string];
  /** Pieces to show above the keys besides the ones the answer needs. */
  moreChips?: string[];
  tools?: ToolId[];
  /** Captions for the worked solution, in place of the plain ones. */
  says?: (string | null)[];
  drag?: boolean;
}

const checksFor = (o: FormulaTask) => [
  { type: 'outcome' as const, cell: o.cell, reference: o.formula },
  ...(o.uses ? [{ type: 'formulaUses' as const, cell: o.cell, fn: o.uses }] : []),
];

const chipsFor = (o: FormulaTask, also: string[] = []): { chips?: string[] } => {
  const chips = [...new Set([...also, ...chipsIn(o.formula), ...(o.moreChips ?? [])])];
  return chips.length > 0 ? { chips } : {};
};

const base = (o: Common) => ({
  id: o.id,
  skill: o.skill,
  prompt: o.prompt,
  explain: o.explain,
  tips: o.tips,
  sheet: o.sheet,
  ...(o.apply ? { apply: true } : {}),
  ...(o.praise ? { praise: o.praise } : {}),
});

/** "Put this formula in that cell": the everyday exercise. */
export function task(o: FormulaTask): GridTaskExercise {
  return {
    ...base(o),
    type: 'grid-task',
    checks: checksFor(o),
    hints: [o.hints[0], o.hints[1], o.formula] as unknown as Hints,
    solution: typing(o.cell, o.formula, { says: o.says, drag: o.drag }),
    ...chipsFor(o),
    ...(o.tools ? { tools: o.tools } : {}),
  };
}

/** A cell already holds something wrong (an error, the wrong cells, the wrong function) and has to be put right. */
export function fix(o: FormulaTask & { broken: string }): FixFormulaExercise {
  return {
    ...base(o),
    sheet: { ...o.sheet, cells: { ...o.sheet.cells, [o.cell]: o.broken } },
    type: 'fix-formula',
    checks: checksFor(o),
    hints: [o.hints[0], o.hints[1], o.formula] as unknown as Hints,
    solution: typing(o.cell, o.formula, { replacing: o.broken, says: o.says }),
    ...chipsFor(o),
  };
}

/** The app shows how on one cell, then the learner does the next one. */
export function demo(o: FormulaTask & { script: ScriptStep[]; scriptChips?: string[] }): DemoExercise {
  return {
    ...base(o),
    type: 'demo',
    script: o.script,
    checks: checksFor(o),
    hints: [o.hints[0], o.hints[1], o.formula] as unknown as Hints,
    solution: typing(o.cell, o.formula, { says: o.says, drag: o.drag }),
    // Whatever the demonstration presses has to be on the keyboard too.
    ...chipsFor(o, [...(o.scriptChips ?? []), ...o.script.flatMap((step) => ('chip' in step ? [step.chip] : []))]),
    ...(o.tools ? { tools: o.tools } : {}),
  };
}

/** "What will this formula show?" The right option is worked out by the engine, not written here. */
export function predict(o: Common & { cell: string; formula: string; options: string[]; hints: Hints }): PredictExercise {
  return { ...base(o), type: 'predict-output', cell: o.cell, formula: o.formula, options: o.options, hints: o.hints };
}

/** A question about an idea. `right` is the position of the correct option (or options), counting from 0. */
export function choice(
  o: Omit<Common, 'sheet'> & { sheet?: SheetSpec; options: string[]; right: number | number[]; hints: Hints },
): ChoiceExercise {
  return {
    id: o.id,
    skill: o.skill,
    prompt: o.prompt,
    explain: o.explain,
    tips: o.tips,
    type: 'choice',
    options: o.options,
    correct: Array.isArray(o.right) ? o.right : [o.right],
    hints: o.hints,
    ...(o.sheet ? { sheet: o.sheet } : {}),
  };
}

const bold = { bold: true };

/**
 * A small table: a row of headings, then the data. Headings are bold, as is the label
 * of a totals row when `footer` names one.
 */
export function table(headings: string[], rows: CellInput[][], opts: { footer?: string; rows?: number; cells?: Record<string, CellInput> } = {}): SheetSpec {
  const grid: CellInput[][] = [headings, ...rows, ...(opts.footer ? [[opts.footer]] : [])];
  const lastHeading = String.fromCharCode(64 + headings.length);
  return {
    cols: headings.length,
    rows: opts.rows ?? grid.length,
    grid,
    ...(opts.cells ? { cells: opts.cells } : {}),
    formats: { [`A1:${lastHeading}1`]: bold, ...(opts.footer ? { [`A${grid.length}`]: bold } : {}) },
  };
}

/** The same sheet with some cells filled in, for exercises that build on earlier ones. */
export const withCells = (sheet: SheetSpec, cells: Record<string, CellInput>): SheetSpec => ({
  ...sheet,
  cells: { ...sheet.cells, ...cells },
});

/** Takes `count` tips starting at `from`, wrapping round, so a lesson can share a pool without repeats. */
export const tipsFrom = (pool: readonly string[], from: number, count = 1): string[] =>
  Array.from({ length: count }, (_, i) => pool[(from + i) % pool.length]);

export type { Exercise };
