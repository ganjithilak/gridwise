import type { CellInput, SheetSpec } from '@/engine';
import { LIMITS, type Checkpoint } from '@/lessons/types';

import { table } from '../build';
import { tipsFor } from '../tips';

const plain = (grid: CellInput[][]): SheetSpec => ({ cols: grid[0].length, rows: grid.length, grid });

/** Trays of eggs collected from each shed. */
const club = table(['Shed', 'Jan', 'Feb'], [['Shed A', 4, 6], ['Shed B', 2, 3], ['Shed C', 5, 1]]);
/** Hours planned for the farm's jobs. */
const notes = table(['Job', 'Mon', 'Tue'], [['Fencing', 3, null], ['Mowing', 1, null]]);
/** What each vehicle is carrying to market. */
const rooms = table(['Vehicle', 'Load'], [['Ute', 'Apples'], ['Van', null], ['Trailer', 'Hay']]);
/** Kilograms picked by the afternoon pickers. */
const marks = table(['Picker', 'Kg'], [['Eli', 55], ['Fay', 72], ['Gus', 48], ['Hal', 63]]);
/** The stall's preserves and dairy, before formatting. */
const fees = plain([
  ['Item', 'Price'],
  ['Jam', 12],
  ['Chutney', 9.5],
  ['Milk', 6],
]);

