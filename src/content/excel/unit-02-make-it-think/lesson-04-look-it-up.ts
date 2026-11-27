import type { CellInput, SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { choice, demo, task, typing } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const XLOOKUP = 'xl.xlookup';
const VLOOKUP = 'xl.vlookup';

const bold = { bold: true };

/**
 * A two-column list on the left, and on the right the things to look up (column D)
 * with a place for each answer (column E).
 */
function lookup(list: [string, string], rows: [CellInput, CellInput][], find: [string, string], wanted: CellInput[]): SheetSpec {
  return {
    cols: 5,
    rows: rows.length + 1,
    grid: [[list[0], list[1], '', find[0], find[1]], ...rows.map(([key, value], i) => [key, value, null, wanted[i] ?? null])],
    formats: { 'A1:E1': bold },
  };
}

/** The stall's price list per kilogram, and two products to price for an order. */
const menu = lookup(['Produce', 'Price'], [['Carrots', 3], ['Pears', 5], ['Tomatoes', 6], ['Apples', 4]], ['Find', 'Price'], ['Tomatoes', 'Apples']);
/** The seed shed: packets left of each seed. */
const stockList = lookup(['Seed', 'Packets'], [['Carrot', 40], ['Pea', 0], ['Bean', 15], ['Corn', 8]], ['Find', 'Packets'], ['Bean', 'Corn']);
/** Which picker is on which orchard row today. */
const desks = lookup(['Picker', 'Row'], [['Ana', 12], ['Ben', 7], ['Cy', 3], ['Dee', 9]], ['Row', 'Who'], [7]);
/** Practice on a different record: the feed supplier's price per bag. */
const phones = lookup(['Feed', 'Price'], [['Hay', 12], ['Oats', 9], ['Barley', 7], ['Wheat', 8]], ['Find', 'Price'], ['Barley', 'Wheat']);

export const lookItUp: Lesson = {
  id: 'xl.u2.l4',
  title: 'Look It Up',
  summary: 'Price an order from the stall’s list: find a row by one column, return another.',
  recap: [
    'A lookup finds a row by one column and returns a value from another.',
    'XLOOKUP asks: find what, look where, return from where.',
    'VLOOKUP works in every version of Excel. It counts columns from the left.',
  ],
  newSkills: [XLOOKUP, VLOOKUP],
  hideKeys: ['$'],
  exercises: [
    demo({
      id: 'xl.u2.l4.e1',
      skill: XLOOKUP,
      sheet: menu,
      script: typing('E2', '=XLOOKUP(D2,A2:A5,B2:B5)', {
        says: [
          'An order needs the tomato price. Select E2.',
          'XLOOKUP finds one value and returns another.',
          'What to find: the text in D2. Then a comma.',
          'Where to look: from the first product...',
          '...to the last. Then a comma.',
          'Where the answer is: from the first price...',
          '...to the last.',
          'Enter. Tomatoes are in row 4: it returns 6.',
        ],
      }),
      prompt: 'Your turn. Look up the price of the product in D3, in E3.',
      cell: 'E3',
      formula: '=XLOOKUP(D3,A2:A5,B2:B5)',
      uses: 'XLOOKUP',
      hints: ['Three parts: what to find, where to look, where the answer is.', 'XLOOKUP , D3 , comma , the products , comma , the prices'],
      explain: 'It found Apples in the Produce column and returned the price beside it: 4.',
      tips: ['A lookup finds a row by one column and reads another from it.', 'XLOOKUP asks: find what, look where, return from where.'],
    }),
    task({
      id: 'xl.u2.l4.e2',
      skill: XLOOKUP,
      sheet: stockList,
      prompt: 'The seed shed. Look up how many packets are left of the seed in D2.',
      cell: 'E2',
      formula: '=XLOOKUP(D2,A2:A5,B2:B5)',
      uses: 'XLOOKUP',
      hints: ['Find the seed in the Seed column, return its Packets.', 'XLOOKUP , D2 , comma , the Seeds , comma , the Packets'],
      explain: 'Bean is the third seed, so XLOOKUP returns its packets: 15.',
      tips: ['The two ranges in XLOOKUP must be the same length.', FORMULAS.bracket],
    }),
    demo({
      id: 'xl.u2.l4.e3',
      skill: VLOOKUP,
      sheet: menu,
      script: typing('E2', '=VLOOKUP(D2,A2:B5,2,FALSE)', {
        says: [
          'Older versions of Excel use VLOOKUP. Select E2.',
          'Tap VLOOKUP.',
          'What to find: the text in D2. Then a comma.',
          'The whole table this time: its first cell...',
          '...to its last. Then 2: the 2nd column.',
          'FALSE means “only an exact match”.',
          'Enter. It found Tomatoes and read column 2: 6.',
        ],
      }),
      prompt: 'Your turn. Use VLOOKUP for the product in D3, in E3.',
      cell: 'E3',
      formula: '=VLOOKUP(D3,A2:B5,2,FALSE)',
      uses: 'VLOOKUP',
      hints: ['Four parts: what to find, the whole table, which column, FALSE.', 'VLOOKUP , D3 , comma , A2 : B5 , comma , 2 , comma , FALSE'],
      explain: 'VLOOKUP found Apples in the first column and read the 2nd column: 4.',
      tips: ['VLOOKUP counts columns from the left of the table, starting at 1.', 'End VLOOKUP with FALSE, or it may return a near match.'],
    }),
    task({
      id: 'xl.u2.l4.e4',
      skill: VLOOKUP,
      sheet: stockList,
      prompt: 'Look up the packets left of the seed in D3, this time with VLOOKUP.',
      cell: 'E3',
      formula: '=VLOOKUP(D3,A2:B5,2,FALSE)',
      uses: 'VLOOKUP',
      moreChips: ['XLOOKUP'],
      hints: ['The table is both columns together, not just one.', 'VLOOKUP , D3 , comma , A2 : B5 , comma , 2 , comma , FALSE'],
      explain: 'Corn is in the table, and its 2nd column says 8.',
      tips: ['VLOOKUP always searches the first column of the table you give it.', FORMULAS.colon],
    }),
    choice({
      id: 'xl.u2.l4.e5',
      skill: VLOOKUP,
      prompt: 'XLOOKUP needs Excel 2021 or Microsoft 365. What do older versions use?',
      options: ['VLOOKUP', 'SUMIF', 'AutoSum'],
      right: 0,
      hints: ['It is the other lookup you have just used.', 'Its name starts with V, for “vertical”.', 'It needs the whole table and a column number.'],
      explain: 'VLOOKUP works in every version of Excel, so it is still worth knowing.',
      tips: ['If nothing matches, a lookup shows #N/A.', BASICS.hint],
    }),
    task({
      id: 'xl.u2.l4.e6',
      skill: XLOOKUP,
      sheet: desks,
      prompt: 'Who is picking orchard row 7? Look in Row, return the Picker.',
      cell: 'E2',
      formula: '=XLOOKUP(D2,B2:B5,A2:A5)',
      uses: 'XLOOKUP',
      hints: ['This time, look in the second column and answer from the first.', 'XLOOKUP , D2 , comma , the Rows , comma , the Pickers'],
      explain: 'Ben is on row 7. XLOOKUP can return a column to the left; VLOOKUP cannot.',
      tips: ['XLOOKUP can look in any column and answer from any other.', FORMULAS.swap],
    }),
  ],
  practice: [
    task({
      id: 'xl.u2.l4.p1',
      skill: XLOOKUP,
      sheet: phones,
      prompt: 'Look up the price of the feed in D2, in E2.',
      cell: 'E2',
      formula: '=XLOOKUP(D2,A2:A5,B2:B5)',
      uses: 'XLOOKUP',
      hints: ['Three parts: what to find, where to look, where the answer is.', 'XLOOKUP , D2 , comma , the feeds , comma , the prices'],
      explain: 'It found Barley and returned its price per bag: 7.',
      tips: tipsFor(XLOOKUP),
    }),
    task({
      id: 'xl.u2.l4.p2',
      skill: VLOOKUP,
      sheet: phones,
      prompt: 'Look up the price of the feed in D3, with VLOOKUP.',
      cell: 'E3',
      formula: '=VLOOKUP(D3,A2:B5,2,FALSE)',
      uses: 'VLOOKUP',
      hints: ['Four parts: what to find, the whole table, which column, FALSE.', 'VLOOKUP , D3 , comma , A2 : B5 , comma , 2 , comma , FALSE'],
      explain: 'VLOOKUP found Wheat in the first column and read the 2nd: 8.',
      tips: tipsFor(VLOOKUP),
    }),
  ],
};
