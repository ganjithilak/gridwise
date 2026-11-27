import type { SheetSpec } from '@/engine';
import { SheetController } from '@/spreadsheet/controller';

/**
 * A sheet for looking and selecting, never typing: in Cell Hunt and Find the Error a second
 * tap on a cell must not open it for editing, as it does in a lesson.
 */
export function selectOnlyController(spec: SheetSpec, select = 'A1'): SheetController {
  const controller = new SheetController(spec, select);
  controller.startEdit = () => {};
  return controller;
}
