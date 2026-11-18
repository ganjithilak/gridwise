import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS, tipsFor } from '../tips';

const RANGE = 'xl.select.range';
const ALL = 'xl.select.all';

const rota = table(
  ['Name', 'Mon', 'Tue', 'Wed'],
  [
    ['Ann', 4, 6, 5],
    ['Bo', 3, 2, 7],
    ['Cy', 8, 1, 4],
  ],
);

const scores = table(
  ['Team', 'Home', 'Away'],
  [
    ['Reds', 3, 1],
    ['Blues', 0, 2],
    ['Golds', 2, 2],
    ['Teals', 1, 4],
  ],
);

export const select: Lesson = {
  id: 'xl.u3.l1',
  title: 'Select',
  summary: 'Pick one cell, a block of cells, or the whole sheet.',
  recap: [
    'Drag across cells to pick a block. It is named by its two ends.',
    'Ctrl + A picks the whole sheet. On a Mac it is Cmd + A.',
  ],
  newSkills: [RANGE, ALL],
  exercises: [
    {
      id: 'xl.u3.l1.e1',
      type: 'demo',
      skill: RANGE,
      sheet: rota,
      script: [
        { tap: 'B2', say: 'One tap picks one cell.' },
        { drag: 'B2:B4', say: 'Put a finger on B2 and drag to B4. Three cells are picked.' },
        { drag: 'B2:D4', say: 'Drag across as well and you pick a whole block.' },
      ],
      prompt: 'Your turn. Drag to pick everyone on Tue: C2 down to C4.',
      checks: [{ type: 'selectionEquals', range: 'C2:C4' }],
      hints: ['Start with your finger on the first Tue number.', 'Hold on C2 and slide down to C4 before letting go.', 'Three cells should be shaded: 6, 2 and 1.'],
      explain: 'A block is named by its two ends: C2:C4.',
      tips: ['Drag across cells to pick more than one.', 'The first cell you touched stays white. It is the active one.'],
      solution: [{ drag: 'C2:C4', say: 'Drag from C2 down to C4.' }],
    },
    {
      id: 'xl.u3.l1.e2',
      type: 'grid-task',
      skill: RANGE,
      sheet: rota,
      prompt: "Pick Ann's whole week: her three numbers.",
      checks: [{ type: 'selectionEquals', range: 'B2:D2' }],
      hints: ['This block runs across, not down.', 'Hold on the Mon number in her row and slide right to Wed.', 'Three cells should be shaded: 4, 6 and 5.'],
      explain: 'A block can run across a row just as well as down a column.',
      tips: ['Row numbers and column letters light up for what is picked.', BASICS.labels],
      solution: [{ drag: 'B2:D2', say: 'Drag from B2 across to D2.' }],
    },
    {
      id: 'xl.u3.l1.e3',
      type: 'grid-task',
      skill: RANGE,
      sheet: rota,
      prompt: 'Pick all nine numbers, without the names or headings.',
      checks: [{ type: 'selectionEquals', range: 'B2:D4' }],
      hints: ['Start on the top-left number and end on the bottom-right one.', 'Hold on the 4 under Mon and slide down and across to the last number.', 'The shaded block should be three across and three down.'],
      explain: 'Corner to corner picks the whole block: B2:D4.',
      tips: ['A picked block is named by its corners, like A1:C3.', 'Tap any single cell to let go of a block.'],
      solution: [{ drag: 'B2:D4', say: 'Drag from B2 down and across to D4.' }],
    },
    {
      id: 'xl.u3.l1.e4',
      type: 'demo',
      skill: ALL,
      sheet: rota,
      script: [
        { combo: 'selectAll', say: '{mod} + A picks every cell on the sheet at once.' },
        { tap: 'B3', say: 'Tap any cell and it is back to one.' },
      ],
      prompt: 'Your turn. Press {mod}, then A, to pick everything.',
      checks: [
        { type: 'usedShortcut', id: 'selectAll' },
        { type: 'selectionEquals', range: 'A1:D4' },
      ],
      hints: ['The keys are under the grid.', 'Press {mod} first. It stays held. Then press A.', 'The whole sheet should be shaded.'],
      explain: 'A for All. One shortcut picks the whole sheet.',
      tips: ['A shortcut is two keys together: hold the first, press the second.', 'On a Mac the key is Cmd. On Windows it is Ctrl.'],
      solution: [{ combo: 'selectAll', say: 'Press {mod}, then A.' }],
    },
    {
      id: 'xl.u3.l1.e5',
      type: 'shortcut-press',
      skill: ALL,
      sheet: scores,
      prompt: 'New sheet. Pick every cell with one shortcut.',
      checks: [
        { type: 'usedShortcut', id: 'selectAll' },
        { type: 'selectionEquals', range: 'A1:C5' },
      ],
      hints: ['It is the shortcut with the letter A.', 'Press {mod} first, then A.', 'The whole sheet should be shaded.'],
      explain: 'However big the sheet, {mod} + A picks all of it.',
      tips: ['Pick first, then act: bold, copy and fill work on what is picked.', BASICS.free],
      solution: [{ combo: 'selectAll', say: 'Press {mod}, then A.' }],
    },
    choice({
      id: 'xl.u3.l1.e6',
      skill: ALL,
      prompt: 'Which of these picks every cell at once?',
      options: ['{mod} + A', '{mod} + C', 'Tapping cell A1'],
      right: 0,
      hints: ['Think of the word "All".', 'Tapping a cell only ever picks that one cell.', 'The letter you want is the first letter of the alphabet.'],
      explain: '{mod} + A is "select All". {mod} + C copies, which comes next.',
      tips: ['On a real keyboard, hold the first key down as you press the letter.', BASICS.hint],
    }),
  ],
  practice: [
    {
      id: 'xl.u3.l1.p1',
      type: 'grid-task',
      skill: RANGE,
      sheet: scores,
      prompt: 'Pick all four Home scores.',
      checks: [{ type: 'selectionEquals', range: 'B2:B5' }],
      hints: ['Start with your finger on the first Home score.', 'Hold on B2 and slide down to B5 before letting go.', 'Four cells should be shaded.'],
      explain: 'The four Home scores are the block B2:B5.',
      tips: tipsFor(RANGE),
      solution: [{ drag: 'B2:B5', say: 'Drag from B2 down to B5.' }],
    },
    {
      id: 'xl.u3.l1.p2',
      type: 'shortcut-press',
      skill: ALL,
      sheet: rota,
      prompt: 'Pick the whole sheet with the shortcut.',
      checks: [
        { type: 'usedShortcut', id: 'selectAll' },
        { type: 'selectionEquals', range: 'A1:D4' },
      ],
      hints: ['It is the shortcut with the letter A.', 'Press {mod} first, then A.', 'The whole sheet should be shaded.'],
      explain: '{mod} + A picks every cell.',
      tips: tipsFor(ALL),
      solution: [{ combo: 'selectAll', say: 'Press {mod}, then A.' }],
    },
  ],
};
