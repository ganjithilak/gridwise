import type { SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { demo, fix, predict, table, task, typing } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const MINMAX = 'xl.minmax';
const COUNT = 'xl.count';

const bold = { bold: true };

/** Numbers down column B, questions in C, and a place for each answer in D. */
function answers(heading: [string, string], rows: [string, number][], questions: string[]): SheetSpec {
  return {
    cols: 4,
    rows: rows.length + 1,
    grid: [[heading[0], heading[1], '', 'Answer'], ...rows.map(([label, value], i) => [label, value, questions[i] ?? null])],
    formats: { 'A1:D1': bold },
  };
}

const race = answers(['Runner', 'Time'], [['Kim', 52], ['Lee', 47], ['Mo', 61], ['Nia', 49]], ['Fastest', 'Slowest', 'How many']);
const shop = answers(['Item', 'Price'], [['Tea', 3], ['Cake', 5], ['Soup', 7], ['Pie', 4]], ['Cheapest', 'Dearest', 'How many']);
const temps = answers(['Day', 'Temp'], [['Mon', 14], ['Tue', 19], ['Wed', 11], ['Thu', 16]], ['Coldest', 'Warmest', 'How many']);

/** Some orders have been paid and some have not: the empty cells are the point. */
const orders = table(
  ['Order', 'Paid', 'Tip'],
  [
    ['Ann', 12, 2],
    ['Bo', null, null],
    ['Cy', 30, 5],
    ['Di', 8, null],
  ],
  { footer: 'How many' },
);

export const smallestBiggestCount: Lesson = {
  id: 'xl.u1.l3',
  title: 'Smallest, biggest, how many',
  summary: 'MIN, MAX and COUNT answer three everyday questions.',
  recap: [
    'MIN finds the smallest number in a range. MAX finds the biggest.',
    'COUNT says how many cells hold a number.',
    'All three are written the same way: the name, then a range.',
  ],
  newSkills: [MINMAX, COUNT],
  hideKeys: ['$', ','],
  exercises: [
    demo({
      id: 'xl.u1.l3.e1',
      skill: MINMAX,
      sheet: race,
      script: typing('D2', '=MIN(B2:B5)', {
        says: [
          'Who was fastest? That is the smallest time. Tap D2 twice.',
          'MIN finds the smallest number.',
          'Give it the times: the first...',
          '...through to the last.',
          'Enter. The smallest time is 47.',
        ],
      }),
      scriptChips: ['MIN'],
      prompt: 'Your turn. Find the slowest time in D3 with MAX.',
      cell: 'D3',
      formula: '=MAX(B2:B5)',
      uses: 'MAX',
      hints: ['The slowest runner has the biggest time.', 'MAX, the first Time cell, : , the last Time cell.'],
      explain: 'MAX looks through B2 to B5 and picks the biggest: 61.',
      tips: ['MIN finds the smallest number. MAX finds the biggest.', FORMULAS.colon],
    }),
    task({
      id: 'xl.u1.l3.e2',
      skill: MINMAX,
      sheet: shop,
      prompt: 'New sheet: a cafe menu. Find the cheapest price in D2.',
      cell: 'D2',
      formula: '=MIN(B2:B5)',
      uses: 'MIN',
      moreChips: ['MAX'],
      hints: ['Cheapest means the smallest price.', 'MIN, the first Price cell, : , the last Price cell.'],
      explain: 'MIN picks the smallest of the four prices: 3, for Tea.',
      tips: ['MIN and MAX give you the number, not the name next to it.', FORMULAS.fn],
    }),
    demo({
      id: 'xl.u1.l3.e3',
      skill: COUNT,
      sheet: orders,
      script: typing('B6', '=COUNT(B2:B5)', {
        says: [
          'How many orders have been paid? Tap B6 twice.',
          'COUNT says how many cells hold a number.',
          'Give it the Paid cells: the first...',
          '...through to the last.',
          'Enter. Three have a number. The empty one is not counted.',
        ],
      }),
      scriptChips: ['COUNT'],
      prompt: 'Your turn. Count how many orders left a Tip, in C6.',
      cell: 'C6',
      formula: '=COUNT(C2:C5)',
      uses: 'COUNT',
      hints: ['Count the cells in the Tip column that hold a number.', 'COUNT, the first Tip cell, : , the last Tip cell.'],
      explain: 'Two of the four Tip cells hold a number, so COUNT gives 2.',
      tips: ['COUNT says how many cells have a number in them.', 'COUNT skips empty cells and cells that hold words.'],
    }),
    task({
      id: 'xl.u1.l3.e4',
      skill: COUNT,
      sheet: race,
      prompt: 'How many runners have a time? Count them in D4.',
      cell: 'D4',
      formula: '=COUNT(B2:B5)',
      uses: 'COUNT',
      moreChips: ['MIN', 'MAX'],
      hints: ['You want how many numbers there are, not how big they are.', 'COUNT, the first Time cell, : , the last Time cell.'],
      explain: 'All four Time cells hold a number, so COUNT gives 4.',
      tips: ['COUNT is not SUM. It counts the cells, it does not add them.', BASICS.labels],
    }),
    predict({
      id: 'xl.u1.l3.e5',
      skill: MINMAX,
      sheet: race,
      prompt: 'This formula is in D5. What will it show?',
      cell: 'D5',
      formula: '=MAX(B2:B5)-MIN(B2:B5)',
      options: ['14', '61', '47', '108'],
      hints: ['Work out each half first.', 'The biggest time is 61 and the smallest is 47.', '61 take away 47.'],
      explain: 'Biggest minus smallest: 61 - 47 = 14. That gap is called the range.',
      tips: ['Functions can be mixed with + and - in one formula.', FORMULAS.long],
    }),
    fix({
      id: 'xl.u1.l3.e6',
      skill: MINMAX,
      sheet: shop,
      prompt: 'D3 should show the dearest price, but it shows the cheapest. Fix it.',
      cell: 'D3',
      broken: '=MIN(B2:B5)',
      formula: '=MAX(B2:B5)',
      uses: 'MAX',
      moreChips: ['MIN'],
      hints: ['Dearest means the biggest price.', 'Delete the formula with ⌫, then build it again with MAX.'],
      explain: 'MIN gave the cheapest, 3. MAX gives the dearest: 7, for Soup.',
      tips: ['To change a formula, tap its cell twice and use ⌫.', FORMULAS.check],
    }),
  ],
  practice: [
    task({
      id: 'xl.u1.l3.p1',
      skill: MINMAX,
      sheet: temps,
      prompt: 'Find the warmest temperature in D3.',
      cell: 'D3',
      formula: '=MAX(B2:B5)',
      uses: 'MAX',
      moreChips: ['MIN'],
      hints: ['Warmest means the biggest number.', 'MAX, the first Temp cell, : , the last Temp cell.'],
      explain: 'MAX picks the biggest of the four: 19, on Tue.',
      tips: tipsFor(MINMAX),
    }),
    task({
      id: 'xl.u1.l3.p2',
      skill: COUNT,
      sheet: temps,
      prompt: 'How many days have a temperature? Count them in D4.',
      cell: 'D4',
      formula: '=COUNT(B2:B5)',
      uses: 'COUNT',
      moreChips: ['MAX'],
      hints: ['You want how many numbers there are.', 'COUNT, the first Temp cell, : , the last Temp cell.'],
      explain: 'Four cells hold a number, so COUNT gives 4.',
      tips: tipsFor(COUNT),
    }),
  ],
};
