import type { Lesson } from '@/lessons/types';

import { choice, table, withCells } from '../build';
import { BASICS } from '../tips';

const TYPE = 'xl.cell.type';
const ADDRESS = 'xl.cell.address';

const money = { numFmt: 'currency' as const };

// Golden Apples Farm inventory before the supplier delivery.
const inventory = {
  ...table(
    ['Product', 'Stock (kg)', 'Price per kg'],
    [
      ['Carrots', 15, 2.5],
      ['Potatoes', 200, 3],
      ['Tomatoes', 50, 6],
      ['Apples', 80, 4],
    ],
  ),
};

inventory.formats = {
  ...inventory.formats,
  'C2:C5': money,
};

// Supplier purchasing records.
const purchases = {
  ...table(
    ['Product', 'Cost per kg', 'Ordered (kg)'],
    [
      ['Carrots', 3, 100],
      ['Potatoes', 2, null],
      ['Tomatoes', 5, 50],
    ],
  ),
};

purchases.formats = {
  ...purchases.formats,
  'B2:B4': money,
};

// Preview of automatic inventory calculations.
const totalled = withCells(
  {
    ...inventory,
    rows: 6,
    formats: {
      ...inventory.formats,
      A6: { bold: true },
      B6: { bold: true },
    },
  },
  {
    A6: 'Total stock (kg)',
    B6: '=SUM(B2:B5)',
  },
);

