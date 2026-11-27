import type { SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { choice, typing, withCells } from '../build';
import { FORMULAS, tipsFor } from '../tips';

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

/** Crate prices are going up by 10%: each rise is the price times the one rate in E2. */
const tax = shared(['Crate', 'Price', 'Rise'], 'Rate', 0.1, [['Apples', 20], ['Pears', 40], ['Plums', 30], ['Tomatoes', 50]]);
/** Each picker earns a bonus: 5% of the week's pay. */
const bonus = shared(['Picker', 'Pay', 'Bonus'], 'Rate', 0.05, [['Ana', 200], ['Ben', 400], ['Cy', 100], ['Dee', 300]]);
/** Each crop's share of the season's harvest, against the total in E2. */
const points = shared(['Crop', 'Kg', 'Share'], 'Total', '=SUM(B2:B5)', [['Apples', 30], ['Pears', 50], ['Plums', 20], ['Carrots', 100]]);
/** Practice: a wholesale customer gets 10% off each order. */
const euros = shared(['Order', 'Price', 'Discount'], 'Rate', 0.1, [['Apples', 10], ['Pears', 30], ['Plums', 80]]);

/** The farmers' market takes 10% of each day's takings. The rate sits in a row of its own, for filling across. */
const fees: SheetSpec = {
  cols: 4,
  rows: 4,
  grid: [
    ['', 'Mon', 'Tue', 'Wed'],
    ['Takings', 100, 200, 300],
    ['Rate', 0.1],
    ['Fee'],
  ],
  formats: { 'A1:D1': bold },
};

const brokenTax = withCells(tax, { C2: '=B2*E2', C3: '=B3*E3', C4: '=B4*E4', C5: '=B5*E5' });
const brokenEuros = withCells(euros, { C2: '=B2*E2', C3: '=B3*E3', C4: '=B4*E4' });

export const lockIt: Lesson = {
  id: 'xl.u1.l6',
  title: 'Lock It with $',
  summary: 'Apply one price rise to every crate: keep a reference fixed with $.',
  recap: [
    '$ locks a reference so a fill cannot move it: $E$2 stays on E2.',
    'Lock the one cell every row shares, such as a rate or a total.',
    'Tap a cell, then $, to lock it. In Excel, F4 does the same.',
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
        { tap: 'C2', say: 'The rise is price times the rate in E2: 2.' },
        { fill: 'C2:C5', say: 'Fill it down, and the others show 0.' },
        { tap: 'C3', say: 'C3 is =B3*E3. The fill moved E2 down too.' },
      ],
      prompt: 'Your turn. Write C2 again, and press $ after tapping E2.',
      checks: [{ type: 'fillsCorrectly', cell: 'C2', over: 'C2:C5', reference: '=B2*$E$2' }],
      hints: ['The rate must stay on E2 however far the formula is filled.', 'Select C2 and type over it: = , B2 , * , E2 , $', '=B2*$E$2'],
      explain: '$E$2 stays on E2 wherever the formula goes. B2 is free to move.',
      tips: ['$ locks a reference, so a fill cannot move it.', 'Typing into a selected cell replaces its formula.'],
      solution: typing('C2', '=B2*$E$2', {
        replacing: '=B2*E2',
        says: ['Select C2. Typing replaces the old formula.', 'Start with =', 'Tap the price, B2.', 'Tap the rate, E2...', '...and press $ to lock it.', 'Enter.'],
      }),
    },
    {
      id: 'xl.u1.l6.e2',
      type: 'grid-task',
      skill: ABSOLUTE,
      sheet: bonus,
      tools: ['fill'],
      prompt: 'A picker’s bonus is pay times the rate in E2. Write C2, then fill down.',
      checks: [{ type: 'filledResults', range: 'C2:C5', reference: '=B2*$E$2' }],
      hints: ['Every row uses the same rate, so that reference needs locking.', 'In C2: = , B2 , * , E2 , $ . Then drag the corner down to C5.', '=B2*$E$2'],
      explain: 'All four rows multiply by the one rate in E2, because of the $: 10, 20, 5 and 15.',
      tips: ['Tap a cell, then $, to lock it. A1 becomes $A$1.', FORMULAS.tapCell],
      solution: [...typing('C2', '=B2*$E$2'), { fill: 'C2:C5', say: 'Now drag the corner of C2 down to C5.' }],
    },
    choice({
      id: 'xl.u1.l6.e3',
      skill: ABSOLUTE,
      prompt: 'Which of these stays on E2 when the formula is filled down?',
      options: ['$E$2', 'E2', '(E2)', '"E2"'],
      right: 0,
      hints: ['Look for the sign that locks a reference.', 'Brackets and quote marks do something else entirely.', 'It has a $ before the letter and before the number.'],
      explain: 'The $ signs lock the column and the row. Plain E2 would move.',
      tips: ['In a reference, $ has nothing to do with money: it means “stay”.', 'In Excel, F4 adds the $ signs to the reference just typed.'],
    }),
    {
      id: 'xl.u1.l6.e4',
      type: 'grid-task',
      skill: ABSOLUTE,
      sheet: points,
      tools: ['fill'],
      prompt: 'Share is a crop’s kg divided by the total in E2. Write C2, then fill down.',
      checks: [{ type: 'filledResults', range: 'C2:C5', reference: '=B2/$E$2' }],
      hints: ['Every crop is divided by the same total.', 'In C2: = , B2 , / , E2 , $ . Then drag the corner down to C5.', '=B2/$E$2'],
      explain: 'Each crop is divided by the same total of 200 kg: 0.15, 0.25, 0.1 and 0.5.',
      tips: ['Lock the one reference every row shares. Leave the rest free.', FORMULAS.shows],
      solution: [...typing('C2', '=B2/$E$2'), { fill: 'C2:C5', say: 'Now drag the corner of C2 down to C5.' }],
    },
    {
      id: 'xl.u1.l6.e5',
      type: 'fix-formula',
      skill: ABSOLUTE,
      sheet: brokenTax,
      tools: ['fill'],
      prompt: 'Only the first price rise is right. Correct C2 with $, then fill it down again.',
      checks: [{ type: 'filledResults', range: 'C2:C5', reference: '=B2*$E$2' }],
      hints: ['Select C3 and read the formula bar. Which reference has moved?', 'Type over C2: = , B2 , * , E2 , $ . Then drag the corner down.', '=B2*$E$2'],
      explain: 'Without the $, each row referred to an empty cell below the rate.',
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
      prompt: 'The market’s fee is takings times the rate in B3. Write B4, then fill across.',
      checks: [{ type: 'filledResults', range: 'B4:D4', reference: '=B2*$B$3' }],
      hints: ['This time the fill goes across, and the rate must not move with it.', 'In B4: = , B2 , * , B3 , $ . Then drag the corner across to D4.', '=B2*$B$3'],
      explain: 'Filling across moved B2 to C2 and D2, while $B$3 stayed on the rate.',
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
      prompt: 'The discount is the price times the rate in E2. Write C2, then fill down.',
      checks: [{ type: 'filledResults', range: 'C2:C4', reference: '=B2*$E$2' }],
      hints: ['Every row uses the same rate, so that reference needs locking.', 'In C2: = , B2 , * , E2 , $ . Then drag the corner down to C4.', '=B2*$E$2'],
      explain: 'All three rows multiply by the one rate in E2: 1, 3 and 8.',
      tips: tipsFor(ABSOLUTE),
      solution: [...typing('C2', '=B2*$E$2'), { fill: 'C2:C4', say: 'Now drag the corner of C2 down to C4.' }],
    },
    {
      id: 'xl.u1.l6.p2',
      type: 'fix-formula',
      skill: ABSOLUTE,
      sheet: brokenEuros,
      tools: ['fill'],
      prompt: 'Only the first discount is right. Correct C2 with $, then fill down.',
      checks: [{ type: 'filledResults', range: 'C2:C4', reference: '=B2*$E$2' }],
      hints: ['Select C3 and read the formula bar. Which reference has moved?', 'Type over C2: = , B2 , * , E2 , $ . Then drag the corner down.', '=B2*$E$2'],
      explain: 'With the $ in place, every row uses the rate in E2.',
      tips: tipsFor(ABSOLUTE),
      solution: [
        ...typing('C2', '=B2*$E$2', { replacing: '=B2*E2' }),
        { fill: 'C2:C4', say: 'Now drag the corner of C2 down to C4.' },
      ],
    },
  ],
};
