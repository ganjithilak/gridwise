import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS } from '../tips';

const MOVE = 'xl.keys.move';
const EXTEND = 'xl.select.extend';

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

/** The farm's wholesale customers, as in "Selecting Rows and Columns". */
const customers = table(
  ['Customer', 'Orders', 'Crates'],
  [
    ['River Cafe', 7, 12],
    ['Hill Market', 3, 8],
    ['Town Grocer', 5, 10],
  ],
);

/** Moving with the arrow keys, and extending a selection with Shift held. */
export const arrows: Lesson = {
  id: 'xl.u0.l4',
  title: 'Moving Around the Sheet',
  summary: 'Move through the farm’s records and select blocks of cells from the keyboard.',
  recap: [
    'An arrow key moves the active cell one cell in that direction.',
    'Shift + an arrow key extends the selection one cell in that direction.',
    'While you extend, the cell you started from remains the active cell.',
  ],
  newSkills: [MOVE, EXTEND],
  exercises: [
    {
      id: 'xl.u0.l4.e1',
      type: 'demo',
      skill: MOVE,
      sheet: inventory,
      script: [
        { say: 'On a computer, arrow keys move without the mouse.' },
        { tap: 'A2', say: 'Each press moves the active cell. Start at Carrots.' },
        { combo: 'moveDown', say: '↓ moves one cell down.' },
        { combo: 'moveRight', say: '→ moves one cell right.' },
      ],
      prompt: 'Your turn. Use the arrow keys to move to the price of apples, C5.',
      checks: [
        { type: 'usedShortcut', id: 'moveDown' },
        { type: 'usedShortcut', id: 'moveRight' },
        { type: 'selectionEquals', range: 'C5' },
      ],
      hints: ['You are on B3. Apples are two rows down.', 'Press ↓ twice, then → once.', 'The active cell should be C5: the apple price, $4.50.'],
      explain: 'Arrow keys let you move through a sheet without reaching for the mouse.',
      tips: ['Each press of an arrow key moves one cell.', 'The arrow keys are on the key strip below the grid.'],
      solution: [
        { combo: 'moveDown', say: '↓ twice, to the Apples row.' },
        { combo: 'moveDown' },
        { combo: 'moveRight', say: '→ once, to Price per kg.' },
      ],
    },
    {
      id: 'xl.u0.l4.e2',
      type: 'shortcut-press',
      skill: MOVE,
      sheet: customers,
      prompt: 'The customer orders sheet. From A1, move to Hill Market’s orders.',
      checks: [
        { type: 'usedShortcut', id: 'moveDown' },
        { type: 'usedShortcut', id: 'moveRight' },
        { type: 'selectionEquals', range: 'B3' },
      ],
      hints: ['Hill Market is two rows below the headings.', 'Press ↓ twice, then → once.', 'The active cell should be B3, which holds 3.'],
      explain: 'Two cells down and one across: the active cell is B3.',
      tips: [BASICS.labels, 'At the edge of the sheet, an arrow key has no effect.'],
      solution: [
        { combo: 'moveDown', say: '↓ twice, to the Hill Market row.' },
        { combo: 'moveDown' },
        { combo: 'moveRight', say: '→ once, to Orders.' },
      ],
    },
    {
      id: 'xl.u0.l4.e3',
      type: 'demo',
      skill: EXTEND,
      sheet: inventory,
      script: [
        { say: 'To work on several cells, select them as a block.' },
        { tap: 'B2', say: 'Select the first cell of the block you need.' },
        { combo: 'extendDown', say: 'Hold Shift and press ↓. The selection grows.' },
        { combo: 'extendDown', say: 'Each press adds one more cell.' },
      ],
      prompt: 'Your turn. Extend the selection one more cell, down to B5.',
      checks: [
        { type: 'usedShortcut', id: 'extendDown' },
        { type: 'selectionEquals', range: 'B2:B5' },
      ],
      hints: ['B2 to B4 is selected. One more press reaches B5.', 'Tap Shift. It stays held. Then tap ↓.', 'Press Shift + ↓ once.'],
      explain: 'Shift + ↓ extended the block to B2:B5. B2 is still the active cell.',
      tips: ['With Shift held, an arrow extends the selection.', 'On the key strip, Shift stays held until you use it.'],
      solution: [{ combo: 'extendDown', say: 'Hold Shift and press ↓ once more.' }],
    },
    {
      id: 'xl.u0.l4.e4',
      type: 'shortcut-press',
      skill: EXTEND,
      sheet: inventory,
      select: 'C2',
      prompt: 'C2 is selected. Extend the selection down to C4 with Shift + ↓.',
      checks: [
        { type: 'usedShortcut', id: 'extendDown' },
        { type: 'selectionEquals', range: 'C2:C4' },
      ],
      hints: ['C4 is two cells below C2.', 'Hold Shift, then press ↓ twice.', 'Three prices should be highlighted: $3.00, $2.75 and $6.00.'],
      explain: 'Two presses, two more cells: the selection is now C2:C4.',
      tips: ['Went too far? Shift + ↑ removes one cell again.', BASICS.free],
      solution: [
        { combo: 'extendDown', say: 'Hold Shift and press ↓ twice.' },
        { combo: 'extendDown' },
      ],
    },
    choice({
      id: 'xl.u0.l4.e5',
      skill: EXTEND,
      prompt: 'One cell is selected. What does Shift + ↓ do?',
      options: ['Extends the selection one cell down', 'Moves the active cell one cell down', 'Selects the whole column'],
      right: 0,
      hints: ['Without Shift, ↓ only moves.', 'Ctrl + Space selects a whole column.', 'Shift is the key that extends.'],
      explain: 'Shift + ↓ extends the selection. ↓ alone moves. Ctrl + Space selects the column.',
      tips: ['You can select one cell, a block, or a whole row or column.', BASICS.hint],
    }),
    {
      id: 'xl.u0.l4.e6',
      type: 'shortcut-press',
      skill: EXTEND,
      apply: true,
      sheet: inventory,
      select: 'A3',
      prompt: 'Select the potato record, from A3 across to C3, with Shift + →.',
      checks: [
        { type: 'usedShortcut', id: 'extendRight' },
        { type: 'selectionEquals', range: 'A3:C3' },
      ],
      hints: ['C3 is two cells to the right of A3.', 'Hold Shift, then press → twice.', 'Three cells should be highlighted: Potatoes, 110 and $2.75.'],
      explain: 'Shift + → extends across, just as Shift + ↓ extends down.',
      tips: ['Shift works with all four arrow keys.', 'The cell you started from stays the active cell.'],
      solution: [
        { combo: 'extendRight', say: 'Hold Shift and press → twice.' },
        { combo: 'extendRight' },
      ],
    },
  ],
  practice: [
    {
      id: 'xl.u0.l4.p1',
      type: 'shortcut-press',
      skill: MOVE,
      sheet: customers,
      prompt: 'From A1, move to the crates Town Grocer ordered, using the arrow keys.',
      checks: [
        { type: 'usedShortcut', id: 'moveDown' },
        { type: 'usedShortcut', id: 'moveRight' },
        { type: 'selectionEquals', range: 'C4' },
      ],
      hints: ['Town Grocer is three rows below the headings.', 'Press ↓ three times, then → twice.', 'The active cell should be C4, which holds 10.'],
      explain: 'Three cells down and two across: the active cell is C4.',
      tips: ['Each press of an arrow key moves one cell.', BASICS.labels],
      solution: [
        { combo: 'moveDown', say: '↓ three times, to the Town Grocer row.' },
        { combo: 'moveDown' },
        { combo: 'moveDown' },
        { combo: 'moveRight', say: '→ twice, to Crates.' },
        { combo: 'moveRight' },
      ],
    },
    {
      id: 'xl.u0.l4.p2',
      type: 'shortcut-press',
      skill: EXTEND,
      sheet: customers,
      select: 'B2',
      prompt: 'B2 is selected. Extend the selection to include all three order counts.',
      checks: [
        { type: 'usedShortcut', id: 'extendDown' },
        { type: 'selectionEquals', range: 'B2:B4' },
      ],
      hints: ['B4 is two cells below B2.', 'Hold Shift, then press ↓ twice.', 'Three cells should be highlighted: 7, 3 and 5.'],
      explain: 'Shift + ↓ twice selects B2:B4.',
      tips: ['With Shift held, an arrow extends the selection.', BASICS.free],
      solution: [
        { combo: 'extendDown', say: 'Hold Shift and press ↓ twice.' },
        { combo: 'extendDown' },
      ],
    },
  ],
};
