import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS } from '../tips';

const COLUMN = 'xl.select.column';
const ROW = 'xl.select.row';

const money = { numFmt: 'currency' as const };

/** The stock record exactly as "Entering and Correcting Data" left it. */
const inventory = table(
  ['Product', 'Stock (kg)', 'Price per kg'],
  [
    ['Carrots', 115, 3],
    ['Potatoes', 110, 2.75],
    ['Tomatoes', 80, 6],
    ['Apples', 100, 4.5],
  ],
);
inventory.formats = { ...inventory.formats, 'C2:C5': money };

/** The farm's wholesale customers: cafés and shops that order by the crate. */
const customers = table(
  ['Customer', 'Orders', 'Crates'],
  [
    ['River Cafe', 7, 12],
    ['Hill Market', 3, 8],
    ['Town Grocer', 5, 10],
  ],
);

/** This week's harvest log: practice on a different record. */
const harvests = table(
  ['Crop', 'Pickings', 'Crates'],
  [
    ['Carrots', 2, 14],
    ['Tomatoes', 4, 9],
    ['Apples', 3, 21],
  ],
);

/**
 * Selecting a whole column or row with the keyboard: the first two shortcuts.
 *
 * Accuracy note: these two shortcuts are the same in Excel for Mac. Ctrl + Space uses the
 * Control key there, not Command (Command + Space opens Spotlight).
 */
