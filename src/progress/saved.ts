import { isFinished, type Attempt, type ExerciseResult, type Playable, type QueueItem, type Session, type Summary } from '@/lessons/session';
import type { ExerciseSnapshot } from '@/lessons/snapshot';
import type { Computer } from '@/spreadsheet/shortcuts';

import type { SkillState } from './srs';
import { NO_STREAK, type Streak } from './streak';

/** Goes up whenever the saved shape changes. `migrate` carries older saves forward. */
export const STORE_VERSION = 3;

/** An exercise in the lesson's queue, saved by its permanent ID. */
export interface SavedItem {
  id: string;
  isRetry: boolean;
}

/** A lesson that was left part-way through: where the learner was, and what was on their sheet. */
export interface SavedRun {
  lessonId: string;
  queue: SavedItem[];
  done: SavedItem[];
  completed: number;
  total: number;
  attempt: Attempt;
  results: Record<string, ExerciseResult>;
  weakSkills: string[];
  combo: number;
  bestCombo: number;
  /** Time spent in the lesson so far, so a break away from it doesn't count. */
  elapsedMs: number;
  /** Where each exercise was left, by item key. */
  snapshots: Record<string, ExerciseSnapshot>;
  savedAt: number;
}

export interface LessonRecord {
  finishedAt: number;
  /** How many times the lesson has been finished. */
  times: number;
  bestFirstTry: number;
  scored: number;
}

/** How much the learner said they already know, on first launch. */
export type Level = 'new' | 'some' | 'test';

export interface Profile {
  /** Null until the first-launch question has been answered. */
  level: Level | null;
  /** Null until it matters: asked the first time a lesson has a keyboard shortcut in it. */
  computer: Computer | null;
  /** Sound and vibration together: one switch. */
  feedback: boolean;
  /** XP to aim for each day. */
  dailyGoal: number;
  /** What the learner likes to be called. Empty until they say. */
  name: string;
  /** The colour of their Cell, the mascot. */
  colour: ProfileColour;
  /** With the phone on its side: which half the sheet takes. The lesson and keys take the other. */
  sheetSide: Side;
  /** The tour of the app has been taken or skipped, so it is not offered again unasked. */
  tourSeen: boolean;
  /** Dark navy (the app's own look), light, or whichever the phone is set to. */
  look: Look;
}

export const LOOKS = ['dark', 'light', 'auto'] as const;
export type Look = (typeof LOOKS)[number];

export const PROFILE_COLOURS = ['blue', 'green', 'orange', 'pink', 'purple'] as const;
export type ProfileColour = (typeof PROFILE_COLOURS)[number];
export type Side = 'left' | 'right';
/** As long as a name fits on one line of a phone. */
export const NAME_LENGTH = 20;

export const DEFAULT_PROFILE: Profile = {
  level: null,
  computer: null,
  feedback: true,
  dailyGoal: 20,
  name: '',
  colour: 'blue',
  // As in the sample layout: the lesson on the left, the sheet on the right.
  sheetSide: 'right',
  tourSeen: false,
  look: 'dark',
};

/** How one level of the Speed Trial game has gone so far. */
export interface GameLevelRecord {
  /** The quickest finish, in thousandths of a second. */
  bestMs: number;
  /** The most stars earned in one go: 1 to 3. */
  bestStars: number;
  plays: number;
}

/** The Speed Trial game: best results, and how well each shortcut is known. */
export interface GameData {
  /** By level ID. A level with a record has been finished at least once. */
  levels: Record<string, GameLevelRecord>;
  /** By shortcut ID: how many times it has been pressed right first time. Hints fade as this grows. */
  known: Record<string, number>;
}

export const NO_GAME: GameData = { levels: {}, known: {} };

/** Everything the app keeps on the device. Keyed by permanent IDs, never by position. */
export interface ProgressData {
  /** Lessons, unit tests and practice rounds in progress, by their ID. */
  runs: Record<string, SavedRun>;
  /** Lessons that have been finished, by lesson ID. */
  finished: Record<string, LessonRecord>;
  /**
   * Lessons that were finished with too many misses: the skills to practise before the
   * next lesson opens. Cleared when the practice round is done.
   */
  toPractise: Record<string, string[]>;
  /** Unit tests that have been passed, by checkpoint ID, and when. */
  passed: Record<string, number>;
  /** Review schedule, by skill ID. */
  skills: Record<string, SkillState>;
  xp: number;
  /** XP earned on each calendar day, for the daily goal. */
  days: Record<string, number>;
  streak: Streak;
  badges: string[];
  profile: Profile;
  game: GameData;
}

export const emptyProgress = (): ProgressData => ({
  game: NO_GAME,
  runs: {},
  finished: {},
  toPractise: {},
  passed: {},
  skills: {},
  xp: 0,
  days: {},
  streak: NO_STREAK,
  badges: [],
  profile: DEFAULT_PROFILE,
});

/** A lesson being played: the session, and where each of its exercises was left. */
export interface Run {
  session: Session;
  snapshots: Record<string, ExerciseSnapshot>;
}

const saveItem = (item: QueueItem): SavedItem => ({ id: item.exercise.id, isRetry: item.isRetry });

