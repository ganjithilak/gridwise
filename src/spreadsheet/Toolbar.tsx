import { Pressable, StyleSheet, Text, View } from 'react-native';

import { buzz } from '@/lib/feedback';
import { radius, useTheme } from '@/theme';

import type { SheetViewState, ToolId } from './controller';

interface Props {
  /** Only the buttons this task needs. A button that would do nothing here is not shown. */
  tools: readonly ToolId[];
  state: SheetViewState;
  onTool: (tool: ToolId) => void;
  /** Demo: the button the app is pressing right now, as "tool:autosum". */
  flash?: string | null;
  locked?: boolean;
  height?: number;
}

const FACE: Partial<Record<ToolId, { label: string; spoken: string; bold?: boolean }>> = {
  undo: { label: 'Undo', spoken: 'Undo' },
  autosum: { label: 'Σ', spoken: 'AutoSum' },
  bold: { label: 'B', spoken: 'Bold', bold: true },
  currency: { label: '$', spoken: 'Show as money' },
  percent: { label: '%', spoken: 'Show as a percentage' },
  sortAsc: { label: 'A→Z', spoken: 'Sort smallest first, or A to Z' },
  sortDesc: { label: 'Z→A', spoken: 'Sort largest first, or Z to A' },
  copy: { label: 'Copy', spoken: 'Copy' },
  cut: { label: 'Cut', spoken: 'Cut' },
  paste: { label: 'Paste', spoken: 'Paste' },
};

/** The row of buttons above the keyboard: AutoSum, Bold, Sort and the like. */
export function Toolbar({ tools, state, onTool, flash, locked = false, height = 44 }: Props) {
  const c = useTheme();
  const shown = tools.filter((tool) => FACE[tool]);
  if (shown.length === 0) return null;

  return (
    <View style={styles.bar} testID="toolbar">
      {shown.map((tool) => {
        const face = FACE[tool]!;
        const off =
          locked || state.editing !== null || (tool === 'undo' && !state.canUndo) || (tool === 'paste' && state.clipboard === null);
        const flashing = flash === `tool:${tool}`;
        return (
          <Pressable
            key={tool}
            testID={`tool-${tool}`}
            accessibilityRole="button"
            accessibilityLabel={face.spoken}
            accessibilityState={{ disabled: off }}
            disabled={off}
            onPress={() => {
              buzz('key');
              onTool(tool);
            }}
            style={({ pressed }) => [
              styles.button,
              {
                height,
                backgroundColor: flashing ? c.spark : c.surface,
                borderColor: flashing ? c.spark : c.outline,
                borderBottomWidth: pressed || flashing ? 1 : 2.5,
                marginTop: pressed || flashing ? 1.5 : 0,
                opacity: off && !flashing ? 0.4 : 1,
              },
            ]}
          >
            <Text style={[face.label.length > 1 ? styles.word : styles.sign, { color: c.ink }, face.bold && styles.heavy]}>
              {face.label}
            </Text>
          </Pressable>
        );
      })}
      {/* Keeps one or two buttons from stretching right across the screen. */}
      {shown.length < 3 ? <View style={{ flex: 3 - shown.length }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 6 },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    userSelect: 'none',
  },
  sign: { fontSize: 20, fontWeight: '600' },
  word: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  heavy: { fontWeight: '900' },
});
