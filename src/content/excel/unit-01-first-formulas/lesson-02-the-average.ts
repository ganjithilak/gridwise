import type { Lesson } from '@/lessons/types';

import { demo, fix, predict, table, task, typing, withCells } from '../build';
import { FORMULAS, tipsFor } from '../tips';

const AVERAGE = 'xl.average';

const money = { numFmt: 'currency' as const };

/** The stall's long weekend. Apples at $4 a kilogram; the averages come out whole on purpose. */
const weekend = table(
  ['Day', 'Apples (kg)', 'Takings', 'Pies'],
  [
    ['Sat', 30, 120, 3],
    ['Sun', 50, 200, 5],
    ['Mon', 20, 80, 2],
    ['Tue', 20, 80, 2],
  ],
  { footer: 'Average' },
);
weekend.formats = { ...weekend.formats, 'C2:C6': money };

/** The orchard pickers' day. Dee worked in the packing shed, so picked no bins: a real 0. */
const pickers = table(
  ['Picker', 'Bins', 'Hours'],
  [
    ['Ana', 4, 10],
    ['Ben', 2, 8],
    ['Cy', 6, 12],
    ['Dee', 0, 6],
  ],
  { footer: 'Average' },
);

/** The stall was shut on Sunday, so that cell is empty rather than 0. */
const shutSunday = table(
  ['Day', 'Apples (kg)'],
  [
    ['Sat', 30],
    ['Sun', null],
    ['Mon', 20],
    ['Tue', 40],
  ],
  { footer: 'Average' },
);

/** Practice on a different record: the dairy's milk, in litres per cow. */
const dairy = table(
  ['Cow', 'Mon (L)', 'Tue (L)'],
  [
    ['Daisy', 24, 32],
    ['Bella', 36, 28],
    ['Rosie', 12, 36],
    ['Mabel', 24, 16],
  ],
  { footer: 'Average' },
);

