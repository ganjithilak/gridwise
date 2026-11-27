import type { SheetSpec } from '@/engine';
import { LIMITS, type Checkpoint } from '@/lessons/types';

import { table, task, typing } from '../build';
import { tipsFor } from '../tips';

const bold = { bold: true };

/** The test is set at the farmers' market: crates sold each day, and the price per crate. */
const shows = table(
  ['Market', 'Crates', 'Price', 'Takings'],
  [
    ['Fri', 50, 8],
    ['Sat', 80, 10],
    ['Sun', 40, 8],
  ],
  { footer: 'Total' },
);

const sold = table(['Market', 'Crates'], [['Fri', 50], ['Sat', 80], ['Sun', 40], ['Mon', 30]], { footer: 'Average' });

const nights: SheetSpec = {
  cols: 4,
  rows: 5,
  grid: [
    ['Market', 'Crates', '', 'Answer'],
    ['Fri', 50, 'Best day'],
    ['Sat', 80, 'Worst day'],
    ['Sun', 40],
    ['Mon', 30],
  ],
  formats: { 'A1:D1': bold },
};

/** Stall sites booked for next month's markets: an empty cell is not yet booked. */
const seats = table(['Site', 'Booked'], [['Front', 1], ['Corner', null], ['Back', 1], ['Gate', 1]], { footer: 'How many' });

const snacks = table(['Preserves', 'Fri', 'Sat'], [['Jam', 12, 20], ['Chutney', 7, 9], ['Pies', 15, 30]], { footer: 'Total' });

/** Supplies for the market stall. */
const stall = table(['Supply', 'Price', 'Qty', 'Cost'], [['Trays', 6, 4], ['Gloves', 9, 2], ['Labels', 2, 15]]);

const fees: SheetSpec = {
  cols: 5,
  rows: 4,
  grid: [
    ['Market', 'Takings', 'Fee', '', 'Rate'],
    ['Fri', 400, null, null, 0.2],
    ['Sat', 800],
    ['Sun', 320],
  ],
  formats: { 'A1:E1': bold },
};

/** The test at the end of Unit 1. Pass it without the lessons and the unit is skipped. */
export const unit1Test: Checkpoint = {
  id: 'xl.u1.test',
  title: 'First Formulas: Test',
  passMark: LIMITS.checkpointPassMark,
  exercises: [
    task({
      id: 'xl.u1.test.e1',
      skill: 'xl.formula.arithmetic',
      sheet: shows,
      prompt: 'Work out Friday’s takings in D2: crates times price.',
      cell: 'D2',
      formula: '=B2*C2',
      hints: ['Takings is how many crates were sold, times the price of each.', 'Select D2. Then = , the Crates cell, * , the Price cell.'],
      explain: '50 crates at 8 each: 400.',
      tips: tipsFor('xl.formula.arithmetic'),
    }),
    task({
      id: 'xl.u1.test.e2',
      skill: 'xl.sum.range',
      sheet: shows,
      prompt: 'Total the crates sold in B5 with SUM.',
      cell: 'B5',
      formula: '=SUM(B2:B4)',
      uses: 'SUM',
      hints: ['SUM adds a whole range at once.', 'Tap SUM, the first Crates cell, : , then the last one.'],
      explain: 'SUM adds B2 to B4: 170 crates.',
      tips: tipsFor('xl.sum.range'),
    }),
    task({
      id: 'xl.u1.test.e3',
      skill: 'xl.average',
      sheet: sold,
      prompt: 'Find the average crates sold per market day, in B6.',
      cell: 'B6',
      formula: '=AVERAGE(B2:B5)',
      uses: 'AVERAGE',
      hints: ['AVERAGE is in the row of functions above the keys.', 'AVERAGE, the first Crates cell, : , the last Crates cell.'],
      explain: '200 crates over 4 days is 50 a day.',
      tips: tipsFor('xl.average'),
    }),
    task({
      id: 'xl.u1.test.e4',
      skill: 'xl.minmax',
      sheet: nights,
      prompt: 'Find the best day in D2: the most crates sold.',
      cell: 'D2',
      formula: '=MAX(B2:B5)',
      uses: 'MAX',
      moreChips: ['MIN', 'COUNT'],
      hints: ['The best day has the biggest number.', 'MAX, the first Crates cell, : , the last Crates cell.'],
      explain: 'MAX finds the biggest of the four: 80, on Saturday.',
      tips: tipsFor('xl.minmax'),
    }),
    task({
      id: 'xl.u1.test.e5',
      skill: 'xl.count',
      sheet: seats,
      prompt: 'How many stall sites are booked? Count them in B6.',
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
      prompt: 'Use Σ to total Friday’s preserves in B5.',
      checks: [{ type: 'outcome', cell: 'B5', reference: '=SUM(B2:B4)' }],
      hints: ['Select the cell under the numbers first.', 'Select B5, tap Σ, then press Enter.', '=SUM(B2:B4)'],
      explain: 'Σ added the three numbers above B5: 34.',
      tips: tipsFor('xl.autosum'),
      solution: [
        { tap: 'B5', say: 'Select B5, under Friday.' },
        { tool: 'autosum', say: 'Tap Σ.' },
        { key: 'enter', say: 'Enter accepts the range.' },
      ],
    },
    {
      id: 'xl.u1.test.e7',
      type: 'grid-task',
      skill: 'xl.fill',
      sheet: stall,
      tools: ['fill'],
      prompt: 'Put price times quantity in D2, then fill it down to D4.',
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
      prompt: 'The market’s fee is takings times the rate in E2. Write C2, then fill down.',
      checks: [{ type: 'filledResults', range: 'C2:C4', reference: '=B2*$E$2' }],
      hints: ['Every row uses the same rate, so that reference needs locking.', 'In C2: = , B2 , * , E2 , $ . Then drag the corner down to C4.', '=B2*$E$2'],
      explain: 'All three rows multiply by the one rate in E2: 80, 160 and 64.',
      tips: tipsFor('xl.absolute'),
      solution: [...typing('C2', '=B2*$E$2'), { fill: 'C2:C4', say: 'Now drag the corner of C2 down to C4.' }],
    },
  ],
};
