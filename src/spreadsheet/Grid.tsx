import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import {
  a1,
  alignFor,
  colToLetters,
  fitNumber,
  isError,
  isFormulaText,
  parseRange,
  sameCell,
  sameRange,
  scanRefs,
  singleCell,
  toA1,
  type CellAddr,
  type CellAlign,
  type RangeAddr,
} from '@/engine';
import { MOTION_MS, TOUCH, useTheme } from '@/theme';

import { Cell } from './Cell';
import { fillArea, type SheetController, type SheetViewState } from './controller';
import { SelectionOverlay, type Rect } from './SelectionOverlay';

interface Props {
  controller: SheetController;
  state: SheetViewState;
  /** Taps are ignored, e.g. while the app is demonstrating. */
  locked?: boolean;
  /** The corner of the selection can be dragged to fill. Off unless the task is about filling. */
  fillHandle?: boolean;
  /** Demo: where the app is about to tap ("B2"), or the block it is about to drag over ("B2:B6"). */
  ghostCell?: string | null;
  /** A correct answer: this cell pops and the cells its formula uses flash. Change `nonce` to replay. */
  celebrate?: { cell: string; nonce: number } | null;
}

const COL_HEADER_H = 20;
const ROW_HEADER_W = 26;
const MIN_ROW_H = 28;
/** How far a finger must travel before a touch counts as a drag and not a wobbly tap. */
const DRAG_SLOP = 8;
/** The touchable square around the fill handle. The handle itself is much smaller. */
const HANDLE_REACH = 36;

