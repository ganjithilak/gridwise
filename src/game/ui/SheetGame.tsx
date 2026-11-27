import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useProgress } from '@/progress/store';
import { space } from '@/theme';

/**
 * How a sheet game is laid out. Upright: the question, the sheet filling the middle, the
 * answers at the bottom. On its side there is no height for all three, so, as in a
 * lesson, the sheet takes one half and the question and answers the other (the side the
 * learner chose for lessons).
 */
export function SheetGame({ top, sheet, bottom, bottomHeight }: { top: ReactNode; sheet: ReactNode; bottom: ReactNode; bottomHeight: number }) {
  const { width, height } = useWindowDimensions();
  const side = useProgress((s) => s.profile.sheetSide);
  if (width > height && height < 600) {
    const sheetHalf = (
      <View key="sheet" style={styles.half}>
        {sheet}
      </View>
    );
    const lessonHalf = (
      <View key="task" style={styles.half}>
        {top}
        <View style={styles.under}>{bottom}</View>
      </View>
    );
    return <View style={styles.split}>{side === 'left' ? [sheetHalf, lessonHalf] : [lessonHalf, sheetHalf]}</View>;
  }
  return (
    <>
      {top}
      {sheet}
      <View style={{ height: bottomHeight, justifyContent: 'flex-end' }}>{bottom}</View>
    </>
  );
}

const styles = StyleSheet.create({
  split: { flex: 1, flexDirection: 'row', gap: space.md },
  half: { flex: 1, minHeight: 0, gap: space.xs },
  under: { flex: 1, justifyContent: 'flex-end' },
});
