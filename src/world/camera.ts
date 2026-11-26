import { Animated, Easing, PanResponder, type PanResponderInstance } from 'react-native';

import { useWorld, type Col, type Row } from './store';

/** Camera moves. Product rule 4 allows 300 ms for a transition. */
export const TRAVEL_MS = 300;

/** What the camera needs to know about the screen and the painting, kept current by the World. */
export interface Frame {
  col: Col;
  row: Row;
  w: number;
  h: number;
  /** The camera's top edge when looking at the roots with no extra scroll. */
  rootsTop: number;
  /** How much further down the roots go than one screen. */
  maxOffset: number;
}

export interface Camera {
  x: Animated.Value;
  y: Animated.Value;
  pan: PanResponderInstance;
  frame: Frame;
  /** Extra scroll inside the roots. */
  offset: number;
  prevRow: Row | null;
  placed: boolean;
  /** Jumps straight to (c, r) without travelling. */
  place: (c: Col, r: Row) => void;
  setFrame: (frame: Frame) => void;
  /** The World's place changed (or the screen did): travel there. `rootsOffset` is where to land in the roots. */
  arrive: (c: Col, r: Row, rootsOffset: number) => void;
  /** The screen changed size: the next arrival jumps rather than travels. */
  reset: () => void;
  animate: (c: Col, r: Row) => void;
  onWheel: (e: { deltaY: number }) => void;
}

/**
 * The world's camera: two animated values (across and down) and the gestures that move
 * them. It is made once per World and works on the latest `frame` the World gives it.
 *
 * The values are moved by JavaScript rather than the native driver, so a drag can pick
 * the camera up mid-move. Only one transform is animated, so this stays cheap.
 */
export function makeCamera(): Camera {
  const go = (c: Col, r?: Row) => useWorld.getState().go(c, r);
  const start = { x: 0, y: 0 };
  let axis: 'x' | 'y' = 'x';
  let wheelLock = 0;

  const cam: Camera = {
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    pan: null as unknown as PanResponderInstance,
    frame: { col: 0, row: 0, w: 0, h: 0, rootsTop: 0, maxOffset: 0 },
    offset: 0,
    prevRow: null,
    placed: false,
    place: (c, r) => {
      cam.x.setValue(targetX(c));
      cam.y.setValue(targetY(r));
    },
    setFrame: (frame) => {
      cam.frame = frame;
    },
    arrive: (c, r, rootsOffset) => {
      if (r === 1 && cam.prevRow !== 1) cam.offset = rootsOffset;
      cam.prevRow = r;
      if (!cam.placed) {
        // First frame: be there already, no travelling in from the corner.
        cam.placed = true;
        cam.place(c, r);
        return;
      }
      cam.animate(c, r);
    },
    reset: () => {
      cam.placed = false;
    },
    animate: (c, r) => {
      const ease = Easing.out(Easing.cubic);
      Animated.parallel([
        Animated.timing(cam.x, { toValue: targetX(c), duration: TRAVEL_MS, easing: ease, useNativeDriver: false }),
        Animated.timing(cam.y, { toValue: targetY(r), duration: TRAVEL_MS, easing: ease, useNativeDriver: false }),
      ]).start();
    },
    onWheel: (e) => {
      const f = cam.frame;
      if (f.col !== 0) return;
      const now = Date.now();
      if (f.row === 1) {
        if (cam.offset <= 0 && e.deltaY < -30 && now > wheelLock) {
          wheelLock = now + 700;
          go(0, 0);
          return;
        }
        cam.offset = Math.min(f.maxOffset, Math.max(0, cam.offset + e.deltaY));
        cam.y.stopAnimation();
        cam.y.setValue(-(f.rootsTop + cam.offset));
        // Reaching the top by scrolling should not carry straight on up to the farm.
        if (cam.offset <= 0) wheelLock = now + 400;
        return;
      }
      if (now < wheelLock || Math.abs(e.deltaY) < 30) return;
      wheelLock = now + 700;
      if (f.row === 0) go(0, e.deltaY > 0 ? 1 : -1);
      else if (e.deltaY > 0) go(0, 0);
    },
  };

  function targetX(c: Col) {
    return -(c + 1) * cam.frame.w;
  }
  function targetY(r: Row) {
    return -(r === -1 ? 0 : r === 0 ? cam.frame.h : cam.frame.rootsTop + cam.offset);
  }

  /** Ends a gesture: moves to (c, r), or springs back if that is where it already is. */
  function settle(c: Col, r: Row) {
    if (c === cam.frame.col && r === cam.frame.row) cam.animate(c, r);
    else go(c, r);
  }

  function release(dx: number, dy: number, vx: number, vy: number) {
    const f = cam.frame;
    if (axis === 'x') {
      let c = f.col;
      if (dx < -f.w * 0.22 || vx < -0.5) c = Math.min(1, f.col + 1) as Col;
      else if (dx > f.w * 0.22 || vx > 0.5) c = Math.max(-1, f.col - 1) as Col;
      settle(c, f.row);
      return;
    }
    const far = f.h * 0.12;
    if (f.row === -1) settle(0, dy < -far || vy < -0.5 ? 0 : -1);
    else if (f.row === 0) settle(0, dy < -far || vy < -0.5 ? 1 : dy > far || vy > 0.5 ? -1 : 0);
    else {
      const top = -(start.y + dy);
      if (top < f.rootsTop - f.h * 0.1 || (top < f.rootsTop + 4 && vy > 1.1)) {
        settle(0, 0);
        return;
      }
      // Within the roots: glide on a little in the direction of the flick, then stop.
      cam.offset = Math.min(f.maxOffset, Math.max(0, top - f.rootsTop - vy * 240));
      cam.animate(0, 1);
    }
  }

  const rubber = (v: number, min: number, max: number) => (v > max ? max + (v - max) * 0.3 : v < min ? min + (v - min) * 0.3 : v);

  cam.pan = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => {
      const ax = Math.abs(g.dx);
      const ay = Math.abs(g.dy);
      if (ax < 10 && ay < 10) return false;
      const horizontal = ax > ay * 1.3;
      const f = cam.frame;
      // The direction is settled here, where the distance moved is known. (On the web, the
      // grant that follows can report none.)
      axis = horizontal ? 'x' : 'y';
      // On Games and Profile only a sideways swipe is the camera's: up and down scroll their lists.
      if (f.col !== 0) return horizontal;
      if (horizontal) return f.row !== -1;
      return ay > ax;
    },
    onPanResponderGrant: () => {
      cam.x.stopAnimation((v) => (start.x = v));
      cam.y.stopAnimation((v) => (start.y = v));
    },
    onPanResponderMove: (_, g) => {
      const f = cam.frame;
      if (axis === 'x') cam.x.setValue(rubber(start.x + g.dx, -2 * f.w, 0));
      else cam.y.setValue(rubber(start.y + g.dy, -(f.rootsTop + f.maxOffset), 0));
    },
    onPanResponderRelease: (_, g) => release(g.dx, g.dy, g.vx, g.vy),
    onPanResponderTerminate: (_, g) => release(g.dx, g.dy, g.vx, g.vy),
  });

  return cam;
}
