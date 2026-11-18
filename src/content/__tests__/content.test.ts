/** @jest-environment node */
import { a1, checkFormula, FUNCTIONS } from '@/engine';
import { checkController } from '@/lessons/checks';
import { correctOptions, shownBy } from '@/lessons/pick';
import { applyScript } from '@/lessons/script';
import { isGrid, isPick, isScored, LIMITS, type Exercise, type Lesson, type ScriptStep, type SheetExercise } from '@/lessons/types';
import { SheetController } from '@/spreadsheet/controller';

import { courses } from '../index';
import { KNOWN_IDS, RETIRED_IDS } from '../ids';

/**
 * Content lint. Lessons are data, so a typo can make an exercise impossible or let a
 * wrong answer through. These rules fail the test run before a learner ever sees it.
 */

const units = courses.flatMap((course) => course.units);
const lessons: Lesson[] = units.flatMap((unit) => unit.lessons);
const checkpoints = units.flatMap((unit) => (unit.checkpoint ? [{ unit, checkpoint: unit.checkpoint }] : []));

/** Every exercise in the app, and where it lives: in a lesson, a practice pool or a unit test. */
const exercises: { exercise: Exercise; home: string; kind: 'lesson' | 'practice' | 'checkpoint' }[] = [
  ...lessons.flatMap((lesson) => lesson.exercises.map((exercise) => ({ exercise, home: lesson.id, kind: 'lesson' as const }))),
  ...lessons.flatMap((lesson) => (lesson.practice ?? []).map((exercise) => ({ exercise, home: lesson.id, kind: 'practice' as const }))),
  ...checkpoints.flatMap(({ checkpoint }) => checkpoint.exercises.map((exercise) => ({ exercise, home: checkpoint.id, kind: 'checkpoint' as const }))),
];

const openingCell = (exercise: SheetExercise): string =>
  exercise.select ?? (exercise.type === 'formula-build' ? exercise.cell : 'A1');

/** The sheet as the learner first gets it: after the app's demonstration, if there is one. */
function opened(exercise: SheetExercise): SheetController {
  const controller = new SheetController(exercise.sheet, openingCell(exercise));
  if (exercise.type === 'demo') applyScript(controller, exercise.script);
  // What the app did while demonstrating is not the learner's own doing.
  controller.forgetActions();
  return controller;
}

const scriptsOf = (exercise: SheetExercise): ScriptStep[] => [
  ...exercise.solution,
  ...(exercise.type === 'demo' ? exercise.script : []),
];

describe('IDs', () => {
  const used = [
    ...courses.map((c) => c.id),
    ...courses.flatMap((c) => c.skills.map((s) => s.id)),
    ...units.map((u) => u.id),
    ...lessons.map((l) => l.id),
    ...checkpoints.map((c) => c.checkpoint.id),
    ...exercises.map((e) => e.exercise.id),
  ];

  it('are unique', () => {
    expect(used.filter((id, i) => used.indexOf(id) !== i)).toEqual([]);
    expect(new Set(KNOWN_IDS).size).toBe(KNOWN_IDS.length);
  });

  it('are all in the ledger', () => {
    expect(used.filter((id) => !KNOWN_IDS.includes(id))).toEqual([]);
  });

  it('never disappear: a removed ID must be retired, not deleted', () => {
    const gone = KNOWN_IDS.filter((id) => !used.includes(id));
    expect(gone.filter((id) => !RETIRED_IDS.includes(id))).toEqual([]);
  });

  it('are never reused once retired', () => {
    expect(used.filter((id) => RETIRED_IDS.includes(id))).toEqual([]);
  });

  it('every exercise skill is a skill the course defines', () => {
    const skills = new Set(courses.flatMap((c) => c.skills.map((s) => s.id)));
    expect(exercises.filter((e) => !skills.has(e.exercise.skill)).map((e) => e.exercise.id)).toEqual([]);
  });
});

