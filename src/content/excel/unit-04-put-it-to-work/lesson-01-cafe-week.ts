import type { SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { table, task, typing, withCells } from '../build';
import { FORMULAS } from '../tips';

const bold = { bold: true };

const days: [string, number, number][] = [
  ['Mon', 120, 80],
  ['Tue', 95, 60],
  ['Wed', 140, 90],
  ['Thu', 110, 70],
  ['Fri', 160, 100],
];

/** The cafe's week: what came in and what went out each day. */
const week = table(['Day', 'Sales', 'Costs', 'Profit'], days, { footer: 'Total' });
const weekStarted = withCells(week, { D2: '=B2-C2' });
const weekFilled = withCells(week, { D2: '=B2-C2', D3: '=B3-C3', D4: '=B4-C4', D5: '=B5-C5', D6: '=B6-C6' });

/** Just the Sales, with a labelled cell beside them for one answer. Kept to six rows so the keys fit under it. */
const sales = (label: string): SheetSpec => ({
  cols: 4,
  rows: 6,
  grid: [['Day', 'Sales', '', label], ...days.map(([day, amount]) => [day, amount])],
  formats: { 'A1:D1': bold },
});

/** The landlord takes a share of each day's sales. The share is written once, in E2. */
const rent: SheetSpec = {
  cols: 5,
  rows: 6,
  grid: [['Day', 'Sales', 'Rent', '', 'Rate'], ['Mon', 120, null, null, 0.1], ['Tue', 95], ['Wed', 140], ['Thu', 110], ['Fri', 160]],
  formats: { 'A1:E1': bold, E2: { numFmt: 'percent' } },
};

/**
 * Fruit: a week of a cafe's books, start to finish. Nothing new is taught here. Every
 * step is a real job done with what the "First formulas" unit covered.
 */
export const cafeWeek: Lesson = {
  id: 'xl.u4.l1',
  title: 'Project: the cafe week',
  summary: "Do a cafe's books for a week: profit, totals, the best day and the rent.",
  recap: [
    'One formula, filled down, did the whole Profit column.',
    'SUM, AVERAGE and MAX each answered a question about the week.',
    'A $ kept the Rate in place while the Rent formula was filled.',
  ],
  newSkills: [],
  exercises: [
    task({
      id: 'xl.u4.l1.e1',
      skill: 'xl.formula.arithmetic',
      apply: true,
      sheet: week,
      prompt: "It is your cafe. Work out Monday's Profit in D2: Sales minus Costs.",
      cell: 'D2',
      formula: '=B2-C2',
      hints: ['Profit is what is left of the Sales after the Costs.', '= , the Sales cell, - , the Costs cell'],
      explain: 'Sales minus Costs: 120 - 80 leaves a Profit of 40.',
      tips: [FORMULAS.equals, FORMULAS.tapCell],
    }),
    {
      id: 'xl.u4.l1.e2',
      type: 'grid-task',
      skill: 'xl.fill',
      apply: true,
      sheet: weekStarted,
      tools: ['fill'],
      prompt: 'Now the rest of the week. Fill the Profit formula down to Friday.',
      checks: [{ type: 'filledResults', range: 'D2:D6', reference: '=B2-C2' }],
      hints: ['Select the cell with the formula first.', 'Drag the small square on the corner of D2 down to D6.', 'D3 should end up as =B3-C3.'],
      explain: 'Five days of Profit from one formula. Each copy uses its own row.',
      tips: ['The small square on the corner of a cell is the fill handle.', 'Filling copies a formula and moves its cells along with it.'],
      solution: [
        { tap: 'D2', say: 'Tap D2, the formula to copy.' },
        { fill: 'D2:D6', say: 'Drag its corner down to D6.' },
      ],
    },
    task({
      id: 'xl.u4.l1.e3',
      skill: 'xl.sum.range',
      apply: true,
      sheet: weekFilled,
      prompt: 'How much did the cafe make this week? Total the Profit in D7.',
      cell: 'D7',
      formula: '=SUM(D2:D6)',
      uses: 'SUM',
      hints: ['One function adds up a whole range.', 'SUM , the first Profit cell , : , the last Profit cell'],
      explain: 'SUM adds the five days: 40, 35, 50, 40 and 60 make 225.',
      tips: [FORMULAS.range, FORMULAS.bracket],
    }),
    task({
      id: 'xl.u4.l1.e4',
      skill: 'xl.average',
      apply: true,
      sheet: sales('Average'),
      prompt: 'What does a typical day bring in? Put the average Sales in D2.',
      cell: 'D2',
      formula: '=AVERAGE(B2:B6)',
      uses: 'AVERAGE',
      hints: ['There is a function that shares a total over the days.', 'AVERAGE , the first Sales cell , : , the last Sales cell'],
      explain: 'The five days add to 625. Shared over 5 days, that is 125 a day.',
      tips: [FORMULAS.fn, FORMULAS.shows],
    }),
    task({
      id: 'xl.u4.l1.e5',
      skill: 'xl.minmax',
      apply: true,
      sheet: sales('Best'),
      prompt: 'Which day was the best? Find the biggest Sales in D2.',
      cell: 'D2',
      formula: '=MAX(B2:B6)',
      uses: 'MAX',
      hints: ['One function finds the biggest number in a range.', 'MAX , the first Sales cell , : , the last Sales cell'],
      explain: 'MAX looks through the week and finds 160: Friday.',
      tips: [FORMULAS.check, FORMULAS.updates],
    }),
    {
      id: 'xl.u4.l1.e6',
      type: 'grid-task',
      skill: 'xl.absolute',
      apply: true,
      sheet: rent,
      tools: ['fill'],
      prompt: 'Rent is Sales times the Rate in E2. Write C2, then fill down to Friday.',
      checks: [{ type: 'filledResults', range: 'C2:C6', reference: '=B2*$E$2' }],
      hints: ['Every day uses the same Rate, so that cell needs locking.', 'In C2: = , B2 , * , E2 , $ . Then drag the corner down to C6.', '=B2*$E$2'],
      explain: 'Every day multiplies by the one Rate in E2, because the $ holds it there.',
      tips: ['$ pins a cell in place, so a fill cannot move it.', 'Tap a cell, then $, to lock it. A1 becomes $A$1.'],
      solution: [...typing('C2', '=B2*$E$2'), { fill: 'C2:C6', say: 'Now drag the corner of C2 down to C6.' }],
    },
  ],
};
