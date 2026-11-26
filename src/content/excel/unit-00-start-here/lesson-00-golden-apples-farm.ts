import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS } from '../tips';

const PURPOSE = 'xl.spreadsheet.purpose';

const money = { numFmt: 'currency' as const };

/**
 * Golden Apples Farm's inventory. The same columns, in the same order, run through every
 * lesson in "Start here": Product, Stock (kg), Price per kg.
 */
const farmInventory = table(
  ['Product', 'Stock (kg)', 'Price per kg'],
  [
    ['Carrots', 100, 2.5],
    ['Potatoes', 200, 3],
    ['Tomatoes', 50, 6],
  ],
);
farmInventory.formats = { ...farmInventory.formats, 'C2:C4': money };

/** What the roadside stall was sent from the farm. */
const roadsideStall = table(
  ['Product', 'Received (kg)'],
  [
    ['Carrots', 40],
    ['Potatoes', 80],
    ['Tomatoes', 20],
  ],
);

/** The two records side by side: what was picked, what went to the stall, what is left. */
const movements = table(
  ['Product', 'Picked (kg)', 'To stall (kg)', 'Left (kg)'],
  [
    ['Carrots', 100, 40, 60],
    ['Potatoes', 200, 80, 120],
    ['Tomatoes', 50, 20, 30],
  ],
);

/** The farm keeps a spreadsheet for each part of the business. */
const records = table(
  ['Spreadsheet', 'What it records'],
  [
    ['Farm Inventory', 'What we grow'],
    ['Roadside Sales', 'What we sell'],
    ['Farm Expenses', 'What we spend'],
  ],
);

