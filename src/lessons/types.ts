import type { CellInput, NumFmt, SheetSpec } from '@/engine';
import type { KeyId, ShortcutId, ToolId } from '@/spreadsheet/controller';

/**
 * One thing the learner (or the app, in a demo) does to the sheet. Each is carried out
 * through the same controller the learner's own taps go through.
 */
export type ScriptStep =
  /** Tap a cell. */
  | { tap: string; say?: string }
  /** Press a key on the formula keyboard. */
  | { key: KeyId; say?: string }
  /** Press one of the ready-made pieces above the keys: a function name, a word or a sign. */
  | { chip: string; say?: string }
  /** Drag across a block of cells ("B2:B6"), from its first cell to its last. */
  | { drag: string; say?: string }
  /** Drag the fill handle so the selection covers this block ("D2:D6"). */
  | { fill: string; say?: string }
  /** Press a toolbar button. */
  | { tool: ToolId; say?: string }
  /** Press a keyboard shortcut. */
  | { combo: ShortcutId; say?: string }
  /** Cell only speaks: nothing on the sheet changes, so the selection stays where it was. */
  | { say: string };

export type Check =
  /**
   * The default. The cell must hold a formula that gives the same answer as `reference`,
   * both on the numbers shown and on hidden replacement numbers, so a typed-in answer
   * or a hard-coded number can't pass.
   */
  | { type: 'outcome'; cell: string; reference: string }
  | { type: 'cellValue'; cell: string; equals: CellInput }
  | { type: 'cellIsFormula'; cell: string }
  /**
   * Only for exercises whose skill *is* this function. If the answer is right without
   * it, the learner is asked to redo it with the function, and it isn't counted as a miss.
   */
  | { type: 'formulaUses'; cell: string; fn: string }
  /**
   * The learner has filled a formula over `range`. Every cell must give what `reference`
   * gives when it is filled from the first cell of the range.
   */
  | { type: 'filledResults'; range: string; reference: string }
  /**
   * For `$` exercises: the learner's formula in `cell` is filled over `over` behind the
   * scenes and every result is compared. Whether there is a `$` in it is never looked at,
   * only whether it behaves.
   */
  | { type: 'fillsCorrectly'; cell: string; over: string; reference: string }
  /** These cells, and only these, are selected. */
  | { type: 'selectionEquals'; range: string }
  | { type: 'cellFormat'; range: string; bold?: boolean; numFmt?: NumFmt }
  /** The values down this column are in order. */
  | { type: 'rangeSorted'; range: string; descending?: boolean }
  /** The shortcut itself was pressed, not just its effect reached some other way. */
  | { type: 'usedShortcut'; id: ShortcutId }
  /** Something was really taken back with Undo. The sheet looking unchanged is not enough. */
  | { type: 'undid' };

/** Nudge, then structure, then the answer (which the learner still enters themselves). */
export type Hints = readonly [string, string, string];

interface ExerciseBase {
  /** Permanent. Never reuse or rename; see content/ids.ts. */
  id: string;
  skill: string;
  /** What to do, in words the lesson has already taught. `{mod}` becomes Ctrl or Cmd. */
  prompt: string;
  /** One line shown once it's right: why this works. */
  explain: string;
  /**
   * Basic facts, shown one at a time under the grid while the learner works ("Every
   * formula starts with ="). They take turns each time that space comes back, starting
   * with the first. A tip is about the idea and never the answer, so it is free.
   */
  tips: readonly string[];
  hints: Hints;
  /**
   * The "Apply" step of a lesson: a practical task, set in a real situation, done without
   * a demonstration. Every lesson has at least one, after its teaching.
   */
  apply?: boolean;
  /** Said when it is right, in place of the usual "Nice!". For a task with its own wording. */
  praise?: string;
}

/** Everything that happens on the live grid. */
interface GridBase extends ExerciseBase {
  sheet: SheetSpec;
  /** Cell selected when the exercise opens. */
  select?: string;
  checks: Check[];
  /** The worked solution, played by "Show me" and used to prove the exercise is solvable. */
  solution: ScriptStep[];
  /** Toolbar buttons this task needs. `fill` turns on the handle at the selection's corner. */
  tools?: ToolId[];
  /**
   * Ready-made pieces shown above the keys: function names (AVERAGE), words ("Hit")
   * and signs (>) that the keypad has no key for. Five at most.
   */
  chips?: string[];
}

export interface GridTaskExercise extends GridBase {
  type: 'grid-task';
}

/**
 * Teach before testing: the app performs `script` on the sheet while the learner watches,
 * then the learner does the same thing on the next piece of data. Not scored.
 */
export interface DemoExercise extends GridBase {
  type: 'demo';
  script: ScriptStep[];
}

/** A sheet with something wrong in it (an error value, a formula pointing at the wrong cells) to put right. */
export interface FixFormulaExercise extends GridBase {
  type: 'fix-formula';
}

