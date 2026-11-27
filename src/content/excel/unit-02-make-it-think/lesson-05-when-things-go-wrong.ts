import type { SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { choice, fix, predict, table, task, typing, withCells } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const IFERROR = 'xl.iferror';

const bold = { bold: true };

/** Kilograms per tree, row by row. Rows 2 and 4 were replanted and have no bearing trees yet. */
const rates = withCells(
  table(
    ['Row', 'Kg', 'Trees', 'Per tree'],
    [
      ['Row 1', 60, 10],
      ['Row 2', 0, 0],
      ['Row 3', 40, 8],
      ['Row 4', 0, 0],
    ],
  ),
  { D2: '=B2/C2', D3: '=B3/C3', D4: '=B4/C4', D5: '=B5/C5' },
);

/** Figs are not on the stall's price list, so looking them up finds nothing. */
const menu: SheetSpec = {
  cols: 5,
  rows: 5,
  grid: [
    ['Produce', 'Price', '', 'Find', 'Price'],
    ['Carrots', 3, null, 'Figs'],
    ['Pears', 5],
    ['Tomatoes', 6],
    ['Apples', 4],
  ],
  formats: { 'A1:E1': bold },
};

/** Kilograms picked per hour. Ben was rained off, so he has no hours yet. */
const trips = table(['Picker', 'Kg', 'Hours', 'Per hour'], [['Ana', 120, 2], ['Ben', 0, 0], ['Cy', 150, 3]]);
/** Supplies bought for the stall. */
const costs = table(['Supply', 'Cost'], [['Twine', 3], ['Gloves', 6], ['Labels', 9]], { footer: 'Total' });
/** Practice: hay shared among the cows in each paddock. The river paddock is resting. */
const shares = table(['Paddock', 'Bales', 'Cows', 'Each'], [['North', 60, 20], ['River', 0, 0], ['Hill', 80, 16]]);

export const whenThingsGoWrong: Lesson = {
  id: 'xl.u2.l5',
  title: 'When Things Go Wrong',
  summary: 'Read the error values in the farm’s records, and handle them with IFERROR.',
  recap: [
    'An error value starts with #. It is a message, not a crash.',
    '#DIV/0! means divided by 0. #NAME? means a misspelt name.',
    'IFERROR shows a value of your choice when a formula fails.',
  ],
  newSkills: [IFERROR],
  hideKeys: ['$'],
  exercises: [
    {
      id: 'xl.u2.l5.e1',
      type: 'demo',
      skill: IFERROR,
      sheet: rates,
      chips: ['IFERROR'],
      script: typing('D3', '=IFERROR(B3/C3,0)', {
        replacing: '=B3/C3',
        says: [
          'D3 shows #DIV/0!: row 2 has 0 trees. Select D3.',
          'IFERROR wraps round a formula that might fail.',
          'The same division as before: Kg...',
          '...divided by Trees. Then a comma and a 0.',
          'Enter. When the division fails, it shows 0.',
        ],
      }),
      prompt: 'Your turn. Do the same for row 4, in D5.',
      checks: [
        { type: 'outcome', cell: 'D5', reference: '=IFERROR(B5/C5,0)' },
        { type: 'formulaUses', cell: 'D5', fn: 'IFERROR' },
      ],
      hints: ['Wrap the division in IFERROR, then say what to show instead.', 'Select D5 and type over it: IFERROR , B5 / C5 , comma , 0', '=IFERROR(B5/C5,0)'],
      explain: 'IFERROR tried B5/C5, got an error, and showed your 0 instead.',
      tips: ['IFERROR has two parts: the formula, then what to show if it fails.', '#DIV/0! means something is being divided by zero.'],
      solution: typing('D5', '=IFERROR(B5/C5,0)', { replacing: '=B5/C5' }),
    },
    fix({
      id: 'xl.u2.l5.e2',
      skill: IFERROR,
      sheet: menu,
      prompt: 'Figs are not on the price list, so E2 shows #N/A. Make it say "None".',
      cell: 'E2',
      broken: '=XLOOKUP(D2,A2:A5,B2:B5)',
      formula: '=IFERROR(XLOOKUP(D2,A2:A5,B2:B5),"None")',
      uses: 'IFERROR',
      hints: ['Put the whole lookup inside IFERROR, then the text to show.', 'IFERROR , the XLOOKUP as before , ) , comma , "None"'],
      explain: 'The lookup found nothing, so IFERROR showed "None" in its place.',
      tips: ['#N/A means a lookup could not find what it was asked for.', 'One function can sit inside another. Each needs its own brackets.'],
    }),
    predict({
      id: 'xl.u2.l5.e3',
      skill: IFERROR,
      sheet: rates,
      prompt: 'This formula is in D3. What will it show?',
      cell: 'D3',
      formula: '=IFERROR(B3/C3,"No trees")',
      options: ['No trees', '#DIV/0!', '0', 'Row 2'],
      hints: ['First ask: does B3 divided by C3 work?', 'C3 is 0, and dividing by 0 is an error.', 'When the formula fails, IFERROR shows its second part.'],
      explain: 'Dividing by 0 fails, so IFERROR shows its second part: No trees.',
      tips: ['An error value starts with #. It is a message, not a crash.', FORMULAS.shows],
    }),
    choice({
      id: 'xl.u2.l5.e4',
      skill: IFERROR,
      prompt: 'A cell shows #DIV/0!. What has happened?',
      options: ['Something is divided by zero or an empty cell', 'The column is too narrow', 'A function name is spelled wrong'],
      right: 0,
      hints: ['DIV is short for divide.', 'The 0 in the message is the thing it was divided by.', 'A wrong name gives #NAME? instead.'],
      explain: 'DIV/0 means “divided by 0”. An empty cell counts as 0 too.',
      tips: ['#NAME? means a word in the formula is spelled wrong.', BASICS.free],
    }),
    task({
      id: 'xl.u2.l5.e5',
      skill: IFERROR,
      sheet: trips,
      prompt: 'Ben was rained off. Write his kg per hour in D3 so it shows 0, not an error.',
      cell: 'D3',
      formula: '=IFERROR(B3/C3,0)',
      uses: 'IFERROR',
      apply: true,
      hints: ['Per hour is Kg divided by Hours, wrapped in IFERROR.', 'IFERROR , B3 / C3 , comma , 0'],
      explain: 'Dividing by 0 hours fails, so IFERROR shows the 0 you gave it.',
      tips: ['Correct the cause if you can. Use IFERROR when a gap is expected.', FORMULAS.bracket],
    }),
    fix({
      id: 'xl.u2.l5.e6',
      skill: IFERROR,
      sheet: costs,
      prompt: 'B5 shows #NAME? because of a spelling slip. Correct it.',
      cell: 'B5',
      broken: '=SUMM(B2:B4)',
      formula: '=SUM(B2:B4)',
      apply: true,
      hints: ['Read the formula bar, one letter at a time.', 'Select B5 and type the formula again with the SUM key.'],
      explain: 'SUMM is not a function, so the sheet did not recognise the name. SUM is.',
      tips: ['Some errors should be corrected, not hidden: a spelling slip is one.', FORMULAS.check],
    }),
  ],
  practice: [
    task({
      id: 'xl.u2.l5.p1',
      skill: IFERROR,
      sheet: shares,
      prompt: 'The river paddock is resting. Write Each in D3 so it shows 0, not an error.',
      cell: 'D3',
      formula: '=IFERROR(B3/C3,0)',
      uses: 'IFERROR',
      hints: ['Each is Bales divided by Cows, wrapped in IFERROR.', 'IFERROR , B3 / C3 , comma , 0'],
      explain: 'Dividing by 0 cows fails, so IFERROR shows the 0 you gave it.',
      tips: tipsFor(IFERROR),
    }),
    fix({
      id: 'xl.u2.l5.p2',
      skill: IFERROR,
      sheet: shares,
      prompt: 'D3 shows #DIV/0!. Wrap its formula in IFERROR so it shows 0.',
      cell: 'D3',
      broken: '=B3/C3',
      formula: '=IFERROR(B3/C3,0)',
      uses: 'IFERROR',
      hints: ['Type over the cell: the same division, inside IFERROR.', 'IFERROR , B3 / C3 , comma , 0'],
      explain: 'The division still fails, but IFERROR now shows 0 in its place.',
      tips: tipsFor(IFERROR),
    }),
  ],
};
