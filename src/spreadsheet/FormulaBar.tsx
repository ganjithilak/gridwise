import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isFormulaText, scanRefs, toA1 } from '@/engine';
import { mono, radius, useTheme } from '@/theme';

import type { SheetController, SheetViewState } from './controller';

interface Props {
  controller: SheetController;
  state: SheetViewState;
  locked?: boolean;
  height?: number;
}

/**
 * Shows which cell is selected and what is really in it (the formula, not the result).
 * While typing, each cell reference takes the colour of its outline on the grid.
 */
export function FormulaBar({ controller, state, locked = false, height = 44 }: Props) {
  const c = useTheme();
  const { editing, selection } = state;
  const text = editing ? editing.text : controller.sheet.getRaw(selection);

  const pieces: { text: string; color?: string }[] = [];
  if (editing && isFormulaText(text)) {
    let at = 0;
    scanRefs(text).forEach((ref, i) => {
      if (ref.start > at) pieces.push({ text: text.slice(at, ref.start) });
      pieces.push({ text: ref.text, color: c.refs[i % c.refs.length] });
      at = ref.end;
    });
    if (at < text.length) pieces.push({ text: text.slice(at) });
  } else {
    pieces.push({ text });
  }

  return (
    <View style={[styles.bar, { height, backgroundColor: c.surface, borderColor: editing ? c.accent : c.outline }]}>
      <View style={[styles.name, { borderColor: c.line, backgroundColor: c.sunken }]}>
        <Text style={[styles.nameText, { color: c.inkSoft }]}>{toA1(selection)}</Text>
      </View>
      <Pressable
        testID="formula-bar"
        accessibilityRole="button"
        accessibilityLabel={editing ? `Typing in ${toA1(selection)}: ${text}` : `Type in ${toA1(selection)}`}
        disabled={locked || editing !== null}
        onPress={() => controller.startEdit()}
        style={styles.field}
      >
        {text === '' && !editing ? (
          <Text style={[styles.placeholder, { color: c.inkFaint }]}>Tap the cell again to type</Text>
        ) : (
          <Text numberOfLines={1} ellipsizeMode="head" style={[styles.text, { color: c.ink, fontFamily: mono }]}>
            {pieces.map((piece, i) => (
              <Text key={i} style={piece.color ? { color: piece.color, fontWeight: '700' } : undefined}>
                {piece.text}
              </Text>
            ))}
            {editing ? <Text style={{ color: c.accent }}>|</Text> : null}
          </Text>
        )}
      </Pressable>
      {editing ? (
        <Pressable
          testID="formula-cancel"
          accessibilityRole="button"
          accessibilityLabel="Cancel typing"
          disabled={locked}
          onPress={() => controller.cancel()}
          style={[styles.action, { borderColor: c.line }]}
        >
          <Text style={[styles.actionText, { color: c.inkSoft }]}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'stretch', borderWidth: 1.5, borderRadius: radius.sm, overflow: 'hidden' },
  name: { width: 46, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1 },
  nameText: { fontSize: 13, fontWeight: '700' },
  field: { flex: 1, justifyContent: 'center', paddingHorizontal: 10 },
  text: { fontSize: 16 },
  placeholder: { fontSize: 14 },
  action: { width: 44, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1 },
  actionText: { fontSize: 16, fontWeight: '700' },
});
