import { StyleSheet, Text, View } from 'react-native';

import { a1, toA1 } from '@/engine';
import { useTheme } from '@/theme';

import { GRID_LEVELS, itemsOf, type GridState, type Item } from './gridMaster';

/** Room for the row numbers down the side and the column letters along the top. */
export const ROW_W = 22;
export const HEAD_H = 18;

interface Props {
  state: GridState;
  /** The size of one cell, worked out by the screen from the space it has. */
  cell: number;
}

const letterOf = (col: number): string => toA1({ col, row: 0 }).replace(/[0-9]/g, '');

/**
 * The Grid Master board: a real-looking sheet, with column letters and row numbers, and
 * the snake drawn as a selection. Its head is the active cell, and the head's column
 * letter and row number light up the way a spreadsheet's do, so the player can always
 * read where the snake is.
 */
export function GridBoard({ state, cell }: Props) {
  const c = useTheme();
  const level = GRID_LEVELS[state.level];
  const items = itemsOf(state);
  const head = a1(state.snake[0]);
  const body = new Set(state.snake.slice(1));
  const bumped = state.status === 'stopped' && state.event?.kind !== 'paused';
  // The things to collect: one colour each, all different from the snake's blue.
  const colours = { collect: c.refs[1], portal: c.refs[2], switch: c.refs[3] };

  const drawItem = (item: Item) => {
    switch (item.kind) {
      case 'collect':
        return <View style={[styles.round, { width: cell * 0.44, height: cell * 0.44, backgroundColor: colours.collect }]} />;
      case 'shrink':
        return (
          <View style={[styles.shrink, { width: cell * 0.64, height: cell * 0.64, borderColor: c.good, backgroundColor: c.goodSoft }]}>
            <Text style={[styles.word, { color: c.good, fontSize: cell * 0.3 }]}>−1</Text>
          </View>
        );
      case 'switch':
        return <View style={{ width: cell * 0.4, height: cell * 0.4, backgroundColor: colours.switch, transform: [{ rotate: '45deg' }], borderRadius: 3 }} />;
      case 'portal':
        return (
          <View style={[styles.round, { width: cell * 0.82, height: cell * 0.82, borderWidth: 2.5, borderColor: colours.portal }]}>
            <Text style={[styles.word, { color: colours.portal, fontSize: cell * 0.26 }]}>{item.to}</Text>
          </View>
        );
      case 'centre':
        return item.open ? (
          <View style={[styles.round, { width: cell * 0.78, height: cell * 0.78, borderWidth: 3, borderColor: c.spark }]}>
            <View style={[styles.round, { width: cell * 0.3, height: cell * 0.3, backgroundColor: c.spark }]} />
          </View>
        ) : (
          <View style={[styles.shut, { width: cell * 0.7, height: cell * 0.7, borderColor: c.spark }]} />
        );
      case 'wall':
        // Grey with a cross: nothing like the snake's blue, so the two are never mixed up.
        return (
          <View style={[StyleSheet.absoluteFill, styles.wall, { backgroundColor: c.inkFaint }]}>
            <Text style={[styles.word, { color: c.bg, fontSize: cell * 0.42 }]}>✕</Text>
          </View>
        );
    }
  };

  const wanted = level.targets[state.found];
  const label =
    `Sheet from A1 to ${letterOf(level.cols - 1)}${level.rows}. The snake's head is at ${state.snake[0]}, ` +
    `${state.snake.length} ${state.snake.length === 1 ? 'cell' : 'cells'} long.` +
    (wanted ? ` Collect ${wanted}.` : ` Head for ${level.centre}.`);

  return (
    <View style={[styles.board, { borderColor: c.outline, backgroundColor: c.sunken }]} accessibilityRole="image" accessibilityLabel={label} testID="grid-board">
      <View style={styles.row}>
        <View style={{ width: ROW_W, height: HEAD_H }} />
        {Array.from({ length: level.cols }, (_, col) => (
          <View key={col} style={[styles.head, { width: cell, height: HEAD_H, backgroundColor: col === head.col ? c.accentSoft : 'transparent' }]}>
            <Text style={[styles.label, { color: col === head.col ? c.accent : c.inkSoft }]}>{letterOf(col)}</Text>
          </View>
        ))}
      </View>
      {Array.from({ length: level.rows }, (_, row) => (
        <View key={row} style={styles.row}>
          <View style={[styles.head, { width: ROW_W, height: cell, backgroundColor: row === head.row ? c.accentSoft : 'transparent' }]}>
            <Text style={[styles.label, { color: row === head.row ? c.accent : c.inkSoft }]}>{row + 1}</Text>
          </View>
          {Array.from({ length: level.cols }, (_, col) => {
            const name = toA1({ col, row });
            const item = items[name];
            const isHead = col === head.col && row === head.row;
            const inBody = body.has(name);
            return (
              <View
                key={col}
                testID={`gm-${name}`}
                style={[
                  styles.cell,
                  {
                    width: cell,
                    height: cell,
                    borderColor: c.line,
                    backgroundColor: inBody ? c.accentSoft : c.surface,
                  },
                ]}
              >
                {item ? drawItem(item) : null}
                {inBody ? <View style={[StyleSheet.absoluteFill, styles.bodyEdge, { borderColor: c.accent }]} /> : null}
                {isHead ? (
                  <View style={[StyleSheet.absoluteFill, styles.headEdge, { borderColor: bumped ? c.bad : c.accent }]}>
                    <View style={[styles.handle, { backgroundColor: bumped ? c.bad : c.accent, borderColor: c.surface }]} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { alignSelf: 'center', borderWidth: 1.5, borderRadius: 6, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  head: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '800' },
  cell: { alignItems: 'center', justifyContent: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  round: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  shrink: { borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  shut: { borderRadius: 5, borderWidth: 2, borderStyle: 'dashed' },
  word: { fontWeight: '800' },
  wall: { alignItems: 'center', justifyContent: 'center', opacity: 0.55 },
  bodyEdge: { borderWidth: 1 },
  headEdge: { borderWidth: 3, borderRadius: 2 },
  // The little square on the corner of a selected cell: the snake is a selection.
  handle: { position: 'absolute', right: -3, bottom: -3, width: 7, height: 7, borderWidth: 1 },
});
