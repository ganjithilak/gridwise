import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS } from '../tips';

const ADDRESS = 'xl.cell.address';

/** A fruit stall: something to point at while learning what a cell is. */
const stall = table(
  ['Fruit', 'Price', 'Stock'],
  [
    ['Apple', 2, 40],
    ['Pear', 3, 25],
    ['Plum', 1, 60],
    ['Fig', 4, 10],
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

/** For someone who has never opened a spreadsheet: what the boxes are and how they are named. */
export const meetTheGrid: Lesson = {
  id: 'xl.u0.l1',
  title: 'Meet the grid',
  summary: 'Cells, columns and rows, and how to find your way around.',
  recap: [
    'A spreadsheet is a tool to organise, store and work with information.',
    'Columns run vertically and have letters. Rows run horizontally and have numbers.',
    'Where they meet is a cell. Its name, like B3, is its cell reference.',
  ],
  newSkills: [ADDRESS],
  exercises: [
    // Teach, part one: what a spreadsheet is and what it is for. The words follow the
    // course brief, a sentence to a step so each can be read whole on a small phone.
    {
      id: 'xl.u0.l1.e1',
      type: 'demo',
      skill: ADDRESS,
      sheet: stall,
      script: [
        { tap: 'A2', say: 'A spreadsheet is a tool to organise and store information.' },
        { tap: 'C2', say: 'It can record names, dates, quantities and currency.' },
        { tap: 'B2', say: 'Use it to manage projects, track expenses or run a business.' },
        { tap: 'A1', say: 'A spreadsheet is made up of columns and rows.' },
        { tap: 'C3', say: 'To select a cell, simply tap it.' },
      ],
      prompt: 'Your turn. Select the cell that says Pear.',
      checks: [{ type: 'selectionEquals', range: 'A3' }],
      hints: ['Look down the first column for the word Pear.', 'Pear is under Apple.', 'Tap the word Pear. A thick outline shows it is selected.'],
      explain: 'The cell you select gets a thick outline. It is called the active cell.',
      tips: ['Each box in the grid is called a cell.', 'The cell you selected gets a thick outline.'],
      solution: [{ tap: 'A3', say: 'Tap the cell that says Pear.' }],
    },
    // Teach, part two: columns, rows, and how a cell gets its name.
    {
      id: 'xl.u0.l1.e7',
      type: 'demo',
      skill: ADDRESS,
      sheet: stall,
      script: [
        { tap: 'B1', say: 'Columns run vertically. Each has a letter: A, B, C.' },
        { tap: 'A3', say: 'Rows run horizontally. Each has a number: 1, 2, 3.' },
        { tap: 'C4', say: 'Where a column and a row meet, they form a cell.' },
        { tap: 'B3', say: 'The cell where column B and row 3 meet is called B3.' },
      ],
      prompt: 'Your turn. Select cell B4.',
      checks: [{ type: 'selectionEquals', range: 'B4' }],
      hints: ['Find column B along the top.', 'Go down column B until you reach row 4.', 'B4 holds the price of a Plum: 1.'],
      explain: 'B4 is where column B meets row 4. That name is its cell reference.',
      tips: ['A name like B3 is called a cell reference.', 'The reference of the active cell shows at the top left.'],
      solution: [{ tap: 'B4', say: 'Column B, row 4. That is B4.' }],
    },
    {
      id: 'xl.u0.l1.e2',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: stall,
      prompt: 'Tap the cell that holds the price of a Pear.',
      checks: [{ type: 'selectionEquals', range: 'B3' }],
      hints: ['Find Pear in column A, then look along its row.', 'Price is the second column. Pear is the third row.', 'Tap the 3 next to Pear.'],
      explain: 'Read across from Pear and down from Price. They meet at B3.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'B3', say: 'Pear is in row 3. Price is column B. So: B3.' }],
    },
    choice({
      id: 'xl.u0.l1.e3',
      skill: ADDRESS,
      sheet: stall,
      prompt: 'Which cell holds the word Plum?',
      options: ['A4', 'B4', 'A3', '4A'],
      right: 0,
      hints: ['Plum is in the first column, which is column A.', 'Count the rows down the side: Plum is in row 4.', 'Letter first, then number.'],
      explain: 'Plum is in column A, row 4. The letter always comes first: A4.',
      tips: ['Columns go down and have letters: A, B, C.', 'Rows go across and have numbers: 1, 2, 3.'],
    }),
    {
      id: 'xl.u0.l1.e4',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: stall,
      prompt: 'Tap cell C5.',
      checks: [{ type: 'selectionEquals', range: 'C5' }],
      hints: ['C is the third column.', 'Row 5 is the last row with anything in it.', 'It holds the number 10.'],
      explain: 'C5 holds 10: the stock of Figs.',
      tips: [BASICS.name, 'The name of the cell you picked shows at the top left.'],
      solution: [{ tap: 'C5', say: 'Column C, row 5.' }],
    },
    {
      id: 'xl.u0.l1.e5',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: stall,
      prompt: 'Tap the heading of the Stock column.',
      checks: [{ type: 'selectionEquals', range: 'C1' }],
      hints: ['Headings are in the top row.', 'Find the word Stock in row 1.', 'It is the last cell in row 1.'],
      explain: 'Headings live in row 1, so the Stock heading is C1.',
      tips: ['Tap any cell to pick it. Nothing changes until you type.', 'Letter first, then number: B3, never 3B.'],
      solution: [{ tap: 'C1', say: 'Stock is the heading of column C, in row 1.' }],
    },
    {
      id: 'xl.u0.l1.e6',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: stall,
      prompt: 'Which fruit is cheapest? Tap its price.',
      checks: [{ type: 'selectionEquals', range: 'B4' }],
      hints: ['Look down the Price column for the smallest number.', 'The smallest price is 1.', 'That is the price of a Plum.'],
      explain: 'The smallest number in the Price column is 1, in B4: the Plum.',
      tips: [BASICS.free, BASICS.hint],
      solution: [{ tap: 'B4', say: 'The smallest price is 1, next to Plum.' }],
    },
  ],
  practice: [
    {
      id: 'xl.u0.l1.p1',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: pets,
      prompt: 'Tap the cell that holds the age of Tibs.',
      checks: [{ type: 'selectionEquals', range: 'B3' }],
      hints: ['Find Tibs in column A.', 'Age is the second column.', 'Tap the 2 next to Tibs.'],
      explain: 'Tibs is in row 3 and Age is column B, so the cell is B3.',
      tips: [BASICS.labels, BASICS.name],
      solution: [{ tap: 'B3', say: 'Tibs is row 3. Age is column B.' }],
    },
    {
      id: 'xl.u0.l1.p2',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: pets,
      prompt: 'Tap cell C2.',
      checks: [{ type: 'selectionEquals', range: 'C2' }],
      hints: ['C is the third column.', 'Row 2 is the first row under the headings.', 'It holds the number 30.'],
      explain: 'C2 is column C, row 2: the weight of Rex.',
      tips: [BASICS.headings, BASICS.free],
      solution: [{ tap: 'C2', say: 'Column C, row 2.' }],
    },
  ],
};
