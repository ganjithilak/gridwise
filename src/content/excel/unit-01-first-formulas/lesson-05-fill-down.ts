import type { Lesson } from '@/lessons/types';

import { choice, table, typing, withCells } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const FILL = 'xl.fill';

const shop = table(
  ['Item', 'Price', 'Qty', 'Cost'],
  [
    ['Pens', 2, 10],
    ['Pads', 4, 5],
    ['Tape', 3, 8],
    ['Glue', 5, 2],
  ],
);

/** The same shop with a second column to fill, for the learner's turn after the demonstration. */
const shopWithHalf = withCells(
  table(
    ['Item', 'Price', 'Qty', 'Cost', 'Half'],
    [
      ['Pens', 2, 10],
      ['Pads', 4, 5],
      ['Tape', 3, 8],
      ['Glue', 5, 2],
    ],
  ),
  { D2: '=B2*C2', E2: '=D2/2' },
);

const fruit = table(
  ['Fruit', 'Mon', 'Tue', 'Wed'],
  [
    ['Apple', 4, 6, 5],
    ['Pear', 3, 2, 7],
    ['Plum', 8, 1, 4],
  ],
  { footer: 'Total', cells: { B5: '=SUM(B2:B4)' } },
);

const week = table(
  ['Day', 'Sales', 'Costs', 'Profit'],
  [
    ['Mon', 120, 80],
    ['Tue', 95, 60],
    ['Wed', 140, 90],
    ['Thu', 110, 70],
    ['Fri', 160, 100],
  ],
);

const trips = table(
  ['Trip', 'Miles', 'Hours', 'Speed'],
  [
    ['North', 120, 2],
    ['South', 90, 3],
    ['Coast', 200, 4],
  ],
);