export function toSaved(run: Run, now: number): SavedRun {
  const { session } = run;
  return {
    lessonId: session.lessonId,
    queue: session.queue.map(saveItem),
    done: session.done.map(saveItem),
    completed: session.completed,
    total: session.total,
    attempt: session.attempt,
    results: session.results,
    weakSkills: session.weakSkills,
    combo: session.combo,
    bestCombo: session.bestCombo,
    elapsedMs: Math.max(0, now - session.startedAt),
    snapshots: run.snapshots,
    savedAt: now,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0);

/**
 * Turns a saved run back into a live one. Returns null when the save no longer fits the
 * lesson (an exercise was removed, or the save is damaged), and the lesson simply starts
 * from the beginning: a bad save must never stop a lesson opening.
 */
export function fromSaved(saved: SavedRun, lesson: Playable, now: number): Run | null {
  try {
    if (!isRecord(saved) || saved.lessonId !== lesson.id) return null;
    const byId = new Map(lesson.exercises.map((exercise) => [exercise.id, exercise]));
    const load = (items: SavedItem[]): QueueItem[] | null => {
      if (!Array.isArray(items)) return null;
      const out: QueueItem[] = [];
      for (const item of items) {
        const exercise = byId.get(item?.id);
        if (!exercise) return null;
        out.push({ exercise, isRetry: item.isRetry === true });
      }
      return out;
    };
    const queue = load(saved.queue);
    const done = load(saved.done);
    if (!queue || !done || queue.length === 0) return null;

    const attempt: Record<string, unknown> = isRecord(saved.attempt) ? saved.attempt : {};
    const session: Session = {
      lessonId: lesson.id,
      queue,
      done,
      completed: done.length,
      total: done.length + queue.length,
      attempt: {
        wrongChecks: count(attempt.wrongChecks),
        hintsShown: count(attempt.hintsShown),
        solutionShown: attempt.solutionShown === true,
      },
      results: isRecord(saved.results) ? (saved.results as Record<string, ExerciseResult>) : {},
      weakSkills: Array.isArray(saved.weakSkills) ? saved.weakSkills.filter((s) => typeof s === 'string') : [],
      combo: count(saved.combo),
      bestCombo: count(saved.bestCombo),
      startedAt: now - count(saved.elapsedMs),
      finishedAt: null,
    };
    if (isFinished(session)) return null;
    const snapshots = isRecord(saved.snapshots) ? (saved.snapshots as Record<string, ExerciseSnapshot>) : {};
    return { session, snapshots };
  } catch {
    return null;
  }
}

/** The record for a lesson that has just been finished, built on any earlier record. */
export function recordFinish(previous: LessonRecord | undefined, summary: Summary, now: number): LessonRecord {
  return {
    finishedAt: now,
    times: (previous?.times ?? 0) + 1,
    bestFirstTry: Math.max(previous?.bestFirstTry ?? 0, summary.firstTry),
    scored: summary.scored,
  };
}

const record = <T,>(value: unknown): Record<string, T> => (isRecord(value) ? (value as Record<string, T>) : {});

/**
 * Brings saved data from any earlier version up to this one, keeping everything it can.
 *
 * - Version 1 held only lessons in progress and lessons finished. Both carry over as
 *   they are; XP, streak and the rest start empty.
 * - Version 2 had no name, colour or tour on the profile and no game results. Someone who
 *   already chose a level has been using the app, so they are not walked through the tour.
 * - Anything unreadable becomes an empty, usable store rather than an error.
 */
export function migrate(persisted: unknown, _version: number): ProgressData {
  const data = isRecord(persisted) ? persisted : {};
  const fresh = emptyProgress();
  const streak = isRecord(data.streak) ? data.streak : {};
  const profile = isRecord(data.profile) ? data.profile : {};
  const game = isRecord(data.game) ? data.game : {};
  const level = profile.level === 'new' || profile.level === 'some' || profile.level === 'test' ? profile.level : fresh.profile.level;
  const levels: Record<string, GameLevelRecord> = {};
  for (const [id, value] of Object.entries(record<unknown>(game.levels))) {
    if (!isRecord(value) || count(value.bestMs) === 0) continue;
    levels[id] = { bestMs: count(value.bestMs), bestStars: Math.min(3, Math.max(1, count(value.bestStars))), plays: Math.max(1, count(value.plays)) };
  }
  const known: Record<string, number> = {};
  for (const [id, value] of Object.entries(record<unknown>(game.known))) known[id] = count(value);
  return {
    game: { levels, known },
    runs: record(data.runs),
    finished: record(data.finished),
    toPractise: record(data.toPractise),
    passed: record(data.passed),
    skills: record(data.skills),
    xp: count(data.xp),
    days: record(data.days),
    streak: {
      count: count(streak.count),
      lastDay: typeof streak.lastDay === 'string' ? streak.lastDay : null,
      freezeWeek: typeof streak.freezeWeek === 'string' ? streak.freezeWeek : null,
      best: count(streak.best),
    },
    badges: Array.isArray(data.badges) ? data.badges.filter((b) => typeof b === 'string') : [],
    profile: {
      level,
      computer: profile.computer === 'win' || profile.computer === 'mac' ? profile.computer : null,
      feedback: profile.feedback !== false,
      dailyGoal: count(profile.dailyGoal) || fresh.profile.dailyGoal,
      name: typeof profile.name === 'string' ? profile.name.trim().slice(0, NAME_LENGTH) : '',
      colour: (PROFILE_COLOURS as readonly unknown[]).includes(profile.colour) ? (profile.colour as ProfileColour) : fresh.profile.colour,
      sheetSide: profile.sheetSide === 'left' ? 'left' : 'right',
      tourSeen: typeof profile.tourSeen === 'boolean' ? profile.tourSeen : level !== null,
      look: (LOOKS as readonly unknown[]).includes(profile.look) ? (profile.look as Look) : fresh.profile.look,
    },
  };
}
