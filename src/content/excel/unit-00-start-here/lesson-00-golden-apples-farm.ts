import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS } from '../tips';

const PURPOSE = 'xl.spreadsheet.purpose';

const money = { numFmt: 'currency' as const };

/**
 * Golden Apples Farm's stock record at the start of the season. The same three columns run
 * through every Roots lesson: Product, Stock (kg), Price per kg. See docs/curriculum-map.md
 * for how the figures change from lesson to lesson.
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

/** The first delivery from the farm to its roadside stall. */
const roadsideStall = table(
  ['Product', 'Received (kg)'],
  [
    ['Carrots', 40],
    ['Potatoes', 80],
    ['Tomatoes', 20],
  ],
);

/** The two records side by side: harvested, sent to the stall, still at the farm. */
const movements = table(
  ['Product', 'Picked (kg)', 'To stall (kg)', 'Left (kg)'],
  [
    ['Carrots', 100, 40, 60],
    ['Potatoes', 200, 80, 120],
    ['Tomatoes', 50, 20, 30],
  ],
);

/** The farm keeps a separate workbook for each part of the business. */
const records = table(
  ['Spreadsheet', 'What it records'],
  [
    ['Farm Inventory', 'Stock on hand'],
    ['Roadside Sales', 'What the stall sells'],
    ['Farm Expenses', 'What the farm spends'],
  ],
);

/**
 * Orientation: why a farm needs spreadsheets, before any cell or reference is taught. The
 * opening is told as short dialogue, one sentence to a screen, so it reads well on a phone.
 * An orientation lesson, so it asks for recognition rather than practice.
 */
