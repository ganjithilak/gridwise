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
  title: 'Explore the Spreadsheet',
  summary: 'Discover cells, rows, columns and cell references.',
  recap: [
    'Every spreadsheet is made of cells, and each cell holds information.',
    'Columns run down and have letters. Rows run across and have numbers.',
    'Each cell has a unique reference, such as B3: its column, then its row.',
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
        { tap: 'A2', say: 'Good news: the roadside stall now sells fruit too.' },
        { tap: 'A1', say: "Now let's see how a spreadsheet is built." },
        { tap: 'B2', say: 'Each box is a cell. A cell holds one piece of information.' },
        { tap: 'C3', say: 'Tap a cell to select it. It becomes the active cell.' },
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
      prompt: 'Your turn. Select cell C2.',
      checks: [{ type: 'selectionEquals', range: 'C2' }],
      hints: ['Find column C along the top.', 'Go down column C until you reach row 2.', 'Row 2 is the first row under the headings.'],
      explain: 'C2 is where column C meets row 2. That name is its cell reference.',
      tips: ['A name like B3 is called a cell reference.', 'The reference of the active cell shows at the top left.'],
      solution: [{ tap: 'C2', say: 'Column C, row 2. That is C2.' }],
    },
    {
      id: 'xl.u0.l1.e2',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: stall,
      prompt: 'Tap the cell that holds the price of a Fig.',
      checks: [{ type: 'selectionEquals', range: 'B5' }],
      hints: ['Find Fig in column A, then look along its row.', 'Price is the second column. Fig is the fifth row.', 'Select the cell containing the price 4, next to Fig.'],
      explain: 'Read across from Fig and down from Price. They meet at B5.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'B5', say: 'Fig is in row 5. Price is column B. So: B5.' }],
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
      prompt: 'Tap cell C4.',
      checks: [{ type: 'selectionEquals', range: 'C4' }],
      hints: ['C is the third column.', 'Row 4 is the last row with anything in it.', 'It holds the number 1.'],
      explain: 'C4 is column C, row 4: the weight of Coco.',
      tips: [BASICS.headings, BASICS.free],
      solution: [{ tap: 'C4', say: 'Column C, row 4.' }],
    },
  ],
};