export const rowsAndColumns: Lesson = {
  id: 'xl.u0.l3',
  title: 'Selecting Rows and Columns',
  summary: 'Select a whole column or row of the stock record in one step.',
  recap: [
    'Ctrl + Space selects the whole column of the active cell.',
    'Shift + Space selects the whole row of the active cell.',
    'On a Mac, use Control + Space for a column. Shift + Space is the same.',
  ],
  newSkills: [COLUMN, ROW],
  exercises: [
    {
      id: 'xl.u0.l3.e1',
      type: 'demo',
      skill: COLUMN,
      sheet: inventory,
      script: [
        { say: 'To review a whole column, select all of it at once.' },
        { tap: 'C3', say: 'Select any cell in the column you need.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space: the whole column.' },
      ],
      prompt: 'Your turn. Select the whole Stock (kg) column with Ctrl + Space.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'B1:B5' },
      ],
      hints: ['First select any cell in the Stock (kg) column.', 'Tap Ctrl on the keys below the grid. It stays held. Then tap Space.', 'Select B2, then press Ctrl + Space.'],
      explain: 'You selected B1:B5: every cell from B1 to B5. The colon means “to”.',
      tips: ['A shortcut is two keys: hold the first, then press the second.', 'On the keys below the grid, Ctrl stays held until used.'],
      solution: [
        { tap: 'B2', say: 'Select a cell in the Stock (kg) column.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.e2',
      // The same shortcut with less help: the prompt no longer names the keys.
      type: 'shortcut-press',
      skill: COLUMN,
      sheet: inventory,
      prompt: 'Before changing prices, select the whole Price per kg column.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'C1:C5' },
      ],
      hints: ['First select any cell in the Price per kg column.', 'Columns use Ctrl. Tap it, then tap Space.', 'Select C2, then press Ctrl + Space.'],
      explain: 'C1:C5 is selected. On a sheet of a thousand rows, the same two keys select them all.',
      tips: ['A selected block is named by its corners, such as B1:B5.', 'The column letter is highlighted when its column is selected.'],
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
        { say: 'A row holds one complete record: a single product.' },
        { tap: 'B3', say: 'Select any cell in the row you need.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space: the whole row.' },
      ],
      prompt: 'Your turn. Select the whole Tomatoes row with Shift + Space.',
      checks: [
        { type: 'usedShortcut', id: 'selectRow' },
        { type: 'selectionEquals', range: 'A4:C4' },
      ],
      hints: ['First select any cell in the Tomatoes row.', 'Tap Shift. It stays held. Then tap Space.', 'Select A4, then press Shift + Space.'],
      explain: 'Shift + Space selects the entire row of the active cell: one complete record.',
      tips: ['Ctrl selects columns. Shift selects rows.', 'The row number is highlighted when its row is selected.'],
      solution: [
        { tap: 'A4', say: 'Select a cell in the Tomatoes row.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space.' },
      ],
    },
    choice({
      id: 'xl.u0.l3.e5',
      skill: ROW,
      prompt: 'Which keys select a whole row?',
      options: ['Shift + Space', 'Ctrl + Space', 'Space on its own'],
      right: 0,
      hints: ['One pair selects a column and the other a row.', 'Ctrl + Space selects a column.', 'So the other pair selects a row.'],
      explain: 'Shift + Space selects a row. Ctrl + Space selects a column.',
      tips: ['Both shortcuts end in Space. Only the first key differs.', BASICS.hint],
    }),
    {
      id: 'xl.u0.l3.e6',
      type: 'shortcut-press',
      skill: ROW,
      sheet: customers,
      prompt: 'Before Hill Market’s delivery, review its record. Select its whole row.',
      checks: [
        { type: 'usedShortcut', id: 'selectRow' },
        { type: 'selectionEquals', range: 'A3:C3' },
      ],
      hints: ['First select any cell in the Hill Market row.', 'Rows use Shift. Hold it, then press Space.', 'Select A3, then press Shift + Space.'],
      explain: 'A3:C3 is Hill Market’s complete record, selected in one step.',
      tips: [BASICS.labels, 'Tap any single cell to cancel a selection.'],
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
      prompt: 'You are reviewing the apple stock. Select the whole Apples row with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectRow' },
        { type: 'selectionEquals', range: 'A5:C5' },
      ],
      hints: ['First select any cell in the Apples row.', 'Rows use Shift. Hold it and press Space.', 'Select A5, then press Shift + Space.'],
      explain: 'With the record selected, a later step could format, copy or clear it in one action.',
      tips: ['Select first, then act: most spreadsheet work follows that order.', BASICS.free],
      solution: [
        { tap: 'A5', say: 'Select a cell in the Apples row.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space.' },
      ],
    },
  ],
  practice: [
    {
      id: 'xl.u0.l3.e4',
      type: 'shortcut-press',
      skill: COLUMN,
      sheet: customers,
      prompt: 'The customer orders sheet. Select the whole Orders column.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'B1:B4' },
      ],
      hints: ['First select a cell in the Orders column.', 'Columns use Ctrl. Hold it and press Space.', 'Select B2, then press Ctrl + Space.'],
      explain: 'Ctrl + Space works on any sheet, whichever cell in the column is active.',
      tips: [BASICS.headings, 'Any cell in the column will do as a starting point.'],
      solution: [
        { tap: 'B2', say: 'Select a cell in the Orders column.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.p1',
      type: 'shortcut-press',
      skill: COLUMN,
      sheet: harvests,
      prompt: 'Select the whole Pickings column with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectColumn' },
        { type: 'selectionEquals', range: 'B1:B4' },
      ],
      hints: ['First select a cell in the Pickings column.', 'Hold Ctrl and press Space.', 'Select B2, then press Ctrl + Space.'],
      explain: 'Ctrl + Space selects the column of the active cell.',
      tips: ['Ctrl selects columns. Shift selects rows.', BASICS.headings],
      solution: [
        { tap: 'B2', say: 'Select a cell in the Pickings column.' },
        { combo: 'selectColumn', say: 'Hold Ctrl and press Space.' },
      ],
    },
    {
      id: 'xl.u0.l3.p2',
      type: 'shortcut-press',
      skill: ROW,
      sheet: harvests,
      prompt: 'Select the whole Tomatoes row of the harvest log with the keys.',
      checks: [
        { type: 'usedShortcut', id: 'selectRow' },
        { type: 'selectionEquals', range: 'A3:C3' },
      ],
      hints: ['First select any cell in the Tomatoes row.', 'Hold Shift and press Space.', 'Select A3, then press Shift + Space.'],
      explain: 'Shift + Space selects the row of the active cell.',
      tips: ['Both shortcuts end in Space. Only the first key differs.', BASICS.labels],
      solution: [
        { tap: 'A3', say: 'Select a cell in the Tomatoes row.' },
        { combo: 'selectRow', say: 'Hold Shift and press Space.' },
      ],
    },
  ],
};