export const goldenApplesFarm: Lesson = {
  id: 'xl.u0.l0',
  title: 'Welcome to Golden Apples Farm',
  summary: 'A new season, a farm to run, and why spreadsheets matter.',
  recap: [
    'A spreadsheet stores information in rows and columns so it is easy to find.',
    'Each part of a business can keep its own spreadsheet.',
    'Records are connected: stock sent to the stall is no longer at the farm.',
  ],
  newSkills: [PURPOSE],
  exercises: [
    // Teach: the story, then what a spreadsheet is for.
    {
      id: 'xl.u0.l0.e1',
      type: 'demo',
      skill: PURPOSE,
      sheet: farmInventory,
      script: [
        { tap: 'A1', say: 'Welcome to Golden Apples Farm.' },
        { tap: 'A2', say: 'A new growing season is about to begin.' },
        { tap: 'A3', say: "You've been entrusted with running the farm." },
        { tap: 'B2', say: 'Harvests, stock, expenses and sales all need tracking.' },
        { tap: 'C2', say: 'A spreadsheet keeps that information organised.' },
        { tap: 'A1', say: "Let's start with the farm's stock record." },
      ],
      prompt: 'Your turn. Select the cell that says Carrots.',
      checks: [{ type: 'selectionEquals', range: 'A2' }],
      hints: ['Product names are in the first column.', 'Carrots is the first product in the list.', 'Tap the cell containing the word Carrots.'],
      explain: 'Each product has its own row, so its stock and price sit beside it.',
      tips: ['A spreadsheet is a grid of rows and columns.', 'Each piece of information has its own place in the grid.'],
      solution: [{ tap: 'A2', say: 'Carrots is the first product listed.' }],
    },
    choice({
      id: 'xl.u0.l0.e2',
      skill: PURPOSE,
      sheet: farmInventory,
      prompt: 'Which question can this spreadsheet answer?',
      options: ['How many kilograms of carrots are in stock', 'Whether it will rain tomorrow', 'How many customers will visit next week'],
      right: 0,
      hints: ['Read the headings in row 1.', 'The sheet records products, stock and prices.', 'A spreadsheet only knows what has been entered into it.'],
      explain: 'The sheet records 100 kg of carrots. It holds no information about weather or visitors.',
      tips: ['A spreadsheet works only with the information you give it.', 'Read the headings first: they say what each column records.'],
    }),
    {
      id: 'xl.u0.l0.e6',
      type: 'grid-task',
      skill: PURPOSE,
      sheet: farmInventory,
      prompt: 'Which product earns the most per kilogram? Select its price.',
      checks: [{ type: 'selectionEquals', range: 'C4' }],
      hints: ['Compare the values in the Price per kg column.', 'The highest price in that column is $6.00.', 'Select the $6.00 in the Tomatoes row.'],
      explain: 'Tomatoes sell for $6.00 per kg, the highest price of the three.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'C4', say: 'Tomatoes: $6.00 per kg.' }],
    },
    // Teach: separate records for separate parts of the business, and how they connect.
    {
      id: 'xl.u0.l0.e3',
      type: 'demo',
      skill: PURPOSE,
      sheet: roadsideStall,
      script: [
        { tap: 'A1', say: 'The farm also runs a roadside stall.' },
        { tap: 'B2', say: 'This sheet records what the stall received.' },
        { tap: 'B3', say: 'The farm and the stall keep separate records.' },
        { tap: 'B4', say: 'Later, formulas will connect them.' },
      ],
      prompt: 'Your turn. Select the amount of carrots the stall received.',
      checks: [{ type: 'selectionEquals', range: 'B2' }],
      hints: ['Find Carrots in the first column.', 'Follow that row across to Received (kg).', 'Select the 40 in the Carrots row.'],
      explain: 'The stall received 40 kg of carrots from the farm.',
      tips: ['Each part of a business can keep its own spreadsheet.', 'Every value in a column measures the same thing.'],
      solution: [{ tap: 'B2', say: 'The stall received 40 kg of carrots.' }],
    },
    {
      id: 'xl.u0.l0.e4',
      type: 'grid-task',
      skill: PURPOSE,
      sheet: movements,
      prompt: '40 kg of carrots went to the stall. Select how much is left.',
      checks: [{ type: 'selectionEquals', range: 'D2' }],
      hints: ['Find the Carrots row.', 'Follow it across to the Left (kg) column.', 'Select 60: 100 kg picked, less 40 kg sent.'],
      explain: '100 kg picked less 40 kg sent leaves 60 kg. Soon a formula will calculate this.',
      tips: ['When stock moves, two records change at once.', BASICS.free],
      solution: [{ tap: 'D2', say: '100 picked, 40 sent: 60 left.' }],
    },
    // Apply: choose the right record for a real question.
    {
      id: 'xl.u0.l0.e5',
      type: 'grid-task',
      skill: PURPOSE,
      apply: true,
      sheet: records,
      prompt: 'You need to know what the farm spent on seed. Select the right spreadsheet.',
      checks: [{ type: 'selectionEquals', range: 'A4' }],
      hints: ['Seed is something the farm buys.', 'Column B says what each spreadsheet records.', 'Select Farm Expenses.'],
      explain: 'Farm Expenses records what the farm spends, including seed.',
      tips: ['Separate records are easier to find and keep accurate.', BASICS.hint],
      solution: [{ tap: 'A4', say: 'Farm Expenses records spending.' }],
    },
  ],
  practice: [
    {
      id: 'xl.u0.l0.p1',
      type: 'grid-task',
      skill: PURPOSE,
      sheet: roadsideStall,
      prompt: 'Select the amount of tomatoes the stall received.',
      checks: [{ type: 'selectionEquals', range: 'B4' }],
      hints: ['Find Tomatoes in the first column.', 'Follow that row across to Received (kg).', 'Select the 20 in the Tomatoes row.'],
      explain: 'The stall received 20 kg of tomatoes.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'B4', say: 'The stall received 20 kg of tomatoes.' }],
    },
    {
      id: 'xl.u0.l0.p2',
      type: 'grid-task',
      skill: PURPOSE,
      sheet: records,
      prompt: 'Which spreadsheet records what the stall sells? Select it.',
      checks: [{ type: 'selectionEquals', range: 'A3' }],
      hints: ['Column B says what each spreadsheet records.', 'Sales happen at the roadside stall.', 'Select Roadside Sales.'],
      explain: 'Roadside Sales records what the stall sells.',
      tips: ['Each part of a business can keep its own spreadsheet.', BASICS.free],
      solution: [{ tap: 'A3', say: 'Roadside Sales records sales.' }],
    },
  ],
};
