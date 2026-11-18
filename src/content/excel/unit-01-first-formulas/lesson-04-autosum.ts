import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const AUTOSUM = 'xl.autosum';

const pocket = table(
  ['Week', 'Saved', 'Spent'],
  [
    ['Wk 1', 5, 2],
    ['Wk 2', 8, 3],
    ['Wk 3', 4, 6],
    ['Wk 4', 7, 1],
  ],
  { footer: 'Total' },
);

const fruit = table(
  ['Fruit', 'Mon', 'Tue', 'Wed'],
  [
    ['Apple', 4, 6, 5],
    ['Pear', 3, 2, 7],
    ['Plum', 8, 1, 4],
  ],
  { footer: 'Total' },
);

const fruitAcross = table(
  ['Fruit', 'Mon', 'Tue', 'Wed', 'All'],
  [
    ['Apple', 4, 6, 5],
    ['Pear', 3, 2, 7],
    ['Plum', 8, 1, 4],
  ],
);

/** Wednesday is missing, which is where AutoSum's guess goes wrong. */
const gappy = table(
  ['Day', 'Sales'],
  [
    ['Mon', 20],
    ['Tue', 35],
    ['Wed', null],
    ['Thu', 15],
    ['Fri', 30],
  ],
  { footer: 'Total' },
);

const tickets = table(
  ['Show', 'Adult', 'Child'],
  [
    ['Fri', 40, 12],
    ['Sat', 65, 30],
    ['Sun', 50, 25],
  ],
  { footer: 'Total' },
);

const laps = table(
  ['Swimmer', 'Heat 1', 'Heat 2', 'Both'],
  [
    ['Ada', 12, 14],
    ['Ben', 10, 9],
  ],
);

