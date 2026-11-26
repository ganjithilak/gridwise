import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS } from '../tips';

const COLUMN = 'xl.select.column';
const ROW = 'xl.select.row';

const money = { numFmt: 'currency' as const };

/** The farm inventory as "Entering Data" left it. */
const inventory = table(
  ['Product', 'Stock (kg)', 'Price per kg'],
  [
    ['Carrots', 115, 3],
    ['Potatoes', 110, 2.75],
    ['Tomatoes', 80, 6],
    ['Apples', 100, 4],
  ],
);
inventory.formats = { ...inventory.formats, 'C2:C5': money };

const customers = table(
  ['Customer', 'Orders', 'Crates'],
  [
    ['River Cafe', 7, 10],
    ['Hill Market', 3, 9],
    ['Town Grocer', 5, 10],
  ],
);

const harvests = table(
  ['Crop', 'Harvests', 'Crates'],
  [
    ['Carrots', 7, 10],
    ['Tomatoes', 3, 9],
    ['Apples', 5, 10],
  ],
);

/** Selecting a whole column or a whole row with the keyboard: the first two shortcuts. */
export const rowsAndColumns: Lesson = {
  id: 'xl.u0.l3',
  title: 'Select Farm Rows and Columns',
  summary: 'Select full rows and columns in the farm inventory.',
  recap: [
    'Ctrl + Space selects the whole column of the active cell.',
    'Shift + Space selects the whole row of the active cell.',
    'Select a cell first, then hold the first key and press Space.',
  ],
  newSkills: [COLUMN, ROW],
  exercises: [
    {
      id: 'xl.u0.l3.e1',
      type: 'demo',
      skill: COLUMN,
      sheet: inventory,
      script: [
        { tap: 'C3', say: 'Select any cell in the column you want.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space. The whole column is selected.' },
      ],
      prompt: 'Your turn. Select the whole Stock (kg) column with Ctrl + Space.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'B1:B5' },
      ],
      hints: ['First select any cell in the Stock (kg) column.', 'The keys are under the grid. Tap Ctrl: it stays held. Then tap Space.', 'Select B2, then press Ctrl + Space.'],
      explain: 'Ctrl + Space selects the column of the active cell, top to bottom.',
      tips: ['A shortcut is two keys together: hold the first, press the second.', 'On the phone, tap Ctrl and it stays held for you.'],
      solution: [
        { tap: 'B2', say: 'Select a cell in the Stock (kg) column.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.e2',
      // Dragging is shown here, not tested: it is taught in "Getting around faster".
      type: 'demo',
      skill: COLUMN,
      sheet: inventory,
      script: [
        { drag: 'C1:C5', say: 'You can also drag down a column to select it.' },
        { tap: 'A1', say: 'The shortcut does it in one press, however long.' },
      ],
      prompt: 'Your turn. Select the whole Price per kg column with Ctrl + Space.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'C1:C5' },
      ],
      hints: ['First select any cell in the Price per kg column.', 'Columns go with Ctrl. Tap it, then tap Space.', 'Select C2, then press Ctrl + Space.'],
      explain: 'Dragging and Ctrl + Space give the same selection, C1:C5. The shortcut is one press.',
      tips: ['Drag across cells to select more than one.', 'A selected block is named by its two ends, like B1:B5.'],
      solution: [
        { tap: 'C2', say: 'Select a cell in the Price per kg column.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.e3',
      type: 'demo',
      skill: ROW,
      sheet: inventory,
      script: [
        { tap: 'B3', say: 'Now rows. Select any cell in the row you want.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space. The whole row is selected.' },
      ],
      prompt: 'Your turn. Select the whole Tomatoes row with Shift + Space.',
      checks: [
        { type: 'usedShortcut', id: 'selectRow' },
        { type: 'selectionEquals', range: 'A4:C4' },
      ],
      hints: ['First select any cell in the Tomatoes row.', 'Tap Shift: it stays held. Then tap Space.', 'Select A4, then press Shift + Space.'],
      explain: 'Shift + Space selects the row of the active cell, side to side.',
      tips: ['Ctrl goes with columns. Shift goes with rows.', 'The row number lights up when its row is selected.'],
      solution: [
        { tap: 'A4', say: 'Select a cell in the Tomatoes row.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.e4',
      type: 'shortcut-press',
      skill: COLUMN,
      sheet: customers,
      prompt: 'Customer order sheet. Select the whole Orders column with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'B1:B4' },
      ],
      hints: ['Select a cell in the Orders column first.', 'Columns go with Ctrl. Hold it and press Space.', 'Select B2, then press Ctrl + Space.'],
      explain: 'Ctrl + Space works on any sheet, however long the column is.',
      tips: [BASICS.headings, 'The column letter lights up when its column is selected.'],
      solution: [
        { tap: 'B2', say: 'Select a cell in the Orders column.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space.' },
      ],
    },
    choice({
      id: 'xl.u0.l3.e5',
      skill: ROW,
      prompt: 'Which keys select a whole row?',
      options: ['Shift + Space', 'Ctrl + Space', 'Space on its own'],
      right: 0,
      hints: ['One of them selects a column, the other a row.', 'Ctrl + Space is the one for columns.', 'So the other pair is for rows.'],
      explain: 'Shift + Space selects a row. Ctrl + Space selects a column.',
      tips: ['Both shortcuts end with Space. Only the first key differs.', BASICS.hint],
    }),
    {
      id: 'xl.u0.l3.e6',
      type: 'shortcut-press',
      skill: ROW,
      sheet: customers,
      prompt: 'Hill Market wants a delivery. Select its whole row with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectRow' },
        { type: 'selectionEquals', range: 'A3:C3' },
      ],
      hints: ['Select any cell in the Hill Market row first.', 'Shift goes with rows. Hold it, then press Space.', 'Select A3, then press Shift + Space.'],
      explain: 'A3:C3 is the whole Hill Market row, selected in one press.',
      tips: [BASICS.labels, 'Tap any single cell to let go of a selection.'],
      solution: [
        { tap: 'A3', say: 'Select a cell in the Hill Market row.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.e7',
      type: 'shortcut-press',
      skill: ROW,
      apply: true,
      sheet: inventory,
      prompt: 'The farm is reviewing its apple inventory. Select its whole row with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectRow' },
        { type: 'selectionEquals', range: 'A5:C5' },
      ],
      hints: ['Select any cell in the Apples row first.', 'Rows go with Shift. Hold it and press Space.', 'Select A5, then press Shift + Space.'],
      explain: 'With the whole row selected, one more step could clear or copy it.',
      tips: ['Select first, then act: that is how a spreadsheet works.', BASICS.free],
      solution: [
        { tap: 'A5', say: 'Select a cell in the Apples row.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space.' },
      ],
    },
  ],
  practice: [
    {
      id: 'xl.u0.l3.p1',
      type: 'shortcut-press',
      skill: COLUMN,
      sheet: harvests,
      prompt: 'Select the whole Harvests column with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'B1:B4' },
      ],
      hints: ['Select a cell in the Harvests column first.', 'Hold Ctrl and press Space.', 'Select B2, then press Ctrl + Space.'],
      explain: 'Ctrl + Space selects the column of the active cell.',
      tips: ['Ctrl goes with columns. Shift goes with rows.', BASICS.headings],
      solution: [
        { tap: 'B2', say: 'Select a cell in the Harvests column.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.p2',
      type: 'shortcut-press',
      skill: ROW,
      sheet: harvests,
      prompt: 'Select the whole Tomatoes harvest row with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectRow' },
        { type: 'selectionEquals', range: 'A3:C3' },
      ],
      hints: ['Select any cell in the Tomatoes row first.', 'Hold Shift and press Space.', 'Select A3, then press Shift + Space.'],
      explain: 'Shift + Space selects the row of the active cell.',
      tips: ['Both shortcuts end with Space. Only the first key differs.', BASICS.labels],
      solution: [
        { tap: 'A3', say: 'Select a cell in the Tomatoes row.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space.' },
      ],
    },
  ],
};
