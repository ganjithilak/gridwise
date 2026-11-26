import type { Lesson } from '@/lessons/types';

import { choice, table, withCells } from '../build';
import { BASICS } from '../tips';

const TYPE = 'xl.cell.type';
/** Taught in the lesson before. Here it is the first half of a real task: find the cell, then change it. */
const ADDRESS = 'xl.cell.address';

const money = { numFmt: 'currency' as const };

/**
 * Golden Apples Farm's inventory after a busy month at the stall. Lesson 0 left 60 kg of
 * carrots, 120 kg of potatoes and 30 kg of tomatoes at the farm; apples arrived with the fruit.
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

// Each task opens on the sheet as the task before left it, so the learner's own updates stay.
/** After the demonstration (10 kg of potatoes sold) and the carrot delivery. */
const carrotsIn = withCells(inventory, { B2: 115, B3: 110 });
/** After the carrot price rise. */
const carrotPrice = withCells(carrotsIn, { C2: 3 });
/** After the potato special. */
const potatoPrice = withCells(carrotPrice, { C3: 2.75 });
/** After the tomato harvest, with a total added at the bottom. */
const totalled = withCells(
  { ...potatoPrice, rows: 6, formats: { ...potatoPrice.formats, A6: { bold: true }, B6: { bold: true } } },
  { B4: 80, A6: 'Total stock (kg)', B6: '=SUM(B2:B5)' },
);

/** What the farm buys from its suppliers. */
const purchases = table(
  ['Product', 'Cost per kg', 'Ordered (kg)'],
  [
    ['Carrots', 3, 100],
    ['Potatoes', 2, null],
    ['Tomatoes', 5, 50],
  ],
);
purchases.formats = { ...purchases.formats, 'B2:B4': money };