export const autoSum: Lesson = {
  id: 'xl.u1.l4',
  title: 'AutoSum',
  summary: 'Let the Σ button write the total for you.',
  recap: [
    'Σ writes =SUM( for you and guesses which cells to add.',
    'It looks at the numbers above the cell first, then to the left.',
    'Check its guess before Enter. Tapping other cells replaces it.',
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
        { tap: 'B6', say: 'Pick the cell under the numbers.' },
        { tool: 'autosum', say: 'Tap Σ. It writes the SUM and guesses which cells you mean.' },
        { key: 'enter', say: 'It guessed B2 to B5. Enter accepts the guess: 24.' },
      ],
      prompt: 'Your turn. Use Σ to total Spent in C6.',
      checks: [{ type: 'outcome', cell: 'C6', reference: '=SUM(C2:C5)' }],
      hints: ['Pick the cell under the Spent numbers first.', 'Tap C6 once, tap Σ, then press Enter.', '=SUM(C2:C5)'],
      explain: 'Σ wrote =SUM(C2:C5) for you. It is the same formula, with less tapping.',
      tips: ['Σ is called AutoSum. It writes =SUM( and guesses the range.', BASICS.bar],
      solution: [
        { tap: 'C6', say: 'Tap C6, under the Spent numbers.' },
        { tool: 'autosum', say: 'Tap Σ.' },
        { key: 'enter', say: 'Enter accepts the guess.' },
      ],
    },
    {
      id: 'xl.u1.l4.e2',
      type: 'grid-task',
      skill: AUTOSUM,
      sheet: fruit,
      tools: ['autosum'],
      prompt: 'New sheet: fruit sold. Use Σ to total Mon in B5.',
      checks: [{ type: 'outcome', cell: 'B5', reference: '=SUM(B2:B4)' }],
      hints: ['Σ is the button under the grid.', 'Tap B5 once, tap Σ, then press Enter.', '=SUM(B2:B4)'],
      explain: 'Σ found the three numbers above B5 and added them: 15.',
      tips: ['AutoSum looks for numbers above the cell first, then to its left.', FORMULAS.shows],
      solution: [
        { tap: 'B5', say: 'Tap B5, under the Mon numbers.' },
        { tool: 'autosum', say: 'Tap Σ.' },
        { key: 'enter', say: 'Enter accepts the guess.' },
      ],
    },
    {
      id: 'xl.u1.l4.e3',
      type: 'grid-task',
      skill: AUTOSUM,
      sheet: fruitAcross,
      tools: ['autosum'],
      prompt: "Σ works across too. Total Apple's three days in E2.",
      checks: [{ type: 'outcome', cell: 'E2', reference: '=SUM(B2:D2)' }],
      hints: ['There are no numbers above E2, so Σ will look to the left.', 'Tap E2 once, tap Σ, then press Enter.', '=SUM(B2:D2)'],
      explain: 'Nothing was above E2, so Σ looked left and added B2 to D2: 15.',
      tips: ['A range can run across a row as well as down a column.', FORMULAS.updates],
      solution: [
        { tap: 'E2', say: "Tap E2, at the end of Apple's row." },
        { tool: 'autosum', say: 'Tap Σ. It looks left this time.' },
        { key: 'enter', say: 'Enter accepts the guess.' },
      ],
    },
    {
      id: 'xl.u1.l4.e4',
      type: 'grid-task',
      skill: AUTOSUM,
      sheet: gappy,
      tools: ['autosum'],
      prompt: 'Wed is empty, so Σ will stop early. Total the whole week in B7.',
      checks: [{ type: 'outcome', cell: 'B7', reference: '=SUM(B2:B6)' }],
      hints: ['Tap Σ and read the range it guessed before pressing Enter.', 'While the guess is open, tap B2, press : and tap B6.', '=SUM(B2:B6)'],
      explain: 'Σ stopped at the gap. Tapping the cells you want replaces its guess.',
      tips: ['AutoSum stops at the first empty cell it meets.', 'If the guess is wrong, tap the cells you really want.'],
      solution: [
        { tap: 'B7', say: 'Tap B7, under the Sales numbers.' },
        { tool: 'autosum', say: 'Tap Σ. It only guessed B5 to B6.' },
        { tap: 'B2', say: 'Tap B2 to start the range again...' },
        { key: ':' },
        { tap: 'B6', say: '...and finish it at B6.' },
        { key: 'enter', say: 'Enter. The whole week: 100.' },
      ],
    },
    choice({
      id: 'xl.u1.l4.e5',
      skill: AUTOSUM,
      sheet: table(['Day', 'Sales'], [['Mon', 20], ['Tue', 35], ['Wed', 15]], { footer: 'Total' }),
      prompt: 'Σ is pressed with B5 picked. Which cells will it guess?',
      options: ['B2 to B4', 'A2 to A4', 'B1 to B4', 'B2 to B5'],
      right: 0,
      hints: ['It looks for numbers directly above the cell.', 'The heading in B1 is a word, not a number.', 'It never includes the cell it is writing in.'],
      explain: 'Σ takes the run of numbers above the cell: B2 to B4. Words stop it.',
      tips: ['Always look at the range AutoSum guessed before you press Enter.', BASICS.headings],
    }),
    {
      id: 'xl.u1.l4.e6',
      type: 'grid-task',
      skill: AUTOSUM,
      sheet: tickets,
      tools: ['autosum'],
      prompt: 'Total both columns: Σ in B5, then Σ in C5.',
      checks: [
        { type: 'outcome', cell: 'B5', reference: '=SUM(B2:B4)' },
        { type: 'outcome', cell: 'C5', reference: '=SUM(C2:C4)' },
      ],
      hints: ['Do one column, then the other.', 'Tap B5, Σ, Enter. Then tap C5, Σ, Enter.', 'B5 is =SUM(B2:B4) and C5 is =SUM(C2:C4).'],
      explain: 'Two totals in six taps: 155 adult tickets and 67 child tickets.',
      tips: ['Σ is the Greek letter S. S for sum.', BASICS.free],
      solution: [
        { tap: 'B5', say: 'Tap B5, under the Adult numbers.' },
        { tool: 'autosum', say: 'Tap Σ.' },
        { key: 'enter', say: 'Enter.' },
        { tap: 'C5', say: 'Now tap C5, under the Child numbers.' },
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
      prompt: 'Use Σ to total the Adult tickets in B5.',
      checks: [{ type: 'outcome', cell: 'B5', reference: '=SUM(B2:B4)' }],
      hints: ['Pick the cell under the numbers first.', 'Tap B5 once, tap Σ, then press Enter.', '=SUM(B2:B4)'],
      explain: 'Σ added the three numbers above B5: 155.',
      tips: tipsFor(AUTOSUM),
      solution: [
        { tap: 'B5', say: 'Tap B5, under the Adult numbers.' },
        { tool: 'autosum', say: 'Tap Σ.' },
        { key: 'enter', say: 'Enter accepts the guess.' },
      ],
    },
    {
      id: 'xl.u1.l4.p2',
      type: 'grid-task',
      skill: AUTOSUM,
      sheet: laps,
      tools: ['autosum'],
      prompt: "Use Σ to add Ada's two heats in D2.",
      checks: [{ type: 'outcome', cell: 'D2', reference: '=SUM(B2:C2)' }],
      hints: ['Nothing is above D2, so Σ will look to the left.', 'Tap D2 once, tap Σ, then press Enter.', '=SUM(B2:C2)'],
      explain: 'Σ looked left and added B2 and C2: 26 laps.',
      tips: tipsFor(AUTOSUM),
      solution: [
        { tap: 'D2', say: "Tap D2, at the end of Ada's row." },
        { tool: 'autosum', say: 'Tap Σ. It looks left.' },
        { key: 'enter', say: 'Enter accepts the guess.' },
      ],
    },
  ],
};