/** A keyboard shortcut, pressed on the key caps (or a real keyboard on the web). One per lesson at most. */
export interface ShortcutExercise extends GridBase {
  type: 'shortcut-press';
}

/**
 * The formula is assembled from pieces instead of typed. `tokens` are shown in the
 * order given and go in exactly as written ("SUM(", "B2", ":"), with a few that
 * don't belong mixed in.
 */
export interface FormulaBuildExercise extends GridBase {
  type: 'formula-build';
  /** The cell the formula goes in. */
  cell: string;
  tokens: string[];
}

/** Read a formula and say what it will show. Exactly one option is what it really gives. */
export interface PredictExercise extends ExerciseBase {
  type: 'predict-output';
  sheet: SheetSpec;
  formula: string;
  /** Where the formula sits on the sheet. */
  cell: string;
  options: string[];
}

/** A question about an idea. Kept to about one in five exercises: this app is for doing. */
export interface ChoiceExercise extends ExerciseBase {
  type: 'choice';
  options: string[];
  /** Positions of the right options. More than one means "choose all that apply". */
  correct: number[];
  /** A sheet to look at while answering, when the question is about one. */
  sheet?: SheetSpec;
}

export type SheetExercise = GridTaskExercise | DemoExercise | FixFormulaExercise | ShortcutExercise | FormulaBuildExercise;
export type PickExercise = PredictExercise | ChoiceExercise;
export type Exercise = SheetExercise | PickExercise;
export type ExerciseType = Exercise['type'];

export const isPick = (exercise: Exercise): exercise is PickExercise =>
  exercise.type === 'choice' || exercise.type === 'predict-output';
export const isGrid = (exercise: Exercise): exercise is SheetExercise => !isPick(exercise);

export const isScored = (exercise: Exercise): boolean => exercise.type !== 'demo';

export interface Skill {
  id: string;
  /** Shown to the learner, e.g. on the results screen. */
  name: string;
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  /** At most two. Each must appear in a demo before it is tested. */
  newSkills: string[];
  /** Keys the lesson hasn't taught yet. They are left blank on the keyboard. */
  hideKeys?: KeyId[];
  /**
   * What the lesson taught, in two or three plain sentences. Shown on the results
   * screen, so the learner leaves with the ideas and not just a score.
   */
  recap: string[];
  exercises: Exercise[];
  /**
   * More of the same skills on different numbers. Only a learner who missed too many in
   * the lesson sees these, as a short practice round before the next lesson opens.
   */
  practice?: Exercise[];
}

/** The test at the end of a unit. Passing it without doing the lessons skips the unit. */
export interface Checkpoint {
  id: string;
  title: string;
  /** How many must be right first time, out of all of them. */
  passMark: number;
  hideKeys?: KeyId[];
  exercises: Exercise[];
}

/**
 * Where a unit sits in the course, pictured as a plant: roots are the fundamentals, the
 * trunk is core skill with formulas, branches are the more advanced functions, and fruit
 * is using it all on real tasks. It decides the order and how the path is drawn.
 */
export type Stage = 'roots' | 'trunk' | 'branches' | 'fruit';
export const STAGES: readonly Stage[] = ['roots', 'trunk', 'branches', 'fruit'];

/** The three steps every lesson goes through, in the order they come. */
export type LessonStep = 'teach' | 'lesson' | 'apply';

export interface Unit {
  id: string;
  title: string;
  summary: string;
  stage: Stage;
  /** A side unit that never blocks the main path. */
  optional?: boolean;
  /**
   * The "Start here" unit for someone who has never used a spreadsheet. Anyone who says
   * they have used one starts after it.
   */
  intro?: boolean;
  lessons: Lesson[];
  checkpoint?: Checkpoint;
}

export interface Course {
  id: string;
  title: string;
  /** Which practice surface the course's exercises run on. */
  simulator: 'spreadsheet';
  skills: Skill[];
  units: Unit[];
}

/** Content limits, enforced by the content lint test. */
export const LIMITS = {
  maxCols: 6,
  /** Seven rows is the most that keeps cells 40 pt tall on a small phone with the keyboard open. */
  maxRows: 7,
  /** One row fewer when the task has an extra row of keys above the keyboard. */
  maxRowsWithChips: 6,
  minExercises: 6,
  maxExercises: 8,
  /** Shortcut exercises in one lesson. On a phone they teach recognition, so they stay few. */
  maxShortcutPresses: 3,
  maxNewSkills: 2,
  minTips: 2,
  maxTips: 3,
  /** A lesson's "what you learned" list: short enough to read at a glance on the results screen. */
  minRecap: 2,
  maxRecap: 3,
  recapLength: 80,
  maxChips: 5,
  checkpointExercises: 8,
  checkpointPassMark: 7,
  /** Miss more scored exercises than this in a lesson and a practice round comes first. */
  missesBeforePractice: 1,
  /** How many exercises a practice round has, at most. */
  practiceRound: 3,
} as const;
