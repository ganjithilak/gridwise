import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { CellAlign } from '@/engine';
import { useTheme } from '@/theme';

interface Props {
  col: number;
  row: number;
  label: string;
  text: string;
  align: CellAlign;
  bold: boolean;
  /** Error values are shown in the "not quite" colour. */
  isError: boolean;
  width: number;
  height: number;
  fontSize: number;
  disabled: boolean;
  onPress: (col: number, row: number) => void;
}

const ALIGN = { left: 'flex-start', right: 'flex-end', center: 'center' } as const;

function CellImpl({ col, row, label, text, align, bold, isError, width, height, fontSize, disabled, onPress }: Props) {
  const c = useTheme();
  return (
    <Pressable
      testID={`cell-${label}`}
      accessibilityRole="button"
      accessibilityLabel={text === '' ? `${label}, empty` : `${label}, ${text}`}
      disabled={disabled}
      onPress={() => onPress(col, row)}
      style={[
        styles.cell,
        { width, height, alignItems: ALIGN[align], backgroundColor: c.surface, borderColor: c.line },
      ]}
    >
      <Text
        numberOfLines={1}
        ellipsizeMode="clip"
        style={[
          styles.text,
          { fontSize, color: isError ? c.bad : c.ink, fontWeight: bold ? '700' : '400' },
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

export const Cell = memo(CellImpl);

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    userSelect: 'none',
  },
  text: { fontVariant: ['tabular-nums'] },
});
