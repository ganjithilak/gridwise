/** @jest-environment node */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { defaultCourse } from '@/content';
import { addItUp } from '@/content/excel/unit-01-first-formulas/lesson-01-add-it-up';
import { advance, recordCheck, startSession, type Summary } from '@/lessons/session';

import { emptyProgress, fromSaved, STORE_VERSION, toSaved } from '../saved';
import { dataOf, useProgress } from '../store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const KEY = 'gridwise.progress';
const onDevice = async () => JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null');
const clean: Summary = {
  scored: 4,
  firstTry: 4,
  seconds: 90,
  weakSkills: [],
  bestCombo: 4,
  xp: 18,
  skills: { 'xl.formula.arithmetic': { firstTry: 2, missed: 0, shown: false }, 'xl.sum.range': { firstTry: 2, missed: 0, shown: false } },
  missedSkills: [],
  missed: [],
};

function twoStepsIn() {
  let s = startSession(addItUp, 1_000);
  s = advance(recordCheck(s, 'pass'), 2_000);
  s = advance(recordCheck(s, 'pass'), 3_000);
  return toSaved({ session: s, snapshots: {} }, 4_000);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useProgress.setState(emptyProgress());
});

describe('progress store', () => {
  it('writes a lesson in progress to the device', async () => {
    useProgress.getState().saveRun(twoStepsIn());
    const stored = await onDevice();
    expect(stored.version).toBe(STORE_VERSION);
    expect(stored.state.runs[addItUp.id]).toMatchObject({ completed: 2, total: 6 });
    // Only data is kept: the store's own functions are not written out.
    expect(Object.keys(stored.state).sort()).toEqual(Object.keys(emptyProgress()).sort());
  });

  it('is still there after the app is closed and opened again', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ state: { ...emptyProgress(), xp: 30, runs: { [addItUp.id]: twoStepsIn() } }, version: STORE_VERSION }));
    await useProgress.persist.rehydrate();
    expect(useProgress.persist.hasHydrated()).toBe(true);
    expect(useProgress.getState().xp).toBe(30);
    const back = fromSaved(useProgress.getState().runs[addItUp.id], addItUp, 9_000);
    expect(back?.session.queue[0].exercise.id).toBe('xl.u1.l1.e3');
  });

  it('reads a save made by version 1 of the app', async () => {
    const v1 = { runs: { [addItUp.id]: twoStepsIn() }, finished: { 'xl.u1.l0': { finishedAt: 1, times: 2, bestFirstTry: 3, scored: 4 } } };
    await AsyncStorage.setItem(KEY, JSON.stringify({ state: v1, version: 1 }));
    await useProgress.persist.rehydrate();
    const now = useProgress.getState();
    expect(now.finished['xl.u1.l0']).toMatchObject({ times: 2, bestFirstTry: 3 });
    expect(now.runs[addItUp.id]).toMatchObject({ completed: 2 });
    expect(now.xp).toBe(0);
    expect(now.streak.count).toBe(0);
  });

  it('finishing a lesson forgets its saved place and records everything it earned', async () => {
    useProgress.getState().saveRun(twoStepsIn());
    const result = useProgress.getState().finish(defaultCourse, { id: addItUp.id, summary: clean, now: 5_000, today: '2026-11-14' });
    const now = useProgress.getState();
    expect(result.xp).toBe(18);
    expect(now.runs).toEqual({});
    expect(now.finished[addItUp.id]).toEqual({ finishedAt: 5_000, times: 1, bestFirstTry: 4, scored: 4 });
    expect(now.xp).toBe(18);
    expect(now.days).toEqual({ '2026-11-14': 18 });
    expect(now.streak).toMatchObject({ count: 1, lastDay: '2026-11-14' });
    expect(now.skills['xl.sum.range']).toMatchObject({ weak: false });
    expect((await onDevice()).state.xp).toBe(18);
  });

  it('"Start again" forgets only that lesson', () => {
    useProgress.getState().saveRun(twoStepsIn());
    useProgress.getState().saveRun({ ...twoStepsIn(), lessonId: 'xl.u1.l2' });
    useProgress.getState().clearRun(addItUp.id);
    expect(Object.keys(useProgress.getState().runs)).toEqual(['xl.u1.l2']);
  });

  it('keeps the answers to the questions it asks', () => {
    useProgress.getState().setLevel('some');
    useProgress.getState().setComputer('mac');
    useProgress.getState().setFeedback(false);
    useProgress.getState().setName('  Samantha the spreadsheet fan  ');
    useProgress.getState().setColour('green');
    useProgress.getState().setSheetSide('left');
    useProgress.getState().setTourSeen();
    useProgress.getState().setLook('light');
    expect(useProgress.getState().profile).toEqual({
      level: 'some',
      computer: 'mac',
      feedback: false,
      dailyGoal: 20,
      // A name is trimmed and kept short enough for one line.
      name: 'Samantha the spreads',
      colour: 'green',
      sheetSide: 'left',
      tourSeen: true,
      look: 'light',
    });
  });

  it('records a level of Grid Master next to Speed Trial, with XP for the day', () => {
    useProgress.getState().finishGame('trial.move', { ms: 30_000, asked: 8, firstTry: 8 }, '2026-11-17');
    const first = useProgress.getState().finishGrid(0, { ms: 45_000, stars: 2 }, '2026-11-17');
    expect(first).toMatchObject({ xp: 4, newBest: false, opened: { id: 'grid.2' } });
    const s = useProgress.getState();
    expect(s.game.levels['grid.1']).toEqual({ bestMs: 45_000, bestStars: 2, plays: 1 });
    expect(s.game.levels['trial.move']).toBeDefined();
    expect(s.days['2026-11-17']).toBe(s.xp);
    expect(s.streak.count).toBe(1);
  });

  it('records a go at a game: best accuracy and time, XP for the day, and the streak', () => {
    const first = useProgress.getState().finishGame('trial.clip', { ms: 30_000, asked: 8, firstTry: 5, known: ['copy'] }, '2026-11-16');
    expect(first).toMatchObject({ stars: 1, xp: 2, newBest: null, accuracy: 63 });
    const second = useProgress.getState().finishGame('trial.clip', { ms: 12_000, asked: 8, firstTry: 8, timed: true, known: ['copy', 'paste'] }, '2026-11-16');
    expect(second).toMatchObject({ stars: 3, xp: 6, newBest: 'accuracy' });
    const s = useProgress.getState();
    expect(s.game.levels['trial.clip']).toEqual({ bestMs: 12_000, bestStars: 3, plays: 2, bestAccuracy: 100, bestTimedMs: 12_000 });
    expect(s.game.known).toEqual({ copy: 2, paste: 1 });
    expect(s.xp).toBe(8);
    expect(s.days['2026-11-16']).toBe(8);
    expect(s.streak.count).toBe(1);
  });

  it('reset wipes everything', () => {
    useProgress.getState().finish(defaultCourse, { id: addItUp.id, summary: clean, now: 5_000, today: '2026-11-14' });
    useProgress.getState().setLevel('new');
    useProgress.getState().reset();
    expect(dataOf(useProgress.getState())).toEqual(emptyProgress());
  });

  it('opens with nothing saved rather than failing on data it cannot read', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ state: 'garbage', version: 0 }));
    await useProgress.persist.rehydrate();
    expect(dataOf(useProgress.getState())).toEqual(emptyProgress());
    expect(typeof useProgress.getState().saveRun).toBe('function');
  });
});
