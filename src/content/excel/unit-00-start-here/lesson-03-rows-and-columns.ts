import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS } from '../tips';

const COLUMN = 'xl.select.column';
const ROW = 'xl.select.row';

const inventory = table(
  ['Product', 'Price per kg', 'Stock (kg)'],
  [
    ['Carrots', 3, 115],
    ['Potatoes', 2.75, 200],
    ['Tomatoes', 6, 100],
    ['Apples', 4, 80],
  ],
);

const customers = table(
  ['Customer', 'Orders', 'Crates'],
  [
    ['River Cafe', 5, 30],
    ['Hill Market', 2, 4],
    ['Town Grocer', 9, 1],
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
    'Hold the first key, then press Space. Select a cell in it first.',
  ],
  newSkills: [COLUMN, ROW],
  exercises: [
    {
      id: 'xl.u0.l3.e1',
      type: 'demo',
      skill: COLUMN,
      sheet: inventory,
      script: [
        { tap: 'B3', say: 'Select any cell in the column you want.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space. The whole column is selected.' },
      ],
      prompt: 'Your turn. Select the whole Stock (kg) column with Ctrl + Space.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'C1:C5' },
      ],
      hints: ['First select any cell in the Stock (kg) column.', 'The keys are under the grid. Tap Ctrl: it stays held. Then tap Space.', 'Select C2, then press Ctrl + Space.'],
      explain: 'Ctrl + Space selects the column of the active cell, top to bottom.',
      tips: ['A shortcut is two keys together: hold the first, press the second.', 'On the phone, tap Ctrl and it stays held for you.'],
      solution: [
        { tap: 'C2', say: 'Select a cell in the Stock (kg) column.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.e2',
      type: 'grid-task',
      skill: COLUMN,
      sheet: inventory,
      prompt: 'Compare with dragging: drag from B1 down to B5.',
      checks: [{ type: 'selectionEquals', range: 'B1:B5' }],
      hints: ['Start with your finger on the Price per kg heading.', 'Hold on B1 and slide down to B5 before letting go.', 'All five cells of column B should be shaded.'],
      explain: 'That is the same selection, B1:B5. The shortcut gets there in one press.',
      tips: ['Drag across cells to select more than one.', 'A selected block is named by its two ends, like B1:B5.'],
      solution: [{ drag: 'B1:B5', say: 'Drag from B1 down to B5.' }],
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
      type: 'grid-task',
      skill: ROW,
      sheet: customers,
      prompt: 'Now try dragging: drag across the Hill Market row, A3 to C3.',
      checks: [{ type: 'selectionEquals', range: 'A3:C3' }],
      hints: ['This block runs across, not down.', 'Hold on Hill Market and slide right to the last cell in the row.', 'Three cells should be shaded: Hill Market, 2 and 4.'],
      explain: 'A3:C3 is the whole Hill Market row. Shift + Space selects it in one press.',
      tips: [BASICS.labels, 'Tap any single cell to let go of a selection.'],
      solution: [{ drag: 'A3:C3', say: 'Drag from A3 across to C3.' }],
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
