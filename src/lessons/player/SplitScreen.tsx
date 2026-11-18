import { useRef, type ReactNode } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import type { Side } from '@/progress/saved';
import { space } from '@/theme';

import type { Metrics } from './GridExercise';

interface Props {
  layout: Exclude<Metrics['layout'], 'stack'>;
  /** The spreadsheet: its bar and its grid. */
  sheet: ReactNode;
  /** The lesson: what to do, and under it the keys or the result. */
  lesson: ReactNode;
  /** The lesson side was swiped across to the other side of the screen. */
  onSheetSide?: (side: Side) => void;
}

/** How far a finger has to travel sideways for it to count as a swipe and not a tap. */
const SWIPE_STARTS = 24;
const SWIPE_COUNTS = 70;

/**
 * The layout for a screen on its side, or a computer: the spreadsheet on one half and the
 * lesson with its keys on the other, as on a real desk with the book beside the screen.
 * Swiping the lesson half sideways moves it to that side, for either hand.
 */
export function SplitScreen({ layout, sheet, lesson, onSheetSide }: Props) {
  const from = useRef<{ x: number; y: number } | null>(null);

  const noteTouch = (e: GestureResponderEvent) => {
    from.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    return false;
  };
  // A sideways drag is taken over as a swipe. Anything else stays a tap on a key or button.
  const becomesSwipe = (e: GestureResponderEvent) => {
    const start = from.current;
    if (!start || !onSheetSide) return false;
    const dx = Math.abs(e.nativeEvent.pageX - start.x);
    const dy = Math.abs(e.nativeEvent.pageY - start.y);
    return dx > SWIPE_STARTS && dx > dy * 2;
  };
  const swiped = (e: GestureResponderEvent) => {
    const start = from.current;
    from.current = null;
    if (!start) return;
    const dx = e.nativeEvent.pageX - start.x;
    if (Math.abs(dx) < SWIPE_COUNTS) return;
    // The lesson goes where the finger went, so the sheet takes the other side.
    const sheetSide: Side = dx > 0 ? 'left' : 'right';
    if ((layout === 'sheet-left' ? 'left' : 'right') !== sheetSide) onSheetSide?.(sheetSide);
  };

  return (
    <View style={[styles.split, layout === 'sheet-right' && styles.sheetRight]} testID={`split-${layout}`}>
      <View style={styles.sheet}>{sheet}</View>
      <View
        style={styles.lesson}
        testID="lesson-side"
        onStartShouldSetResponderCapture={noteTouch}
        onMoveShouldSetResponderCapture={becomesSwipe}
        onResponderRelease={swiped}
        onResponderTerminate={() => {
          from.current = null;
        }}
      >
        {lesson}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  split: { flex: 1, flexDirection: 'row', gap: space.md },
  sheetRight: { flexDirection: 'row-reverse' },
  // The sheet gets a little more than half: it is what the lesson is about.
  sheet: { flex: 1.2, minWidth: 0, gap: space.sm },
  lesson: { flex: 1, minWidth: 260, maxWidth: 420, gap: space.sm },
});
