import type { Lesson } from '@/lessons/types';

import { choice, table, typing, withCells } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const FILL = 'xl.fill';

/** Saturday at the stall: the price per kilogram, kilograms sold, and what each took. */
const shop = table(
  ['Produce', 'Price', 'Sold (kg)', 'Takings'],
  [
    ['Carrots', 3, 10],
    ['Tomatoes', 6, 5],
    ['Apples', 4, 8],
    ['Plums', 5, 2],
  ],
);

/**
 * The same day with a second column to fill, for the learner's turn after the demonstration:
 * a rough profit, taken as half of each product's takings.
 */
const shopWithHalf = withCells(
  table(
    ['Produce', 'Price', 'Sold (kg)', 'Takings', 'Profit'],
    [
      ['Carrots', 3, 10],
      ['Tomatoes', 6, 5],
      ['Apples', 4, 8],
      ['Plums', 5, 2],
    ],
  ),
  { D2: '=B2*C2', E2: '=D2/2' },
);

/** Crates sold at the stall, from the AutoSum lesson. */
const fruit = table(
  ['Crates', 'Mon', 'Tue', 'Wed'],
  [
    ['Apples', 4, 6, 5],
    ['Pears', 3, 2, 7],
    ['Plums', 8, 1, 4],
  ],
  { footer: 'Total', cells: { B5: '=SUM(B2:B4)' } },
);

/** The stall's week from Add It Up, with Profit still to work out. */
const week = table(
  ['Day', 'Takings', 'Costs', 'Profit'],
  [
    ['Mon', 120, 80],
    ['Tue', 95, 60],
    ['Wed', 140, 90],
    ['Thu', 110, 70],
    ['Fri', 160, 100],
  ],
);

/** Practice on a different record: kilograms picked and hours worked, for a rate per hour. */
const trips = table(
  ['Picker', 'Kg', 'Hours', 'Per hour'],
  [
    ['Ana', 120, 2],
    ['Ben', 90, 3],
    ['Cy', 200, 4],
  ],
);

