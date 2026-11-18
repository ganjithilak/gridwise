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

const menu = lookup(['Item', 'Price'], [['Tea', 3], ['Cake', 5], ['Soup', 7], ['Pie', 4]], ['Find', 'Price'], ['Soup', 'Pie']);
const stockList = lookup(['Part', 'Stock'], [['Bolt', 40], ['Nut', 0], ['Gear', 15], ['Belt', 8]], ['Find', 'Stock'], ['Gear', 'Belt']);
const desks = lookup(['Name', 'Desk'], [['Ann', 12], ['Bo', 7], ['Cy', 3], ['Di', 9]], ['Desk', 'Who'], [7]);
const phones = lookup(['Name', 'Ext'], [['Raj', 204], ['Mei', 311], ['Tom', 118], ['Zoe', 450]], ['Find', 'Ext'], ['Tom', 'Zoe']);

export const lookItUp: Lesson = {
  id: 'xl.u2.l4',
  title: 'Look it up',
  summary: 'Find a row by one column and bring back another.',
  recap: [
    'A lookup finds a row by one column and brings back another.',
    'XLOOKUP asks: find what, look where, bring back from where.',
    'VLOOKUP works in every Excel. It counts columns from the left.',
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
          'XLOOKUP finds one thing, brings back another. Tap E2 twice.',
          'Tap XLOOKUP.',
          'What to find: the word in D2. Then a comma.',
          'Where to look for it: from the first Item...',
          '...to the last. Then a comma.',
          'Where the answer is: from the first Price...',
          '...to the last.',
          'Enter. Soup is in row 4, so it brings back 7.',
        ],
      }),
      prompt: 'Your turn. Look up the price of the item in D3, in E3.',
      cell: 'E3',
      formula: '=XLOOKUP(D3,A2:A5,B2:B5)',
      uses: 'XLOOKUP',
      hints: ['Three parts: what to find, where to look, where the answer is.', 'XLOOKUP , D3 , comma , the Items , comma , the Prices'],
      explain: 'It found Pie in the Items and brought back the Price beside it: 4.',
      tips: ['A lookup finds a row by one column and reads another from it.', 'XLOOKUP asks: find what, look where, bring back from where.'],
    }),
    task({
      id: 'xl.u2.l4.e2',
      skill: XLOOKUP,
      sheet: stockList,
      prompt: 'New sheet: a parts list. Look up the Stock of the part in D2.',
      cell: 'E2',
      formula: '=XLOOKUP(D2,A2:A5,B2:B5)',
      uses: 'XLOOKUP',
      hints: ['Find the part name in the Part column, bring back its Stock.', 'XLOOKUP , D2 , comma , the Parts , comma , the Stock numbers'],
      explain: 'Gear is the third part, so XLOOKUP brings back its Stock: 15.',
      tips: ['The two ranges in XLOOKUP must be the same length.', FORMULAS.bracket],
    }),
    demo({
      id: 'xl.u2.l4.e3',
      skill: VLOOKUP,
      sheet: menu,
      script: typing('E2', '=VLOOKUP(D2,A2:B5,2,FALSE)', {
        says: [
          'Older versions of Excel use VLOOKUP instead. Tap E2 twice.',
          'Tap VLOOKUP.',
          'What to find: the word in D2. Then a comma.',
          'The whole table this time: from its first cell...',
          '...to its last. Then 2: the answer is in the 2nd column.',
          'FALSE means "only an exact match".',
          'Enter. It found Soup and read across to column 2: 7.',
        ],
      }),
      prompt: 'Your turn. Use VLOOKUP for the item in D3, in E3.',
      cell: 'E3',
      formula: '=VLOOKUP(D3,A2:B5,2,FALSE)',
      uses: 'VLOOKUP',
      hints: ['Four parts: what to find, the whole table, which column, FALSE.', 'VLOOKUP , D3 , comma , A2 : B5 , comma , 2 , comma , FALSE'],
      explain: 'VLOOKUP found Pie in the first column and read the 2nd column: 4.',
      tips: ['VLOOKUP counts columns from the left of the table, starting at 1.', 'Always end VLOOKUP with FALSE, or it may guess a near match.'],
    }),
    task({
      id: 'xl.u2.l4.e4',
      skill: VLOOKUP,
      sheet: stockList,
      prompt: 'Look up the Stock of the part in D3, this time with VLOOKUP.',
      cell: 'E3',
      formula: '=VLOOKUP(D3,A2:B5,2,FALSE)',
      uses: 'VLOOKUP',
      moreChips: ['XLOOKUP'],
      hints: ['The table is both columns together, not just one.', 'VLOOKUP , D3 , comma , A2 : B5 , comma , 2 , comma , FALSE'],
      explain: 'Belt is in the table, and its 2nd column says 8.',
      tips: ['VLOOKUP always searches the first column of the table you give it.', FORMULAS.colon],
    }),
    choice({
      id: 'xl.u2.l4.e5',
      skill: VLOOKUP,
      prompt: 'XLOOKUP needs Excel 2021 or Microsoft 365. What do older versions use?',
      options: ['VLOOKUP', 'SUMIF', 'AutoSum'],
      right: 0,
      hints: ['It is the other lookup you have just used.', 'Its name starts with V, for "vertical".', 'It needs the whole table and a column number.'],
      explain: 'VLOOKUP works in every version of Excel, so it is still worth knowing.',
      tips: ['If nothing matches, a lookup shows #N/A.', BASICS.hint],
    }),
    task({
      id: 'xl.u2.l4.e6',
      skill: XLOOKUP,
      sheet: desks,
      prompt: 'Who sits at the desk in D2? Look in Desk, bring back Name.',
      cell: 'E2',
      formula: '=XLOOKUP(D2,B2:B5,A2:A5)',
      uses: 'XLOOKUP',
      hints: ['This time you look in the second column and answer from the first.', 'XLOOKUP , D2 , comma , the Desks , comma , the Names'],
      explain: 'XLOOKUP can bring back a column to the left. VLOOKUP cannot.',
      tips: ['XLOOKUP can look in any column and answer from any other.', FORMULAS.swap],
    }),
  ],
  practice: [
    task({
      id: 'xl.u2.l4.p1',
      skill: XLOOKUP,
      sheet: phones,
      prompt: 'Look up the extension of the person in D2, in E2.',
      cell: 'E2',
      formula: '=XLOOKUP(D2,A2:A5,B2:B5)',
      uses: 'XLOOKUP',
      hints: ['Three parts: what to find, where to look, where the answer is.', 'XLOOKUP , D2 , comma , the Names , comma , the Ext numbers'],
      explain: 'It found Tom in the Names and brought back his extension: 118.',
      tips: tipsFor(XLOOKUP),
    }),
    task({
      id: 'xl.u2.l4.p2',
      skill: VLOOKUP,
      sheet: phones,
      prompt: 'Look up the extension of the person in D3, with VLOOKUP.',
      cell: 'E3',
      formula: '=VLOOKUP(D3,A2:B5,2,FALSE)',
      uses: 'VLOOKUP',
      hints: ['Four parts: what to find, the whole table, which column, FALSE.', 'VLOOKUP , D3 , comma , A2 : B5 , comma , 2 , comma , FALSE'],
      explain: 'VLOOKUP found Zoe in the first column and read the 2nd: 450.',
      tips: tipsFor(VLOOKUP),
    }),
  ],
};