describe.each(lessons.map((lesson) => [lesson.id, lesson] as const))('lesson %s', (_id, lesson) => {
  it(`has ${LIMITS.minExercises} to ${LIMITS.maxExercises} exercises`, () => {
    expect(lesson.exercises.length).toBeGreaterThanOrEqual(LIMITS.minExercises);
    expect(lesson.exercises.length).toBeLessThanOrEqual(LIMITS.maxExercises);
  });

  it('goes Teach, Lesson, Apply: it ends on a practical task done on the sheet', () => {
    const applied = lesson.exercises.filter((e) => e.apply);
    expect(applied.length).toBeGreaterThan(0);
    // Applying is doing, not watching: never a demonstration, never a question with options.
    expect(applied.filter((e) => !isScored(e) || !isGrid(e)).map((e) => e.id)).toEqual([]);
    // And it comes after the teaching: no demonstration follows the first practical task.
    const firstApply = lesson.exercises.findIndex((e) => e.apply);
    expect(lesson.exercises.slice(firstApply).filter((e) => e.type === 'demo').map((e) => e.id)).toEqual([]);
  });

  it('is mostly doing: multiple choice at one in five or less, and only a few shortcuts', () => {
    const types = lesson.exercises.map((e) => e.type);
    expect(types.filter((t) => t === 'choice').length / types.length).toBeLessThanOrEqual(0.2);
    expect(types.filter((t) => t === 'shortcut-press').length).toBeLessThanOrEqual(LIMITS.maxShortcutPresses);
    // Questions with options never outnumber tasks done on the sheet.
    expect(lesson.exercises.filter(isPick).length).toBeLessThan(lesson.exercises.filter(isGrid).length);
  });

  it(`introduces at most ${LIMITS.maxNewSkills} new skills`, () => {
    expect(lesson.newSkills.length).toBeLessThanOrEqual(LIMITS.maxNewSkills);
  });

  it('demonstrates every new skill before testing it', () => {
    for (const skill of lesson.newSkills) {
      const firstDemo = lesson.exercises.findIndex((e) => e.type === 'demo' && e.skill === skill);
      const firstTest = lesson.exercises.findIndex((e) => isScored(e) && e.skill === skill);
      expect(firstDemo).toBeGreaterThanOrEqual(0);
      if (firstTest >= 0) expect(firstDemo).toBeLessThan(firstTest);
    }
  });

  it(`says what it taught in ${LIMITS.minRecap} or ${LIMITS.maxRecap} short points`, () => {
    expect(lesson.recap.length).toBeGreaterThanOrEqual(LIMITS.minRecap);
    expect(lesson.recap.length).toBeLessThanOrEqual(LIMITS.maxRecap);
    const points = lesson.recap.map((point) => point.trim().toLowerCase());
    expect(new Set(points).size).toBe(points.length);
    for (const point of lesson.recap) {
      expect(point.trim()).not.toBe('');
      // The results screen is read on a phone: a point is one or two lines there.
      expect(point.length).toBeLessThanOrEqual(LIMITS.recapLength);
    }
  });

  it('never shows the same tip twice', () => {
    const tips = lesson.exercises.flatMap((e) => e.tips.map((tip) => tip.trim().toLowerCase()));
    expect(tips.filter((tip, i) => tips.indexOf(tip) !== i)).toEqual([]);
  });

  it('only tests skills that this lesson or an earlier one has taught', () => {
    const index = lessons.findIndex((l) => l.id === lesson.id);
    const taught = new Set(lessons.slice(0, index + 1).flatMap((l) => l.newSkills));
    const all = [...lesson.exercises, ...(lesson.practice ?? [])];
    expect(all.filter((e) => !taught.has(e.skill)).map((e) => e.id)).toEqual([]);
  });

  it('has extra practice for each new skill, none of it a demonstration', () => {
    const pool = lesson.practice ?? [];
    expect(pool.filter((e) => e.type === 'demo').map((e) => e.id)).toEqual([]);
    for (const skill of lesson.newSkills) {
      // A skill that is tested must have something to practise it with.
      const tested = lesson.exercises.some((e) => isScored(e) && e.skill === skill);
      if (tested) expect(pool.some((e) => e.skill === skill)).toBe(true);
    }
  });
});

const eachCheckpoint = checkpoints.length > 0 ? describe.each(checkpoints.map((c) => [c.checkpoint.id, c] as const)) : describe.skip.each([['none', checkpoints[0]] as const]);
eachCheckpoint('unit test %s', (_id, { unit, checkpoint }) => {
  it(`has ${LIMITS.checkpointExercises} exercises and passes at ${LIMITS.checkpointPassMark}`, () => {
    expect(checkpoint.exercises).toHaveLength(LIMITS.checkpointExercises);
    expect(checkpoint.passMark).toBe(LIMITS.checkpointPassMark);
  });

  it('only tests, never teaches, and only skills from its own unit', () => {
    expect(checkpoint.exercises.filter((e) => e.type === 'demo').map((e) => e.id)).toEqual([]);
    const taught = new Set(unit.lessons.flatMap((l) => l.newSkills));
    expect(checkpoint.exercises.filter((e) => !taught.has(e.skill)).map((e) => e.id)).toEqual([]);
  });

  it('covers every skill the unit teaches', () => {
    const tested = new Set(checkpoint.exercises.map((e) => e.skill));
    const taught = unit.lessons.flatMap((l) => l.newSkills);
    expect(taught.filter((skill) => !tested.has(skill))).toEqual([]);
  });
});

