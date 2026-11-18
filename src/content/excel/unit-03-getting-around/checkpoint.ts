import type { CellInput, SheetSpec } from '@/engine';
import { LIMITS, type Checkpoint } from '@/lessons/types';

import { table } from '../build';
import { tipsFor } from '../tips';

const plain = (grid: CellInput[][]): SheetSpec => ({ cols: grid[0].length, rows: grid.length, grid });

const club = table(['Member', 'Jan', 'Feb'], [['Ola', 4, 6], ['Pim', 2, 3], ['Quin', 5, 1]]);
const notes = table(['Task', 'Mon', 'Tue'], [['Post', 3, null], ['Bank', 1, null]]);
const rooms = table(['Room', 'Guest'], [['Blue', 'Ida'], ['Green', null], ['Red', 'Jay']]);
const marks = table(['Pupil', 'Mark'], [['Rae', 55], ['Sol', 72], ['Tia', 48], ['Udo', 63]]);
const fees = plain([
  ['Class', 'Fee'],
  ['Yoga', 12],
  ['Spin', 9.5],
  ['Swim', 6],
]);

/** The test at the end of Unit 3. Pass it without the lessons and the unit is skipped. */
export const unit3Test: Checkpoint = {
  id: 'xl.u3.test',
  title: 'Getting around faster: test',
  passMark: LIMITS.checkpointPassMark,
  hideKeys: ['=', '+', '-', '*', '/', '(', ')', ':', ',', '$', 'SUM'],
  exercises: [
    {
      id: 'xl.u3.test.e1',
      type: 'grid-task',
      skill: 'xl.select.range',
      sheet: club,
      prompt: 'Pick all three Feb numbers.',
      checks: [{ type: 'selectionEquals', range: 'C2:C4' }],
      hints: ['Start with your finger on the first Feb number.', 'Hold on C2 and slide down to C4 before letting go.', 'Three cells should be shaded: 6, 3 and 1.'],
      explain: 'The three Feb numbers are the block C2:C4.',
      tips: tipsFor('xl.select.range'),
      solution: [{ drag: 'C2:C4', say: 'Drag from C2 down to C4.' }],
    },
    {
      id: 'xl.u3.test.e2',
      type: 'shortcut-press',
      skill: 'xl.select.all',
      sheet: club,
      prompt: 'Pick every cell on the sheet with one shortcut.',
      checks: [
        { type: 'usedShortcut', id: 'selectAll' },
        { type: 'selectionEquals', range: 'A1:C4' },
      ],
      hints: ['It is the shortcut with the letter A.', 'Press {mod} first, then A.', 'The whole sheet should be shaded.'],
      explain: '{mod} + A picks every cell.',
      tips: tipsFor('xl.select.all'),
      solution: [{ combo: 'selectAll', say: 'Press {mod}, then A.' }],
    },
    {
      id: 'xl.u3.test.e3',
      type: 'grid-task',
      skill: 'xl.copy',
      sheet: notes,
      tools: ['copy', 'cut', 'paste'],
      prompt: 'Tue is the same as Mon. Copy both Mon numbers across.',
      checks: [
        { type: 'cellValue', cell: 'C2', equals: 3 },
        { type: 'cellValue', cell: 'C3', equals: 1 },
        { type: 'cellValue', cell: 'B2', equals: 3 },
      ],
      hints: ['Pick both Mon numbers first, by dragging.', 'Drag B2 to B3, tap Copy, tap C2, tap Paste.', 'C2 and C3 should show 3 and 1, with Mon unchanged.'],
      explain: 'Copy left Mon alone and made a second set under Tue.',
      tips: tipsFor('xl.copy'),
      solution: [
        { drag: 'B2:B3', say: 'Drag from B2 down to B3.' },
        { tool: 'copy', say: 'Tap Copy.' },
        { tap: 'C2', say: 'Tap C2, where the top of the copy goes.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
    {
      id: 'xl.u3.test.e4',
      type: 'grid-task',
      skill: 'xl.cut',
      sheet: rooms,
      tools: ['copy', 'cut', 'paste'],
      prompt: 'Move Jay from the Red room to the Green room.',
      checks: [
        { type: 'cellValue', cell: 'B3', equals: 'Jay' },
        { type: 'cellValue', cell: 'B4', equals: null },
      ],
      hints: ['Moving is Cut, then Paste.', 'Tap B4, tap Cut, tap B3, tap Paste.', 'B3 should say Jay, and B4 should be empty.'],
      explain: 'Cut and paste moved Jay and left the Red room empty.',
      tips: tipsFor('xl.cut'),
      solution: [
        { tap: 'B4', say: 'Tap B4, the cell to move.' },
        { tool: 'cut', say: 'Tap Cut.' },
        { tap: 'B3', say: 'Tap B3, where it should go.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
    {
      id: 'xl.u3.test.e5',
      type: 'grid-task',
      skill: 'xl.sort',
      sheet: marks,
      tools: ['sortAsc', 'sortDesc'],
      prompt: 'Put the highest Mark on top.',
      checks: [{ type: 'rangeSorted', range: 'B2:B5', descending: true }],
      hints: ['Sort by the Mark column, biggest first.', 'Tap any Mark, then tap Z→A.', 'Sol, with 72, should end up on top.'],
      explain: 'Z→A on Mark put the biggest first, and each row stayed together.',
      tips: tipsFor('xl.sort'),
      solution: [
        { tap: 'B2', say: 'Tap a Mark, to sort by that column.' },
        { tool: 'sortDesc', say: 'Z→A puts the biggest first.' },
      ],
    },
    {
      id: 'xl.u3.test.e6',
      type: 'grid-task',
      skill: 'xl.undo',
      sheet: marks,
      tools: ['undo', 'sortAsc'],
      prompt: 'Sort the pupils A to Z by Mark, then take it back with Undo.',
      checks: [{ type: 'undid' }, { type: 'cellValue', cell: 'A2', equals: 'Rae' }],
      hints: ['Do the sort first. There is nothing to undo until you have.', 'Tap a Mark, tap A→Z, then tap Undo.', 'Rae should be back on top.'],
      explain: 'Undo put every row back where it was.',
      tips: tipsFor('xl.undo'),
      solution: [
        { tap: 'B2', say: 'Tap a Mark.' },
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
      hints: ['The headings are the two cells in row 1.', 'Drag from A1 across to B1, then tap B.', 'Class and Fee should both be bold.'],
      explain: 'Pick, then press B.',
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
      prompt: 'Show the three fees as money.',
      checks: [{ type: 'cellFormat', range: 'B2:B4', numFmt: 'currency' }],
      hints: ['Pick the three Fee numbers first.', 'Drag from B2 down to B4, then tap $.', '9.5 should now read $9.50.'],
      explain: 'Money format adds the $ sign and two decimal places.',
      tips: tipsFor('xl.numfmt'),
      solution: [
        { drag: 'B2:B4', say: 'Drag from B2 down to B4.' },
        { tool: 'currency', say: 'Tap $.' },
      ],
    },
  ],
};
