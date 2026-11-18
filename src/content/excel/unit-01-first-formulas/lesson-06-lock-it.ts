import type { SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { choice, typing, withCells } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const ABSOLUTE = 'xl.absolute';

const bold = { bold: true };

/** A column of amounts, an empty column to work out, and one shared number off to the side in E2. */
function shared(headings: [string, string, string], shareLabel: string, share: number | string, rows: [string, number][]): SheetSpec {
  return {
    cols: 5,
    rows: rows.length + 1,
    grid: [[...headings, '', shareLabel], ...rows.map(([label, value], i) => (i === 0 ? [label, value, null, null, share] : [label, value]))],
    formats: { 'A1:E1': bold },
  };
}

const tax = shared(['Item', 'Price', 'Tax'], 'Rate', 0.1, [['Pens', 20], ['Pads', 40], ['Tape', 30], ['Glue', 50]]);
const bonus = shared(['Seller', 'Sales', 'Bonus'], 'Rate', 0.05, [['Ann', 200], ['Bo', 400], ['Cy', 100], ['Di', 300]]);
const points = shared(['Team', 'Points', 'Share'], 'Total', '=SUM(B2:B5)', [['Red', 30], ['Blue', 50], ['Gold', 20], ['Teal', 100]]);
const euros = shared(['Item', 'Dollars', 'Euros'], 'Rate', 0.9, [['Hat', 10], ['Bag', 30], ['Coat', 80]]);

/** The shared number sits in a row of its own, for filling across instead of down. */
const fees: SheetSpec = {
  cols: 4,
  rows: 4,
  grid: [
    ['', 'Mon', 'Tue', 'Wed'],
    ['Sales', 100, 200, 300],
    ['Rate', 0.1],
    ['Fee'],
  ],
  formats: { 'A1:D1': bold },
};

const brokenTax = withCells(tax, { C2: '=B2*E2', C3: '=B3*E3', C4: '=B4*E4', C5: '=B5*E5' });
const brokenEuros = withCells(euros, { C2: '=B2*E2', C3: '=B3*E3', C4: '=B4*E4' });

export const lockIt: Lesson = {
  id: 'xl.u1.l6',
  title: 'Lock it with $',
  summary: 'Keep one cell fixed when a formula is filled.',
  recap: [
    '$ pins a cell so a fill cannot move it: $E$2 stays on E2.',
    'Lock the one cell every row shares, like a rate or a total.',
    'Tap a cell, then $, to lock it.',
  ],
  newSkills: [ABSOLUTE],
  hideKeys: [','],
  exercises: [
    {
      id: 'xl.u1.l6.e1',
      type: 'demo',
      skill: ABSOLUTE,
      sheet: withCells(tax, { C2: '=B2*E2' }),
      tools: ['fill'],
      script: [
        { tap: 'C2', say: 'Tax is Price times the Rate in E2. C2 is right: 2.' },
        { fill: 'C2:C5', say: 'But fill it down and the others come out as 0.' },
        { tap: 'C3', say: 'C3 is B3 times E3. The fill moved E2 down as well.' },
      ],
      prompt: 'Your turn. Write C2 again, and press $ after tapping E2.',
      checks: [{ type: 'fillsCorrectly', cell: 'C2', over: 'C2:C5', reference: '=B2*$E$2' }],
      hints: ['The Rate must stay on E2 however far the formula is filled.', 'Tap C2 twice, clear it, then = , B2 , * , E2 , $', '=B2*$E$2'],
      explain: '$E$2 stays on E2 wherever the formula goes. B2 is free to move.',
      tips: ['$ pins a cell in place, so a fill cannot move it.', BASICS.backspace],
      solution: typing('C2', '=B2*$E$2', {
        replacing: '=B2*E2',
        says: ['Tap C2, then tap it again to type.', 'Clear the old formula.', 'Start with =', 'Tap the Price, B2.', 'Tap the Rate, E2...', '...and press $ to lock it.', 'Enter.'],
      }),
    },
    {
      id: 'xl.u1.l6.e2',
      type: 'grid-task',
      skill: ABSOLUTE,
      sheet: bonus,
      tools: ['fill'],
      prompt: 'Bonus is Sales times the Rate in E2. Write C2, then fill down.',
      checks: [{ type: 'filledResults', range: 'C2:C5', reference: '=B2*$E$2' }],
      hints: ['Every row uses the same Rate, so that cell needs locking.', 'In C2: = , B2 , * , E2 , $ . Then drag the corner down to C5.', '=B2*$E$2'],
      explain: 'All four rows multiply by the one Rate in E2, because of the $.',
      tips: ['Tap a cell, then $, to lock it. A1 becomes $A$1.', FORMULAS.tapCell],
      solution: [...typing('C2', '=B2*$E$2'), { fill: 'C2:C5', say: 'Now drag the corner of C2 down to C5.' }],
    },
    choice({
      id: 'xl.u1.l6.e3',
      skill: ABSOLUTE,
      prompt: 'Which of these stays on E2 when the formula is filled down?',
      options: ['$E$2', 'E2', '(E2)', '"E2"'],
      right: 0,
      hints: ['Look for the sign that pins a cell in place.', 'Brackets and quote marks do something else entirely.', 'It has a $ before the letter and before the number.'],
      explain: 'The $ signs pin the column and the row. Plain E2 would move.',
      tips: ['The $ has nothing to do with money. It just means "stay put".', 'On a keyboard, F4 does what the $ key does here.'],
    }),
    {
      id: 'xl.u1.l6.e4',
      type: 'grid-task',
      skill: ABSOLUTE,
      sheet: points,
      tools: ['fill'],
      prompt: 'Share is Points divided by the Total in E2. Write C2, then fill down.',
      checks: [{ type: 'filledResults', range: 'C2:C5', reference: '=B2/$E$2' }],
      hints: ['Every team is divided by the same Total.', 'In C2: = , B2 , / , E2 , $ . Then drag the corner down to C5.', '=B2/$E$2'],
      explain: 'Each team is divided by the same total of 200: 0.15, 0.25, 0.1, 0.5.',
      tips: ['Lock the one cell every row shares. Leave the rest free.', FORMULAS.shows],
      solution: [...typing('C2', '=B2/$E$2'), { fill: 'C2:C5', say: 'Now drag the corner of C2 down to C5.' }],
    },
    {
      id: 'xl.u1.l6.e5',
      type: 'fix-formula',
      skill: ABSOLUTE,
      sheet: brokenTax,
      tools: ['fill'],
      prompt: 'Only the first Tax is right. Fix C2 with $, then fill it down again.',
      checks: [{ type: 'filledResults', range: 'C2:C5', reference: '=B2*$E$2' }],
      hints: ['Tap C3 and read the bar. Which cell has wandered off?', 'Rewrite C2 as = , B2 , * , E2 , $ . Then drag the corner down.', '=B2*$E$2'],
      explain: 'Without the $, each row reached for an empty cell below the Rate.',
      tips: ['A formula that gives 0 after a fill is often missing a $.', FORMULAS.check],
      solution: [
        ...typing('C2', '=B2*$E$2', { replacing: '=B2*E2' }),
        { fill: 'C2:C5', say: 'Now drag the corner of C2 down to C5.' },
      ],
    },
    {
      id: 'xl.u1.l6.e6',
      type: 'grid-task',
      skill: ABSOLUTE,
      sheet: fees,
      tools: ['fill'],
      prompt: 'Fee is Sales times the Rate in B3. Write B4, then fill across to D4.',
      checks: [{ type: 'filledResults', range: 'B4:D4', reference: '=B2*$B$3' }],
      hints: ['This time the fill goes sideways, and the Rate must not go with it.', 'In B4: = , B2 , * , B3 , $ . Then drag the corner across to D4.', '=B2*$B$3'],
      explain: 'Filling across moved B2 to C2 and D2, while $B$3 stayed on the Rate.',
      tips: ['$ works the same whether you fill down or across.', FORMULAS.updates],
      solution: [...typing('B4', '=B2*$B$3'), { fill: 'B4:D4', say: 'Now drag the corner of B4 across to D4.' }],
    },
  ],
  practice: [
    {
      id: 'xl.u1.l6.p1',
      type: 'grid-task',
      skill: ABSOLUTE,
      sheet: euros,
      tools: ['fill'],
      prompt: 'Euros is Dollars times the Rate in E2. Write C2, then fill down.',
      checks: [{ type: 'filledResults', range: 'C2:C4', reference: '=B2*$E$2' }],
      hints: ['Every row uses the same Rate, so that cell needs locking.', 'In C2: = , B2 , * , E2 , $ . Then drag the corner down to C4.', '=B2*$E$2'],
      explain: 'All three rows multiply by the one Rate in E2: 9, 27 and 72.',
      tips: tipsFor(ABSOLUTE),
      solution: [...typing('C2', '=B2*$E$2'), { fill: 'C2:C4', say: 'Now drag the corner of C2 down to C4.' }],
    },
    {
      id: 'xl.u1.l6.p2',
      type: 'fix-formula',
      skill: ABSOLUTE,
      sheet: brokenEuros,
      tools: ['fill'],
      prompt: 'Only the first Euros price is right. Fix C2 with $, then fill down.',
      checks: [{ type: 'filledResults', range: 'C2:C4', reference: '=B2*$E$2' }],
      hints: ['Tap C3 and read the bar. Which cell has wandered off?', 'Rewrite C2 as = , B2 , * , E2 , $ . Then drag the corner down.', '=B2*$E$2'],
      explain: 'With the $ in place, every row uses the Rate in E2.',
      tips: tipsFor(ABSOLUTE),
      solution: [
        ...typing('C2', '=B2*$E$2', { replacing: '=B2*E2' }),
        { fill: 'C2:C4', say: 'Now drag the corner of C2 down to C4.' },
      ],
    },
  ],
};