/** What a cell can hold, and putting numbers into cells and changing them: the last step before formulas. */
export const typeInACell: Lesson = {
  id: 'xl.u0.l2',
  title: 'Entering Data',
  summary: 'Enter, update and correct information at Golden Apples Farm.',
  recap: [
    'Cells can hold words, numbers and money.',
    'Tap a cell twice to type in it. ⌫ deletes one character at a time.',
    'Press Enter to keep a change. The ✕ in the bar cancels it.',
  ],
  newSkills: [TYPE],
  // Formulas come next. For now the keyboard is just numbers.
  hideKeys: ['=', '+', '-', '*', '/', '(', ')', ':', ',', '$', 'SUM'],
  exercises: [
    {
      id: 'xl.u0.l2.e1',
      type: 'demo',
      skill: TYPE,
      sheet: inventory,
      script: [
        { tap: 'A2', say: 'Welcome back! The stall sold a lot this month.' },
        { tap: 'B2', say: 'Only 15 kg of carrots are left. More are on order.' },
        { tap: 'A3', say: 'A cell can hold words, like a product name.' },
        { tap: 'B3', say: 'Or a number, like kilograms in stock.' },
        { tap: 'C3', say: 'Or money, like the price per kg.' },
        { tap: 'B3', say: 'We sold 10 kg of potatoes, so their stock changes.' },
        { tap: 'B3', say: 'Tap it again to type. The keyboard opens.' },
        { key: 'backspace', say: '⌫ deletes one digit. Press it until the cell is empty.' },
        { key: 'backspace' },
        { key: 'backspace' },
        { key: '1', say: 'Type the new number: 110.' },
        { key: '1' },
        { key: '0' },
        { key: 'enter', say: 'Enter keeps it in the cell.' },
      ],
      prompt: 'Your turn. 100 kg of carrots arrived. Change their stock from 15 to 115.',
      checks: [{ type: 'cellValue', cell: 'B2', equals: 115 }],
      hints: ['Carrot stock is in B2.', 'Tap B2 twice. Press ⌫ twice to clear the 15.', 'Type 115, then press Enter. The cell should show 115.'],
      praise: 'Excellent work!',
      explain: 'Golden Apples Farm now has 115 kg of carrots in stock.',
      tips: [BASICS.tapTwice, BASICS.enter],
      solution: [
        { tap: 'B2', say: 'Tap B2, then tap it again to type.' },
        { tap: 'B2' },
        { key: 'backspace', say: 'Press ⌫ twice to clear the 15.' },
        { key: 'backspace' },
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
      prompt: 'Carrots cost us more this season. Raise their price to $3 per kg.',
      checks: [{ type: 'cellValue', cell: 'C2', equals: 3 }],
      hints: ['Find Carrots in column A.', 'Price per kg is column C. Tap C2 twice.', 'Press ⌫ three times to clear 2.5, type 3, then press Enter.'],
      explain: 'Carrots now sell for $3.00 a kg. The money format adds the $ and the .00.',
      tips: ['⌫ deletes one character at a time.', BASICS.bar],
      solution: [
        { tap: 'C2', say: 'Tap C2, then tap it again to type.' },
        { tap: 'C2' },
        { key: 'backspace', say: 'Press ⌫ three times to clear 2.5.' },
        { key: 'backspace' },
        { key: 'backspace' },
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
      hints: ['Potatoes are in row 3.', 'Their price is in column C.', 'Tap C3 twice, press ⌫, type 2.75, then press Enter.'],
      explain: 'The . key makes a decimal point. The cell shows $2.75.',
      tips: ['A decimal point is the . key, next to 0.', 'Money format shows a number as dollars and cents.'],
      solution: [
        { tap: 'C3', say: 'Tap C3, then tap it again to type.' },
        { tap: 'C3' },
        { key: 'backspace', say: 'Delete the old price.' },
        { key: '2', say: 'Type 2, the point, then 7 and 5.' },
        { key: '.' },
        { key: '7' },
        { key: '5' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    choice({
      id: 'xl.u0.l2.e5',
      skill: TYPE,
      prompt: 'You have typed a number. What puts it into the cell?',
      options: ['Pressing Enter', 'Waiting a moment', 'Tapping the ✕ in the bar'],
      right: 0,
      hints: ['It is a key on the keyboard.', 'It is the big key at the bottom right.', 'The ✕ does the opposite: it throws the typing away.'],
      explain: 'Enter keeps what you typed. The ✕ in the bar throws it away.',
      tips: ['The ✕ in the bar stops typing and leaves the cell as it was.', 'You can change a cell as often as you like.'],
    }),
    // Apply: one real task in two steps, as set out in the course brief. First find the
    // cell, then change it.
    {
      id: 'xl.u0.l2.e7',
      type: 'grid-task',
      skill: ADDRESS,
      apply: true,
      sheet: potatoPrice,
      prompt: 'We picked another 50 kg of tomatoes. Select the tomato stock.',
      checks: [{ type: 'selectionEquals', range: 'B4' }],
      hints: ['Find Tomatoes in column A.', 'Stock (kg) is column B.', 'Tomatoes are in row 4. Select B4.'],
      praise: 'Well done!',
      explain: 'You selected B4: the stock of tomatoes.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'B4', say: 'Tomatoes are in row 4. Stock is column B.' }],
    },
    {
      id: 'xl.u0.l2.e2',
      type: 'grid-task',
      skill: TYPE,
      apply: true,
      sheet: potatoPrice,
      // Carries on from the step before: the cell that was found is still selected.
      select: 'B4',
      prompt: 'We had 30 kg and picked 50 kg more. Change the stock to 80.',
      checks: [{ type: 'cellValue', cell: 'B4', equals: 80 }],
      hints: ['B4 is already selected. Tap it to start typing.', 'Press ⌫ twice to clear the 30, then type 80.', 'Finish with Enter. The cell should show 80.'],
      praise: 'Excellent work!',
      explain: 'Golden Apples Farm now has 80 kg of tomatoes in stock.',
      tips: [BASICS.backspace, 'Nothing goes into the cell until you press Enter.'],
      solution: [
        { tap: 'B4', say: 'B4 is already selected. Tap it again to type.' },
        { key: 'backspace', say: 'Press ⌫ twice to clear the 30.' },
        { key: 'backspace' },
        { key: '8', say: 'Type 80.' },
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
      prompt: 'We picked 20 kg more apples. Change their stock and watch the total.',
      checks: [{ type: 'cellValue', cell: 'B5', equals: 100 }],
      hints: ['Apple stock is in B5.', 'Tap B5 twice, press ⌫ twice, then type 100.', 'Press Enter. The total should change from 385 to 405.'],
      explain: 'The total changed by itself. It is a formula, and you will write your own soon.',
      tips: [BASICS.free, BASICS.hint],
      solution: [
        { tap: 'B5', say: 'Tap B5, then tap it again to type.' },
        { tap: 'B5' },
        { key: 'backspace', say: 'Press ⌫ twice to clear the 80.' },
        { key: 'backspace' },
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
      prompt: 'We ordered 75 kg of potatoes. Put 75 in the empty Ordered cell.',
      checks: [{ type: 'cellValue', cell: 'C3', equals: 75 }],
      hints: ['Find Potatoes in row 3.', 'Ordered (kg) is column C.', 'Tap C3 twice, type 75, then press Enter.'],
      explain: 'Tap, tap, type, Enter. The potato order is recorded.',
      tips: [BASICS.tapTwice, BASICS.enter],
      solution: [
        { tap: 'C3', say: 'Tap C3, then tap it again to type.' },
        { tap: 'C3' },
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
      prompt: 'The tomato supplier now charges $4 per kg. Change the cost to 4.',
      checks: [{ type: 'cellValue', cell: 'B4', equals: 4 }],
      hints: ['Find Tomatoes in row 4.', 'Cost per kg is column B.', 'Tap B4 twice, press ⌫ to clear the 5, then type 4.'],
      explain: 'Delete the old number first, then type the new one.',
      tips: ['⌫ deletes one character at a time.', BASICS.bar],
      solution: [
        { tap: 'B4', say: 'Tap B4, then tap it again to type.' },
        { tap: 'B4' },
        { key: 'backspace', say: 'Delete the 5.' },
        { key: '4', say: 'Type 4.' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    {
      id: 'xl.u0.l2.p3',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: purchases,
      prompt: 'Carrot costs are changing. Select the carrot cost cell.',
      checks: [{ type: 'selectionEquals', range: 'B2' }],
      hints: ['Carrots are in row 2.', 'Cost per kg is column B.', 'Select the $3.00 next to Carrots. That cell is B2.'],
      explain: 'Carrots are in row 2 and Cost per kg is column B, so the cell is B2.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'B2', say: 'Carrots are in row 2. Cost is column B. So: B2.' }],
    },
  ],
};
