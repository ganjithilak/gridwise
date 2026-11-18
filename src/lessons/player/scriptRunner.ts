import type { SheetCapture, SheetController } from '@/spreadsheet/controller';

import { applyStep, stepPress, stepTarget } from '../script';
import type { ScriptStep } from '../types';

export interface Playback {
  playing: boolean;
  /** True while the app is waiting for the learner to press Next. */
  waiting: boolean;
  /** What the app is saying about the step on screen. Stays up after the last step. */
  caption: string | null;
  /** The cell the app is about to tap, or the block it is about to drag over ("B2:B6"). */
  ghostCell: string | null;
  /** What the app is about to press: a key ("7"), or "chip:AVERAGE", "tool:autosum", "combo:copy". */
  flashKey: string | null;
  /** The step the app last stopped at. Saved, so a lesson reopens at the same place. */
  stop: number;
  /** False only while waiting on the very first step, where there is nothing earlier. */
  canBack: boolean;
}

export const IDLE: Playback = {
  playing: false,
  waiting: false,
  caption: null,
  ghostCell: null,
  flashKey: null,
  stop: 0,
  canBack: false,
};

/** Pause after a step, so its result can be seen before the next one is pointed at. */
export const SETTLE_MS = 220;
/** How long a step with nothing to read is pointed at before it happens by itself. */
export const SILENT_LEAD_MS = 320;

/** The app stops at the first step, and at every step that has something to read. */
export const isStop = (steps: readonly ScriptStep[], index: number): boolean =>
  index === 0 || steps[index]?.say !== undefined;

/** The last step a script stops at: where "Back" lands once the script has finished. */
export function lastStop(steps: readonly ScriptStep[]): number {
  for (let i = steps.length - 1; i > 0; i--) if (isStop(steps, i)) return i;
  return 0;
}

/**
 * Plays a script on a sheet at the learner's pace. Every step that has something to
 * read is shown, pointed at, and then waits for Next, so nobody is rushed. Steps with
 * nothing to read (the fourth "+" in a row) follow on by themselves. Back returns to
 * the step before, with the sheet put back as it was then.
 *
 * It drives the same controller the learner uses, so what is shown is exactly what
 * happens when they do it themselves.
 */
export class ScriptRunner {
  view: Playback = IDLE;
  private steps: readonly ScriptStep[] = [];
  private index = 0;
  /** The sheet as it was before the first step, which Back rebuilds from. */
  private start: SheetCapture | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** What the running timer will do when it fires. */
  private pending: 'act' | 'present' | null = null;
  private onDone: (() => void) | undefined;

  constructor(
    private readonly controller: SheetController,
    private readonly emit: (view: Playback) => void,
  ) {}

  /**
   * Starts from the sheet as it is now. `startAt` reopens a script part-way through:
   * the steps before it are done at once, and the app waits there.
   */
  play(steps: readonly ScriptStep[], onDone?: () => void, startAt = 0): void {
    this.dispose();
    this.steps = steps;
    this.onDone = onDone;
    this.start = this.controller.capture();
    let from = Math.max(0, Math.min(Math.floor(startAt) || 0, steps.length - 1));
    while (!isStop(steps, from)) from--;
    for (let i = 0; i < from; i++) applyStep(this.controller, steps[i]);
    this.index = from;
    this.view = IDLE;
    this.present();
  }

  /** The learner pressed Next. If the app is already mid-step, this just hurries it along. */
  next(): void {
    if (!this.view.playing) return;
    if (this.view.waiting) {
      this.act();
      return;
    }
    const pending = this.pending;
    this.clearTimer();
    if (pending === 'act') this.act();
    else if (pending === 'present') this.present();
  }

  /**
   * The learner pressed Back: return to the step they read before this one. If the app is
   * mid-step, it returns to the one it was carrying out. False if there is nothing earlier.
   */
  back(): boolean {
    if (!this.view.playing || !this.start) return false;
    const target = this.view.waiting ? this.stopBefore(this.index) : this.view.stop;
    if (target === null) return false;
    this.clearTimer();
    this.controller.restore(this.start);
    for (let i = 0; i < target; i++) applyStep(this.controller, this.steps[i]);
    this.index = target;
    this.view = IDLE;
    this.present();
    return true;
  }

  /** Skip: do everything that is left at once. */
  finish(): void {
    if (!this.view.playing) return;
    this.clearTimer();
    // The sheet ends up finished, so the words on screen should be the last ones too.
    let caption = this.view.caption;
    while (this.index < this.steps.length) {
      const step = this.steps[this.index++];
      applyStep(this.controller, step);
      if (step.say !== undefined) caption = step.say;
    }
    this.view = { ...this.view, caption, stop: lastStop(this.steps) };
    this.end();
  }

  /** Stop without telling anyone. Used when the screen goes away. */
  dispose(): void {
    this.clearTimer();
    this.onDone = undefined;
    this.steps = [];
    this.index = 0;
    this.start = null;
  }

  /** Point at the next step and say what it is. */
  private present(): void {
    this.clearTimer();
    const step = this.steps[this.index];
    if (!step) {
      this.end();
      return;
    }
    // The very first step always waits, so a demonstration never starts by itself.
    const waits = isStop(this.steps, this.index);
    this.set({
      playing: true,
      waiting: waits,
      caption: step.say ?? this.view.caption,
      ghostCell: stepTarget(step),
      flashKey: stepPress(step),
      stop: waits ? this.index : this.view.stop,
      canBack: waits ? this.stopBefore(this.index) !== null : true,
    });
    if (!waits) this.schedule('act', SILENT_LEAD_MS);
  }

  /** Do the step that is being pointed at. */
  private act(): void {
    this.clearTimer();
    applyStep(this.controller, this.steps[this.index++]);
    if (this.index >= this.steps.length) {
      this.end();
      return;
    }
    this.set({ ...this.view, waiting: false, ghostCell: null, flashKey: null, canBack: true });
    this.schedule('present', SETTLE_MS);
  }

  private end(): void {
    const done = this.onDone;
    this.onDone = undefined;
    this.set({ ...this.view, playing: false, waiting: false, ghostCell: null, flashKey: null });
    done?.();
  }

  private stopBefore(index: number): number | null {
    for (let i = index - 1; i >= 0; i--) if (isStop(this.steps, i)) return i;
    return null;
  }

  private schedule(what: 'act' | 'present', ms: number): void {
    this.pending = what;
    this.timer = setTimeout(() => (what === 'act' ? this.act() : this.present()), ms);
  }

  private set(view: Playback): void {
    this.view = view;
    this.emit(view);
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.pending = null;
  }
}