/** The mini spreadsheet. It sizes its rows to the space it is given, up to a comfortable 44 pt. */
export function Grid({ controller, state, locked = false, fillHandle = false, ghostCell, celebrate }: Props) {
  const c = useTheme();
  const { sheet } = controller;
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  /** Where the fill handle is being dragged to, for the dashed preview. */
  const [fillTo, setFillTo] = useState<CellAddr | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  }, []);

  const onCellPress = useCallback(
    (col: number, row: number) => controller.tapCell({ col, row }),
    [controller],
  );

  const pop = useState(() => new Animated.Value(0))[0];
  const flash = useState(() => new Animated.Value(0))[0];
  const ghost = useState(() => new Animated.Value(0))[0];
  const ants = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (!celebrate) return;
    pop.setValue(0);
    flash.setValue(1);
    Animated.parallel([
      Animated.timing(pop, { toValue: 1, duration: MOTION_MS + 60, easing: Easing.out(Easing.back(2.5)), useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 300, delay: 120, useNativeDriver: true }),
    ]).start();
  }, [celebrate, pop, flash]);

  useEffect(() => {
    if (!ghostCell) return;
    ghost.setValue(0);
    Animated.timing(ghost, { toValue: 1, duration: MOTION_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [ghostCell, ghost]);

  // What has been copied keeps a dashed outline that gently pulses until it is dropped.
  const copied = state.clipboard !== null;
  useEffect(() => {
    if (!copied) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ants, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(ants, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [copied, ants]);

  const editing = state.editing;
  const editingFormula = editing !== null && isFormulaText(editing.text);
  const refs = useMemo(
    () => (editingFormula && editing ? scanRefs(editing.text) : []),
    [editingFormula, editing],
  );

  // ---- turning a finger position into a cell ---------------------------------------------
  const sheetView = useRef<ComponentRef<typeof View>>(null);
  const live = useRef({
    originX: 0,
    originY: 0,
    colW: 1,
    rowH: 1,
    startX: 0,
    startY: 0,
    /** The cell a drag began on, once it has become a drag. */
    from: null as CellAddr | null,
    last: null as CellAddr | null,
    left: false,
    onHandle: false,
  });

  const cellAt = (pageX: number, pageY: number): CellAddr => {
    const g = live.current;
    const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n));
    return {
      col: clamp(Math.floor((pageX - g.originX - ROW_HEADER_W) / g.colW), sheet.cols - 1),
      row: clamp(Math.floor((pageY - g.originY - COL_HEADER_H) / g.rowH), sheet.rows - 1),
    };
  };

  // Every touch is noted as it lands, without taking it away from the cell under it.
  const noteTouch = (e: GestureResponderEvent): boolean => {
    const g = live.current;
    g.startX = e.nativeEvent.pageX;
    g.startY = e.nativeEvent.pageY;
    g.from = null;
    g.onHandle = false;
    sheetView.current?.measureInWindow((x, y) => {
      g.originX = x;
      g.originY = y;
    });
    return false;
  };

  // Once the finger has travelled, the touch is a drag and the grid takes it over.
  const becomesDrag = (e: GestureResponderEvent): boolean => {
    const g = live.current;
    if (locked || g.onHandle) return false;
    return Math.abs(e.nativeEvent.pageX - g.startX) > DRAG_SLOP || Math.abs(e.nativeEvent.pageY - g.startY) > DRAG_SLOP;
  };

  const dragStart = () => {
    const g = live.current;
    g.from = cellAt(g.startX, g.startY);
    g.last = g.from;
    g.left = false;
  };

  const dragMove = (e: GestureResponderEvent) => {
    const g = live.current;
    if (!g.from) return;
    const to = cellAt(e.nativeEvent.pageX, e.nativeEvent.pageY);
    if (g.last && sameCell(to, g.last)) return;
    g.last = to;
    g.left = true;
    controller.drag(g.from, to);
  };

  const dragEnd = () => {
    const g = live.current;
    // A drag that never left its first cell was a tap with an unsteady finger.
    if (g.from && !g.left) controller.tapCell(g.from);
    g.from = null;
  };

  const handleMove = (e: GestureResponderEvent) => {
    const to = cellAt(e.nativeEvent.pageX, e.nativeEvent.pageY);
    setFillTo((prev) => (prev && sameCell(prev, to) ? prev : to));
  };

  const handleEnd = () => {
    live.current.onHandle = false;
    if (fillTo) controller.fillTo(fillTo);
    setFillTo(null);
  };

  const colW = size ? (size.w - ROW_HEADER_W) / sheet.cols : 1;
  const rowH = size ? Math.max(MIN_ROW_H, Math.min(TOUCH.ideal, Math.floor((size.h - COL_HEADER_H) / sheet.rows))) : 1;
  useEffect(() => {
    live.current.colW = colW;
    live.current.rowH = rowH;
  }, [colW, rowH]);

  if (!size) return <View style={styles.fill} onLayout={onLayout} />;

  const fontSize = rowH >= 40 ? 15 : 13;
  const maxChars = Math.max(3, Math.floor((colW - 12) / (fontSize * 0.58)));

  const rectOf = (r: RangeAddr): Rect => ({
    left: ROW_HEADER_W + r.start.col * colW,
    top: COL_HEADER_H + r.start.row * rowH,
    width: (r.end.col - r.start.col + 1) * colW,
    height: (r.end.row - r.start.row + 1) * rowH,
  });

  const { selection, range } = state;
  const several = !sameRange(range, singleCell(selection));
  const celebrateRefs =
    celebrate && sheet.isFormula(a1(celebrate.cell)) ? scanRefs(sheet.getRaw(a1(celebrate.cell))) : [];
  const ghostRange = ghostCell ? parseRange(ghostCell) : null;
  const ghostIsBlock = ghostRange !== null && !sameCell(ghostRange.start, ghostRange.end);
  const canFill = fillHandle && !locked && !editing;
  const fillPreview = fillTo ? fillArea(range, fillTo) : null;
  const corner = rectOf(range);

  const rows = [];
  for (let row = 0; row < sheet.rows; row++) {
    const cells = [];
    for (let col = 0; col < sheet.cols; col++) {
      const addr = { col, row };
      const here = editing !== null && selection.col === col && selection.row === row;
      const value = sheet.getValue(addr);
      const format = sheet.getFormat(addr);
      let text: string;
      let align: CellAlign;
      if (here && editing) {
        text = editing.text;
        align = 'left';
      } else if (typeof value === 'number') {
        text = fitNumber(value, format.numFmt ?? 'general', maxChars);
        align = 'right';
      } else {
        text = sheet.getDisplay(addr);
        align = alignFor(value);
      }
      cells.push(
        <Cell
          key={col}
          col={col}
          row={row}
          label={toA1(addr)}
          text={text}
          align={align}
          bold={!!format.bold}
          isError={!here && isError(value)}
          width={colW}
          height={rowH}
          fontSize={fontSize}
          disabled={locked}
          onPress={onCellPress}
        />,
      );
    }
    const activeRow = row >= range.start.row && row <= range.end.row;
    rows.push(
      <View key={row} style={styles.row}>
        <View
          style={[
            styles.rowHeader,
            { height: rowH, backgroundColor: activeRow ? c.accentSoft : c.sunken, borderColor: c.line },
          ]}
        >
          <Text style={[styles.headerText, { color: activeRow ? c.accent : c.inkSoft }]}>{row + 1}</Text>
        </View>
        {cells}
      </View>,
    );
  }

  return (
    <View style={styles.fill} onLayout={onLayout}>
      <View
        ref={sheetView}
        testID="grid"
        style={[styles.sheet, { borderColor: c.outline, width: size.w, height: COL_HEADER_H + rowH * sheet.rows + 1 }]}
        onStartShouldSetResponderCapture={noteTouch}
        onMoveShouldSetResponderCapture={becomesDrag}
        onResponderGrant={dragStart}
        onResponderMove={dragMove}
        onResponderRelease={dragEnd}
        onResponderTerminate={dragEnd}
        onResponderTerminationRequest={() => false}
      >
        <View style={styles.row}>
          <View style={[styles.corner, { backgroundColor: c.sunken, borderColor: c.line }]} />
          {Array.from({ length: sheet.cols }, (_, col) => {
            const active = col >= range.start.col && col <= range.end.col;
            return (
              <View
                key={col}
                style={[
                  styles.colHeader,
                  { width: colW, backgroundColor: active ? c.accentSoft : c.sunken, borderColor: c.line },
                ]}
              >
                <Text style={[styles.headerText, { color: active ? c.accent : c.inkSoft }]}>{colToLetters(col)}</Text>
              </View>
            );
          })}
        </View>
        {rows}

        {refs.map((ref, i) => {
          const colour = c.refs[i % c.refs.length];
          return <SelectionOverlay key={`${ref.start}-${ref.text}`} rect={rectOf(ref.range)} color={colour} fill={`${colour}22`} dashed />;
        })}

        {state.clipboard ? (
          <Animated.View
            pointerEvents="none"
            testID="copied-outline"
            style={[
              styles.overlay,
              rectOf(state.clipboard.range),
              {
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: c.ink,
                opacity: ants.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              },
            ]}
          />
        ) : null}

        {several ? (
          // The whole block is tinted; the active cell inside it keeps its own outline.
          <SelectionOverlay rect={rectOf(range)} color={c.accent} fill={`${c.accent}1F`} handle={!editing} handleEdge={c.surface} bigHandle={canFill} />
        ) : null}
        <SelectionOverlay
          rect={rectOf(singleCell(selection))}
          color={c.accent}
          handle={!editing && !several}
          handleEdge={c.surface}
          bigHandle={canFill}
        />

        {fillPreview ? <SelectionOverlay rect={rectOf(fillPreview)} color={c.accent} dashed /> : null}

        {canFill ? (
          <View
            testID="fill-handle"
            accessibilityRole="adjustable"
            accessibilityLabel="Fill handle. Drag it to copy this cell down or across."
            style={[
              styles.reach,
              { left: corner.left + corner.width - HANDLE_REACH / 2, top: corner.top + corner.height - HANDLE_REACH / 2 },
            ]}
            onStartShouldSetResponder={() => {
              live.current.onHandle = true;
              return true;
            }}
            onResponderMove={handleMove}
            onResponderRelease={handleEnd}
            onResponderTerminate={handleEnd}
            onResponderTerminationRequest={() => false}
          />
        ) : null}

        {celebrate
          ? celebrateRefs.map((ref, i) => (
              <Animated.View
                key={`flash-${ref.start}`}
                pointerEvents="none"
                style={[
                  styles.overlay,
                  rectOf(ref.range),
                  { backgroundColor: c.refs[i % c.refs.length], opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }) },
                ]}
              />
            ))
          : null}
        {celebrate ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.overlay,
              rectOf(singleCell(a1(celebrate.cell))),
              {
                borderWidth: 3,
                borderRadius: 4,
                borderColor: c.spark,
                transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1.35, 1] }) }],
              },
            ]}
          />
        ) : null}

        {ghostRange && ghostIsBlock ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.overlay,
              rectOf(ghostRange),
              { borderWidth: 2, borderStyle: 'dashed', borderColor: c.spark, backgroundColor: `${c.spark}22`, opacity: ghost },
            ]}
          />
        ) : null}
        {ghostRange ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ghost,
              {
                // For a block, the finger is shown where the drag ends.
                left: rectOf(singleCell(ghostRange.end)).left + colW / 2 - 15,
                top: rectOf(singleCell(ghostRange.end)).top + rowH / 2 - 15,
                backgroundColor: `${c.spark}55`,
                borderColor: c.spark,
                opacity: ghost,
                transform: [{ scale: ghost.interpolate({ inputRange: [0, 1], outputRange: [1.8, 1] }) }],
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignSelf: 'stretch' },
  sheet: { borderWidth: 1, borderRadius: 4, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  corner: {
    width: ROW_HEADER_W,
    height: COL_HEADER_H,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colHeader: {
    height: COL_HEADER_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowHeader: {
    width: ROW_HEADER_W,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { fontSize: 11, fontWeight: '700', userSelect: 'none' },
  overlay: { position: 'absolute' },
  reach: { position: 'absolute', width: HANDLE_REACH, height: HANDLE_REACH },
  ghost: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2 },
});
