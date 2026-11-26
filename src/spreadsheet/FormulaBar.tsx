import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isFormulaText, scanRefs, toA1 } from '@/engine';
import { mono, useTheme } from '@/theme';

import type { SheetController, SheetViewState } from './controller';

interface Props {
  controller: SheetController;
  state: SheetViewState;
  locked?: boolean;
  height?: number;
}

/**
 * Excel's formula bar: the Name Box with the active cell's reference, then what is really
 * in the cell (the formula, not its result). While typing, each cell reference takes the
 * colour of its outline on the grid, and ✕ and ✓ cancel or confirm, as in Excel.
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
    <BarFrame name={toA1(selection)} height={height} active={editing !== null}>
      {editing ? (
        <BarButton testID="formula-cancel" label="Cancel typing" glyph="✕" colour={c.inkSoft} disabled={locked} onPress={() => controller.cancel()} />
      ) : null}
      {editing ? (
        <BarButton testID="formula-enter" label="Confirm the entry" glyph="✓" colour={c.good} disabled={locked} onPress={() => controller.commit()} />
      ) : null}
      <Fx />
      <Pressable
        testID="formula-bar"
        accessibilityRole="button"
        accessibilityLabel={editing ? `Typing in ${toA1(selection)}: ${text}` : `Edit ${toA1(selection)}`}
        disabled={locked || editing !== null}
        onPress={() => controller.startEdit()}
        style={styles.field}
      >
        {text === '' && !editing ? null : (
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
    </BarFrame>
  );
}

/**
 * The bar's frame on its own: Name Box on the left, then whatever goes in the bar. For
 * screens that show a formula without a live sheet behind it, such as "what will this show?".
 */
export function BarFrame({ name, height = 44, active = false, children }: { name: string; height?: number; active?: boolean; children: React.ReactNode }) {
  const c = useTheme();
  return (
    <View style={[styles.bar, { height, backgroundColor: c.surface, borderBottomColor: active ? c.accent : c.line }]}>
      <View style={[styles.name, { borderColor: c.line, backgroundColor: c.sunken }]} accessibilityLabel={`Name Box: ${name}`}>
        <Text testID="name-box" style={[styles.nameText, { color: active ? c.accent : c.ink, fontFamily: mono }]}>
          {name}
        </Text>
      </View>
      {children}
    </View>
  );
}

/** The fx mark between the Name Box and the contents. */
export function Fx() {
  const c = useTheme();
  return (
    <View style={styles.fx} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={[styles.fxText, { color: c.inkFaint }]}>fx</Text>
    </View>
  );
}

function BarButton(props: { testID: string; label: string; glyph: string; colour: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      disabled={props.disabled}
      onPress={props.onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      style={styles.action}
    >
      <Text style={[styles.actionText, { color: props.colour }]}>{props.glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: 1.5 },
  name: { minWidth: 56, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRightWidth: StyleSheet.hairlineWidth },
  nameText: { fontSize: 14, fontWeight: '700' },
  fx: { width: 30, alignItems: 'center', justifyContent: 'center' },
  fxText: { fontSize: 14, fontStyle: 'italic', fontWeight: '600', fontFamily: 'Georgia, serif' },
  field: { flex: 1, justifyContent: 'center', paddingRight: 10 },
  text: { fontSize: 16 },
  action: { width: 36, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 17, fontWeight: '700' },
});
