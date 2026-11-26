import { create } from 'zustand';

/** Left (Games), centre (the farm and its roots), right (Profile). */
export type Col = -1 | 0 | 1;
/** Above (the cloud's sky), the farm, below (the roots). Only the centre column has rows. */
export type Row = -1 | 0 | 1;

interface WorldState {
  col: Col;
  row: Row;
  go: (col: Col, row?: Row) => void;
  /** Development only: a growth stage to show instead of the learner's real one. */
  previewStage: number | null;
  setPreviewStage: (stage: number | null) => void;
}

/**
 * Where the camera is in the world. Not saved: the app always opens on the farm.
 * Moving to a side keeps the row, so Games and back returns to where you were.
 */
export const useWorld = create<WorldState>((set) => ({
  col: 0,
  row: 0,
  go: (col, row) => set((s) => ({ col, row: row ?? s.row })),
  previewStage: null,
  setPreviewStage: (previewStage) => set({ previewStage }),
}));
