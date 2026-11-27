import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const AUTOSUM = 'xl.autosum';

/** The farm's running costs for the month: feed for the animals and fuel for the tractor. */
const pocket = table(
  ['Week', 'Feed', 'Fuel'],
  [
    ['Wk 1', 50, 20],
    ['Wk 2', 80, 30],
    ['Wk 3', 40, 60],
    ['Wk 4', 70, 10],
  ],
  { footer: 'Total' },
);

/** Crates of fruit sold at the stall, day by day. */
const fruit = table(
  ['Crates', 'Mon', 'Tue', 'Wed'],
  [
    ['Apples', 4, 6, 5],
    ['Pears', 3, 2, 7],
    ['Plums', 8, 1, 4],
  ],
  { footer: 'Total' },
);

const fruitAcross = table(
  ['Crates', 'Mon', 'Tue', 'Wed', 'All'],
  [
    ['Apples', 4, 6, 5],
    ['Pears', 3, 2, 7],
    ['Plums', 8, 1, 4],
  ],
);

/** The stall's takings. It was shut on Wednesday, which is where AutoSum's guess goes wrong. */
const gappy = table(
  ['Day', 'Takings'],
  [
    ['Mon', 20],
    ['Tue', 35],
    ['Wed', null],
    ['Thu', 15],
    ['Fri', 30],
  ],
  { footer: 'Total' },
);

/** Kilograms sold at the weekend farmers' market. */
const tickets = table(
  ['Market', 'Apples', 'Pears'],
  [
    ['Fri', 40, 12],
    ['Sat', 65, 30],
    ['Sun', 50, 25],
  ],
  { footer: 'Total' },
);

/** Bins picked over two days. */
const laps = table(
  ['Picker', 'Mon', 'Tue', 'Both'],
  [
    ['Ana', 12, 14],
    ['Ben', 10, 9],
  ],
);

