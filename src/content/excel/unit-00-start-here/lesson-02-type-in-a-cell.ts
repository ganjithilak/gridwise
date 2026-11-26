import type { Lesson } from '@/lessons/types';

import { choice, table, withCells } from '../build';
import { BASICS } from '../tips';

const TYPE = 'xl.cell.type';
/** Taught in the lesson before. Here it is the first half of a real task: find the cell, then change it. */
const ADDRESS = 'xl.cell.address';

const money = { numFmt: 'currency' as const };

/**
 * Golden Apples Farm's stock record a month into the season. The stall has sold most of the
 * carrots from lesson 0; apples have come in from the orchard. Every task below opens on the
 * sheet as the task before left it, so the learner's own updates carry through.
 */
const inventory = table(
  ['Product', 'Stock (kg)', 'Price per kg'],
  [
    ['Carrots', 15, 2.5],
    ['Potatoes', 120, 3],
    ['Tomatoes', 30, 6],
    ['Apples', 80, 4],
  ],
);
inventory.formats = { ...inventory.formats, 'C2:C5': money };

/** After the demonstration (10 kg of potatoes sold) and the carrot delivery. */
const carrotsIn = withCells(inventory, { B2: 115, B3: 110 });
/** After the carrot price rise. */
const carrotPrice = withCells(carrotsIn, { C2: 3 });
/** After the potato special. */
const potatoPrice = withCells(carrotPrice, { C3: 2.75 });
/** Two prices keyed in wrongly, to be corrected by editing. */
const typos = withCells(potatoPrice, { C4: 6.6, C5: 4.15 });
/** After the corrections. */
const corrected = withCells(potatoPrice, { C4: 6, C5: 4.5 });
/** After the tomato harvest, with a total added at the bottom. */
const totalled = withCells(
  { ...corrected, rows: 6, formats: { ...corrected.formats, A6: { bold: true }, B6: { bold: true } } },
  { B4: 80, A6: 'Total stock (kg)', B6: '=SUM(B2:B5)' },
);

/** What the farm buys from its suppliers: practice on a different record. */
const purchases = table(
  ['Product', 'Cost per kg', 'Ordered (kg)'],
  [
    ['Carrots', 3, 100],
    ['Potatoes', 2, null],
    ['Tomatoes', 5, 50],
  ],
);
purchases.formats = { ...purchases.formats, 'B2:B4': money };

/**
 * Entering, replacing and correcting values: the last step before formulas.
 *
 * Accuracy note: as in Excel, typing into a selected cell replaces its contents; to change
 * only part of an entry, the cell is opened for editing (a second tap here, F2 or a
 * double-click in Excel).
 */