/** The test at the end of Unit 3. Pass it without the lessons and the unit is skipped. */
export const unit3Test: Checkpoint = {
  id: 'xl.u3.test',
  title: 'Getting Around Faster: Test',
  passMark: LIMITS.checkpointPassMark,
  hideKeys: ['=', '+', '-', '*', '/', '(', ')', ':', ',', '$', 'SUM'],
  exercises: [
    {
      id: 'xl.u3.test.e1',
      type: 'grid-task',
      skill: 'xl.select.range',
      sheet: club,
      prompt: 'Select all three February numbers.',
      checks: [{ type: 'selectionEquals', range: 'C2:C4' }],
      hints: ['Start with your finger on the first Feb number.', 'Hold on C2 and slide down to C4 before letting go.', 'Three cells should be shaded: 6, 3 and 1.'],
      explain: 'The three February numbers are the range C2:C4.',
      tips: tipsFor('xl.select.range'),
      solution: [{ drag: 'C2:C4', say: 'Drag from C2 down to C4.' }],
    },
    {
      id: 'xl.u3.test.e2',
      type: 'shortcut-press',
      skill: 'xl.select.all',
      sheet: club,
      prompt: 'Select every cell on the sheet with one shortcut.',
      checks: [
        { type: 'usedShortcut', id: 'selectAll' },
        { type: 'selectionEquals', range: 'A1:C4' },
      ],
      hints: ['It is the shortcut with the letter A.', 'Press {mod} first, then A.', 'The whole sheet should be shaded.'],
      explain: '{mod} + A selects every cell.',
      tips: tipsFor('xl.select.all'),
      solution: [{ combo: 'selectAll', say: 'Press {mod}, then A.' }],
    },
    {
      id: 'xl.u3.test.e3',
      type: 'grid-task',
      skill: 'xl.copy',
      sheet: notes,
      tools: ['copy', 'cut', 'paste'],
      prompt: 'Tuesday’s plan is the same as Monday’s. Copy both numbers across.',
      checks: [
        { type: 'cellValue', cell: 'C2', equals: 3 },
        { type: 'cellValue', cell: 'C3', equals: 1 },
        { type: 'cellValue', cell: 'B2', equals: 3 },
      ],
      hints: ['Select both Monday numbers first, by dragging.', 'Drag B2 to B3, tap Copy, select C2, tap Paste.', 'C2 and C3 should show 3 and 1, with Monday unchanged.'],
      explain: 'Copy left Monday as it was and made a second set under Tuesday.',
      tips: tipsFor('xl.copy'),
      solution: [
        { drag: 'B2:B3', say: 'Drag from B2 down to B3.' },
        { tool: 'copy', say: 'Tap Copy.' },
        { tap: 'C2', say: 'Select C2, where the top of the copy goes.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
    {
      id: 'xl.u3.test.e4',
      type: 'grid-task',
      skill: 'xl.cut',
      sheet: rooms,
      tools: ['copy', 'cut', 'paste'],
      prompt: 'Move the hay from the trailer to the van.',
      checks: [
        { type: 'cellValue', cell: 'B3', equals: 'Hay' },
        { type: 'cellValue', cell: 'B4', equals: null },
      ],
      hints: ['Moving is Cut, then Paste.', 'Select B4, tap Cut, select B3, tap Paste.', 'B3 should say Hay, and B4 should be empty.'],
      explain: 'Cut and paste moved the hay and left the trailer empty.',
      tips: tipsFor('xl.cut'),
      solution: [
        { tap: 'B4', say: 'Select B4, the cell to move.' },
        { tool: 'cut', say: 'Tap Cut.' },
        { tap: 'B3', say: 'Select B3, where it should go.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
    {
      id: 'xl.u3.test.e5',
      type: 'grid-task',
      skill: 'xl.sort',
      sheet: marks,
      tools: ['sortAsc', 'sortDesc'],
      prompt: 'Put the picker with the most kilograms on top.',
      checks: [{ type: 'rangeSorted', range: 'B2:B5', descending: true }],
      hints: ['Sort by the Kg column, biggest first.', 'Select any Kg number, then tap Z→A.', 'Fay, with 72, should end up on top.'],
      explain: 'Z→A on Kg put the biggest first, and each row stayed together.',
      tips: tipsFor('xl.sort'),
      solution: [
        { tap: 'B2', say: 'Select a Kg number, to sort by it.' },
        { tool: 'sortDesc', say: 'Z→A puts the biggest first.' },
      ],
    },
    {
      id: 'xl.u3.test.e6',
      type: 'grid-task',
      skill: 'xl.undo',
      sheet: marks,
      tools: ['undo', 'sortAsc'],
      prompt: 'Sort by Kg, smallest first, then take it back with Undo.',
      checks: [{ type: 'undid' }, { type: 'cellValue', cell: 'A2', equals: 'Eli' }],
      hints: ['Do the sort first. There is nothing to undo until you have.', 'Select a Kg number, tap A→Z, then tap Undo.', 'Eli should be back on top.'],
      explain: 'Undo put every row back where it was.',
      tips: tipsFor('xl.undo'),
      solution: [
        { tap: 'B2', say: 'Select a Kg number.' },
        { tool: 'sortAsc', say: 'A→Z sorts smallest first.' },
        { tool: 'undo', say: 'Undo puts it back.' },
      ],
    },
    {
      id: 'xl.u3.test.e7',
      type: 'grid-task',
      skill: 'xl.bold',
      sheet: fees,
      tools: ['bold', 'currency'],
      prompt: 'Make the two headings bold.',
      checks: [{ type: 'cellFormat', range: 'A1:B1', bold: true }],
      hints: ['The headings are the two cells in row 1.', 'Drag from A1 across to B1, then tap B.', 'Item and Price should both be bold.'],
      explain: 'Select, then press B.',
      tips: tipsFor('xl.bold'),
      solution: [
        { drag: 'A1:B1', say: 'Drag from A1 across to B1.' },
        { tool: 'bold', say: 'Tap B.' },
      ],
    },
    {
      id: 'xl.u3.test.e8',
      type: 'grid-task',
      skill: 'xl.numfmt',
      sheet: fees,
      tools: ['bold', 'currency'],
      prompt: 'Show the three prices in currency format.',
      checks: [{ type: 'cellFormat', range: 'B2:B4', numFmt: 'currency' }],
      hints: ['Select the three prices first.', 'Drag from B2 down to B4, then tap $.', '9.5 should now read $9.50.'],
      explain: 'Currency format adds the $ sign and two decimal places.',
      tips: tipsFor('xl.numfmt'),
      solution: [
        { drag: 'B2:B4', say: 'Drag from B2 down to B4.' },
        { tool: 'currency', say: 'Tap $.' },
      ],
    },
  ],
};
