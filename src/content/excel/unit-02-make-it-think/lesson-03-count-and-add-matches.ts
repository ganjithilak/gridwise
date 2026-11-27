import type { SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { demo, fix, predict, table, task, typing } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const COUNTIF = 'xl.countif';
const SUMIF = 'xl.sumif';

const bold = { bold: true };

/** Three wholesale orders by delivery route, and two questions about them, each with its own answer cell underneath. */
function orders(first: string, second: string): SheetSpec {
  return {
    cols: 2,
    rows: 6,
    grid: [['Route', 'Amount'], ['North', 120], ['South', 80], ['North', 200], [first], [second]],
    formats: { 'A1:B1': bold, 'A5:A6': bold },
  };
}

/** This week's wholesale orders, by customer. */
const sales = table(['Customer', 'Order'], [['River Cafe', 120], ['Hill Market', 80], ['Town Grocer', 200], ['Bay Deli', 50]], { footer: 'Over 100' });
/** The harvest log: one row per picking, so a crop can appear more than once. */
const fruit = table(['Crop', 'Kg'], [['Apples', 40], ['Pears', 30], ['Apples', 60], ['Plums', 20]], { footer: 'Apple kg' });
/** Practice on a different record: bags of feed given out this week. */
const pets = table(['Animal', 'Bags'], [['Hens', 2], ['Cows', 5], ['Hens', 1], ['Cows', 3]], { footer: 'Cow rows' });
const petVisits = table(['Animal', 'Bags'], [['Hens', 2], ['Cows', 5], ['Hens', 1], ['Cows', 3]], { footer: 'Cow bags' });

export const countAndAddMatches: Lesson = {
  id: 'xl.u2.l3',
  title: 'Count and Add What Matches',
  summary: 'Count and total the orders for one route or one crop with COUNTIF and SUMIF.',
  recap: [
    'COUNTIF counts the cells that match: where to look, what for.',
    'SUMIF adds the numbers on matching rows: it has a third part.',
    'A rule like ">100" goes in quote marks. Capitals make no difference.',
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
          'How many orders are for the North route? Select B5.',
          'COUNTIF counts only the cells that match.',
          'Where to look: from the first Route...',
          '...to the last. Then a comma.',
          'What to look for.',
          'Enter. Two orders are on the North route.',
        ],
      }),
      prompt: 'Your turn. Count the South route’s orders in B6.',
      cell: 'B6',
      formula: '=COUNTIF(A2:A4,"South")',
      uses: 'COUNTIF',
      hints: ['Where to look, then what to look for.', 'COUNTIF , the Route cells , comma , "South"'],
      explain: 'Only one Route cell says South, so COUNTIF gives 1.',
      tips: ['COUNTIF needs two things: where to look, and what to look for.', BASICS.labels],
    }),
    task({
      id: 'xl.u2.l3.e2',
      skill: COUNTIF,
      sheet: sales,
      prompt: 'How many orders are over 100? Count them in B6.',
      cell: 'B6',
      formula: '=COUNTIF(B2:B5,">100")',
      uses: 'COUNTIF',
      moreChips: ['"<100"'],
      hints: ['The rule goes in as one ready-made piece, quote marks and all.', 'COUNTIF , the Order cells , comma , ">100"'],
      explain: 'Two of the four orders are over 100: the River Cafe’s and the Town Grocer’s.',
      tips: ['A rule like ">100" goes inside quote marks, sign first.', FORMULAS.range],
    }),
    demo({
      id: 'xl.u2.l3.e3',
      skill: SUMIF,
      sheet: orders('North total', 'South total'),
      script: typing('B5', '=SUMIF(A2:A4,"North",B2:B4)', {
        says: [
          'What do the North orders come to? Select B5.',
          'SUMIF adds up only the rows that match.',
          'Where to look: from the first Route...',
          '...to the last. Then a comma.',
          'What to look for, and another comma.',
          'Then what to add up: from the first Amount...',
          '...to the last.',
          'Enter. The North orders come to 320.',
        ],
      }),
      prompt: 'Your turn. Add up the South route’s orders in B6.',
      cell: 'B6',
      formula: '=SUMIF(A2:A4,"South",B2:B4)',
      uses: 'SUMIF',
      hints: ['Three parts: where to look, what for, and what to add up.', 'SUMIF , the Routes , comma , "South" , comma , the Amounts'],
      explain: 'Only one order is on the South route, so the total is its 80.',
      tips: ['SUMIF needs a third thing: which numbers to add up.', 'COUNTIF counts rows. SUMIF adds up their numbers.'],
    }),
    task({
      id: 'xl.u2.l3.e4',
      skill: SUMIF,
      sheet: fruit,
      prompt: 'The harvest log. Add up the kilograms of apples in B6.',
      cell: 'B6',
      formula: '=SUMIF(A2:A5,"Apples",B2:B5)',
      uses: 'SUMIF',
      apply: true,
      hints: ['Look in the Crop column, add from the Kg column.', 'SUMIF , the Crops , comma , "Apples" , comma , the Kg cells'],
      explain: 'Apples were picked twice, 40 and 60 kg: 100 in all.',
      tips: ['The cells to look in and the cells to add must be the same length.', FORMULAS.bracket],
    }),
    predict({
      id: 'xl.u2.l3.e5',
      skill: COUNTIF,
      sheet: table(['Crop', 'Kg', 'Result'], [['Apples', 40], ['Pears', 30], ['Apples', 60], ['Plums', 20]]),
      prompt: 'This formula is in C2. What will it show?',
      cell: 'C2',
      formula: '=COUNTIF(A2:A5,"apples")',
      options: ['2', '100', '0', '4'],
      hints: ['COUNTIF counts cells. It does not add anything up.', 'Capital letters make no difference when matching text.', 'How many of the Crop cells say Apples?'],
      explain: 'Two cells say Apples. Capitals make no difference, and COUNTIF counts rather than adds.',
      tips: ['Matching text ignores capitals: north finds North.', FORMULAS.shows],
    }),
    fix({
      id: 'xl.u2.l3.e6',
      skill: COUNTIF,
      sheet: sales,
      prompt: 'B6 should count orders over 100, but it counts those under. Correct it.',
      cell: 'B6',
      broken: '=COUNTIF(B2:B5,"<100")',
      formula: '=COUNTIF(B2:B5,">100")',
      uses: 'COUNTIF',
      moreChips: ['"<100"'],
      hints: ['Read the rule in the formula bar. Which way does its sign point?', 'Select B6 and type the formula again with ">100". Typing replaces it.'],
      explain: 'The sign was the wrong way round. Over 100 is ">100".',
      tips: ['The open side of > faces the bigger number.', FORMULAS.check],
    }),
  ],
  practice: [
    task({
      id: 'xl.u2.l3.p1',
      skill: COUNTIF,
      sheet: pets,
      prompt: 'How many rows are for the cows? Count them in B6.',
      cell: 'B6',
      formula: '=COUNTIF(A2:A5,"Cows")',
      uses: 'COUNTIF',
      hints: ['Where to look, then what to look for.', 'COUNTIF , the Animal cells , comma , "Cows"'],
      explain: 'Two of the four Animal cells say Cows.',
      tips: tipsFor(COUNTIF),
    }),
    task({
      id: 'xl.u2.l3.p2',
      skill: SUMIF,
      sheet: petVisits,
      prompt: 'Add up the bags of feed the cows had, in B6.',
      cell: 'B6',
      formula: '=SUMIF(A2:A5,"Cows",B2:B5)',
      uses: 'SUMIF',
      hints: ['Three parts: where to look, what for, and what to add up.', 'SUMIF , the Animals , comma , "Cows" , comma , the Bags'],
      explain: 'The two Cows rows have 5 and 3 bags: 8 in all.',
      tips: tipsFor(SUMIF),
    }),
  ],
};
