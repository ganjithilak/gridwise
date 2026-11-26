import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS } from '../tips';

const ADDRESS = 'xl.cell.address';

const money = { numFmt: 'currency' as const };

/** The stall's fruit price list: the same produce the stall displays on the farm. */
const stall = table(
  ['Fruit', 'Price per kg', 'Stock (kg)'],
  [
    ['Apples', 4, 120],
    ['Pears', 3.5, 60],
    ['Plums', 3, 45],
    ['Golden apples', 6, 30],
  ],
);
stall.formats = { ...stall.formats, 'B2:B5': money };

/** Who picked what in the orchard this morning: practice on a different record. */
const pickers = table(
  ['Picker', 'Rows picked', 'Crates'],
  [
    ['Mia', 6, 18],
    ['Sam', 4, 11],
    ['Priya', 7, 23],
  ],
);

/** Cells, columns, rows and cell references: the vocabulary every later lesson relies on. */
export const meetTheGrid: Lesson = {
  id: 'xl.u0.l1',
  title: 'Cells and References',
  summary: 'Learn how a spreadsheet is laid out and how every cell is named.',
  recap: [
    'A spreadsheet is a grid of cells. Each cell holds one piece of information.',
    'Columns run down and are lettered. Rows run across and are numbered.',
    'A cell reference names a cell by its column, then its row: B3.',
  ],
  newSkills: [ADDRESS],
  exercises: [
    // Teach, part one: cells and the active cell.
    {
      id: 'xl.u0.l1.e1',
      type: 'demo',
      skill: ADDRESS,
      sheet: stall,
      script: [
        { tap: 'A2', say: 'This season the stall also sells orchard fruit.' },
        { tap: 'A1', say: 'Before you update its prices, learn the layout.' },
        { tap: 'B2', say: 'Each box is a cell. It holds one piece of data.' },
        { tap: 'C3', say: 'The selected cell is the active cell.' },
      ],
      prompt: 'Your turn. Select the cell that says Pears.',
      checks: [{ type: 'selectionEquals', range: 'A3' }],
      hints: ['Fruit names are in the first column.', 'Pears is directly below Apples.', 'Tap Pears. A gold outline shows it is selected.'],
      explain: 'The outlined cell is the active cell: anything you do next happens there.',
      tips: ['Each box in the grid is called a cell.', 'The active cell has an outline around it.'],
      solution: [{ tap: 'A3', say: 'Select the cell that says Pears.' }],
    },
    // Teach, part two: columns, rows and references.
    {
      id: 'xl.u0.l1.e7',
      type: 'demo',
      skill: ADDRESS,
      sheet: stall,
      script: [
        { tap: 'B1', say: 'Columns run down the sheet and are lettered.' },
        { tap: 'A3', say: 'Rows run across the sheet and are numbered.' },
        { tap: 'C4', say: 'A cell sits where a column and a row meet.' },
        { tap: 'B3', say: 'Column B meets row 3 here, so this cell is B3.' },
      ],
      prompt: 'Your turn. Select cell C2.',
      checks: [{ type: 'selectionEquals', range: 'C2' }],
      hints: ['Find column C along the top.', 'Follow column C down to row 2.', 'Row 2 is the first row below the headings.'],
      explain: 'C2 is where column C meets row 2. That name is its cell reference.',
      tips: ['A name such as B3 is a cell reference.', 'The active cell’s reference appears at the top left.'],
      solution: [{ tap: 'C2', say: 'Column C, row 2: C2.' }],
    },
    {
      id: 'xl.u0.l1.e2',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: stall,
      prompt: 'Select the cell that holds the price of golden apples.',
      checks: [{ type: 'selectionEquals', range: 'B5' }],
      hints: ['Find Golden apples in column A.', 'Price per kg is column B. Golden apples is row 5.', 'Select the $6.00 in the Golden apples row.'],
      explain: 'The Golden apples row and the Price per kg column meet at B5.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'B5', say: 'Row 5, column B: B5.' }],
    },
    choice({
      id: 'xl.u0.l1.e3',
      skill: ADDRESS,
      sheet: stall,
      prompt: 'What is the reference of the cell that says Plums?',
      options: ['A4', 'B4', 'A3', '4A'],
      right: 0,
      hints: ['Plums is in the first column, column A.', 'Count down the row numbers: Plums is in row 4.', 'The column letter always comes first.'],
      explain: 'Plums is in column A, row 4. References give the letter first: A4.',
      tips: ['Columns are lettered: A, B, C.', 'Rows are numbered: 1, 2, 3.'],
    }),
    {
      id: 'xl.u0.l1.e4',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: stall,
      prompt: 'Select cell C5.',
      checks: [{ type: 'selectionEquals', range: 'C5' }],
      hints: ['C is the third column.', 'Row 5 is the last row of data.', 'C5 holds the number 30.'],
      explain: 'C5 holds 30: the stall has 30 kg of golden apples in stock.',
      tips: [BASICS.name, 'Check the reference at the top left after you select.'],
      solution: [{ tap: 'C5', say: 'Column C, row 5.' }],
    },
    {
      id: 'xl.u0.l1.e5',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: stall,
      prompt: 'Select the heading of the Stock (kg) column.',
      checks: [{ type: 'selectionEquals', range: 'C1' }],
      hints: ['Headings are in row 1.', 'Find Stock (kg) in row 1.', 'It is the last heading in row 1.'],
      explain: 'Headings are in row 1, so the Stock (kg) heading is in C1.',
      tips: ['Selecting a cell never changes what is in it.', 'Letter first, then number: B3, never 3B.'],
      solution: [{ tap: 'C1', say: 'Stock (kg) heads column C, in row 1.' }],
    },
    {
      id: 'xl.u0.l1.e6',
      type: 'grid-task',
      skill: ADDRESS,
      apply: true,
      sheet: stall,
      prompt: 'A customer wants the cheapest fruit. Select its price.',
      checks: [{ type: 'selectionEquals', range: 'B4' }],
      hints: ['Compare the values in the Price per kg column.', 'The lowest price is $3.00.', 'Select the $3.00 in the Plums row.'],
      explain: 'The lowest value in Price per kg is $3.00, in B4: plums.',
      tips: [BASICS.free, BASICS.hint],
      solution: [{ tap: 'B4', say: 'The lowest price is $3.00, for plums.' }],
    },
  ],
  practice: [
    {
      id: 'xl.u0.l1.p1',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: pickers,
      prompt: 'Select the cell showing how many rows Sam picked.',
      checks: [{ type: 'selectionEquals', range: 'B3' }],
      hints: ['Find Sam in column A.', 'Rows picked is column B.', 'Select the 4 in Sam’s row.'],
      explain: 'Sam is in row 3 and Rows picked is column B, so the cell is B3.',
      tips: [BASICS.labels, BASICS.name],
      solution: [{ tap: 'B3', say: 'Sam is in row 3. Rows picked is column B.' }],
    },
    {
      id: 'xl.u0.l1.p2',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: pickers,
      prompt: 'Select cell C4.',
      checks: [{ type: 'selectionEquals', range: 'C4' }],
      hints: ['C is the third column.', 'Row 4 is the last row of data.', 'C4 holds the number 23.'],
      explain: 'C4 is column C, row 4: the crates Priya picked.',
      tips: [BASICS.headings, BASICS.free],
      solution: [{ tap: 'C4', say: 'Column C, row 4.' }],
    },
  ],
};
