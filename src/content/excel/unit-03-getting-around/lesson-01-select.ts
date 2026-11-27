import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS, tipsFor } from '../tips';

const RANGE = 'xl.select.range';
const ALL = 'xl.select.all';

/** Bins picked by each picker this week. */
const rota = table(
  ['Picker', 'Mon', 'Tue', 'Wed'],
  [
    ['Ana', 4, 6, 5],
    ['Ben', 3, 2, 7],
    ['Cy', 8, 1, 4],
  ],
);

/** Practice on a different record: cows and calves in each paddock. */
const scores = table(
  ['Paddock', 'Cows', 'Calves'],
  [
    ['North', 3, 1],
    ['River', 0, 2],
    ['Hill', 2, 2],
    ['Creek', 1, 4],
  ],
);

export const select: Lesson = {
  id: 'xl.u3.l1',
  title: 'Select',
  summary: 'Select one cell, a range of cells, or the whole sheet, ready to work on.',
  recap: [
    'Drag across cells to select a range. It is named by its corners.',
    'Ctrl + A selects the whole sheet. On a Mac it is Cmd + A.',
    'Select first, then act: the next lessons copy, sort and format selections.',
  ],
  newSkills: [RANGE, ALL],
  exercises: [
    {
      id: 'xl.u3.l1.e1',
      type: 'demo',
      skill: RANGE,
      sheet: rota,
      script: [
        { tap: 'B2', say: 'A tap selects one cell.' },
        { drag: 'B2:B4', say: 'Drag from B2 to B4: three cells are selected.' },
        { drag: 'B2:D4', say: 'Drag across as well to select a whole range.' },
      ],
      prompt: 'Your turn. Drag to select every picker’s Tuesday: C2 down to C4.',
      checks: [{ type: 'selectionEquals', range: 'C2:C4' }],
      hints: ['Start with your finger on the first Tuesday number.', 'Hold on C2 and slide down to C4 before letting go.', 'Three cells should be shaded: 6, 2 and 1.'],
      explain: 'A range is named by its corners: C2:C4.',
      tips: ['Drag across cells to select more than one.', 'The first cell you touched stays white: it is the active cell.'],
      solution: [{ drag: 'C2:C4', say: 'Drag from C2 down to C4.' }],
    },
    {
      id: 'xl.u3.l1.e2',
      type: 'grid-task',
      skill: RANGE,
      sheet: rota,
      prompt: 'Select Ana’s whole week: her three numbers.',
      checks: [{ type: 'selectionEquals', range: 'B2:D2' }],
      hints: ['This range runs across, not down.', 'Hold on the Monday number in her row and slide right to Wednesday.', 'Three cells should be shaded: 4, 6 and 5.'],
      explain: 'A range can run across a row just as well as down a column.',
      tips: ['Row numbers and column letters are highlighted for the selection.', BASICS.labels],
      solution: [{ drag: 'B2:D2', say: 'Drag from B2 across to D2.' }],
    },
    {
      id: 'xl.u3.l1.e3',
      type: 'grid-task',
      skill: RANGE,
      sheet: rota,
      prompt: 'Select all nine numbers, without the names or the headings.',
      checks: [{ type: 'selectionEquals', range: 'B2:D4' }],
      hints: ['Start on the top-left number and end on the bottom-right one.', 'Hold on the 4 under Mon and slide down and across to the last number.', 'The shaded range should be three across and three down.'],
      explain: 'Corner to corner selects the whole range: B2:D4.',
      tips: ['A range is named by its corners, such as A1:C3.', 'Tap any single cell to clear a range selection.'],
      solution: [{ drag: 'B2:D4', say: 'Drag from B2 down and across to D4.' }],
    },
    {
      id: 'xl.u3.l1.e4',
      type: 'demo',
      skill: ALL,
      sheet: rota,
      script: [
        { combo: 'selectAll', say: '{mod} + A selects every cell at once.' },
        { tap: 'B3', say: 'Tap any cell to select just one again.' },
      ],
      prompt: 'Your turn. Press {mod}, then A, to select everything.',
      checks: [
        { type: 'usedShortcut', id: 'selectAll' },
        { type: 'selectionEquals', range: 'A1:D4' },
      ],
      hints: ['The keys are under the grid.', 'Press {mod} first. It stays held. Then press A.', 'The whole sheet should be shaded.'],
      explain: 'A for All. One shortcut selects the whole sheet.',
      tips: ['A shortcut is two keys: hold the first, then press the second.', 'On a Mac the key is Cmd. On Windows it is Ctrl.'],
      solution: [{ combo: 'selectAll', say: 'Press {mod}, then A.' }],
    },
    {
      id: 'xl.u3.l1.e5',
      type: 'shortcut-press',
      skill: ALL,
      sheet: scores,
      prompt: 'The paddock record. Select every cell with one shortcut.',
      checks: [
        { type: 'usedShortcut', id: 'selectAll' },
        { type: 'selectionEquals', range: 'A1:C5' },
      ],
      hints: ['It is the shortcut with the letter A.', 'Press {mod} first, then A.', 'The whole sheet should be shaded.'],
      explain: 'However big the sheet, {mod} + A selects all of it.',
      tips: ['Select first, then act: bold, copy and fill work on the selection.', BASICS.free],
      solution: [{ combo: 'selectAll', say: 'Press {mod}, then A.' }],
    },
    choice({
      id: 'xl.u3.l1.e6',
      skill: ALL,
      prompt: 'Which of these selects every cell at once?',
      options: ['{mod} + A', '{mod} + C', 'Tapping cell A1'],
      right: 0,
      hints: ['Think of the word “All”.', 'Tapping a cell only ever selects that one cell.', 'The letter you want is the first letter of the alphabet.'],
      explain: '{mod} + A is “select All”. {mod} + C copies, which comes next.',
      tips: ['On a real keyboard, hold the first key down as you press the letter.', BASICS.hint],
    }),
  ],
  practice: [
    {
      id: 'xl.u3.l1.p1',
      type: 'grid-task',
      skill: RANGE,
      sheet: scores,
      prompt: 'Select the number of cows in all four paddocks.',
      checks: [{ type: 'selectionEquals', range: 'B2:B5' }],
      hints: ['Start with your finger on the first Cows number.', 'Hold on B2 and slide down to B5 before letting go.', 'Four cells should be shaded.'],
      explain: 'The four Cows numbers are the range B2:B5.',
      tips: tipsFor(RANGE),
      solution: [{ drag: 'B2:B5', say: 'Drag from B2 down to B5.' }],
    },
    {
      id: 'xl.u3.l1.p2',
      type: 'shortcut-press',
      skill: ALL,
      sheet: rota,
      prompt: 'Select the whole sheet with the shortcut.',
      checks: [
        { type: 'usedShortcut', id: 'selectAll' },
        { type: 'selectionEquals', range: 'A1:D4' },
      ],
      hints: ['It is the shortcut with the letter A.', 'Press {mod} first, then A.', 'The whole sheet should be shaded.'],
      explain: '{mod} + A selects every cell.',
      tips: tipsFor(ALL),
      solution: [{ combo: 'selectAll', say: 'Press {mod}, then A.' }],
    },
  ],
};
