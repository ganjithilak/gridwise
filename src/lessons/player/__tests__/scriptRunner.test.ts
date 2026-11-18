/** @jest-environment node */
import { a1, type SheetSpec } from '@/engine';
import { SheetController } from '@/spreadsheet/controller';

import type { ScriptStep } from '../../types';
import { lastStop, ScriptRunner, SETTLE_MS, SILENT_LEAD_MS, type Playback } from '../scriptRunner';

const spec: SheetSpec = {
  cols: 3,
  rows: 5,
  grid: [
    ['Day', 'Sales', 'Costs'],
    ['Mon', 120, 80],
    ['Tue', 95, 60],
  ],
};

const script: ScriptStep[] = [
  { tap: 'B4', say: 'Tap B4.' },
  { tap: 'B4' },
  { key: '=', say: 'Start with =' },
  { tap: 'B2', say: 'Add the two days.' },
  { key: '+' },
  { tap: 'B3' },
  { key: 'enter', say: 'Enter.' },
];

function setup() {
  const controller = new SheetController(spec, 'A1');
  const seen: Playback[] = [];
  const runner = new ScriptRunner(controller, (view) => seen.push(view));
  const done = jest.fn();
  return { controller, runner, seen, done };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('ScriptRunner', () => {
  it('shows the first step and waits: nothing happens until Next', () => {
    const { controller, runner, done } = setup();
    runner.play(script, done);
    expect(runner.view).toMatchObject({ playing: true, waiting: true, caption: 'Tap B4.', ghostCell: 'B4' });
    jest.advanceTimersByTime(60_000);
    expect(controller.getState().selection).toEqual(a1('A1'));
    expect(runner.view.waiting).toBe(true);
    expect(done).not.toHaveBeenCalled();
  });

  it('does a step on Next, then points at the following one and waits again', () => {
    const { controller, runner } = setup();
    runner.play(script);
    runner.next();
    expect(controller.getState().selection).toEqual(a1('B4'));
    expect(runner.view.waiting).toBe(false);
    // The second tap has nothing to read, so it follows on by itself...
    jest.advanceTimersByTime(SETTLE_MS);
    expect(runner.view).toMatchObject({ waiting: false, ghostCell: 'B4', caption: 'Tap B4.' });
    jest.advanceTimersByTime(SILENT_LEAD_MS);
    expect(controller.getState().editing).not.toBeNull();
    // ...and the app stops at the next step that has a caption.
    jest.advanceTimersByTime(SETTLE_MS);
    expect(runner.view).toMatchObject({ waiting: true, caption: 'Start with =', flashKey: '=' });
    jest.advanceTimersByTime(60_000);
    expect(controller.getState().editing?.text).toBe('');
  });

  it('plays the whole script with one Next per caption', () => {
    const { controller, runner, done } = setup();
    runner.play(script, done);
    let presses = 0;
    while (runner.view.playing) {
      expect(runner.view.waiting).toBe(true);
      runner.next();
      presses++;
      jest.advanceTimersByTime(5_000);
    }
    expect(presses).toBe(script.filter((step) => step.say).length);
    expect(controller.sheet.getRaw(a1('B4'))).toBe('=B2+B3');
    expect(controller.sheet.getValue(a1('B4'))).toBe(215);
    expect(done).toHaveBeenCalledTimes(1);
    expect(runner.view).toMatchObject({ playing: false, waiting: false, caption: 'Enter.', ghostCell: null, flashKey: null });
  });

  it('a second quick Next hurries the app along but never skips a caption', () => {
    const { runner } = setup();
    runner.play(script);
    runner.next(); // does "Tap B4."
    runner.next(); // hurries: points at the silent tap straight away
    runner.next(); // hurries: does the silent tap
    runner.next(); // hurries: shows the next caption
    expect(runner.view).toMatchObject({ waiting: true, caption: 'Start with =' });
  });

  it('Skip does everything that is left at once', () => {
    const { controller, runner, done } = setup();
    runner.play(script, done);
    runner.next();
    runner.finish();
    expect(controller.sheet.getValue(a1('B4'))).toBe(215);
    expect(done).toHaveBeenCalledTimes(1);
    expect(runner.view.playing).toBe(false);
    // The words match the finished sheet, not the step that was skipped from.
    expect(runner.view).toMatchObject({ caption: 'Enter.', stop: 6 });
    jest.advanceTimersByTime(60_000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('stops silently when the screen goes away', () => {
    const { controller, runner, done } = setup();
    runner.play(script, done);
    runner.next();
    runner.dispose();
    jest.advanceTimersByTime(60_000);
    expect(controller.getState().editing).toBeNull();
    expect(done).not.toHaveBeenCalled();
  });

  describe('Back', () => {
    /** Presses Next and lets the app run on until it is waiting again (or has finished). */
    const step = (runner: ScriptRunner) => {
      runner.next();
      jest.advanceTimersByTime(5_000);
    };

    it('has nowhere to go on the first step', () => {
      const { runner } = setup();
      runner.play(script);
      expect(runner.view.canBack).toBe(false);
      expect(runner.back()).toBe(false);
      expect(runner.view).toMatchObject({ waiting: true, caption: 'Tap B4.', stop: 0 });
    });

    it('returns to the step read before, with the sheet as it was then', () => {
      const { controller, runner } = setup();
      runner.play(script);
      step(runner); // "Tap B4." done, silent tap done, now waiting on "Start with ="
      step(runner); // "=" typed, now waiting on "Add the two days."
      expect(runner.view).toMatchObject({ waiting: true, caption: 'Add the two days.', stop: 3, canBack: true });
      expect(controller.getState().editing?.text).toBe('=');

      expect(runner.back()).toBe(true);
      expect(runner.view).toMatchObject({ waiting: true, caption: 'Start with =', flashKey: '=', stop: 2 });
      expect(controller.getState().editing?.text).toBe('');

      expect(runner.back()).toBe(true);
      expect(runner.view).toMatchObject({ waiting: true, caption: 'Tap B4.', ghostCell: 'B4', stop: 0, canBack: false });
      expect(controller.getState().selection).toEqual(a1('A1'));
      expect(controller.getState().editing).toBeNull();
    });

    it('going back and forward again ends in the same place', () => {
      const { controller, runner, done } = setup();
      runner.play(script, done);
      step(runner);
      step(runner);
      step(runner);
      runner.back();
      runner.back();
      while (runner.view.playing) step(runner);
      expect(controller.sheet.getRaw(a1('B4'))).toBe('=B2+B3');
      expect(done).toHaveBeenCalledTimes(1);
    });

    it('pressed while the app is mid-step, it re-reads the step being carried out', () => {
      const { controller, runner } = setup();
      runner.play(script);
      step(runner);
      step(runner);
      runner.next(); // "Add the two days." is now being carried out: B2 tapped, + and B3 to follow
      expect(runner.view.waiting).toBe(false);
      expect(runner.back()).toBe(true);
      expect(runner.view).toMatchObject({ waiting: true, caption: 'Add the two days.', stop: 3 });
      expect(controller.getState().editing?.text).toBe('=');
      jest.advanceTimersByTime(60_000);
      expect(controller.getState().editing?.text).toBe('=');
    });

    it('does nothing once the script has finished', () => {
      const { controller, runner } = setup();
      runner.play(script);
      runner.finish();
      expect(runner.back()).toBe(false);
      expect(controller.sheet.getValue(a1('B4'))).toBe(215);
    });

    it('rebuilds from the sheet the script started on, not a blank one', () => {
      const { controller, runner } = setup();
      controller.tapCell(a1('C4'));
      controller.pressKey('9');
      controller.pressKey('enter');
      runner.play(script);
      step(runner);
      step(runner);
      runner.back();
      expect(controller.sheet.getValue(a1('C4'))).toBe(9);
    });
  });

  describe('reopening part-way through', () => {
    it('does the earlier steps at once and waits at the saved one', () => {
      const { controller, runner } = setup();
      runner.play(script, undefined, 3);
      expect(runner.view).toMatchObject({ playing: true, waiting: true, caption: 'Add the two days.', ghostCell: 'B2', stop: 3 });
      expect(controller.getState().editing?.text).toBe('=');
      expect(controller.getState().selection).toEqual(a1('B4'));
      jest.advanceTimersByTime(60_000);
      expect(controller.getState().editing?.text).toBe('=');
    });

    it('can still go back from there, and plays on to the end', () => {
      const { controller, runner, done } = setup();
      runner.play(script, done, 3);
      expect(runner.back()).toBe(true);
      expect(runner.view).toMatchObject({ caption: 'Start with =', stop: 2 });
      while (runner.view.playing) {
        runner.next();
        jest.advanceTimersByTime(5_000);
      }
      expect(controller.sheet.getValue(a1('B4'))).toBe(215);
      expect(done).toHaveBeenCalledTimes(1);
    });

    it('settles on the nearest step with something to read if the saved one has none', () => {
      const { runner } = setup();
      runner.play(script, undefined, 5); // a silent tap: the caption before it is step 3
      expect(runner.view).toMatchObject({ waiting: true, caption: 'Add the two days.', stop: 3 });
      runner.play(script, undefined, 99);
      expect(runner.view).toMatchObject({ waiting: true, caption: 'Enter.', stop: 6 });
      runner.play(script, undefined, -4);
      expect(runner.view).toMatchObject({ waiting: true, caption: 'Tap B4.', stop: 0 });
    });

    it('knows the last step a script stops at', () => {
      expect(lastStop(script)).toBe(6);
      expect(lastStop([{ tap: 'A1' }, { key: '1' }])).toBe(0);
      expect(lastStop([])).toBe(0);
    });
  });

  it('starting again replaces whatever was playing', () => {
    const { runner, done } = setup();
    runner.play(script, done);
    runner.next();
    runner.play([{ key: '1', say: 'One.' }]);
    expect(runner.view).toMatchObject({ waiting: true, caption: 'One.', flashKey: '1' });
    jest.advanceTimersByTime(60_000);
    expect(done).not.toHaveBeenCalled();
  });
});
