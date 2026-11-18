import { useSyncExternalStore } from 'react';

import type { SheetController, SheetViewState } from './controller';

/** Re-renders the calling component whenever the controller's sheet, selection or edit changes. */
export function useSheet(controller: SheetController): SheetViewState {
  return useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
}