export const fillDown: Lesson = {
  id: 'xl.u1.l5',
  title: 'Fill Down',
  summary: 'Work out each product’s takings with one formula, copied down the list.',
  recap: [
    'Write a formula once, then drag the fill handle to copy it.',
    'Each copy’s references move with it, so each row uses its own cells.',
    'Next: how to stop one reference moving, with $.',
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
        { tap: 'D2', say: 'D2 works out takings: price times kg sold.' },
        { say: 'The other rows need the same formula.' },
        { fill: 'D2:D5', say: 'Drag the fill handle, on its corner, to D5.' },
        { tap: 'D3', say: 'Each copy uses its own row: D3 is =B3*C3.' },
      ],
      prompt: 'Your turn. E2 estimates profit as half the takings. Fill it down to E5.',
      checks: [{ type: 'filledResults', range: 'E2:E5', reference: '=D2/2' }],
      hints: ['Select E2 first: it is the cell to copy.', 'Drag the small square on the corner of E2 down to E5.', 'E3 should end up as =D3/2.'],
      explain: 'One formula, copied down. Each copy refers to its own row.',
      tips: ['The small square on the corner of a cell is the fill handle.', BASICS.bar],
      solution: [
        { tap: 'E2', say: 'Select E2, the cell to copy.' },
        { fill: 'E2:E5', say: 'Drag its corner down to E5.' },
      ],
    },
    {
      id: 'xl.u1.l5.e2',
      type: 'grid-task',
      skill: FILL,
      sheet: shop,
      tools: ['fill'],
      prompt: 'Put price times kg sold in D2, then fill it down to D5.',
      checks: [{ type: 'filledResults', range: 'D2:D5', reference: '=B2*C2' }],
      hints: ['Write the formula for the first row only.', 'In D2: = , the Price cell, * , the Sold cell. Then drag the corner down.', '=B2*C2'],
      explain: 'You wrote one formula and the fill made the other three: 30, 30, 32 and 10.',
      tips: ['One formula, filled down, beats typing it on every row.', '* is the times sign. / is the divide sign.'],
      solution: [...typing('D2', '=B2*C2'), { fill: 'D2:D5', say: 'Now drag the corner of D2 down to D5.' }],
    },
    {
      id: 'xl.u1.l5.e3',
      type: 'grid-task',
      skill: FILL,
      sheet: fruit,
      tools: ['fill'],
      prompt: 'B5 totals Monday’s crates. Fill it across to D5 for Tuesday and Wednesday.',
      checks: [{ type: 'filledResults', range: 'B5:D5', reference: '=SUM(B2:B4)' }],
      hints: ['Select B5 first.', 'Drag the corner of B5 to the right, as far as D5.', 'C5 should end up as =SUM(C2:C4).'],
      explain: 'Filling across moves the column letters along: B became C, then D.',
      tips: ['Fill down for a column, fill across for a row.', FORMULAS.range],
      solution: [
        { tap: 'B5', say: 'Select B5, the total to copy.' },
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
      tips: ['Filling copies the formula and moves its references with it.', 'After a fill, select a copy and read the formula bar.'],
    }),
    {
      id: 'xl.u1.l5.e5',
      type: 'grid-task',
      skill: FILL,
      sheet: withCells(shop, { D2: '=B2*C2', D3: 30, D4: 99, D5: 10 }),
      tools: ['fill'],
      prompt: 'Someone typed the takings by hand, and D4 is wrong. Fill D2 down over them.',
      checks: [{ type: 'filledResults', range: 'D2:D5', reference: '=B2*C2' }],
      hints: ['D2 has the right formula. The rest are typed numbers.', 'Select D2, then drag its corner down to D5.', 'D4 should end up as =B4*C4.'],
      explain: 'The fill replaced the typed numbers with formulas, so D4 is right: 32.',
      tips: ['Filling over a cell replaces what was in it.', 'A typed number never updates. A formula always does.'],
      solution: [
        { tap: 'D2', say: 'Select D2, the one cell with a formula.' },
        { fill: 'D2:D5', say: 'Drag its corner down to D5, over the typed numbers.' },
      ],
    },
    {
      id: 'xl.u1.l5.e6',
      type: 'grid-task',
      skill: FILL,
      sheet: week,
      tools: ['fill'],
      prompt: 'The stall’s week. Work out Monday’s profit in D2, then fill down to D6.',
      checks: [{ type: 'filledResults', range: 'D2:D6', reference: '=B2-C2' }],
      hints: ['Profit is takings minus costs.', 'In D2: = , the Takings cell, - , the Costs cell. Then drag the corner down.', '=B2-C2'],
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
      prompt: 'D2 works out kilograms picked per hour. Fill it down to D4.',
      checks: [{ type: 'filledResults', range: 'D2:D4', reference: '=B2/C2' }],
      hints: ['Select D2 first: it is the cell to copy.', 'Drag the small square on its corner down to D4.', 'D3 should end up as =B3/C3.'],
      explain: 'Each copy divides its own kilograms by its own hours.',
      tips: tipsFor(FILL),
      solution: [
        { tap: 'D2', say: 'Select D2, the cell to copy.' },
        { fill: 'D2:D4', say: 'Drag its corner down to D4.' },
      ],
    },
    {
      id: 'xl.u1.l5.p2',
      type: 'grid-task',
      skill: FILL,
      sheet: trips,
      tools: ['fill'],
      prompt: 'Put kilograms divided by hours in D2, then fill it down to D4.',
      checks: [{ type: 'filledResults', range: 'D2:D4', reference: '=B2/C2' }],
      hints: ['Write the formula for the first row only.', 'In D2: = , the Kg cell, / , the Hours cell. Then drag the corner down.', '=B2/C2'],
      explain: 'One formula, filled down: 60, 30 and 50 kg an hour.',
      tips: tipsFor(FILL),
      solution: [...typing('D2', '=B2/C2'), { fill: 'D2:D4', say: 'Now drag the corner of D2 down to D4.' }],
    },
  ],
};
