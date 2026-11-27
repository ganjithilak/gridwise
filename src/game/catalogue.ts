import type { Course } from '@/lessons/types';
import type { ProgressData } from '@/progress/saved';

import { BUILDER_SKILLS } from './formulaBuilder';
import { ERROR_SKILLS } from './findTheError';
import { PREDICT_SKILLS } from './predict';
import { GAME_LEVELS, levelOpen } from './speedTrial';
import { taughtSkills } from './taught';

/**
 * The core games, as the Games screen lists them. Each opens with the first lesson that
 * teaches something it can ask about, and covers more as the course goes on.
 */
export interface GameEntry {
  id: string;
  title: string;
  about: string;
  path: '/match-pairs' | '/speed-trial' | '/cell-hunt' | '/formula-builder' | '/find-the-error' | '/predict-the-result';
  /** Any one of these taught opens the game. */
  opensWith: readonly string[];
  /** Records the game keeps, for "played" and best stars. */
  records: readonly string[];
}

export const GAMES: readonly GameEntry[] = [
  { id: 'match', title: 'Match Pairs', about: 'Join terms, keys and references to their meanings', path: '/match-pairs', opensWith: ['xl.spreadsheet.purpose', 'xl.cell.address'], records: ['match'] },
  { id: 'hunt', title: 'Cell Hunt', about: 'Find cells, rows, columns and blocks', path: '/cell-hunt', opensWith: ['xl.cell.address'], records: ['hunt'] },
  { id: 'trial', title: 'Speed Trial', about: 'Press the keys for an action', path: '/speed-trial', opensWith: ['xl.cell.type', 'xl.select.column', 'xl.keys.move'], records: GAME_LEVELS.map((l) => l.id) },
  { id: 'errors', title: 'Find the Error', about: 'Spot the mistake in a farm record and correct it', path: '/find-the-error', opensWith: ERROR_SKILLS, records: ['errors'] },
  { id: 'builder', title: 'Formula Builder', about: 'Put a formula together from its pieces', path: '/formula-builder', opensWith: BUILDER_SKILLS, records: ['builder'] },
  { id: 'predict', title: 'Predict the Result', about: 'Say what a formula will show', path: '/predict-the-result', opensWith: PREDICT_SKILLS, records: ['predict'] },
];

export interface GameStatus {
  entry: GameEntry;
  open: boolean;
  /** "Opens after Cells and References", when closed. */
  opensAfter: string | null;
  plays: number;
  bestStars: number;
}

/** The first lesson, in course order, that would open the game. */
function firstOpener(course: Course, skills: readonly string[]): string | null {
  for (const unit of course.units) for (const lesson of unit.lessons) if (lesson.newSkills.some((s) => skills.includes(s))) return lesson.title;
  return null;
}

export function gameStatuses(course: Course, data: ProgressData): GameStatus[] {
  const taught = taughtSkills(course, data);
  return GAMES.map((entry) => {
    const open = entry.id === 'trial' ? GAME_LEVELS.some((_, i) => levelOpen(taught, i)) : entry.opensWith.some((s) => taught.has(s));
    const records = entry.records.map((id) => data.game.levels[id]).filter((r) => r !== undefined);
    const opener = firstOpener(course, entry.opensWith);
    return {
      entry,
      open,
      opensAfter: open ? null : opener ? `Opens after ${opener}` : null,
      plays: records.reduce((t, r) => t + r.plays, 0),
      bestStars: records.reduce((t, r) => Math.max(t, r.bestStars), 0),
    };
  });
}

