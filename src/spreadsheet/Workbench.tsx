import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, useTheme } from '@/theme';

/**
 * The spreadsheet's window: a formula bar on top and the grid filling the rest, framed as
 * one object, the way the sheet sits in Excel. Lessons, questions and games all put their
 * sheet in one of these, so the sheet looks and behaves the same everywhere.
 *
 * `bar` is usually a FormulaBar; leave it out for a sheet that is only read. `children`
 * is the grid, plus anything laid over it (such as "tap anywhere for Next").
 */
export function Workbench({ bar, children, testID }: { bar?: ReactNode; children: ReactNode; testID?: string }) {
  const c = useTheme();
  return (
    <View testID={testID ?? 'workbench'} style={[styles.frame, { backgroundColor: c.sunken, borderColor: `${c.accent}55`, shadowColor: '#000' }]}>
      {bar}
      <View style={styles.stage}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    minHeight: 0,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  stage: { flex: 1, minHeight: 0 },
});
