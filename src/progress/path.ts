import { STAGES, type Checkpoint, type Course, type Lesson, type Stage, type Unit } from '@/lessons/types';

import type { LessonRecord, ProgressData } from './saved';

/**
 * - `done`: finished, and well enough to move on.
 * - `practice`: finished, but with enough misses that a practice round comes before the next lesson.
 * - `open`: ready to start (or carry on with).
 * - `locked`: an earlier lesson has to be done first.
 */
export type LessonState = 'done' | 'practice' | 'open' | 'locked';

export interface LessonNode {
  lesson: Lesson;
  unit: Unit;
  state: LessonState;
  record?: LessonRecord;
  /** Part-way through: there is a saved place to carry on from. */
  inProgress: boolean;
}

export interface UnitNode {
  unit: Unit;
  /** 1, 2, 3 for the main path. The intro and side units have no number. */
  number: number | null;
  lessons: LessonNode[];
  /** Skipped without doing its lessons: by passing its test, or by saying "I've used one before". */
  skipped: boolean;
  /** Every lesson is done (or the unit was skipped). */
  complete: boolean;
  /** The unit test can be taken to skip the unit. Not offered once the unit is complete. */
  testOut: Checkpoint | null;
}

/** True if the unit counts as known without its lessons being done. */
export function unitSkipped(unit: Unit, data: ProgressData): boolean {
  if (unit.checkpoint && data.passed[unit.checkpoint.id] !== undefined) return true;
  return !!unit.intro && (data.profile.level === 'some' || data.profile.level === 'test');
}

const lessonPassed = (lesson: Lesson, data: ProgressData): boolean =>
  data.finished[lesson.id] !== undefined && (data.toPractise[lesson.id] ?? []).length === 0;

/**
 * The whole course as the Learn screen draws it. On the main path each lesson opens
 * when everything before it is passed. A side unit never blocks anything and only asks
 * that its own lessons are done in order.
 */
export function buildPath(course: Course, data: ProgressData): UnitNode[] {
  let mainOpen = true;
  let number = 0;
  return course.units.map((unit) => {
    const skipped = unitSkipped(unit, data);
    let open = unit.optional ? true : mainOpen;
    const lessons = unit.lessons.map((lesson): LessonNode => {
      const record = data.finished[lesson.id];
      const passed = skipped || lessonPassed(lesson, data);
      let state: LessonState;
      if (record && (data.toPractise[lesson.id] ?? []).length > 0 && !skipped) state = 'practice';
      else if (record || skipped) state = 'done';
      else state = open ? 'open' : 'locked';
      // A lesson waiting on its practice round is still reachable; what comes after it is not.
      if (!passed) open = false;
      return { lesson, unit, state, record, inProgress: data.runs[lesson.id] !== undefined };
    });
    const complete = skipped || unit.lessons.every((lesson) => lessonPassed(lesson, data));
    if (!unit.optional && !complete) mainOpen = false;
    const numbered = !unit.optional && !unit.intro;
    if (numbered) number++;
    return {
      unit,
      number: numbered ? number : null,
      lessons,
      skipped,
      complete,
      testOut: unit.checkpoint && !complete ? unit.checkpoint : null,
    };
  });
}

/** The lesson to offer first on the Learn screen: the earliest one on the main path that isn't passed. */
export function nextUp(path: UnitNode[]): LessonNode | null {
  for (const node of path) {
    if (node.unit.optional) continue;
    const found = node.lessons.find((l) => l.state === 'open' || l.state === 'practice');
    if (found) return found;
  }
  // The main path is finished: point at a side unit, if one is left.
  for (const node of path) {
    const found = node.lessons.find((l) => l.state === 'open' || l.state === 'practice');
    if (found) return found;
  }
  return null;
}

/** What each stage of the plant stands for, in the course's own words. */
export const STAGE_INFO: Record<Stage, { name: string; about: string }> = {
  roots: { name: 'Roots', about: 'Fundamentals: the spreadsheet itself, and getting around it.' },
  trunk: { name: 'Trunk', about: 'Core skill: formulas and functions you will use every day.' },
  branches: { name: 'Branches', about: 'Developing skills: formulas that decide, count and look things up.' },
  fruit: { name: 'Fruit', about: 'Practical application: real jobs, done start to finish.' },
};

export interface StageNode {
  stage: Stage;
  /** Every unit of this stage on the main path is done (side units never hold a stage back). */
  done: boolean;
  /** The earliest stage that is not done: where the learner is growing now. */
  current: boolean;
}

/** How far up the plant the learner has got, stage by stage. */
export function stagesOf(path: UnitNode[]): StageNode[] {
  let found = false;
  return STAGES.map((stage) => {
    const units = path.filter((node) => node.unit.stage === stage && !node.unit.optional);
    const done = units.length > 0 && units.every((node) => node.complete);
    const current = !done && !found;
    if (current) found = true;
    return { stage, done, current };
  });
}

/** How much of the plant to draw in colour: every stage done, plus the one being grown. */
export const grownTo = (stages: StageNode[]): number => stages.filter((s) => s.done).length + (stages.some((s) => s.current) ? 1 : 0);

export const unitBadge = (unitId: string): string => `unit:${unitId}`;
export const STREAK_BADGES = [7, 30] as const;
export const streakBadge = (days: number): string => `streak:${days}`;

/** Every badge earned so far: one for each unit completed, and for streaks of 7 and 30 days. */
export function badgesFor(course: Course, data: ProgressData): string[] {
  const earned = new Set(data.badges);
  for (const node of buildPath(course, data)) {
    // Skipping the intro by saying "I've used one before" is not an achievement; passing a test is.
    const byLevelOnly = node.skipped && !(node.unit.checkpoint && data.passed[node.unit.checkpoint.id] !== undefined);
    if (node.complete && !byLevelOnly) earned.add(unitBadge(node.unit.id));
  }
  for (const days of STREAK_BADGES) if (data.streak.best >= days) earned.add(streakBadge(days));
  return [...earned];
}
