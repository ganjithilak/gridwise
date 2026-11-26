import { useEffect, useState } from 'react';
import { Animated } from 'react-native';

/**
 * One thing that can happen in the world now and then: a bird lands, the worm peeks out.
 * `run` starts it and must call `done` when it is over. It may return a function that
 * stops it early (the scene was left, or the component unmounted).
 */
export interface AmbientEvent {
  name: string;
  /** How likely this one is, relative to the others. Default 1. */
  weight?: number;
  run: (done: () => void) => (() => void) | void;
}

/** Every running scene, so development tools (and tests) can fire an event on demand. */
const scenes = new Map<string, { trigger: (name?: string) => void; names: string[] }>();

/** Development only: fires `event` (or the scene's next one) in `scene` now. */
export function triggerAmbient(scene: string, event?: string): void {
  scenes.get(scene)?.trigger(event);
}
export const ambientScenes = (): { scene: string; events: string[] }[] => [...scenes].map(([scene, s]) => ({ scene, events: s.names }));

if (__DEV__ && typeof window !== 'undefined') {
  (window as unknown as { gridwiseAmbient?: object }).gridwiseAmbient = { trigger: triggerAmbient, scenes: ambientScenes };
}

/**
 * The world's event clock (Creative Direction V2: "intermittent environmental events rather
 * than continuous repetitive animations"). While `active`, it waits a random time within
 * `gap` (ms), runs one event picked by weight, waits for it to finish, and goes again. Only
 * one event per scene runs at a time, and nothing runs while the scene is off screen.
 */
export function useAmbient(scene: string, active: boolean, events: AmbientEvent[], gap: [number, number], firstDelay = gap[0]): void {
  // The list is read when an event is picked, so callers may pass a fresh array each render.
  const [box] = useState(() => ({
    events,
    update(next: AmbientEvent[]) {
      this.events = next;
    },
  }));
  useEffect(() => box.update(events));

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stop: (() => void) | void;
    let busy = false;
    let order = 0;

    const pick = (name?: string): AmbientEvent | undefined => {
      const list = box.events;
      if (name) return list.find((e) => e.name === name);
      const total = list.reduce((n, e) => n + (e.weight ?? 1), 0);
      let r = Math.random() * total;
      for (const e of list) {
        r -= e.weight ?? 1;
        if (r <= 0) return e;
      }
      return list[list.length - 1];
    };

    const schedule = (ms: number) => {
      timer = setTimeout(() => fire(), ms);
    };
    let current = 0;
    const fire = (event = pick(), interrupt = false) => {
      if (!event) return;
      if (busy && !interrupt) return;
      if (busy && stop) stop();
      if (timer) clearTimeout(timer);
      busy = true;
      // Each run has its own token, so a run that was interrupted cannot end the next one.
      const token = ++current;
      stop = event.run(() => {
        if (token !== current) return;
        current++;
        busy = false;
        stop = undefined;
        schedule(gap[0] + Math.random() * (gap[1] - gap[0]));
      });
    };

    scenes.set(scene, {
      names: box.events.map((e) => e.name),
      // In order when no name is given, so a reviewer can step through every event.
      trigger: (name) => fire(name ? pick(name) : box.events[order++ % box.events.length], true),
    });
    schedule(firstDelay + Math.random() * 1500);
    return () => {
      if (timer) clearTimeout(timer);
      current++;
      if (stop) stop();
      scenes.delete(scene);
    };
  }, [active, scene]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Plays an animation and resolves when it ends (false if it was stopped). */
export const play = (anim: Animated.CompositeAnimation): Promise<boolean> => new Promise((resolve) => anim.start(({ finished }) => resolve(finished)));

export const wait = (ms: number): Animated.CompositeAnimation => Animated.delay(ms);

/** A random number between a and b. */
export const between = (a: number, b: number): number => a + Math.random() * (b - a);
