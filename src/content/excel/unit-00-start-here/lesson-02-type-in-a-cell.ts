import type { Lesson } from '@/lessons/types';

import { choice, table, withCells } from '../build';
import { BASICS } from '../tips';

const TYPE = 'xl.cell.type';
/** Taught in the lesson before. Here it is the first half of a real task: find the cell, then change it. */
const ADDRESS = 'xl.cell.address';

const money = { numFmt: 'currency' as const };

/** A shop's price list, with what each item costs shown as money. */
const list = {
  ...table(
    ['Item', 'Cost', 'Bought'],
    [
      ['Milk', 2, null],
      ['Bread', 3, 1],
      ['Eggs', 4, 2],
      ['Tea', 5, null],
    ],
  ),
};
list.formats = { ...list.formats, 'B2:B5': money };

const totalled = withCells({ ...list, rows: 6, formats: { ...list.formats, A6: { bold: true }, B6: money } }, { A6: 'Total', B6: '=SUM(B2:B5)' });

const tools = {
  ...table(
    ['Tool', 'Cost', 'Owned'],
    [
      ['Saw', 9, 1],
      ['Drill', 40, null],
      ['Tape', 3, 2],
    ],
  ),
};
tools.formats = { ...tools.formats, 'B2:B4': money };

/** What a cell can hold, and putting numbers into cells and changing them: the last step before formulas. */
export const typeInACell: Lesson = {
  id: 'xl.u0.l2',
  title: 'Type in a cell',
  summary: 'What a cell can hold, and how to put a number in one or change it.',
  recap: [
    'A cell can hold words, numbers or money.',
    'Tap a cell once to select it, and again to type in it. Enter keeps it.',
    'To change a cell, delete what is there, then type the new value.',
  ],
  newSkills: [TYPE],
  // Formulas come next. For now the keyboard is just numbers.
  hideKeys: ['=', '+', '-', '*', '/', '(', ')', ':', ',', '$', 'SUM'],
  exercises: [
    {
      id: 'xl.u0.l2.e1',
      type: 'demo',
      skill: TYPE,
      sheet: list,
      script: [
        { tap: 'A2', say: 'You can select a cell. Now, what can you enter into one?' },
        { tap: 'A3', say: 'A cell can hold words, like the name of an item.' },
        { tap: 'C3', say: 'Or a number, like a quantity.' },
        { tap: 'B3', say: 'Or currency. This sheet shows costs as money.' },
        { tap: 'C2', say: 'To enter something, select the cell...' },
        { tap: 'C2', say: '...then tap it again and the keyboard opens.' },
        { key: '3', say: 'Type a number.' },
        { key: 'enter', say: 'Enter puts it in the cell.' },
      ],
      prompt: 'Your turn. Put 1 in C5.',
      checks: [{ type: 'cellValue', cell: 'C5', equals: 1 }],
      hints: ['C5 is the empty cell next to Tea.', 'Tap C5 twice, type 1, then press Enter.', 'The cell should show 1.'],
      explain: 'Tap, tap, type, Enter. That is how everything gets into a cell.',
      tips: [BASICS.tapTwice, BASICS.enter],
      solution: [
        { tap: 'C5', say: 'Tap C5, then tap it again to type.' },
        { tap: 'C5' },
        { key: '1', say: 'Type 1.' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    {
      id: 'xl.u0.l2.e3',
      type: 'grid-task',
      skill: TYPE,
      sheet: list,
      prompt: 'You bought a dozen Eggs. Change C4 to 12.',
      checks: [{ type: 'cellValue', cell: 'C4', equals: 12 }],
      hints: ['C4 is in the Bought column, next to Eggs.', 'Tap C4 twice, delete the 2, then type 1 and 2.', 'The cell should show 12.'],
      explain: 'A number can have as many digits as you like. Type them one after another.',
      tips: [BASICS.bar, 'Nothing goes into the cell until you press Enter.'],
      solution: [
        { tap: 'C4', say: 'Tap C4, then tap it again to type.' },
        { tap: 'C4' },
        { key: 'backspace', say: 'Delete the 2.' },
        { key: '1', say: 'Type 1, then 2.' },
        { key: '2' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    {
      id: 'xl.u0.l2.e4',
      type: 'grid-task',
      skill: TYPE,
      sheet: list,
      prompt: 'Milk goes up to $2.50. Find its cost and change it to 2.5.',
      checks: [{ type: 'cellValue', cell: 'B2', equals: 2.5 }],
      hints: ['The cost of Milk is in B2. The point is the . key, next to 0.', 'Tap B2 twice, delete the 2, then type 2 . 5', 'The cell should show $2.50.'],
      explain: 'The . key makes a decimal point. The sheet adds the $ and the last 0.',
      tips: ['A decimal point is the . key, next to 0.', 'Numbers line up on the right of a cell. Words line up on the left.'],
      solution: [
        { tap: 'B2', say: 'Tap B2, then tap it again to type.' },
        { tap: 'B2' },
        { key: 'backspace', say: 'Delete the old cost.' },
        { key: '2', say: 'Type 2, the point, then 5.' },
        { key: '.' },
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
      sheet: list,
      prompt: 'New financial year: our supplier has raised the cost of Bread. Select its cost.',
      checks: [{ type: 'selectionEquals', range: 'B3' }],
      hints: ['Find Bread in column A, then look along its row.', 'Cost is column B. Bread is in row 3.', 'Select the $3.00 next to Bread. That cell is B3.'],
      praise: 'Well done!',
      explain: "You've selected B3: the cell that holds the cost of Bread.",
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'B3', say: 'Bread is in row 3. Cost is column B. So: B3.' }],
    },
    {
      id: 'xl.u0.l2.e2',
      type: 'grid-task',
      skill: TYPE,
      apply: true,
      sheet: list,
      // Carries on from the step before: the cell that was found is still selected.
      select: 'B3',
      prompt: 'The new cost is $4. Now change the value in cell B3 to $4.',
      checks: [{ type: 'cellValue', cell: 'B3', equals: 4 }],
      hints: ['B3 is already selected. Tap it to start typing.', 'Delete the 3 with ⌫, then type 4. The $ is added for you.', 'Finish with Enter. The cell should show $4.00.'],
      praise: 'Excellent work!',
      explain: "You've successfully updated the cost of Bread to $4.",
      tips: [BASICS.backspace, 'Typing in a cell that is full keeps what is there. ⌫ clears it.'],
      solution: [
        { tap: 'B3', say: 'B3 is already selected. Tap it again to type.' },
        { key: 'backspace', say: 'Delete the old number.' },
        { key: '4', say: 'Type the new one.' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    {
      id: 'xl.u0.l2.e6',
      type: 'grid-task',
      skill: TYPE,
      apply: true,
      sheet: totalled,
      prompt: 'Tea goes up to $9. Change its cost, and watch the Total.',
      checks: [{ type: 'cellValue', cell: 'B5', equals: 9 }],
      hints: ['B5 holds the cost of Tea.', 'Tap B5 twice, delete the 5, type 9, press Enter.', 'The Total should change from $14.00 to $18.00.'],
      explain: 'The Total changed by itself. It is a formula, and you will write your own next.',
      tips: [BASICS.free, BASICS.hint],
      solution: [
        { tap: 'B5', say: 'Tap B5, then tap it again to type.' },
        { tap: 'B5' },
        { key: 'backspace', say: 'Delete the 5.' },
        { key: '9', say: 'Type 9.' },
        { key: 'enter', say: 'Enter. The Total follows: $18.00.' },
      ],
    },
  ],
  practice: [
    {
      id: 'xl.u0.l2.p1',
      type: 'grid-task',
      skill: TYPE,
      sheet: tools,
      prompt: 'You now own a Drill. Put 1 in C3.',
      checks: [{ type: 'cellValue', cell: 'C3', equals: 1 }],
      hints: ['C3 is the empty cell next to Drill.', 'Tap C3 twice, type 1, then press Enter.', 'The cell should show 1.'],
      explain: 'Tap, tap, type, Enter.',
      tips: [BASICS.tapTwice, BASICS.enter],
      solution: [
        { tap: 'C3', say: 'Tap C3, then tap it again to type.' },
        { tap: 'C3' },
        { key: '1', say: 'Type 1.' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    {
      id: 'xl.u0.l2.p2',
      type: 'grid-task',
      skill: TYPE,
      sheet: tools,
      prompt: 'The Saw is on sale for $7. Find its cost and change it.',
      checks: [{ type: 'cellValue', cell: 'B2', equals: 7 }],
      hints: ['B2 holds the cost of the Saw.', 'Tap B2 twice, delete the 9, then type 7.', 'The cell should show $7.00.'],
      explain: 'Delete the old number first, then type the new one.',
      tips: [BASICS.backspace, BASICS.bar],
      solution: [
        { tap: 'B2', say: 'Tap B2, then tap it again to type.' },
        { tap: 'B2' },
        { key: 'backspace', say: 'Delete the 9.' },
        { key: '7', say: 'Type 7.' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    {
      id: 'xl.u0.l2.p3',
      type: 'grid-task',
      skill: ADDRESS,
      sheet: tools,
      prompt: 'The Drill has a new price. Select the cell with its cost.',
      checks: [{ type: 'selectionEquals', range: 'B3' }],
      hints: ['Find Drill in column A, then look along its row.', 'Cost is column B. Drill is in row 3.', 'Select the $40.00 next to Drill. That cell is B3.'],
      explain: 'Drill is in row 3 and Cost is column B, so the cell is B3.',
      tips: [BASICS.labels, BASICS.headings],
      solution: [{ tap: 'B3', say: 'Drill is in row 3. Cost is column B. So: B3.' }],
    },
  ],
};