describe.each(exercises.map((e) => [e.exercise.id, e.exercise, e.kind] as const))('exercise %s', (_id, exercise, kind) => {
  it('has a prompt, an explanation and three hints', () => {
    expect(exercise.prompt.trim()).not.toBe('');
    expect(exercise.explain.trim()).not.toBe('');
    expect(exercise.hints).toHaveLength(3);
    for (const hint of exercise.hints) expect(hint.trim()).not.toBe('');
  });

  it(`has ${LIMITS.minTips} or ${LIMITS.maxTips} tips, each basic and never the answer`, () => {
    expect(exercise.tips.length).toBeGreaterThanOrEqual(LIMITS.minTips);
    expect(exercise.tips.length).toBeLessThanOrEqual(LIMITS.maxTips);
    const tips = exercise.tips.map((tip) => tip.trim());
    expect(new Set(tips).size).toBe(tips.length);
    for (const tip of tips) {
      expect(tip).not.toBe('');
      // Two lines at most: a tip is one fact, not a paragraph.
      expect(tip.length).toBeLessThanOrEqual(70);
      // Hints are the ladder towards the answer. A tip is free, so it must not be a rung of it.
      for (const hint of exercise.hints) expect(tip.toLowerCase()).not.toBe(hint.toLowerCase());
      if (!isGrid(exercise)) continue;
      for (const check of exercise.checks) {
        if (!('reference' in check)) continue;
        const answer = check.reference.replace(/^=/, '');
        expect(tip).not.toContain(answer);
        // Nor the cells the answer uses: "D2:D6" in a tip would give the range away.
        for (const range of answer.match(/[A-Z]+[0-9]+:[A-Z]+[0-9]+/g) ?? []) expect(tip).not.toContain(range);
        if ('cell' in check) expect(tip).not.toContain(check.cell);
      }
    }
  });

  it('keeps on-screen text short enough for a phone', () => {
    expect(exercise.prompt.length).toBeLessThanOrEqual(80);
    for (const hint of exercise.hints) expect(hint.length).toBeLessThanOrEqual(80);
    expect(exercise.explain.length).toBeLessThanOrEqual(110);
    // A caption sits beside the Next button, so it has the least room of all: 60 letters is
    // what three small lines hold there on the narrowest phone (320 pt). See MessageCard.
    if (isGrid(exercise)) for (const step of scriptsOf(exercise)) expect((step.say ?? '').length).toBeLessThanOrEqual(60);
  });

  if (isGrid(exercise)) {
    const hasChips = (exercise.chips ?? []).length > 0;
    const maxRows = hasChips ? LIMITS.maxRowsWithChips : LIMITS.maxRows;

    it(`fits a ${LIMITS.maxCols} x ${maxRows} sheet, so cells stay big enough to tap`, () => {
      expect(exercise.sheet.cols).toBeLessThanOrEqual(LIMITS.maxCols);
      expect(exercise.sheet.rows).toBeLessThanOrEqual(maxRows);
      for (const line of exercise.sheet.grid ?? []) expect(line.length).toBeLessThanOrEqual(exercise.sheet.cols);
      expect((exercise.sheet.grid ?? []).length).toBeLessThanOrEqual(exercise.sheet.rows);
      expect((exercise.chips ?? []).length).toBeLessThanOrEqual(LIMITS.maxChips);
    });

    it('has at least one check, and is not already solved when it opens', () => {
      expect(exercise.checks.length).toBeGreaterThan(0);
      expect(checkController(exercise.checks, opened(exercise)).status).not.toBe('pass');
    });

    it('is solved by its own worked solution', () => {
      const controller = opened(exercise);
      applyScript(controller, exercise.solution);
      expect(controller.getState().editing).toBeNull();
      expect(checkController(exercise.checks, controller)).toEqual({ status: 'pass' });
    });

    it('only uses buttons and keys the learner is given', () => {
      const tools = exercise.tools ?? [];
      const pieces = [...(exercise.chips ?? []), ...(exercise.type === 'formula-build' ? exercise.tokens : [])];
      for (const step of scriptsOf(exercise)) {
        if ('tool' in step) expect(tools).toContain(step.tool);
        if ('fill' in step) expect(tools).toContain('fill');
        if ('chip' in step) expect(pieces).toContain(step.chip);
        if ('combo' in step) expect(['shortcut-press', 'demo']).toContain(exercise.type);
      }
      // And nothing on screen that the task never needs. A unit test is the exception:
      // showing only the one button that is needed would give the answer away.
      if (kind === 'checkpoint') return;
      const used = new Set(scriptsOf(exercise).flatMap((step) => ('tool' in step ? [step.tool] : 'fill' in step ? ['fill'] : [])));
      // The two sort buttons come as a pair: choosing between them is the task.
      const sorts = used.has('sortAsc') || used.has('sortDesc');
      const spare = tools.filter((tool) => !used.has(tool) && tool !== 'undo' && !(sorts && tool.startsWith('sort')));
      expect(spare).toEqual([]);
    });

    it('gives the answer in its last hint', () => {
      const answer = exercise.hints[2];
      if (!answer.startsWith('=')) return;
      expect(checkFormula(answer)).toMatchObject({ ok: true });
      const target = exercise.checks.find((c) => c.type === 'outcome');
      if (!target || target.type !== 'outcome' || exercise.checks.length > 2) return;
      const controller = opened(exercise);
      controller.sheet.setRaw(a1(target.cell), answer);
      expect(checkController([target], controller)).toEqual({ status: 'pass' });
    });

    it('uses reference formulas the engine can read', () => {
      for (const check of exercise.checks) {
        if ('reference' in check) expect(checkFormula(check.reference)).toMatchObject({ ok: true });
        if (check.type === 'formulaUses') expect(Object.keys(FUNCTIONS)).toContain(check.fn.toUpperCase());
      }
    });

    if (exercise.type === 'demo') {
      it('has a demonstration that runs cleanly and leaves no formula half typed', () => {
        const controller = new SheetController(exercise.sheet, openingCell(exercise));
        applyScript(controller, exercise.script);
        expect(controller.getState().editing).toBeNull();
        expect(exercise.script.some((step) => step.say)).toBe(true);
      });
    }

    if (exercise.type === 'shortcut-press') {
      it('is about the shortcut itself, not just where it gets you', () => {
        expect(exercise.checks.some((check) => check.type === 'usedShortcut')).toBe(true);
      });
    }

    if (exercise.type === 'formula-build') {
      it('can be built from its pieces, with at least one piece that does not belong', () => {
        const usedPieces = exercise.solution.flatMap((step) => ('chip' in step ? [step.chip] : []));
        expect(exercise.solution.every((step) => 'chip' in step || ('key' in step && step.key === 'enter'))).toBe(true);
        expect(exercise.tokens.filter((token) => !usedPieces.includes(token)).length).toBeGreaterThan(0);
        expect(exercise.tokens.length).toBeLessThanOrEqual(10);
      });
    }
  } else {
    it('has two to four different options', () => {
      expect(exercise.options.length).toBeGreaterThanOrEqual(2);
      expect(exercise.options.length).toBeLessThanOrEqual(4);
      expect(new Set(exercise.options.map((o) => o.trim().toLowerCase())).size).toBe(exercise.options.length);
      for (const option of exercise.options) expect(option.length).toBeLessThanOrEqual(60);
    });

    it('has a right answer, and it is not every option', () => {
      const right = correctOptions(exercise);
      expect(right.length).toBeGreaterThan(0);
      expect(right.length).toBeLessThan(exercise.options.length);
      for (const index of right) expect(exercise.options[index]).toBeDefined();
    });

    if (exercise.type === 'predict-output') {
      it('offers exactly one option that matches what the formula really shows', () => {
        expect(checkFormula(exercise.formula)).toMatchObject({ ok: true });
        expect(correctOptions(exercise)).toHaveLength(1);
        expect(exercise.options).toContain(exercise.options[correctOptions(exercise)[0]]);
        expect(shownBy(exercise).toUpperCase()).toBe(exercise.options[correctOptions(exercise)[0]].trim().toUpperCase());
      });
    }
    if (exercise.sheet) {
      it('shows a sheet small enough to read above the options', () => {
        expect(exercise.sheet!.cols).toBeLessThanOrEqual(LIMITS.maxCols);
        expect(exercise.sheet!.rows).toBeLessThanOrEqual(5);
      });
    }
  }
});
