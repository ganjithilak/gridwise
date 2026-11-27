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

/** Minutes each picker took to fill a bin this morning: the smallest is the fastest. */
const race = answers(['Picker', 'Minutes'], [['Kim', 52], ['Lee', 47], ['Mo', 61], ['Nia', 49]], ['Fastest', 'Slowest', 'How many']);
/** The stall's price list, as the Roots lessons left it. */
const shop = answers(['Produce', 'Price per kg'], [['Carrots', 3], ['Potatoes', 2.75], ['Tomatoes', 6], ['Apples', 4.5]], ['Cheapest', 'Dearest', 'How many']);
shop.formats = { ...shop.formats, 'B2:B5': { numFmt: 'currency' }, 'D2:D3': { numFmt: 'currency' } };
/** Practice on a different record: the orchard's afternoon temperature. */
const temps = answers(['Day', 'Orchard (°C)'], [['Mon', 14], ['Tue', 19], ['Wed', 11], ['Thu', 16]], ['Coolest', 'Warmest', 'How many']);

/** The wholesale customers' orders. Some have paid and some have not: the empty cells are the point. */
const orders = table(
  ['Customer', 'Paid', 'Deposit'],
  [
    ['River Cafe', 120, 20],
    ['Hill Market', null, null],
    ['Town Grocer', 300, 50],
    ['Bay Deli', 80, null],
  ],
  { footer: 'How many' },
);

export const smallestBiggestCount: Lesson = {
  id: 'xl.u1.l3',
  title: 'Smallest, Biggest, How Many',
  summary: 'Find the stall’s cheapest and dearest prices, and count the orders paid.',
  recap: [
    'MIN finds the smallest number in a range. MAX finds the biggest.',
    'COUNT says how many cells hold a number.',
    'All three are written like SUM: the function name, then a range.',
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
          'Who filled a bin fastest? Select D2.',
          'MIN finds the smallest number: the fewest minutes.',
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
      hints: ['The slowest picker took the most minutes.', 'MAX, the first Minutes cell, : , the last Minutes cell.'],
      explain: 'MAX looks through B2 to B5 and finds the biggest: 61.',
      tips: ['MIN finds the smallest number. MAX finds the biggest.', FORMULAS.colon],
    }),
    task({
      id: 'xl.u1.l3.e2',
      skill: MINMAX,
      sheet: shop,
      prompt: 'The stall’s price list. Find the cheapest price in D2.',
      cell: 'D2',
      formula: '=MIN(B2:B5)',
      uses: 'MIN',
      moreChips: ['MAX'],
      hints: ['Cheapest means the smallest price.', 'MIN, the first Price cell, : , the last Price cell.'],
      explain: 'MIN finds the smallest of the four prices: $2.75, for potatoes.',
      tips: ['MIN and MAX give the number, not the name beside it.', FORMULAS.fn],
    }),
    demo({
      id: 'xl.u1.l3.e3',
      skill: COUNT,
      sheet: orders,
      script: typing('B6', '=COUNT(B2:B5)', {
        says: [
          'How many customers have paid? Select B6.',
          'COUNT says how many cells hold a number.',
          'Give it the Paid cells: the first...',
          '...through to the last.',
          'Enter: 3. The empty cell is not counted.',
        ],
      }),
      scriptChips: ['COUNT'],
      prompt: 'Your turn. Count how many customers paid a deposit, in C6.',
      cell: 'C6',
      formula: '=COUNT(C2:C5)',
      uses: 'COUNT',
      hints: ['Count the cells in the Deposit column that hold a number.', 'COUNT, the first Deposit cell, : , the last Deposit cell.'],
      explain: 'Two of the four Deposit cells hold a number, so COUNT gives 2.',
      tips: ['COUNT says how many cells have a number in them.', 'COUNT skips empty cells and cells that hold words.'],
    }),
    task({
      id: 'xl.u1.l3.e4',
      skill: COUNT,
      sheet: race,
      prompt: 'How many pickers have a time recorded? Count them in D4.',
      cell: 'D4',
      formula: '=COUNT(B2:B5)',
      uses: 'COUNT',
      moreChips: ['MIN', 'MAX'],
      hints: ['You want how many numbers there are, not how big they are.', 'COUNT, the first Minutes cell, : , the last Minutes cell.'],
      explain: 'All four Minutes cells hold a number, so COUNT gives 4.',
      tips: ['COUNT counts the cells. It does not add them.', BASICS.labels],
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
      explain: 'Slowest minus fastest: 61 - 47 = 14 minutes between them.',
      tips: ['Functions can be mixed with + and - in one formula.', FORMULAS.long],
    }),
    fix({
      id: 'xl.u1.l3.e6',
      skill: MINMAX,
      sheet: shop,
      prompt: 'D3 should show the dearest price, but it shows the cheapest. Correct it.',
      cell: 'D3',
      broken: '=MIN(B2:B5)',
      formula: '=MAX(B2:B5)',
      uses: 'MAX',
      moreChips: ['MIN'],
      hints: ['Dearest means the biggest price.', 'Select D3 and type the formula again with MAX. Typing replaces it.'],
      explain: 'MIN gave the cheapest, $2.75. MAX gives the dearest: $6, for tomatoes.',
      tips: ['Typing into a selected cell replaces its formula.', FORMULAS.check],
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
      hints: ['Warmest means the biggest number.', 'MAX, the first temperature, : , the last one.'],
      explain: 'MAX finds the biggest of the four: 19 °C, on Tuesday.',
      tips: tipsFor(MINMAX),
    }),
    task({
      id: 'xl.u1.l3.p2',
      skill: COUNT,
      sheet: temps,
      prompt: 'How many days have a temperature recorded? Count them in D4.',
      cell: 'D4',
      formula: '=COUNT(B2:B5)',
      uses: 'COUNT',
      moreChips: ['MAX'],
      hints: ['You want how many numbers there are.', 'COUNT, the first temperature, : , the last one.'],
      explain: 'Four cells hold a number, so COUNT gives 4.',
      tips: tipsFor(COUNT),
    }),
  ],
};
