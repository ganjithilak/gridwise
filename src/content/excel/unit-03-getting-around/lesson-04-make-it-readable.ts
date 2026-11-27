import type { CellInput, SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { choice } from '../build';
import { BASICS, tipsFor } from '../tips';

const BOLD = 'xl.bold';
const NUMFMT = 'xl.numfmt';

/** A sheet with no formatting at all: making it readable is the exercise. */
const plain = (grid: CellInput[][]): SheetSpec => ({ cols: grid[0].length, rows: grid.length, grid });

/** The month's running costs, and each one's share of the farm's budget. */
const bills = plain([
  ['Cost', 'Amount', 'Share'],
  ['Feed', 600, 0.5],
  ['Fuel', 300, 0.25],
  ['Seed', 60, 0.05],
  ['Total', 960, 0.8],
]);

/** The stall's price list, before anyone has formatted it. */
const prices = plain([
  ['Produce', 'Price'],
  ['Carrots', 3],
  ['Apples', 4.5],
  ['Tomatoes', 6],
]);

/** Practice: each fruit's share of the orchard. */
const votes = plain([
  ['Fruit', 'Share'],
  ['Apples', 0.6],
  ['Pears', 0.3],
  ['Plums', 0.1],
]);

/** The costs of a day at the farmers' market. */
const trip = plain([
  ['Cost', 'Amount'],
  ['Stall fee', 42],
  ['Fuel', 120],
  ['Lunch', 35.5],
]);

export const makeItReadable: Lesson = {
  id: 'xl.u3.l4',
  title: 'Make It Readable',
  summary: 'Tidy the farm’s records: bold headings, currency and percentages.',
  recap: [
    'Bold makes headings and totals stand out.',
    'A format changes how a number looks, never the number itself.',
    'Currency format adds $ and two decimals. 0.25 as a percentage is 25%.',
  ],
  newSkills: [BOLD, NUMFMT],
  hideKeys: ['=', '+', '-', '*', '/', '(', ')', ':', ',', '$', 'SUM'],
  exercises: [
    {
      id: 'xl.u3.l4.e1',
      type: 'demo',
      skill: BOLD,
      sheet: bills,
      tools: ['bold'],
      script: [
        { drag: 'A1:C1', say: 'Select the headings: drag from A1 to C1.' },
        { tool: 'bold', say: 'B makes them bold, so they stand out.' },
      ],
      prompt: 'Your turn. Make the Total row bold: A5 across to C5.',
      checks: [{ type: 'cellFormat', range: 'A5:C5', bold: true }],
      hints: ['Select all three cells of the Total row first.', 'Drag from A5 across to C5, then tap B.', 'Total, 960 and 0.8 should all be bold.'],
      explain: 'Select first, then press B. Everything selected turns bold together.',
      tips: ['Bold is for headings and totals: what a reader looks for first.', 'Select the cells first, then press the button.'],
      solution: [
        { drag: 'A5:C5', say: 'Drag from A5 across to C5.' },
        { tool: 'bold', say: 'Tap B.' },
      ],
    },
    {
      id: 'xl.u3.l4.e2',
      type: 'grid-task',
      skill: BOLD,
      sheet: prices,
      tools: ['bold'],
      prompt: 'The stall’s price list. Make both headings bold.',
      checks: [{ type: 'cellFormat', range: 'A1:B1', bold: true }],
      hints: ['The headings are the two cells in row 1.', 'Drag from A1 across to B1, then tap B.', 'Produce and Price should both be bold.'],
      explain: 'Bold headings tell the reader at a glance what each column is.',
      tips: ['Pressing B again takes the bold off.', BASICS.headings],
      solution: [
        { drag: 'A1:B1', say: 'Drag from A1 across to B1.' },
        { tool: 'bold', say: 'Tap B.' },
      ],
    },
    {
      id: 'xl.u3.l4.e3',
      type: 'demo',
      skill: NUMFMT,
      sheet: bills,
      tools: ['currency', 'percent'],
      script: [
        { drag: 'B2:B5', say: 'These are amounts of money. Select them.' },
        { tool: 'currency', say: '$ applies currency format. The values stay.' },
      ],
      prompt: 'Your turn. Show the Share column as percentages: C2 down to C5.',
      checks: [{ type: 'cellFormat', range: 'C2:C5', numFmt: 'percent' }],
      hints: ['Select the four Share numbers first.', 'Drag from C2 down to C5, then tap %.', '0.5 should now read 50%.'],
      explain: '0.5 and 50% are the same number. The format only changes how it looks.',
      tips: ['A format changes how a number looks, never the number itself.', '0.25 shown as a percentage is 25%.'],
      solution: [
        { drag: 'C2:C5', say: 'Drag from C2 down to C5.' },
        { tool: 'percent', say: 'Tap %.' },
      ],
    },
    {
      id: 'xl.u3.l4.e4',
      type: 'grid-task',
      skill: NUMFMT,
      sheet: prices,
      tools: ['currency'],
      prompt: 'Show the three prices in currency format.',
      checks: [{ type: 'cellFormat', range: 'B2:B4', numFmt: 'currency' }],
      hints: ['Select the three Price numbers first.', 'Drag from B2 down to B4, then tap $.', '4.5 should now read $4.50.'],
      explain: 'Currency format adds the $ sign and always shows two decimal places.',
      tips: ['Currency format adds the $ sign and two decimal places.', 'To format many cells at once, select them all first.'],
      solution: [
        { drag: 'B2:B4', say: 'Drag from B2 down to B4.' },
        { tool: 'currency', say: 'Tap $.' },
      ],
    },
    choice({
      id: 'xl.u3.l4.e5',
      skill: NUMFMT,
      prompt: 'A cell holds 0.25 and is shown as a percentage. What do you see?',
      options: ['25%', '0.25%', '2.5%', '250%'],
      right: 0,
      hints: ['A percentage is “out of 100”.', '0.25 is a quarter.', 'A quarter of 100 is 25.'],
      explain: 'Per cent means “out of 100”, so 0.25 shows as 25%.',
      tips: ['The formula bar shows the real value, whatever the format.', BASICS.bar],
    }),
    {
      id: 'xl.u3.l4.e6',
      type: 'grid-task',
      skill: NUMFMT,
      sheet: trip,
      tools: ['bold', 'currency'],
      prompt: 'A day at the market. Bold the headings, and show the costs as currency.',
      checks: [
        { type: 'cellFormat', range: 'A1:B1', bold: true },
        { type: 'cellFormat', range: 'B2:B4', numFmt: 'currency' },
      ],
      hints: ['Two jobs: the headings, then the amounts.', 'Drag A1 to B1 and tap B. Then drag B2 to B4 and tap $.', 'Cost and Amount in bold, and $42.00, $120.00, $35.50.'],
      explain: 'Bold headings and currency format: the same values, far easier to read.',
      tips: ['One job at a time: select, press, then select the next cells.', BASICS.free],
      solution: [
        { drag: 'A1:B1', say: 'Drag across the two headings.' },
        { tool: 'bold', say: 'Tap B.' },
        { drag: 'B2:B4', say: 'Now drag down the three costs.' },
        { tool: 'currency', say: 'Tap $.' },
      ],
    },
  ],
  practice: [
    {
      id: 'xl.u3.l4.p1',
      type: 'grid-task',
      skill: BOLD,
      sheet: votes,
      tools: ['bold'],
      prompt: 'Make both headings bold.',
      checks: [{ type: 'cellFormat', range: 'A1:B1', bold: true }],
      hints: ['The headings are the two cells in row 1.', 'Drag from A1 across to B1, then tap B.', 'Fruit and Share should both be bold.'],
      explain: 'Select, then press B.',
      tips: tipsFor(BOLD),
      solution: [
        { drag: 'A1:B1', say: 'Drag from A1 across to B1.' },
        { tool: 'bold', say: 'Tap B.' },
      ],
    },
    {
      id: 'xl.u3.l4.p2',
      type: 'grid-task',
      skill: NUMFMT,
      sheet: votes,
      tools: ['percent'],
      prompt: 'Show the three Share numbers as percentages.',
      checks: [{ type: 'cellFormat', range: 'B2:B4', numFmt: 'percent' }],
      hints: ['Select the three Share numbers first.', 'Drag from B2 down to B4, then tap %.', '0.6 should now read 60%.'],
      explain: '0.6, 0.3 and 0.1 now read 60%, 30% and 10%.',
      tips: tipsFor(NUMFMT),
      solution: [
        { drag: 'B2:B4', say: 'Drag from B2 down to B4.' },
        { tool: 'percent', say: 'Tap %.' },
      ],
    },
  ],
};