/** Before any cell or reference: what a spreadsheet is for, told through the farm. */
export const goldenApplesFarm: Lesson = {
  id: 'xl.u0.l0',
  title: 'Welcome to Golden Apples Farm',
  summary: 'Discover what spreadsheets are and how businesses use them.',
  recap: [
    'A spreadsheet organises, stores and works with information.',
    'Each part of a business can keep its own spreadsheet.',
    'Records connect: produce sent to the stall leaves the farm.',
  ],
  newSkills: [PURPOSE],
  exercises: [
    // Teach 1: what a spreadsheet is.
    {
      id: 'xl.u0.l0.e1',
      type: 'demo',
      skill: PURPOSE,
      sheet: farmInventory,
      script: [
        { tap: 'A2', say: 'Welcome to Golden Apples Farm! The farm is now yours.' },
        { tap: 'B2', say: 'You need to know how much produce you have.' },
        { tap: 'C2', say: 'And what each product sells for.' },
        { tap: 'A1', say: 'A spreadsheet organises and stores all of it.' },
      ],
      prompt: 'Your turn. Tap the word Carrots.',
      checks: [{ type: 'selectionEquals', range: 'A2' }],
      hints: ['Look in the Product column on the left.', 'Carrots are the first product listed.', 'Tap the cell that says Carrots.'],
      explain: 'A spreadsheet organises information into rows and columns, one item to a box.',
      tips: ['A spreadsheet is like a notebook made of rows and columns.', 'Each piece of information has its own place.'],
      solution: [{ tap: 'A2', say: 'Carrots are listed here.' }],
    },
    choice({
      id: 'xl.u0.l0.e2',
      skill: PURPOSE,
      sheet: farmInventory,
      prompt: 'What can this spreadsheet tell us?',
      options: ['How many kg of carrots we have', 'Whether it will rain tomorrow', 'How many customers will visit next week'],
      right: 0,
      hints: ['Look at what the spreadsheet records.', 'It shows products, stock and prices.', 'A spreadsheet only knows what has been typed into it.'],
      explain: 'It records 100 kg of carrots. It cannot know the weather or who will visit.',
      tips: ['Spreadsheets work with the information you give them.', 'Row 1 says what each column records.'],
    }),
    {
      id: 'xl.u0.l0.e6',
      type: 'grid-task',
      skill: PURPOSE,
      sheet: farmInventory,
      prompt: 'Which vegetable sells for the most per kg? Tap its price.',
      checks: [{ type: 'selectionEquals', range: 'C4' }],
      hints: ['Look down the Price per kg column.', 'The biggest price there is $6.00.', 'Tap the $6.00 next to Tomatoes.'],
      explain: 'Tomatoes sell for $6.00 a kg, the most of the three.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'C4', say: 'Tomatoes: $6.00 a kg.' }],
    },
    // Teach 2: different parts of the business, connected.
    {
      id: 'xl.u0.l0.e3',
      type: 'demo',
      skill: PURPOSE,
      sheet: roadsideStall,
      script: [
        { tap: 'A2', say: 'Your farm also runs a roadside stall.' },
        { tap: 'B2', say: 'The stall gets vegetables picked on the farm.' },
        { tap: 'B3', say: 'Farm and stall are two parts of one business.' },
        { tap: 'B4', say: 'Later, you will connect their numbers.' },
      ],
      prompt: 'Your turn. Tap how many kg of carrots the stall received.',
      checks: [{ type: 'selectionEquals', range: 'B2' }],
      hints: ['Find Carrots in the first column.', 'Look across to the Received (kg) column.', 'Tap the 40 next to Carrots.'],
      explain: 'The stall received 40 kg of carrots from the farm.',
      tips: ['Each part of a business can have its own spreadsheet.', 'Numbers in one column all measure the same thing.'],
      solution: [{ tap: 'B2', say: 'The stall received 40 kg of carrots.' }],
    },
    {
      id: 'xl.u0.l0.e4',
      type: 'grid-task',
      skill: PURPOSE,
      sheet: movements,
      prompt: 'We sent 40 kg of carrots to the stall. Tap how much is left.',
      checks: [{ type: 'selectionEquals', range: 'D2' }],
      hints: ['Find the Carrots row.', 'Look along it to the Left (kg) column.', 'Tap the 60 next to Carrots: 100 picked, 40 sent.'],
      explain: '100 kg picked and 40 kg sent to the stall leaves 60 kg. Later, a formula will work this out.',
      tips: ['When produce moves, two records change at once.', BASICS.free],
      solution: [{ tap: 'D2', say: '100 picked, 40 sent: 60 left.' }],
    },
    // Apply: pick the right record for the job.
    {
      id: 'xl.u0.l0.e5',
      type: 'grid-task',
      skill: PURPOSE,
      apply: true,
      sheet: records,
      prompt: 'You need to know what the farm spent on seeds. Tap the right spreadsheet.',
      checks: [{ type: 'selectionEquals', range: 'A4' }],
      hints: ['Seeds are something the farm buys.', 'Read column B to see what each one records.', 'Tap Farm Expenses: it records what we spend.'],
      praise: 'Well done!',
      explain: 'Farm Expenses records what the farm spends, so the cost of seeds is there.',
      tips: ['Keeping different records apart makes them easier to find.', BASICS.hint],
      solution: [{ tap: 'A4', say: 'Farm Expenses records what we spend.' }],
    },
  ],
  practice: [
    {
      id: 'xl.u0.l0.p1',
      type: 'grid-task',
      skill: PURPOSE,
      sheet: roadsideStall,
      prompt: 'Tap how many kg of tomatoes the stall received.',
      checks: [{ type: 'selectionEquals', range: 'B4' }],
      hints: ['Find Tomatoes in the first column.', 'Look across to the Received (kg) column.', 'Tap the 20 next to Tomatoes.'],
      explain: 'The stall received 20 kg of tomatoes.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'B4', say: 'The stall received 20 kg of tomatoes.' }],
    },
    {
      id: 'xl.u0.l0.p2',
      type: 'grid-task',
      skill: PURPOSE,
      sheet: records,
      prompt: 'Which spreadsheet records what we sell? Tap it.',
      checks: [{ type: 'selectionEquals', range: 'A3' }],
      hints: ['Read column B to see what each one records.', 'Selling happens at the roadside stall.', 'Tap Roadside Sales.'],
      explain: 'Roadside Sales records what the stall sells.',
      tips: ['Each part of a business can have its own spreadsheet.', BASICS.free],
      solution: [{ tap: 'A3', say: 'Roadside Sales records what we sell.' }],
    },
  ],
};
