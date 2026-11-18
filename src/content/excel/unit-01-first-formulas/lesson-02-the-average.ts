import type { Lesson } from '@/lessons/types';

import { demo, fix, predict, table, task, typing, withCells } from '../build';
import { FORMULAS, tipsFor } from '../tips';

const AVERAGE = 'xl.average';

/** A lemonade stand's long weekend. Averages come out as whole numbers on purpose. */
const lemon = table(
  ['Day', 'Cups', 'Sales', 'Ice'],
  [
    ['Sat', 30, 60, 3],
    ['Sun', 50, 100, 5],
    ['Mon', 20, 40, 2],
    ['Tue', 20, 40, 2],
  ],
  { footer: 'Average' },
);

const football = table(
  ['Player', 'Goals', 'Shots'],
  [
    ['Ana', 4, 10],
    ['Ben', 2, 8],
    ['Cy', 6, 12],
    ['Dee', 0, 6],
  ],
  { footer: 'Average' },
);

const shutSunday = table(
  ['Day', 'Cups'],
  [
    ['Sat', 30],
    ['Sun', null],
    ['Mon', 20],
    ['Tue', 40],
  ],
  { footer: 'Average' },
);

const tests = table(
  ['Pupil', 'Test 1', 'Test 2'],
  [
    ['Ali', 6, 8],
    ['Bea', 9, 7],
    ['Cal', 3, 9],
    ['Dot', 6, 4],
  ],
  { footer: 'Average' },
);

export const theAverage: Lesson = {
  id: 'xl.u1.l2',
  title: 'The average',
  summary: 'Find a typical value with AVERAGE.',
  recap: [
    'AVERAGE adds the numbers up, then divides by how many there are.',
    'It is written like SUM: the name, then a range in brackets.',
    'A 0 counts as one of the numbers. An empty cell is skipped.',
  ],
  newSkills: [AVERAGE],
  hideKeys: ['$', ','],
  exercises: [
    demo({
      id: 'xl.u1.l2.e1',
      skill: AVERAGE,
      sheet: lemon,
      script: typing('B6', '=AVERAGE(B2:B5)', {
        says: [
          'The average is the total shared out evenly. Tap B6 twice.',
          'AVERAGE does the sharing for you.',
          'Tap the first cell...',
          '...then the colon, and the last cell.',
          'Enter. 120 cups over 4 days is 30 a day.',
        ],
      }),
      prompt: 'Your turn. Find the average Sales in C6.',
      cell: 'C6',
      formula: '=AVERAGE(C2:C5)',
      uses: 'AVERAGE',
      hints: ['The AVERAGE key is in the row above the numbers.', 'AVERAGE, the first Sales cell, : , the last Sales cell.'],
      explain: 'AVERAGE adds C2 through C5 and divides by 4: 60 a day.',
      tips: ['An average is a typical value: the total, shared out evenly.', FORMULAS.colon],
    }),
    task({
      id: 'xl.u1.l2.e2',
      skill: AVERAGE,
      sheet: withCells(lemon, { B6: '=AVERAGE(B2:B5)', C6: '=AVERAGE(C2:C5)' }),
      prompt: 'Find the average bags of Ice in D6.',
      cell: 'D6',
      formula: '=AVERAGE(D2:D5)',
      uses: 'AVERAGE',
      hints: ['Same as the two before it, one column along.', 'AVERAGE, the first Ice cell, : , the last Ice cell.'],
      explain: 'Same shape, new column: 12 bags over 4 days is 3 a day.',
      tips: ['AVERAGE needs a range, just like SUM does.', FORMULAS.bracket],
    }),
    predict({
      id: 'xl.u1.l2.e3',
      skill: AVERAGE,
      sheet: table(['Day', 'Cups', 'Answer'], [['Sat', 30], ['Sun', 50], ['Mon', 20], ['Tue', 20]]),
      prompt: 'This formula is in C2. What will it show?',
      cell: 'C2',
      formula: '=AVERAGE(B2:B3)',
      options: ['40', '80', '30', '50'],
      hints: ['Only two cells are in the range.', 'Add Sat and Sun, then share the total between the two days.', '30 and 50 make 80. Half of 80 is 40.'],
      explain: 'B2:B3 is just Sat and Sun: 80 shared over 2 days is 40.',
      tips: ['AVERAGE adds the numbers up, then divides by how many there are.', FORMULAS.shows],
    }),
    task({
      id: 'xl.u1.l2.e4',
      skill: AVERAGE,
      sheet: football,
      prompt: 'New sheet: a football team. Find the average Goals in B6.',
      cell: 'B6',
      formula: '=AVERAGE(B2:B5)',
      uses: 'AVERAGE',
      hints: ['All four players count, even the one with no goals.', 'AVERAGE, then the Goals cells from first to last.'],
      explain: 'Dee scored 0, and that still counts as one of the four: 12 over 4 is 3.',
      tips: ['A zero counts in an average. An empty cell does not.', FORMULAS.tapCell],
    }),
    fix({
      id: 'xl.u1.l2.e5',
      skill: AVERAGE,
      sheet: football,
      prompt: 'C6 should be the average Shots, but it shows the total. Fix it.',
      cell: 'C6',
      broken: '=SUM(C2:C5)',
      formula: '=AVERAGE(C2:C5)',
      uses: 'AVERAGE',
      hints: ['Read the formula in the bar. Which function is it using?', 'Delete it with ⌫, then build it again with AVERAGE.'],
      explain: 'SUM gave the total, 36. AVERAGE shares it over the 4 players: 9.',
      tips: ['To change a formula, tap its cell twice and use ⌫.', FORMULAS.check],
    }),
    task({
      id: 'xl.u1.l2.e6',
      skill: AVERAGE,
      sheet: shutSunday,
      prompt: 'The stand was shut on Sun. Find the average Cups in B6.',
      cell: 'B6',
      formula: '=AVERAGE(B2:B5)',
      uses: 'AVERAGE',
      hints: ['Use the whole column, empty cell and all.', 'AVERAGE over all four days. The gap looks after itself.'],
      explain: 'AVERAGE skips the empty cell: 90 shared over 3 days, not 4.',
      tips: ['An average can be a number that is not in the list at all.', FORMULAS.updates],
    }),
  ],
  practice: [
    task({
      id: 'xl.u1.l2.p1',
      skill: AVERAGE,
      sheet: tests,
      prompt: 'Find the average mark for Test 1, in B6.',
      cell: 'B6',
      formula: '=AVERAGE(B2:B5)',
      uses: 'AVERAGE',
      hints: ['The AVERAGE key is in the row above the numbers.', 'AVERAGE, the first Test 1 mark, : , the last one.'],
      explain: 'The four marks add to 24. Shared over 4 pupils, that is 6.',
      tips: tipsFor(AVERAGE),
    }),
    task({
      id: 'xl.u1.l2.p2',
      skill: AVERAGE,
      sheet: tests,
      prompt: 'Now the average for Test 2, in C6.',
      cell: 'C6',
      formula: '=AVERAGE(C2:C5)',
      uses: 'AVERAGE',
      hints: ['Same idea, one column along.', 'AVERAGE, the first Test 2 mark, : , the last one.'],
      explain: 'The four marks add to 28. Shared over 4 pupils, that is 7.',
      tips: tipsFor(AVERAGE),
    }),
  ],
};
