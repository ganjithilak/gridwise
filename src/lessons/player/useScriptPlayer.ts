import { useEffect, useMemo, useState } from 'react';

import type { SheetController } from '@/spreadsheet/controller';

import type { ScriptStep } from '../types';
import { IDLE, ScriptRunner, type Playback } from './scriptRunner';

export interface ScriptPlayer extends Playback {
  /** `startAt` reopens a script at a step the learner had already reached. */
  play: (steps: readonly ScriptStep[], onDone?: () => void, startAt?: number) => void;
  /** Move on to the next step. */
  next: () => void;
  /** Return to the step before. */
  back: () => void;
  /** Skip to the end. */
  finish: () => void;
}

/** A ScriptRunner bound to a component: it re-renders on every step and stops when the screen goes away. */
export function useScriptPlayer(controller: SheetController): ScriptPlayer {
  const [view, setView] = useState<Playback>(IDLE);
  const runner = useMemo(() => new ScriptRunner(controller, setView), [controller]);
  useEffect(() => () => runner.dispose(), [runner]);

  // These never change for a given sheet, so they are safe to hand to other components.
  const actions = useMemo(
    () => ({
      play: (steps: readonly ScriptStep[], onDone?: () => void, startAt?: number) => runner.play(steps, onDone, startAt),
      next: () => runner.next(),
      back: () => {
        runner.back();
      },
      finish: () => runner.finish(),
    }),
    [runner],
  );

  return useMemo(() => ({ ...view, ...actions }), [view, actions]);
}
