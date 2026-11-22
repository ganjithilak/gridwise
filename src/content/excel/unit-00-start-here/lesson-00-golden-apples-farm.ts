import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';

const PURPOSE = 'xl.spreadsheet.purpose';

// Golden Apples Farm's first inventory spreadsheet.
const farmInventory = table(
  ['Product', 'Quantity (kg)', 'Price per kg'],
  [
    ['Carrots', 100, 2.5],
    ['Potatoes', 200, 3],
    ['Tomatoes', 50, 6],
  ],
);

// Produce delivered to the roadside stall.
const roadsideStall = table(
  ['Product', 'Stock received (kg)'],
  [
    ['Carrots', 40],
    ['Potatoes', 80],
    ['Tomatoes', 20],
  ],
);

export const goldenApplesFarm: Lesson = {
  id: 'xl.u0.l0',
  title: 'Welcome to Golden Apples Farm',
  summary: 'Discover what spreadsheets are and how businesses use them.',

  recap: [
    'Spreadsheets organise and store information.',
    'They can calculate and analyse information.',
    'Different business activities need different records.',
    'Spreadsheets can connect information across a business.',
  ],

  newSkills: [PURPOSE],

  exercises: [
    // TEACH 1 — Introducing spreadsheets.
    {
      id: 'xl.u0.l0.e1',
      type: 'demo',
      skill: PURPOSE,
      sheet: farmInventory,

      script: [
        {
          tap: 'A2',
          say: 'Welcome to Golden Apples Farm! You have taken over a small farming business.',
        },
        {
          tap: 'B2',
          say: 'Your farm grows vegetables. You need to keep track of how much produce you have.',
        },
        {
          tap: 'C2',
          say: 'You also need to record prices and manage your business.',
        },
        {
          tap: 'A1',
          say: 'A spreadsheet helps you organise, store and work with information.',
        },
      ],

      prompt: 'Now it’s your turn! Select the product Carrots.',

      checks: [
        { type: 'selectionEquals', range: 'A2' },
      ],

      hints: [
        'Look in the Product column.',
        'Carrots are the first product listed.',
      ],

      explain: 'Spreadsheets organise information into rows and columns.',

      tips: [
        'Spreadsheets help businesses organise information.',
      ],

      solution: [
        { tap: 'A2', say: 'Carrots are listed here.' },
      ],
    },

    // PRACTICE 1 — Understanding recorded information.
    choice({
      id: 'xl.u0.l0.e2',
      skill: PURPOSE,
      sheet: farmInventory,

      prompt: 'What can this spreadsheet tell us?',

      options: [
        'How many kilograms of carrots we have',
        'Whether it will rain tomorrow',
        'How many customers will visit next week',
      ],

      right: 0,

      hints: [
        'Look at the information recorded in the spreadsheet.',
        'The spreadsheet shows products, quantities and prices.',
      ],

      explain: 'Correct! Golden Apples Farm has 100 kg of carrots recorded.',

      tips: [
        'Spreadsheets work with information that has been entered.',
      ],
    }),

    // TEACH 2 — Connecting business activities.
    {
      id: 'xl.u0.l0.e3',
      type: 'demo',
      skill: PURPOSE,
      sheet: roadsideStall,

      script: [
        {
          tap: 'A2',
          say: 'Your farm also operates a roadside stall.',
        },
        {
          tap: 'B2',
          say: 'The stall receives vegetables harvested from your farm.',
        },
        {
          tap: 'B3',
          say: 'The farm and stall are different parts of the same business.',
        },
        {
          tap: 'B4',
          say: 'Later, you will learn how spreadsheets can connect their information.',
        },
      ],

      prompt: "Your turn! Can you find the quantity of carrots delivered to the stall?",

      checks: [
        { type: 'selectionEquals', range: 'B2' },
      ],

      hints: [
        'Find Carrots in the first column.',
        'Look across to Stock received.',
      ],

      explain: 'The roadside stall received 40 kg of carrots.',

      tips: [
        'Different spreadsheets can record different business activities.',
      ],

      solution: [
        { tap: 'B2', say: 'The stall received 40 kg of carrots.' },
      ],
    },

    // PRACTICE 2 — Recognising relationships.
    choice({
      id: 'xl.u0.l0.e4',
      skill: PURPOSE,
      sheet: farmInventory,

      prompt: 'You harvest 100 kg of carrots and send 40 kg to the stall. How much remains at the farm?',

      options: [
        '140 kg',
        '60 kg',
        '40 kg',
      ],

      right: 1,

      hints: [
        'Start with 100 kg.',
        'Subtract the 40 kg sent to the stall.',
      ],

      explain: 'Exactly! 60 kg remain. Later, you will learn to calculate this automatically.',

      tips: [
        'Spreadsheets can perform calculations when you learn formulas.',
      ],
    }),

    // APPLY — Choosing the correct business records.
    choice({
      id: 'xl.u0.l0.e5',
      skill: PURPOSE,
      sheet: farmInventory,

      prompt: 'You need to find how much the farm spent purchasing seeds. Which spreadsheet should you check?',

      options: [
        'Farm Inventory',
        'Roadside Sales',
        'Farm Expenses',
      ],

      right: 2,

      hints: [
        'Seeds are something the farm purchases.',
        'Look for the spreadsheet that records business costs.',
      ],

      explain: 'Well done! Farm Expenses records purchases and operating costs.',

      tips: [
        'Organising different information makes it easier to find.',
      ],
    }),
  ],

  practice: [],
};