export const autoSum: Lesson = {
  id: 'xl.u1.l4',
  title: 'AutoSum',
  summary: 'Total the farm’s costs and sales with one button: Σ.',
  recap: [
    'Σ (AutoSum) writes =SUM( and suggests which cells to add.',
    'It looks for numbers above the cell first, then to the left.',
    'Check the range before Enter. Tap other cells to replace it.',
  ],
  newSkills: [AUTOSUM],
  hideKeys: ['$', ','],
  exercises: [
    {
      id: 'xl.u1.l4.e1',
      type: 'demo',
      skill: AUTOSUM,
      sheet: pocket,
      tools: ['autosum'],
      script: [
        { say: 'The month’s feed and fuel need totals.' },
        { tap: 'B6', say: 'Select the cell under the numbers.' },
        { tool: 'autosum', say: 'Tap Σ. It writes SUM and suggests a range.' },
        { key: 'enter', say: 'It chose B2:B5. Enter accepts it: 240.' },
      ],
      prompt: 'Your turn. Use Σ to total the fuel in C6.',
      checks: [{ type: 'outcome', cell: 'C6', reference: '=SUM(C2:C5)' }],
      hints: ['Select the cell under the fuel costs first.', 'Select C6, tap Σ, then press Enter.', '=SUM(C2:C5)'],
      explain: 'Σ wrote =SUM(C2:C5) for you: the same formula as typing it, with less tapping.',
      tips: ['Σ is called AutoSum. It writes =SUM( and suggests the range.', BASICS.bar],
      solution: [
        { tap: 'C6', say: 'Select C6, under the fuel costs.' },
        { tool: 'autosum', say: 'Tap Σ.' },
        { key: 'enter', say: 'Enter accepts the range.' },
      ],
    },
    {
      id: 'xl.u1.l4.e2',
      type: 'grid-task',
      skill: AUTOSUM,
      sheet: fruit,
      tools: ['autosum'],
      prompt: 'Crates sold at the stall. Use Σ to total Monday in B5.',
      checks: [{ type: 'outcome', cell: 'B5', reference: '=SUM(B2:B4)' }],
      hints: ['Σ is the button under the grid.', 'Select B5, tap Σ, then press Enter.', '=SUM(B2:B4)'],
      explain: 'Σ found the three numbers above B5 and added them: 15 crates.',
      tips: ['AutoSum looks for numbers above the cell first, then to its left.', FORMULAS.shows],
      solution: [
        { tap: 'B5', say: 'Select B5, under Monday.' },
        { tool: 'autosum', say: 'Tap Σ.' },
        { key: 'enter', say: 'Enter accepts the range.' },
      ],
    },
    {
      id: 'xl.u1.l4.e3',
      type: 'grid-task',
      skill: AUTOSUM,
      sheet: fruitAcross,
      tools: ['autosum'],
      prompt: 'Σ works across a row too. Total the apples’ three days in E2.',
      checks: [{ type: 'outcome', cell: 'E2', reference: '=SUM(B2:D2)' }],
      hints: ['There are no numbers above E2, so Σ will look to the left.', 'Select E2, tap Σ, then press Enter.', '=SUM(B2:D2)'],
      explain: 'Nothing was above E2, so Σ looked left and added B2 to D2: 15 crates.',
      tips: ['A range can run across a row as well as down a column.', FORMULAS.updates],
      solution: [
        { tap: 'E2', say: 'Select E2, at the end of the apples’ row.' },
        { tool: 'autosum', say: 'Tap Σ. It looks left this time.' },
        { key: 'enter', say: 'Enter accepts the range.' },
      ],
    },
    {
      id: 'xl.u1.l4.e4',
      type: 'grid-task',
      skill: AUTOSUM,
      sheet: gappy,
      tools: ['autosum'],
      prompt: 'The stall was shut on Wednesday. Total the whole week in B7.',
      checks: [{ type: 'outcome', cell: 'B7', reference: '=SUM(B2:B6)' }],
      hints: ['Tap Σ and read the range it suggests before pressing Enter.', 'While the formula is open, tap B2, press : and tap B6.', '=SUM(B2:B6)'],
      explain: 'Σ stopped at the empty cell. Tapping the cells you want replaces its range.',
      tips: ['AutoSum stops at the first empty cell it meets.', 'If the range is wrong, tap the cells you want instead.'],
      solution: [
        { tap: 'B7', say: 'Select B7, under the takings.' },
        { tool: 'autosum', say: 'Tap Σ. It stopped at the gap: B5:B6.' },
        { tap: 'B2', say: 'Tap B2 to start the range again...' },
        { key: ':' },
        { tap: 'B6', say: '...and finish it at B6.' },
        { key: 'enter', say: 'Enter. The whole week took 100.' },
      ],
    },
    choice({
      id: 'xl.u1.l4.e5',
      skill: AUTOSUM,
      sheet: table(['Day', 'Takings'], [['Mon', 20], ['Tue', 35], ['Wed', 15]], { footer: 'Total' }),
      prompt: 'B5 is selected and Σ is pressed. Which range will it suggest?',
      options: ['B2 to B4', 'A2 to A4', 'B1 to B4', 'B2 to B5'],
      right: 0,
      hints: ['It looks for numbers directly above the cell.', 'The heading in B1 is a word, not a number.', 'It never includes the cell it is writing in.'],
      explain: 'Σ takes the run of numbers above the cell: B2 to B4. The heading is text, so it stops there.',
      tips: ['Always read the range AutoSum suggests before pressing Enter.', BASICS.headings],
    }),
    {
      id: 'xl.u1.l4.e6',
      type: 'grid-task',
      skill: AUTOSUM,
      sheet: tickets,
      tools: ['autosum'],
      prompt: 'The farmers’ market. Total both columns: Σ in B5, then Σ in C5.',
      checks: [
        { type: 'outcome', cell: 'B5', reference: '=SUM(B2:B4)' },
        { type: 'outcome', cell: 'C5', reference: '=SUM(C2:C4)' },
      ],
      hints: ['Do one column, then the other.', 'Select B5, Σ, Enter. Then select C5, Σ, Enter.', 'B5 is =SUM(B2:B4) and C5 is =SUM(C2:C4).'],
      explain: 'Two totals in six taps: 155 kg of apples and 67 kg of pears.',
      tips: ['Σ is the Greek capital S: S for sum.', BASICS.free],
      solution: [
        { tap: 'B5', say: 'Select B5, under the apples.' },
        { tool: 'autosum', say: 'Tap Σ.' },
        { key: 'enter', say: 'Enter.' },
        { tap: 'C5', say: 'Now select C5, under the pears.' },
        { tool: 'autosum', say: 'Tap Σ again.' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
  ],
  practice: [
    {
      id: 'xl.u1.l4.p1',
      type: 'grid-task',
      skill: AUTOSUM,
      sheet: tickets,
      tools: ['autosum'],
      prompt: 'Use Σ to total the apples sold at the market, in B5.',
      checks: [{ type: 'outcome', cell: 'B5', reference: '=SUM(B2:B4)' }],
      hints: ['Select the cell under the numbers first.', 'Select B5, tap Σ, then press Enter.', '=SUM(B2:B4)'],
      explain: 'Σ added the three numbers above B5: 155 kg.',
      tips: tipsFor(AUTOSUM),
      solution: [
        { tap: 'B5', say: 'Select B5, under the apples.' },
        { tool: 'autosum', say: 'Tap Σ.' },
        { key: 'enter', say: 'Enter accepts the range.' },
      ],
    },
    {
      id: 'xl.u1.l4.p2',
      type: 'grid-task',
      skill: AUTOSUM,
      sheet: laps,
      tools: ['autosum'],
      prompt: 'Use Σ to add Ana’s two days of bins, in D2.',
      checks: [{ type: 'outcome', cell: 'D2', reference: '=SUM(B2:C2)' }],
      hints: ['Nothing is above D2, so Σ will look to the left.', 'Select D2, tap Σ, then press Enter.', '=SUM(B2:C2)'],
      explain: 'Σ looked left and added B2 and C2: 26 bins.',
      tips: tipsFor(AUTOSUM),
      solution: [
        { tap: 'D2', say: 'Select D2, at the end of Ana’s row.' },
        { tool: 'autosum', say: 'Tap Σ. It looks left.' },
        { key: 'enter', say: 'Enter accepts the range.' },
      ],
    },
  ],
};
