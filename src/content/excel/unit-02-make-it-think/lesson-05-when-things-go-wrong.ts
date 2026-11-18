import type { SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { choice, fix, predict, table, task, typing, withCells } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const IFERROR = 'xl.iferror';

const bold = { bold: true };

/** Two teams have not played yet, so their win rate divides by zero. */
const rates = withCells(
  table(
    ['Team', 'Wins', 'Games', 'Rate'],
    [
      ['Red', 6, 10],
      ['Blue', 0, 0],
      ['Gold', 4, 8],
      ['Teal', 0, 0],
    ],
  ),
  { D2: '=B2/C2', D3: '=B3/C3', D4: '=B4/C4', D5: '=B5/C5' },
);

/** "Milk" is not on the menu, so looking it up finds nothing. */
const menu: SheetSpec = {
  cols: 5,
  rows: 5,
  grid: [
    ['Item', 'Price', '', 'Find', 'Price'],
    ['Tea', 3, null, 'Milk'],
    ['Cake', 5],
    ['Soup', 7],
    ['Pie', 4],
  ],
  formats: { 'A1:E1': bold },
};

const trips = table(['Trip', 'Miles', 'Hours', 'Speed'], [['North', 120, 2], ['Home', 90, 0], ['Coast', 150, 3]]);
const costs = table(['Item', 'Cost'], [['Bus', 3], ['Lunch', 6], ['Book', 9]], { footer: 'Total' });
const shares = table(['Class', 'Sweets', 'Pupils', 'Each'], [['Oak', 60, 20], ['Ash', 45, 0], ['Elm', 80, 16]]);

export const whenThingsGoWrong: Lesson = {
  id: 'xl.u2.l5',
  title: 'When things go wrong',
  summary: 'Read error values, and tidy them up with IFERROR.',
  recap: [
    'An error value starts with #. It is a message, not a crash.',
    '#DIV/0! means divided by 0. #NAME? means a misspelt name.',
    'IFERROR shows something of your choice when a formula fails.',
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
          'D3 shows #DIV/0!: Blue has played 0 games. Tap it twice.',
          'Clear the old formula.',
          'IFERROR wraps round a formula that might fail.',
          'The sum as before: Wins...',
          '...divided by Games. Then a comma and a 0.',
          'Enter. If the sum fails, it now shows 0 instead.',
        ],
      }),
      prompt: 'Your turn. Do the same for Teal in D5.',
      checks: [
        { type: 'outcome', cell: 'D5', reference: '=IFERROR(B5/C5,0)' },
        { type: 'formulaUses', cell: 'D5', fn: 'IFERROR' },
      ],
      hints: ['Wrap the division in IFERROR, then say what to show instead.', 'Clear D5. Then IFERROR , B5 / C5 , comma , 0', '=IFERROR(B5/C5,0)'],
      explain: 'IFERROR tried B5/C5, got an error, and showed your 0 instead.',
      tips: ['IFERROR has two parts: the formula, then what to show if it fails.', '#DIV/0! means something is being divided by zero.'],
      solution: typing('D5', '=IFERROR(B5/C5,0)', { replacing: '=B5/C5' }),
    },
    fix({
      id: 'xl.u2.l5.e2',
      skill: IFERROR,
      sheet: menu,
      prompt: 'Milk is not on the menu, so E2 shows #N/A. Make it say "None".',
      cell: 'E2',
      broken: '=XLOOKUP(D2,A2:A5,B2:B5)',
      formula: '=IFERROR(XLOOKUP(D2,A2:A5,B2:B5),"None")',
      uses: 'IFERROR',
      hints: ['Put the whole lookup inside IFERROR, then the word to show.', 'IFERROR , the XLOOKUP as before , ) , comma , "None"'],
      explain: 'The lookup found nothing, so IFERROR showed "None" in its place.',
      tips: ['#N/A means a lookup could not find what it was asked for.', 'One function can sit inside another. Each needs its own brackets.'],
    }),
    predict({
      id: 'xl.u2.l5.e3',
      skill: IFERROR,
      sheet: rates,
      prompt: 'This formula is in D3. What will it show?',
      cell: 'D3',
      formula: '=IFERROR(B3/C3,"No games")',
      options: ['No games', '#DIV/0!', '0', 'Blue'],
      hints: ['First ask: does B3 divided by C3 work?', 'C3 is 0, and dividing by 0 is an error.', 'When the formula fails, IFERROR shows its second part.'],
      explain: 'Dividing by 0 fails, so IFERROR shows its second part: No games.',
      tips: ['An error value starts with #. It is a message, not a crash.', FORMULAS.shows],
    }),
    choice({
      id: 'xl.u2.l5.e4',
      skill: IFERROR,
      prompt: 'A cell shows #DIV/0!. What has happened?',
      options: ['Something is divided by zero or an empty cell', 'The column is too narrow', 'A function name is spelled wrong'],
      right: 0,
      hints: ['DIV is short for divide.', 'The 0 in the message is the thing it was divided by.', 'A wrong name gives #NAME? instead.'],
      explain: 'DIV/0 means "divided by 0". An empty cell counts as 0 too.',
      tips: ['#NAME? means a word in the formula is spelled wrong.', BASICS.free],
    }),
    task({
      id: 'xl.u2.l5.e5',
      skill: IFERROR,
      sheet: trips,
      prompt: 'The Home trip took 0 hours. Write Speed in D3 so it shows 0, not an error.',
      cell: 'D3',
      formula: '=IFERROR(B3/C3,0)',
      uses: 'IFERROR',
      hints: ['Speed is Miles divided by Hours, wrapped in IFERROR.', 'IFERROR , B3 / C3 , comma , 0'],
      explain: '90 divided by 0 fails, so IFERROR shows the 0 you gave it.',
      tips: ['Fix the cause if you can. Use IFERROR when a blank is expected.', FORMULAS.bracket],
    }),
    fix({
      id: 'xl.u2.l5.e6',
      skill: IFERROR,
      sheet: costs,
      prompt: 'B5 shows #NAME? because of a spelling slip. Put it right.',
      cell: 'B5',
      broken: '=SUMM(B2:B4)',
      formula: '=SUM(B2:B4)',
      hints: ['Read the formula in the bar, one letter at a time.', 'Delete it with ⌫, then build it again with the SUM key.'],
      explain: 'SUMM is not a function, so the sheet did not know the name. SUM is.',
      tips: ['Some errors are best fixed, not hidden. A spelling slip is one.', FORMULAS.check],
    }),
  ],
  practice: [
    task({
      id: 'xl.u2.l5.p1',
      skill: IFERROR,
      sheet: shares,
      prompt: 'Ash has no pupils today. Write Each in D3 so it shows 0, not an error.',
      cell: 'D3',
      formula: '=IFERROR(B3/C3,0)',
      uses: 'IFERROR',
      hints: ['Each is Sweets divided by Pupils, wrapped in IFERROR.', 'IFERROR , B3 / C3 , comma , 0'],
      explain: '45 divided by 0 fails, so IFERROR shows the 0 you gave it.',
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
      hints: ['Clear the cell, then put the same division inside IFERROR.', 'IFERROR , B3 / C3 , comma , 0'],
      explain: 'The division still fails, but IFERROR now shows 0 in its place.',
      tips: tipsFor(IFERROR),
    }),
  ],
};
