import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS } from '../tips';

const MOVE = 'xl.keys.move';
const EXTEND = 'xl.select.extend';

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

/** Getting around with the arrow keys, and stretching a selection with Shift held. */
export const arrows: Lesson = {
  id: 'xl.u0.l4',
  title: 'Navigate the Farm Records',
  summary: 'Move through farm records and select ranges using arrow keys.',
  recap: [
    'An arrow key moves the active cell one cell that way.',
    'Shift + an arrow stretches the selection one cell that way.',
    'The cell you started on stays the active cell while you stretch.',
  ],
  newSkills: [MOVE, EXTEND],
  exercises: [
    {
      id: 'xl.u0.l4.e1',
      type: 'demo',
      skill: MOVE,
      sheet: inventory,
      script: [
        { tap: 'A2', say: 'Arrow keys move the active cell. Start on Carrots.' },
        { combo: 'moveDown', say: '↓ moves one cell down.' },
        { combo: 'moveRight', say: '→ moves one cell right.' },
      ],
      prompt: 'Your turn. Use the arrows to move to the price of Apples: C5.',
      checks: [
        { type: 'usedShortcut', id: 'moveDown' },
        { type: 'usedShortcut', id: 'moveRight' },
        { type: 'selectionEquals', range: 'C5' },
      ],
      hints: ['You are on B3. Apples are two rows down.', 'Press ↓ twice, then → once.', 'The active cell should be C5: the price of Apples, $4.00.'],
      explain: 'Arrow keys get you around without lifting your hands from the keyboard.',
      tips: ['Each press of an arrow moves one cell.', 'The arrow keys are under the grid.'],
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
      prompt: "New sheet. From A1, move to Hill Market's Orders with the arrow keys.",
      checks: [
        { type: 'usedShortcut', id: 'moveDown' },
        { type: 'usedShortcut', id: 'moveRight' },
        { type: 'selectionEquals', range: 'B3' },
      ],
      hints: ['Hill Market is two rows down from the heading.', 'Press ↓ twice, then → once.', 'The active cell should be B3, which holds 3.'],
      explain: 'Two presses down and one across: the active cell is B3.',
      tips: [BASICS.labels, 'An arrow at the edge of the sheet does nothing.'],
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
        { tap: 'B2', say: 'Select the first cell of the block you want.' },
        { combo: 'extendDown', say: 'Hold Shift and press ↓. The selection stretches.' },
        { combo: 'extendDown', say: 'Each press adds one more cell.' },
      ],
      prompt: 'Your turn. Stretch it one more cell, down to B5.',
      checks: [
        { type: 'usedShortcut', id: 'extendDown' },
        { type: 'selectionEquals', range: 'B2:B5' },
      ],
      hints: ['B2 to B4 is selected. One more press reaches B5.', 'Tap Shift: it stays held. Then tap ↓.', 'Press Shift + ↓ once.'],
      explain: 'Shift + ↓ grew the block to B2:B5. B2 is still the active cell.',
      tips: ['With Shift held, an arrow stretches instead of moving.', 'On the phone, Shift stays held until you tap it again.'],
      solution: [{ combo: 'extendDown', say: 'Hold Shift and press ↓ once more.' }],
    },
    {
      id: 'xl.u0.l4.e4',
      type: 'shortcut-press',
      skill: EXTEND,
      sheet: inventory,
      select: 'C2',
      prompt: 'C2 is selected. Stretch the selection down to C4 with Shift + ↓.',
      checks: [
        { type: 'usedShortcut', id: 'extendDown' },
        { type: 'selectionEquals', range: 'C2:C4' },
      ],
      hints: ['C4 is two cells below C2.', 'Hold Shift, then press ↓ twice.', 'Three cells should be shaded: $3.00, $2.75 and $6.00.'],
      explain: 'Two presses, two more cells: C2:C4.',
      tips: ['Went too far? Shift + ↑ takes one cell back off.', BASICS.free],
      solution: [
        { combo: 'extendDown', say: 'Hold Shift and press ↓ twice.' },
        { combo: 'extendDown' },
      ],
    },
    choice({
      id: 'xl.u0.l4.e5',
      skill: EXTEND,
      prompt: 'One cell is selected. What does Shift + ↓ do?',
      options: ['Stretches the selection down one cell', 'Moves the active cell down one', 'Selects the whole column'],
      right: 0,
      hints: ['Without Shift, ↓ just moves.', 'Ctrl + Space is the one for a whole column.', 'Shift is the key that stretches.'],
      explain: 'Shift + ↓ stretches. ↓ alone moves. Ctrl + Space takes the whole column.',
      tips: ['Three ways to select: one cell, a block, or a whole row or column.', BASICS.hint],
    }),
    {
      id: 'xl.u0.l4.e6',
      type: 'shortcut-press',
      skill: EXTEND,
      apply: true,
      sheet: inventory,
      select: 'A3',
      prompt: 'To copy the Potatoes row, select from A3 across to C3 with Shift + →.',
      checks: [
        { type: 'usedShortcut', id: 'extendRight' },
        { type: 'selectionEquals', range: 'A3:C3' },
      ],
      hints: ['C3 is two cells to the right of A3.', 'Hold Shift, then press → twice.', 'Three cells should be shaded: Potatoes, 110 and $2.75.'],
      explain: 'Shift + → stretches across, just as Shift + ↓ stretches down.',
      tips: ['Shift works with all four arrows.', 'The first cell you selected stays white: it is the active cell.'],
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
      prompt: "From A1, move to Town Grocer's Crates with the arrow keys.",
      checks: [
        { type: 'usedShortcut', id: 'moveDown' },
        { type: 'usedShortcut', id: 'moveRight' },
        { type: 'selectionEquals', range: 'C4' },
      ],
      hints: ['Town Grocer is three rows down from the heading.', 'Press ↓ three times, then → twice.', 'The active cell should be C4, which holds 10.'],
      explain: 'Three presses down and two across: the active cell is C4.',
      tips: ['Each press of an arrow moves one cell.', BASICS.labels],
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
      prompt: 'B2 is selected. Stretch down to select all three order counts.',
      checks: [
        { type: 'usedShortcut', id: 'extendDown' },
        { type: 'selectionEquals', range: 'B2:B4' },
      ],
      hints: ['B4 is two cells below B2.', 'Hold Shift, then press ↓ twice.', 'Three cells should be shaded: 7, 3 and 5.'],
      explain: 'Shift + ↓ twice selects B2:B4.',
      tips: ['With Shift held, an arrow stretches instead of moving.', BASICS.free],
      solution: [
        { combo: 'extendDown', say: 'Hold Shift and press ↓ twice.' },
        { combo: 'extendDown' },
      ],
    },
  ],
};