export const fillDown: Lesson = {
  id: 'xl.u1.l5',
  title: 'Fill down',
  summary: 'Write a formula once, then copy it down a whole column.',
  recap: [
    'Write a formula once, then drag the fill handle to copy it.',
    'Each copy moves its cells along, so it points at its own row.',
    'Filling across works the same way: the columns move along.',
  ],
  newSkills: [FILL],
  hideKeys: ['$', ','],
  exercises: [
    {
      id: 'xl.u1.l5.e1',
      type: 'demo',
      skill: FILL,
      sheet: shopWithHalf,
      tools: ['fill'],
      script: [
        { tap: 'D2', say: 'D2 has a formula: Price times Qty. Other rows need it too.' },
        { fill: 'D2:D5', say: 'Drag the small square on its corner down to D5.' },
        { tap: 'D3', say: 'Each copy uses its own row. D3 became B3 times C3.' },
      ],
      prompt: 'Your turn. E2 halves the Cost. Fill it down to E5.',
      checks: [{ type: 'filledResults', range: 'E2:E5', reference: '=D2/2' }],
      hints: ['Pick E2 first: it is the cell to copy.', 'Drag the small square on the corner of E2 down to E5.', 'E3 should end up as =D3/2.'],
      explain: 'One formula, copied down. Each copy points at its own row.',
      tips: ['The small square on the corner of a cell is the fill handle.', BASICS.bar],
      solution: [
        { tap: 'E2', say: 'Tap E2, the cell to copy.' },
        { fill: 'E2:E5', say: 'Drag its corner down to E5.' },
      ],
    },
    {
      id: 'xl.u1.l5.e2',
      type: 'grid-task',
      skill: FILL,
      sheet: shop,
      tools: ['fill'],
      prompt: 'Put Price times Qty in D2, then fill it down to D5.',
      checks: [{ type: 'filledResults', range: 'D2:D5', reference: '=B2*C2' }],
      hints: ['Write the formula for the first row only.', 'In D2: = , the Price cell, * , the Qty cell. Then drag the corner down.', '=B2*C2'],
      explain: 'You wrote one formula and the fill made the other three.',
      tips: ['One formula, filled down, beats typing it on every row.', '* is the times sign. / is the divide sign.'],
      solution: [...typing('D2', '=B2*C2'), { fill: 'D2:D5', say: 'Now drag the corner of D2 down to D5.' }],
    },
    {
      id: 'xl.u1.l5.e3',
      type: 'grid-task',
      skill: FILL,
      sheet: fruit,
      tools: ['fill'],
      prompt: 'B5 totals Mon. Fill it across to D5 for Tue and Wed.',
      checks: [{ type: 'filledResults', range: 'B5:D5', reference: '=SUM(B2:B4)' }],
      hints: ['Pick B5 first.', 'Drag the corner of B5 to the right, as far as D5.', 'C5 should end up as =SUM(C2:C4).'],
      explain: 'Filling across moves the columns along: B became C, then D.',
      tips: ['Fill down for a column, fill across for a row.', FORMULAS.range],
      solution: [
        { tap: 'B5', say: 'Tap B5, the total to copy.' },
        { fill: 'B5:D5', say: 'Drag its corner across to D5.' },
      ],
    },
    choice({
      id: 'xl.u1.l5.e4',
      skill: FILL,
      sheet: withCells(shop, { D2: '=B2*C2' }),
      prompt: 'D2 is =B2*C2. After a fill down, what is in D4?',
      options: ['=B4*C4', '=B2*C2', '=B2*C4', '=D2*4'],
      right: 0,
      hints: ['A fill moves every cell in the formula by the same amount.', 'D4 is two rows below D2.', 'So each row number goes up by 2.'],
      explain: 'Two rows down, so both cells move two rows down: B4 and C4.',
      tips: ['Filling copies the formula and moves its cells along with it.', 'After a fill, tap a copy and read the bar to see what it uses.'],
    }),
    {
      id: 'xl.u1.l5.e5',
      type: 'grid-task',
      skill: FILL,
      sheet: withCells(shop, { D2: '=B2*C2', D3: 20, D4: 99, D5: 10 }),
      tools: ['fill'],
      prompt: 'Someone typed the Cost by hand and D4 is wrong. Fill D2 down over it.',
      checks: [{ type: 'filledResults', range: 'D2:D5', reference: '=B2*C2' }],
      hints: ['D2 has the right formula. The rest are just typed numbers.', 'Pick D2, then drag its corner down to D5.', 'D4 should end up as =B4*C4.'],
      explain: 'The fill replaced the typed numbers with formulas, so D4 is right: 24.',
      tips: ['Filling over a cell replaces what was in it.', 'A typed number never updates. A formula always does.'],
      solution: [
        { tap: 'D2', say: 'Tap D2, the one cell with a formula.' },
        { fill: 'D2:D5', say: 'Drag its corner down to D5, over the typed numbers.' },
      ],
    },
    {
      id: 'xl.u1.l5.e6',
      type: 'grid-task',
      skill: FILL,
      sheet: week,
      tools: ['fill'],
      prompt: 'Work out Profit for Mon in D2, then fill down to D6.',
      checks: [{ type: 'filledResults', range: 'D2:D6', reference: '=B2-C2' }],
      hints: ['Profit is Sales minus Costs.', 'In D2: = , the Sales cell, - , the Costs cell. Then drag the corner down.', '=B2-C2'],
      explain: 'Five days of profit from one formula.',
      tips: [FORMULAS.equals, FORMULAS.tapCell],
      solution: [...typing('D2', '=B2-C2'), { fill: 'D2:D6', say: 'Now drag the corner of D2 down to D6.' }],
    },
  ],
  practice: [
    {
      id: 'xl.u1.l5.p1',
      type: 'grid-task',
      skill: FILL,
      sheet: withCells(trips, { D2: '=B2/C2' }),
      tools: ['fill'],
      prompt: 'D2 works out the speed. Fill it down to D4.',
      checks: [{ type: 'filledResults', range: 'D2:D4', reference: '=B2/C2' }],
      hints: ['Pick D2 first: it is the cell to copy.', 'Drag the small square on its corner down to D4.', 'D3 should end up as =B3/C3.'],
      explain: 'Each copy divides its own Miles by its own Hours.',
      tips: tipsFor(FILL),
      solution: [
        { tap: 'D2', say: 'Tap D2, the cell to copy.' },
        { fill: 'D2:D4', say: 'Drag its corner down to D4.' },
      ],
    },
    {
      id: 'xl.u1.l5.p2',
      type: 'grid-task',
      skill: FILL,
      sheet: trips,
      tools: ['fill'],
      prompt: 'Put Miles divided by Hours in D2, then fill it down to D4.',
      checks: [{ type: 'filledResults', range: 'D2:D4', reference: '=B2/C2' }],
      hints: ['Write the formula for the first row only.', 'In D2: = , the Miles cell, / , the Hours cell. Then drag the corner down.', '=B2/C2'],
      explain: 'One formula, filled down: 60, 30 and 50.',
      tips: tipsFor(FILL),
      solution: [...typing('D2', '=B2/C2'), { fill: 'D2:D4', say: 'Now drag the corner of D2 down to D4.' }],
    },
  ],
};