export const typeInACell: Lesson = {
  id: 'xl.u0.l2',

  title: 'Entering Data',

  summary:
    'Enter, update and correct information at Golden Apples Farm.',

  recap: [
    'Cells can hold words, numbers and currency values.',
    'Select a cell, enter information and press Enter to confirm it.',
    'Existing information can be replaced when business records change.',
    'Accurate information helps businesses manage their inventory.',
  ],

  newSkills: [TYPE],

  // Formulas are introduced in a later lesson.
  hideKeys: ['=', '+', '-', '*', '/', '(', ')', ':', ',', '$', 'SUM'],

  exercises: [
    // --------------------------------------------------
    // TEACH: THE CARROT SHORTAGE
    // --------------------------------------------------

    {
      id: 'xl.u0.l2.e1',
      type: 'demo',
      skill: TYPE,
      sheet: inventory,

      script: [
        {
          tap: 'A2',
          say:
            'Welcome back to Golden Apples Farm! We have a problem. Our carrot supplies are running low.',
        },
        {
          tap: 'B2',
          say:
            'We only have 15 kg of carrots remaining, and our next harvest is still weeks away.',
        },
        {
          tap: 'A1',
          say:
            'We have ordered more carrots from a local supplier. We need to update our inventory.',
        },
        {
          tap: 'B2',
          say:
            'A spreadsheet allows us to change information whenever our business records need updating.',
        },
        {
          tap: 'B2',
          say:
            'To change information, select a cell and tap it again to open the keyboard.',
        },
        {
          tap: 'B2',
          say:
            'The keyboard lets us enter numbers. We can replace the old quantity with the new one.',
        },
        {
          tap: 'B2',
          say:
            'After entering the new quantity, press Enter to confirm the change.',
        },
      ],

      prompt:
        'Our supplier delivered 100 kg of carrots. Update cell B2 from 15 to 115.',

      checks: [
        {
          type: 'cellValue',
          cell: 'B2',
          equals: 115,
        },
      ],

      hints: [
        'Carrots are listed in row 2. Their stock quantity is in column B.',
        'Select B2, delete the existing 15 and enter 115.',
        'Press Enter. The cell should display 115.',
      ],

      praise: 'Excellent work!',

      explain:
        'Golden Apples Farm now has 115 kg of carrots recorded in its inventory.',

      tips: [
        BASICS.tapTwice,
        BASICS.enter,
      ],

      solution: [
        {
          tap: 'B2',
          say: 'Select the carrot stock quantity.',
        },
        {
          tap: 'B2',
          say: 'Open the cell for editing.',
        },
        {
          key: 'backspace',
          say: 'Remove the existing value.',
        },
        {
          key: '1',
          say: 'Enter 115.',
        },
        {
          key: '1',
        },
        {
          key: '5',
        },
        {
          key: 'enter',
          say: 'Confirm the updated quantity.',
        },
      ],
    },

    // --------------------------------------------------
    // PRACTICE: UPDATE A SUPPLIER PRICE
    // --------------------------------------------------

    {
      id: 'xl.u0.l2.e3',
      type: 'grid-task',
      skill: TYPE,
      sheet: inventory,

      prompt:
        'Our supplier has increased the price of carrots to $3 per kilogram. Find the price and update it.',

      checks: [
        {
          type: 'cellValue',
          cell: 'C2',
          equals: 3,
        },
      ],

      hints: [
        'Find Carrots in row 2.',
        'Price per kg is column C. Select C2.',
        'Delete 2.5, enter 3 and press Enter.',
      ],

      explain:
        'Well done! The new carrot price is $3 per kilogram.',

      tips: [
        BASICS.backspace,
        BASICS.bar,
      ],

      solution: [
        {
          tap: 'C2',
          say: 'Select the carrot price.',
        },
        {
          tap: 'C2',
          say: 'Open the cell.',
        },
        {
          key: 'backspace',
          say: 'Delete the old price.',
        },
        {
          key: '3',
          say: 'Enter the new price.',
        },
        {
          key: 'enter',
          say: 'Confirm the change.',
        },
      ],
    },

    // --------------------------------------------------
    // PRACTICE: ENTER DECIMAL VALUES
    // --------------------------------------------------

    {
      id: 'xl.u0.l2.e4',
      type: 'grid-task',
      skill: TYPE,
      sheet: inventory,

      prompt:
        'Our potato supplier offers a new price of $2.75 per kilogram. Update the potato price.',

      checks: [
        {
          type: 'cellValue',
          cell: 'C3',
          equals: 2.75,
        },
      ],

      hints: [
        'Potatoes are in row 3.',
        'Their price is in column C.',
        'Select C3, delete 3 and enter 2.75.',
      ],

      explain:
        'Great work! You have entered a decimal value. The potato price is now $2.75.',

      tips: [
        'The decimal point allows you to enter values such as 2.75.',
        'Currency formatting displays the number as money.',
      ],

      solution: [
        {
          tap: 'C3',
          say: 'Select the potato price.',
        },
        {
          tap: 'C3',
        },
        {
          key: 'backspace',
          say: 'Delete the old price.',
        },
        {
          key: '2',
          say: 'Enter 2.75.',
        },
        {
          key: '.',
        },
        {
          key: '7',
        },
        {
          key: '5',
        },
        {
          key: 'enter',
          say: 'Confirm the price.',
        },
      ],
    },

    // --------------------------------------------------
    // KNOWLEDGE CHECK
    // --------------------------------------------------

    choice({
      id: 'xl.u0.l2.e5',
      skill: TYPE,

      prompt:
        'After entering information into a cell, what should you do to confirm it?',

      options: [
        'Press Enter',
        'Wait for the spreadsheet to save it',
        'Press the ✕ button',
      ],

      right: 0,

      hints: [
        'Think about the keyboard.',
        'The Enter key confirms your entry.',
        'The ✕ button cancels your changes.',
      ],

      explain:
        'Correct! Pressing Enter confirms the information you entered.',

      tips: [
        'Enter confirms your changes.',
        'The ✕ button cancels the current edit.',
      ],
    }),

    // --------------------------------------------------
    // APPLY: IDENTIFY THE TOMATO STOCK CELL
    // --------------------------------------------------

    {
      id: 'xl.u0.l2.e7',
      type: 'grid-task',
      skill: ADDRESS,
      apply: true,
      sheet: inventory,

      prompt:
        'Another delivery has arrived! Our supplier delivered 50 kg of tomatoes. Select the tomato stock cell.',

      checks: [
        {
          type: 'selectionEquals',
          range: 'B4',
        },
      ],

      hints: [
        'Find Tomatoes in column A.',
        'Stock quantities are recorded in column B.',
        'Tomatoes are in row 4. Select B4.',
      ],

      praise: 'Well done!',

      explain:
        'You selected B4, which records the quantity of tomatoes in stock.',

      tips: [
        BASICS.labels,
        BASICS.headings,
      ],

      solution: [
        {
          tap: 'B4',
          say: 'Tomatoes are in row 4, and Stock is column B.',
        },
      ],
    },

    // --------------------------------------------------
    // APPLY: UPDATE THE TOMATO INVENTORY
    // --------------------------------------------------

    {
      id: 'xl.u0.l2.e2',
      type: 'grid-task',
      skill: TYPE,
      apply: true,
      sheet: inventory,

      select: 'B4',

      prompt:
        'We had 50 kg of tomatoes and received another 50 kg. Update our inventory to show the new total.',

      checks: [
        {
          type: 'cellValue',
          cell: 'B4',
          equals: 100,
        },
      ],

      hints: [
        'Add the existing 50 kg to the new delivery of 50 kg.',
        'The updated quantity is 100 kg.',
        'Select B4, replace 50 with 100 and press Enter.',
      ],

      praise: 'Excellent work!',

      explain:
        'Golden Apples Farm now has 100 kg of tomatoes recorded in its inventory.',

      tips: [
        BASICS.backspace,
        BASICS.enter,
      ],

      solution: [
        {
          tap: 'B4',
          say: 'Open the tomato stock cell.',
        },
        {
          key: 'backspace',
          say: 'Remove the previous quantity.',
        },
        {
          key: '1',
          say: 'Enter 100.',
        },
        {
          key: '0',
        },
        {
          key: '0',
        },
        {
          key: 'enter',
          say: 'Confirm the updated inventory.',
        },
      ],
    },

    // --------------------------------------------------
    // APPLY: PREVIEW AUTOMATIC CALCULATIONS
    // --------------------------------------------------

    {
      id: 'xl.u0.l2.e6',
      type: 'grid-task',
      skill: TYPE,
      apply: true,
      sheet: totalled,

      prompt:
        'Our apple harvest is ready! We have collected another 20 kg of apples. Update our inventory and watch the total stock change.',

      checks: [
        {
          type: 'cellValue',
          cell: 'B5',
          equals: 100,
        },
      ],

      hints: [
        'Apples are in row 5.',
        'We had 80 kg and harvested another 20 kg.',
        'Select B5, replace 80 with 100 and press Enter.',
      ],

      praise: 'Excellent work!',

      explain:
        'The total stock increased from 345 kg to 365 kg automatically! A formula performed the calculation. You will learn how formulas work in a later lesson.',

      tips: [
        BASICS.free,
        BASICS.hint,
      ],

      solution: [
        {
          tap: 'B5',
          say: 'Select the apple stock quantity.',
        },
        {
          tap: 'B5',
        },
        {
          key: 'backspace',
          say: 'Delete the old quantity.',
        },
        {
          key: '1',
          say: 'Enter 100.',
        },
        {
          key: '0',
        },
        {
          key: '0',
        },
        {
          key: 'enter',
          say: 'Watch the total stock update automatically.',
        },
      ],
    },
  ],

  // --------------------------------------------------
  // INDEPENDENT PRACTICE
  // --------------------------------------------------

  practice: [
    {
      id: 'xl.u0.l2.p1',
      type: 'grid-task',
      skill: TYPE,
      sheet: purchases,

      prompt:
        'Golden Apples Farm has ordered 75 kg of potatoes. Enter 75 in the empty order quantity cell.',

      checks: [
        {
          type: 'cellValue',
          cell: 'C3',
          equals: 75,
        },
      ],

      hints: [
        'Find Potatoes in row 3.',
        'Ordered (kg) is column C.',
        'Select C3, enter 75 and press Enter.',
      ],

      explain:
        'Excellent! You have recorded the potato order.',

      tips: [
        BASICS.tapTwice,
        BASICS.enter,
      ],

      solution: [
        {
          tap: 'C3',
          say: 'Select the empty order cell.',
        },
        {
          tap: 'C3',
        },
        {
          key: '7',
          say: 'Enter 75.',
        },
        {
          key: '5',
        },
        {
          key: 'enter',
          say: 'Confirm the order.',
        },
      ],
    },

    // --------------------------------------------------
    // PRACTICE: UPDATE A SUPPLIER PRICE
    // --------------------------------------------------

    {
      id: 'xl.u0.l2.p2',
      type: 'grid-task',
      skill: TYPE,
      sheet: purchases,

      prompt:
        'Our tomato supplier has reduced the price to $4 per kilogram. Update the supplier price.',

      checks: [
        {
          type: 'cellValue',
          cell: 'B4',
          equals: 4,
        },
      ],

      hints: [
        'Find Tomatoes in row 4.',
        'Cost per kg is column B.',
        'Replace the existing 5 with 4.',
      ],

      explain:
        'Well done! The supplier price is now $4 per kilogram.',

      tips: [
        BASICS.backspace,
        BASICS.bar,
      ],

      solution: [
        {
          tap: 'B4',
          say: 'Select the tomato supplier price.',
        },
        {
          tap: 'B4',
        },
        {
          key: 'backspace',
          say: 'Remove the old price.',
        },
        {
          key: '4',
          say: 'Enter the new price.',
        },
        {
          key: 'enter',
          say: 'Confirm the change.',
        },
      ],
    },

    // --------------------------------------------------
    // PRACTICE: IDENTIFY A CELL REFERENCE
    // --------------------------------------------------

    {
      id: 'xl.u0.l2.p3',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: purchases,

      prompt:
        'Our carrot supplier has announced a price change. Select the cell containing the current carrot price.',

      checks: [
        {
          type: 'selectionEquals',
          range: 'B2',
        },
      ],

      hints: [
        'Carrots are in row 2.',
        'Cost per kg is column B.',
        'Select cell B2.',
      ],

      explain:
        'Correct! B2 contains the supplier price for carrots.',

      tips: [
        BASICS.labels,
        BASICS.headings,
      ],

      solution: [
        {
          tap: 'B2',
          say: 'Carrots are in row 2, and Cost is column B.',
        },
      ],
    },
  ],
};