export const theAverage: Lesson = {
  id: 'xl.u1.l2',
  title: 'The Average',
  summary: 'Find a typical day at the stall with AVERAGE.',
  recap: [
    'AVERAGE adds the numbers, then divides by how many there are.',
    'It is written like SUM: the function name, then a range in brackets.',
    'A 0 counts as one of the numbers. An empty cell is skipped.',
  ],
  newSkills: [AVERAGE],
  hideKeys: ['$', ','],
  exercises: [
    demo({
      id: 'xl.u1.l2.e1',
      skill: AVERAGE,
      sheet: weekend,
      script: typing('B6', '=AVERAGE(B2:B5)', {
        says: [
          'How many apples does a typical day sell? Select B6.',
          'AVERAGE shares the total out evenly.',
          'Tap the first cell...',
          '...then the colon, and the last cell.',
          'Enter. 120 kg over 4 days is 30 kg a day.',
        ],
      }),
      prompt: 'Your turn. Find the average takings in C6.',
      cell: 'C6',
      formula: '=AVERAGE(C2:C5)',
      uses: 'AVERAGE',
      hints: ['AVERAGE is in the row of functions above the keys.', 'AVERAGE, the first takings cell, : , the last takings cell.'],
      explain: 'AVERAGE adds C2 to C5 and divides by 4: $120 a day.',
      tips: ['An average is a typical value: the total, shared out evenly.', FORMULAS.colon],
    }),
    task({
      id: 'xl.u1.l2.e2',
      skill: AVERAGE,
      sheet: withCells(weekend, { B6: '=AVERAGE(B2:B5)', C6: '=AVERAGE(C2:C5)' }),
      prompt: 'Find the average number of pies sold, in D6.',
      cell: 'D6',
      formula: '=AVERAGE(D2:D5)',
      uses: 'AVERAGE',
      hints: ['The same as the two before it, one column along.', 'AVERAGE, the first Pies cell, : , the last Pies cell.'],
      explain: 'Same calculation, new column: 12 pies over 4 days is 3 a day.',
      tips: ['AVERAGE needs a range, just as SUM does.', FORMULAS.bracket],
    }),
    predict({
      id: 'xl.u1.l2.e3',
      skill: AVERAGE,
      sheet: table(['Day', 'Apples (kg)', 'Result'], [['Sat', 30], ['Sun', 50], ['Mon', 20], ['Tue', 20]]),
      prompt: 'This formula is in C2. What will it show?',
      cell: 'C2',
      formula: '=AVERAGE(B2:B3)',
      options: ['40', '80', '30', '50'],
      hints: ['Only two cells are in the range.', 'Add Saturday and Sunday, then share the total between the two days.', '30 and 50 make 80. Half of 80 is 40.'],
      explain: 'B2:B3 is only Saturday and Sunday: 80 kg shared over 2 days is 40.',
      tips: ['AVERAGE adds the numbers, then divides by how many there are.', FORMULAS.shows],
    }),
    task({
      id: 'xl.u1.l2.e4',
      skill: AVERAGE,
      apply: true,
      sheet: pickers,
      prompt: 'The orchard pickers’ day. Find the average bins picked, in B6.',
      cell: 'B6',
      formula: '=AVERAGE(B2:B5)',
      uses: 'AVERAGE',
      hints: ['All four pickers count, including Dee, who picked none.', 'AVERAGE, then the Bins cells from first to last.'],
      explain: 'Dee’s 0 still counts as one of the four: 12 bins over 4 pickers is 3.',
      tips: ['A 0 counts in an average. An empty cell does not.', FORMULAS.tapCell],
    }),
    fix({
      id: 'xl.u1.l2.e5',
      skill: AVERAGE,
      apply: true,
      sheet: pickers,
      prompt: 'C6 should be the average hours, but it shows the total. Correct it.',
      cell: 'C6',
      broken: '=SUM(C2:C5)',
      formula: '=AVERAGE(C2:C5)',
      uses: 'AVERAGE',
      hints: ['Read the formula bar. Which function is it using?', 'Select C6 and type the formula again with AVERAGE. Typing replaces it.'],
      explain: 'SUM gave the total, 36 hours. AVERAGE shares it over the 4 pickers: 9.',
      tips: ['Typing into a selected cell replaces its formula.', FORMULAS.check],
    }),
    task({
      id: 'xl.u1.l2.e6',
      skill: AVERAGE,
      apply: true,
      sheet: shutSunday,
      prompt: 'The stall was shut on Sunday. Find the average apples sold, in B6.',
      cell: 'B6',
      formula: '=AVERAGE(B2:B5)',
      uses: 'AVERAGE',
      hints: ['Use the whole column, empty cell and all.', 'AVERAGE over all four days. The empty cell is skipped.'],
      explain: 'AVERAGE skips the empty cell: 90 kg shared over 3 days, not 4.',
      tips: ['An average need not be one of the numbers in the list.', FORMULAS.updates],
    }),
  ],
  practice: [
    task({
      id: 'xl.u1.l2.p1',
      skill: AVERAGE,
      sheet: dairy,
      prompt: 'Find the average milk per cow on Monday, in B6.',
      cell: 'B6',
      formula: '=AVERAGE(B2:B5)',
      uses: 'AVERAGE',
      hints: ['AVERAGE is in the row of functions above the keys.', 'AVERAGE, the first Monday cell, : , the last one.'],
      explain: 'The four cows gave 96 litres. Shared over 4, that is 24 each.',
      tips: tipsFor(AVERAGE),
    }),
    task({
      id: 'xl.u1.l2.p2',
      skill: AVERAGE,
      sheet: dairy,
      prompt: 'Now the average for Tuesday, in C6.',
      cell: 'C6',
      formula: '=AVERAGE(C2:C5)',
      uses: 'AVERAGE',
      hints: ['The same calculation, one column along.', 'AVERAGE, the first Tuesday cell, : , the last one.'],
      explain: 'The four cows gave 112 litres. Shared over 4, that is 28 each.',
      tips: tipsFor(AVERAGE),
    }),
  ],
};
