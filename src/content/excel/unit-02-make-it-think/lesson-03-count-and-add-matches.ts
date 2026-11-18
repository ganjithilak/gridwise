import type { SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { demo, fix, predict, table, task, typing } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const COUNTIF = 'xl.countif';
const SUMIF = 'xl.sumif';

const bold = { bold: true };

/** Three orders and two questions about them, each with its own answer cell underneath. */
function orders(first: string, second: string): SheetSpec {
  return {
    cols: 2,
    rows: 6,
    grid: [['Region', 'Amount'], ['North', 120], ['South', 80], ['North', 200], [first], [second]],
    formats: { 'A1:B1': bold, 'A5:A6': bold },
  };
}

const sales = table(['Rep', 'Sales'], [['Ann', 120], ['Bo', 80], ['Cy', 200], ['Di', 50]], { footer: 'Over 100' });
const fruit = table(['Fruit', 'Kilos'], [['Apple', 4], ['Pear', 3], ['Apple', 6], ['Plum', 2]], { footer: 'Apple kilos' });
const pets = table(['Pet', 'Visits'], [['Cat', 2], ['Dog', 5], ['Cat', 1], ['Dog', 3]], { footer: 'Dogs' });
const petVisits = table(['Pet', 'Visits'], [['Cat', 2], ['Dog', 5], ['Cat', 1], ['Dog', 3]], { footer: 'Dog visits' });

export const countAndAddMatches: Lesson = {
  id: 'xl.u2.l3',
  title: 'Count and add what matches',
  summary: 'COUNTIF and SUMIF only look at the rows you ask for.',
  recap: [
    'COUNTIF counts the cells that match: where to look, what for.',
    'SUMIF adds the numbers on matching rows: it has a third part.',
    'A rule like ">100" goes in quote marks. Capitals do not matter.',
  ],
  newSkills: [COUNTIF, SUMIF],
  hideKeys: ['$'],
  exercises: [
    demo({
      id: 'xl.u2.l3.e1',
      skill: COUNTIF,
      sheet: orders('North orders', 'South orders'),
      script: typing('B5', '=COUNTIF(A2:A4,"North")', {
        says: [
          'COUNTIF counts only the cells that match. Tap B5 twice.',
          'Tap COUNTIF.',
          'Where to look: from the first Region...',
          '...to the last. Then a comma.',
          'What to look for.',
          'Enter. Two of the orders came from the North.',
        ],
      }),
      prompt: 'Your turn. Count the South orders in B6.',
      cell: 'B6',
      formula: '=COUNTIF(A2:A4,"South")',
      uses: 'COUNTIF',
      hints: ['Where to look, then what to look for.', 'COUNTIF , the Region cells , comma , "South"'],
      explain: 'Only one Region cell says South, so COUNTIF gives 1.',
      tips: ['COUNTIF needs two things: where to look, and what to look for.', BASICS.labels],
    }),
    task({
      id: 'xl.u2.l3.e2',
      skill: COUNTIF,
      sheet: sales,
      prompt: 'How many reps sold over 100? Count them in B6.',
      cell: 'B6',
      formula: '=COUNTIF(B2:B5,">100")',
      uses: 'COUNTIF',
      moreChips: ['"<100"'],
      hints: ['The rule goes in as one ready-made piece, quote marks and all.', 'COUNTIF , the Sales cells , comma , ">100"'],
      explain: 'Two of the four numbers are over 100: 120 and 200.',
      tips: ['A rule like ">100" goes inside quote marks, sign first.', FORMULAS.range],
    }),
    demo({
      id: 'xl.u2.l3.e3',
      skill: SUMIF,
      sheet: orders('North total', 'South total'),
      script: typing('B5', '=SUMIF(A2:A4,"North",B2:B4)', {
        says: [
          'SUMIF adds up only the rows that match. Tap B5 twice.',
          'Tap SUMIF.',
          'Where to look: from the first Region...',
          '...to the last. Then a comma.',
          'What to look for, and another comma.',
          'Then what to add up: from the first Amount...',
          '...to the last.',
          'Enter. The North orders come to 320.',
        ],
      }),
      prompt: 'Your turn. Add up the South orders in B6.',
      cell: 'B6',
      formula: '=SUMIF(A2:A4,"South",B2:B4)',
      uses: 'SUMIF',
      hints: ['Three parts: where to look, what for, and what to add up.', 'SUMIF , Regions , comma , "South" , comma , Amounts'],
      explain: 'Only one order is from the South, so the total is its 80.',
      tips: ['SUMIF needs a third thing: which numbers to add up.', 'COUNTIF counts rows. SUMIF adds up their numbers.'],
    }),
    task({
      id: 'xl.u2.l3.e4',
      skill: SUMIF,
      sheet: fruit,
      prompt: 'New sheet: a fruit stall. Add up the Kilos of Apple in B6.',
      cell: 'B6',
      formula: '=SUMIF(A2:A5,"Apple",B2:B5)',
      uses: 'SUMIF',
      hints: ['Look in the Fruit column, add from the Kilos column.', 'SUMIF , Fruits , comma , "Apple" , comma , Kilos'],
      explain: 'Apple appears twice, with 4 and 6 kilos: 10 in all.',
      tips: ['The cells to look in and the cells to add must be the same length.', FORMULAS.bracket],
    }),
    predict({
      id: 'xl.u2.l3.e5',
      skill: COUNTIF,
      sheet: table(['Fruit', 'Kilos', 'Answer'], [['Apple', 4], ['Pear', 3], ['Apple', 6], ['Plum', 2]]),
      prompt: 'This formula is in C2. What will it show?',
      cell: 'C2',
      formula: '=COUNTIF(A2:A5,"apple")',
      options: ['2', '10', '0', '4'],
      hints: ['COUNTIF counts cells. It does not add anything up.', 'Capital letters make no difference when matching words.', 'How many of the Fruit cells say Apple?'],
      explain: 'Two cells say Apple. Capitals do not matter, and COUNTIF counts, not adds.',
      tips: ['Matching words ignores capitals: north finds North.', FORMULAS.shows],
    }),
    fix({
      id: 'xl.u2.l3.e6',
      skill: COUNTIF,
      sheet: sales,
      prompt: 'B6 should count Sales over 100, but it counts the ones under. Fix it.',
      cell: 'B6',
      broken: '=COUNTIF(B2:B5,"<100")',
      formula: '=COUNTIF(B2:B5,">100")',
      uses: 'COUNTIF',
      moreChips: ['"<100"'],
      hints: ['Read the rule in the bar. Which way does its sign point?', 'Delete the rule with ⌫ and put ">100" in its place.'],
      explain: 'The sign was the wrong way round. Over 100 is ">100".',
      tips: ['The open side of > faces the bigger number.', FORMULAS.check],
    }),
  ],
  practice: [
    task({
      id: 'xl.u2.l3.p1',
      skill: COUNTIF,
      sheet: pets,
      prompt: 'How many of the rows are for a Dog? Count them in B6.',
      cell: 'B6',
      formula: '=COUNTIF(A2:A5,"Dog")',
      uses: 'COUNTIF',
      hints: ['Where to look, then what to look for.', 'COUNTIF , the Pet cells , comma , "Dog"'],
      explain: 'Two of the four Pet cells say Dog.',
      tips: tipsFor(COUNTIF),
    }),
    task({
      id: 'xl.u2.l3.p2',
      skill: SUMIF,
      sheet: petVisits,
      prompt: 'Add up the Visits made by Dogs, in B6.',
      cell: 'B6',
      formula: '=SUMIF(A2:A5,"Dog",B2:B5)',
      uses: 'SUMIF',
      hints: ['Three parts: where to look, what for, and what to add up.', 'SUMIF , Pets , comma , "Dog" , comma , Visits'],
      explain: 'The two Dog rows have 5 and 3 visits: 8 in all.',
      tips: tipsFor(SUMIF),
    }),
  ],
};
