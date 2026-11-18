import type { SheetSpec } from '@/engine';
import { LIMITS, type Checkpoint } from '@/lessons/types';

import { table, task, typing } from '../build';
import { tipsFor } from '../tips';

const bold = { bold: true };

const shows = table(
  ['Show', 'Sold', 'Price', 'Takings'],
  [
    ['Fri', 50, 8],
    ['Sat', 80, 10],
    ['Sun', 40, 8],
  ],
  { footer: 'Total' },
);

const sold = table(['Show', 'Sold'], [['Fri', 50], ['Sat', 80], ['Sun', 40], ['Mon', 30]], { footer: 'Average' });

const nights: SheetSpec = {
  cols: 4,
  rows: 5,
  grid: [
    ['Show', 'Sold', '', 'Answer'],
    ['Fri', 50, 'Best night'],
    ['Sat', 80, 'Worst night'],
    ['Sun', 40],
    ['Mon', 30],
  ],
  formats: { 'A1:D1': bold },
};

const seats = table(['Seat', 'Booked'], [['Front', 1], ['Aisle', null], ['Back', 1], ['Box', 1]], { footer: 'How many' });

const snacks = table(['Snack', 'Fri', 'Sat'], [['Crisps', 12, 20], ['Nuts', 7, 9], ['Ices', 15, 30]], { footer: 'Total' });

const stall = table(['Item', 'Price', 'Qty', 'Cost'], [['Mugs', 6, 4], ['Caps', 9, 2], ['Pins', 2, 15]]);

const fees: SheetSpec = {
  cols: 5,
  rows: 4,
  grid: [
    ['Show', 'Takings', 'Fee', '', 'Rate'],
    ['Fri', 400, null, null, 0.2],
    ['Sat', 800],
    ['Sun', 320],
  ],
  formats: { 'A1:E1': bold },
};

/** The test at the end of Unit 1. Pass it without the lessons and the unit is skipped. */
export const unit1Test: Checkpoint = {
  id: 'xl.u1.test',
  title: 'First formulas: test',
  passMark: LIMITS.checkpointPassMark,
  exercises: [
    task({
      id: 'xl.u1.test.e1',
      skill: 'xl.formula.arithmetic',
      sheet: shows,
      prompt: "Work out Friday's Takings in D2: Sold times Price.",
      cell: 'D2',
      formula: '=B2*C2',
      hints: ['Takings is how many were sold, times the price of each.', 'Tap D2 twice. Then = , the Sold cell, * , the Price cell.'],
      explain: '50 tickets at 8 each: 400.',
      tips: tipsFor('xl.formula.arithmetic'),
    }),
    task({
      id: 'xl.u1.test.e2',
      skill: 'xl.sum.range',
      sheet: shows,
      prompt: 'Total the tickets Sold in B5 with SUM.',
      cell: 'B5',
      formula: '=SUM(B2:B4)',
      uses: 'SUM',
      hints: ['SUM adds a whole range in one go.', 'Tap SUM, the first Sold cell, press : and tap the last one.'],
      explain: 'SUM adds B2 through B4: 170 tickets.',
      tips: tipsFor('xl.sum.range'),
    }),
    task({
      id: 'xl.u1.test.e3',
      skill: 'xl.average',
      sheet: sold,
      prompt: 'Find the average tickets Sold per show, in B6.',
      cell: 'B6',
      formula: '=AVERAGE(B2:B5)',
      uses: 'AVERAGE',
      hints: ['The AVERAGE key is in the row above the numbers.', 'AVERAGE, the first Sold cell, : , the last Sold cell.'],
      explain: '200 tickets over 4 shows is 50 a show.',
      tips: tipsFor('xl.average'),
    }),
    task({
      id: 'xl.u1.test.e4',
      skill: 'xl.minmax',
      sheet: nights,
      prompt: 'Find the best night in D2: the most tickets Sold.',
      cell: 'D2',
      formula: '=MAX(B2:B5)',
      uses: 'MAX',
      moreChips: ['MIN', 'COUNT'],
      hints: ['The best night has the biggest number.', 'MAX, the first Sold cell, : , the last Sold cell.'],
      explain: 'MAX picks the biggest of the four: 80, on Sat.',
      tips: tipsFor('xl.minmax'),
    }),
    task({
      id: 'xl.u1.test.e5',
      skill: 'xl.count',
      sheet: seats,
      prompt: 'How many seats are booked? Count them in B6.',
      cell: 'B6',
      formula: '=COUNT(B2:B5)',
      uses: 'COUNT',
      moreChips: ['MAX'],
      hints: ['You want how many cells hold a number.', 'COUNT, the first Booked cell, : , the last Booked cell.'],
      explain: 'Three cells hold a number. The empty one is not counted.',
      tips: tipsFor('xl.count'),
    }),
    {
      id: 'xl.u1.test.e6',
      type: 'grid-task',
      skill: 'xl.autosum',
      sheet: snacks,
      tools: ['autosum'],
      prompt: 'Use Σ to total the Fri snacks in B5.',
      checks: [{ type: 'outcome', cell: 'B5', reference: '=SUM(B2:B4)' }],
      hints: ['Pick the cell under the numbers first.', 'Tap B5 once, tap Σ, then press Enter.', '=SUM(B2:B4)'],
      explain: 'Σ added the three numbers above B5: 34.',
      tips: tipsFor('xl.autosum'),
      solution: [
        { tap: 'B5', say: 'Tap B5, under the Fri numbers.' },
        { tool: 'autosum', say: 'Tap Σ.' },
        { key: 'enter', say: 'Enter accepts the guess.' },
      ],
    },
    {
      id: 'xl.u1.test.e7',
      type: 'grid-task',
      skill: 'xl.fill',
      sheet: stall,
      tools: ['fill'],
      prompt: 'Put Price times Qty in D2, then fill it down to D4.',
      checks: [{ type: 'filledResults', range: 'D2:D4', reference: '=B2*C2' }],
      hints: ['Write the formula for the first row only.', 'In D2: = , the Price cell, * , the Qty cell. Then drag the corner down.', '=B2*C2'],
      explain: 'One formula, filled down: 24, 18 and 30.',
      tips: tipsFor('xl.fill'),
      solution: [...typing('D2', '=B2*C2'), { fill: 'D2:D4', say: 'Now drag the corner of D2 down to D4.' }],
    },
    {
      id: 'xl.u1.test.e8',
      type: 'grid-task',
      skill: 'xl.absolute',
      sheet: fees,
      tools: ['fill'],
      prompt: 'Fee is Takings times the Rate in E2. Write C2, then fill down.',
      checks: [{ type: 'filledResults', range: 'C2:C4', reference: '=B2*$E$2' }],
      hints: ['Every row uses the same Rate, so that cell needs locking.', 'In C2: = , B2 , * , E2 , $ . Then drag the corner down to C4.', '=B2*$E$2'],
      explain: 'All three rows multiply by the one Rate in E2: 80, 160 and 64.',
      tips: tipsFor('xl.absolute'),
      solution: [...typing('C2', '=B2*$E$2'), { fill: 'C2:C4', say: 'Now drag the corner of C2 down to C4.' }],
    },
  ],
};
