import { StyleSheet, View } from 'react-native';

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Props {
  rect: Rect;
  color: string;
  /** A light wash of the colour inside the outline. */
  fill?: string;
  /** The small square on the bottom-right corner of the selected cell. */
  handle?: boolean;
  handleEdge?: string;
  /** The handle can be dragged to fill, so it is drawn big enough to notice. */
  bigHandle?: boolean;
  dashed?: boolean;
}

/** An outline drawn over the grid: the selection, or a reference being pointed at. */
export function SelectionOverlay({ rect, color, fill, handle, handleEdge, bigHandle, dashed }: Props) {
  return (
    <View pointerEvents="none" style={[styles.box, rect]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderColor: color, borderWidth: 2, borderStyle: dashed ? 'dashed' : 'solid', backgroundColor: fill },
        ]}
      />
      {handle ? (
        <View style={[styles.handle, bigHandle && styles.big, { backgroundColor: color, borderColor: handleEdge ?? '#FFFFFF' }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute' },
  handle: { position: 'absolute', right: -4, bottom: -4, width: 9, height: 9, borderWidth: 1.5, borderRadius: 2 },
  big: { right: -7, bottom: -7, width: 14, height: 14, borderWidth: 2, borderRadius: 3 },
});