export const typeInACell: Lesson = {
  id: 'xl.u0.l2',
  title: 'Entering and Correcting Data',
  summary: 'Keep the farm’s stock record up to date: enter, replace and correct values.',
  recap: [
    'Select a cell and type to replace its contents. Enter confirms the entry.',
    'Tap a selected cell again to edit part of it: F2 or a double-click in Excel.',
    'Cells hold text, numbers or currency. A format changes only how they look.',
  ],
  newSkills: [TYPE],
  // Formulas come next. For now the keyboard is just numbers.
  hideKeys: ['=', '+', '-', '*', '/', '(', ')', ':', ',', '$', 'SUM'],
  exercises: [
    // Teach: what a cell holds, and replacing a value by typing over it.
    {
      id: 'xl.u0.l2.e1',
      type: 'demo',
      skill: TYPE,
      sheet: inventory,
      script: [
        { tap: 'A3', say: 'A cell can hold text, such as a product name.' },
        { tap: 'B3', say: 'Or a number, such as kilograms in stock.' },
        { tap: 'C3', say: 'Or currency, such as a price per kilogram.' },
        { tap: 'B3', say: 'The stall sold 10 kg of potatoes today.' },
        { key: '1', say: 'With the cell selected, type the new amount.' },
        { key: '1' },
        { key: '0' },
        { key: 'enter', say: 'Enter confirms it. The old value is replaced.' },
      ],
      prompt: 'Your turn. 100 kg of carrots arrived. Change their stock from 15 to 115.',
      checks: [{ type: 'cellValue', cell: 'B2', equals: 115 }],
      hints: ['Carrot stock is in B2.', 'Select B2. You can start typing straight away.', 'Type 115, then press Enter.'],
      explain: 'Typing into a selected cell replaces its contents. There is no need to clear it first.',
      tips: [BASICS.tapTwice, BASICS.enter],
      solution: [
        { tap: 'B2', say: 'Select B2.' },
        { key: '1', say: 'Type 115.' },
        { key: '1' },
        { key: '5' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    {
      id: 'xl.u0.l2.e3',
      type: 'grid-task',
      skill: TYPE,
      sheet: carrotsIn,
      prompt: 'Carrots now sell for $3 per kg. Update their price.',
      checks: [{ type: 'cellValue', cell: 'C2', equals: 3 }],
      hints: ['Find Carrots in column A.', 'Price per kg is column C, so the cell is C2.', 'Select C2, type 3, then press Enter.'],
      explain: 'Enter the number only. The currency format adds the $ sign and the cents.',
      tips: ['Currency format shows a number as dollars and cents.', BASICS.bar],
      solution: [
        { tap: 'C2', say: 'Select C2.' },
        { key: '3', say: 'Type 3.' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    {
      id: 'xl.u0.l2.e4',
      type: 'grid-task',
      skill: TYPE,
      sheet: carrotPrice,
      prompt: 'Potatoes are on special. Change their price to $2.75 per kg.',
      checks: [{ type: 'cellValue', cell: 'C3', equals: 2.75 }],
      hints: ['Potatoes are in row 3.', 'Their price is in column C: cell C3.', 'Select C3, type 2.75, then press Enter.'],
      explain: 'The . key enters a decimal point, so 2.75 is shown as $2.75.',
      tips: ['The decimal point is the . key, beside 0.', 'Enter $2.75 as 2.75; the format supplies the $ sign.'],
      solution: [
        { tap: 'C3', say: 'Select C3.' },
        { key: '2', say: 'Type 2.75.' },
        { key: '.' },
        { key: '7' },
        { key: '5' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    // Teach: correcting part of an entry, instead of retyping all of it.
    {
      id: 'xl.u0.l2.e8',
      type: 'demo',
      skill: TYPE,
      sheet: typos,
      script: [
        { tap: 'C5', say: 'The apple price was keyed as $4.15, not $4.50.' },
        { tap: 'C5', say: 'Tap it again to edit. In Excel: F2 or double-click.' },
        { key: 'backspace', say: '⌫ removes one character at a time.' },
        { key: 'backspace' },
        { key: '5', say: 'Type the correct digit.' },
        { key: 'enter', say: 'Enter confirms the correction.' },
      ],
      prompt: 'Your turn. Tomatoes show $6.60 but should be $6.00. Correct the entry.',
      checks: [{ type: 'cellValue', cell: 'C4', equals: 6 }],
      hints: ['The tomato price is in C4.', 'Select C4, then tap it again to edit it.', 'Press ⌫ twice to remove .6, then press Enter.'],
      explain: 'Editing keeps the rest of the entry, which saves retyping long values. Typing over replaces it all.',
      tips: ['Editing keeps what is already in the cell.', BASICS.backspace],
      solution: [
        { tap: 'C4', say: 'Select C4.' },
        { tap: 'C4', say: 'Tap it again to edit.' },
        { key: 'backspace', say: 'Remove the .6.' },
        { key: 'backspace' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    choice({
      id: 'xl.u0.l2.e5',
      skill: TYPE,
      prompt: 'You have typed a value into a cell. What confirms the entry?',
      options: ['Pressing Enter', 'Waiting a moment', 'Tapping ✕ in the formula bar'],
      right: 0,
      hints: ['It is a key on the keyboard.', 'It is the large key at the lower right.', '✕ does the opposite: it discards the entry.'],
      explain: 'Enter confirms the entry. ✕ in the formula bar (Esc in Excel) cancels it.',
      tips: ['Nothing is saved to the cell until you press Enter.', 'You can change a cell as often as you need.'],
    }),
    // Apply: one task in two steps: find the cell, then update it.
    {
      id: 'xl.u0.l2.e7',
      type: 'grid-task',
      skill: ADDRESS,
      apply: true,
      sheet: corrected,
      prompt: 'Another 50 kg of tomatoes has been picked. First, select the tomato stock.',
      checks: [{ type: 'selectionEquals', range: 'B4' }],
      hints: ['Find Tomatoes in column A.', 'Stock (kg) is column B.', 'Tomatoes are in row 4. Select B4.'],
      explain: 'B4 holds the tomato stock: row 4, column B.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'B4', say: 'Tomatoes are in row 4. Stock is column B.' }],
    },
    {
      id: 'xl.u0.l2.e2',
      type: 'grid-task',
      skill: TYPE,
      apply: true,
      sheet: corrected,
      // Carries on from the step before: the cell that was found is still selected.
      select: 'B4',
      prompt: 'Stock was 30 kg. Add the 50 kg just picked and enter the new total.',
      checks: [{ type: 'cellValue', cell: 'B4', equals: 80 }],
      hints: ['B4 is already selected.', '30 kg plus 50 kg is 80 kg.', 'Type 80, then press Enter.'],
      explain: 'The farm now has 80 kg of tomatoes. Typing over replaced the old figure of 30.',
      tips: ['You can type as soon as a cell is selected.', 'Nothing changes in the cell until you press Enter.'],
      solution: [
        { key: '8', say: 'B4 is selected. Type 80.' },
        { key: '0' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    {
      id: 'xl.u0.l2.e6',
      type: 'grid-task',
      skill: TYPE,
      apply: true,
      sheet: totalled,
      prompt: 'Apple stock has risen to 100 kg. Update it and watch the total.',
      checks: [{ type: 'cellValue', cell: 'B5', equals: 100 }],
      hints: ['Apple stock is in B5.', 'Select B5 and type 100.', 'Press Enter. The total changes from 385 to 405.'],
      explain: 'The total updated itself because B6 holds a formula. Formulas come in the next unit.',
      tips: [BASICS.free, BASICS.hint],
      solution: [
        { tap: 'B5', say: 'Select B5.' },
        { key: '1', say: 'Type 100.' },
        { key: '0' },
        { key: '0' },
        { key: 'enter', say: 'Enter. The total follows: 405.' },
      ],
    },
  ],
  practice: [
    {
      id: 'xl.u0.l2.p1',
      type: 'grid-task',
      skill: TYPE,
      sheet: purchases,
      prompt: 'The farm ordered 75 kg of potatoes. Enter 75 in the empty Ordered cell.',
      checks: [{ type: 'cellValue', cell: 'C3', equals: 75 }],
      hints: ['Find Potatoes in row 3.', 'Ordered (kg) is column C, so the cell is C3.', 'Select C3, type 75, then press Enter.'],
      explain: 'Select, type, Enter: the potato order is recorded in C3.',
      tips: [BASICS.tapTwice, BASICS.enter],
      solution: [
        { tap: 'C3', say: 'Select C3.' },
        { key: '7', say: 'Type 75.' },
        { key: '5' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    {
      id: 'xl.u0.l2.p2',
      type: 'grid-task',
      skill: TYPE,
      sheet: purchases,
      prompt: 'The tomato supplier now charges $4 per kg. Update the cost.',
      checks: [{ type: 'cellValue', cell: 'B4', equals: 4 }],
      hints: ['Find Tomatoes in row 4.', 'Cost per kg is column B, so the cell is B4.', 'Select B4, type 4, then press Enter.'],
      explain: 'Typing over the old cost replaced it with the new one.',
      tips: ['Currency format shows a number as dollars and cents.', BASICS.bar],
      solution: [
        { tap: 'B4', say: 'Select B4.' },
        { key: '4', say: 'Type 4.' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    {
      id: 'xl.u0.l2.p3',
      type: 'grid-task',
      skill: TYPE,
      sheet: withCells(purchases, { C4: 500 }),
      prompt: 'The tomato order was keyed as 500 kg. It should be 50. Correct it.',
      checks: [{ type: 'cellValue', cell: 'C4', equals: 50 }],
      hints: ['The tomato order is in C4.', 'Only the last 0 is wrong. Edit the entry, or type over it.', 'Tap C4 twice, press ⌫ once, then press Enter.'],
      explain: 'C4 now holds 50. Editing removed the extra 0 and kept the rest.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [
        { tap: 'C4', say: 'Select the tomato order.' },
        { tap: 'C4', say: 'Tap again to edit it.' },
        { key: 'backspace', say: 'Remove the extra 0.' },
        { key: 'enter', say: 'Enter confirms the correction.' },
      ],
    },
  ],
};
