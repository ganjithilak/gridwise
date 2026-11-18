import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS } from '../tips';

const COLUMN = 'xl.select.column';
const ROW = 'xl.select.row';

const shop = table(
  ['Item', 'Cost', 'Stock'],
  [
    ['Milk', 2, 12],
    ['Bread', 3, 8],
    ['Eggs', 4, 30],
    ['Tea', 5, 6],
  ],
);

const pets = table(
  ['Pet', 'Age', 'Weight'],
  [
    ['Rex', 5, 30],
    ['Tibs', 2, 4],
    ['Coco', 9, 1],
  ],
);

const team = table(
  ['Player', 'Goals', 'Games'],
  [
    ['Ada', 7, 10],
    ['Ben', 3, 9],
    ['Cal', 5, 10],
  ],
);

/** Selecting a whole column or a whole row with the keyboard: the first two shortcuts. */
export const rowsAndColumns: Lesson = {
  id: 'xl.u0.l3',
  title: 'Whole rows and columns',
  summary: 'Select an entire column or row with two keys.',
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
      sheet: shop,
      script: [
        { tap: 'B3', say: 'Select any cell in the column you want.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space. The whole column is selected.' },
      ],
      prompt: 'Your turn. Select the whole Stock column with Ctrl + Space.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'C1:C5' },
      ],
      hints: ['First select any cell in the Stock column.', 'The keys are under the grid. Tap Ctrl: it stays held. Then tap Space.', 'Select C2, then press Ctrl + Space.'],
      explain: 'Ctrl + Space selects the column of the active cell, top to bottom.',
      tips: ['A shortcut is two keys together: hold the first, press the second.', 'On the phone, tap Ctrl and it stays held for you.'],
      solution: [
        { tap: 'C2', say: 'Select a cell in the Stock column.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.e2',
      type: 'grid-task',
      skill: COLUMN,
      sheet: shop,
      prompt: 'The slow way, to compare: drag from B1 down to B5.',
      checks: [{ type: 'selectionEquals', range: 'B1:B5' }],
      hints: ['Start with your finger on the Cost heading.', 'Hold on B1 and slide down to B5 before letting go.', 'All five cells of column B should be shaded.'],
      explain: 'That is the same selection, B1:B5. The shortcut gets there in one press.',
      tips: ['Drag across cells to select more than one.', 'A selected block is named by its two ends, like B1:B5.'],
      solution: [{ drag: 'B1:B5', say: 'Drag from B1 down to B5.' }],
    },
    {
      id: 'xl.u0.l3.e3',
      type: 'demo',
      skill: ROW,
      sheet: shop,
      script: [
        { tap: 'B3', say: 'Now rows. Select any cell in the row you want.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space. The whole row is selected.' },
      ],
      prompt: 'Your turn. Select the whole Eggs row with Shift + Space.',
      checks: [
        { type: 'usedShortcut', id: 'selectRow' },
        { type: 'selectionEquals', range: 'A4:C4' },
      ],
      hints: ['First select any cell in the Eggs row.', 'Tap Shift: it stays held. Then tap Space.', 'Select A4, then press Shift + Space.'],
      explain: 'Shift + Space selects the row of the active cell, side to side.',
      tips: ['Ctrl goes with columns. Shift goes with rows.', 'The row number lights up when its row is selected.'],
      solution: [
        { tap: 'A4', say: 'Select a cell in the Eggs row.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.e4',
      type: 'shortcut-press',
      skill: COLUMN,
      sheet: pets,
      prompt: 'New sheet. Select the whole Age column with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'B1:B4' },
      ],
      hints: ['Select a cell in the Age column first.', 'Columns go with Ctrl. Hold it and press Space.', 'Select B2, then press Ctrl + Space.'],
      explain: 'Ctrl + Space works on any sheet, however long the column is.',
      tips: [BASICS.headings, 'The column letter lights up when its column is selected.'],
      solution: [
        { tap: 'B2', say: 'Select a cell in the Age column.' },
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
      sheet: pets,
      prompt: 'The slow way again: drag across the Tibs row, A3 to C3.',
      checks: [{ type: 'selectionEquals', range: 'A3:C3' }],
      hints: ['This block runs across, not down.', 'Hold on Tibs and slide right to the last cell in the row.', 'Three cells should be shaded: Tibs, 2 and 4.'],
      explain: 'A3:C3 is the whole Tibs row. Shift + Space selects it in one press.',
      tips: [BASICS.labels, 'Tap any single cell to let go of a selection.'],
      solution: [{ drag: 'A3:C3', say: 'Drag from A3 across to C3.' }],
    },
    {
      id: 'xl.u0.l3.e7',
      type: 'shortcut-press',
      skill: ROW,
      apply: true,
      sheet: shop,
      prompt: 'The shop stops selling Tea. Select its whole row with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectRow' },
        { type: 'selectionEquals', range: 'A5:C5' },
      ],
      hints: ['Select any cell in the Tea row first.', 'Rows go with Shift. Hold it and press Space.', 'Select A5, then press Shift + Space.'],
      explain: 'With the whole row selected, one more step could clear or copy it.',
      tips: ['Select first, then act: that is how a spreadsheet works.', BASICS.free],
      solution: [
        { tap: 'A5', say: 'Select a cell in the Tea row.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space.' },
      ],
    },
  ],
  practice: [
    {
      id: 'xl.u0.l3.p1',
      type: 'shortcut-press',
      skill: COLUMN,
      sheet: team,
      prompt: 'Select the whole Goals column with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'B1:B4' },
      ],
      hints: ['Select a cell in the Goals column first.', 'Hold Ctrl and press Space.', 'Select B2, then press Ctrl + Space.'],
      explain: 'Ctrl + Space selects the column of the active cell.',
      tips: ['Ctrl goes with columns. Shift goes with rows.', BASICS.headings],
      solution: [
        { tap: 'B2', say: 'Select a cell in the Goals column.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.p2',
      type: 'shortcut-press',
      skill: ROW,
      sheet: team,
      prompt: 'Select everything about Ben: his whole row, with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectRow' },
        { type: 'selectionEquals', range: 'A3:C3' },
      ],
      hints: ['Select any cell in the Ben row first.', 'Hold Shift and press Space.', 'Select A3, then press Shift + Space.'],
      explain: 'Shift + Space selects the row of the active cell.',
      tips: ['Both shortcuts end with Space. Only the first key differs.', BASICS.labels],
      solution: [
        { tap: 'A3', say: 'Select a cell in the Ben row.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space.' },
      ],
    },
  ],
};
