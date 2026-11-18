import type { CellInput, SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { choice } from '../build';
import { BASICS, tipsFor } from '../tips';

const BOLD = 'xl.bold';
const NUMFMT = 'xl.numfmt';

/** A sheet with no formatting at all: making it readable is the exercise. */
const plain = (grid: CellInput[][]): SheetSpec => ({ cols: grid[0].length, rows: grid.length, grid });

const bills = plain([
  ['Item', 'Cost', 'Share'],
  ['Rent', 600, 0.5],
  ['Food', 300, 0.25],
  ['Bus', 60, 0.05],
  ['Total', 960, 0.8],
]);

const prices = plain([
  ['Item', 'Price'],
  ['Tea', 3],
  ['Cake', 4.5],
  ['Soup', 7],
]);

const votes = plain([
  ['Choice', 'Share'],
  ['Yes', 0.6],
  ['No', 0.3],
  ['Unsure', 0.1],
]);

const trip = plain([
  ['Part', 'Cost'],
  ['Train', 42],
  ['Hotel', 120],
  ['Food', 35.5],
]);

export const makeItReadable: Lesson = {
  id: 'xl.u3.l4',
  title: 'Make it readable',
  summary: 'Bold headings, and numbers shown as money or percentages.',
  recap: [
    'Bold makes headings and totals stand out.',
    'A format changes how a number looks, never the number itself.',
    'Money format adds $ and two decimals. 0.25 as a percent is 25%.',
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
        { drag: 'A1:C1', say: 'Pick the headings: drag from A1 across to C1.' },
        { tool: 'bold', say: 'B makes them bold, so they stand out from the data.' },
      ],
      prompt: 'Your turn. Make the Total row bold: A5 across to C5.',
      checks: [{ type: 'cellFormat', range: 'A5:C5', bold: true }],
      hints: ['Pick all three cells of the Total row first.', 'Drag from A5 across to C5, then tap B.', 'Total, 960 and 0.8 should all be bold.'],
      explain: 'Pick first, then press B. Everything picked turns bold together.',
      tips: ['Bold is for headings and totals: the things eyes look for first.', 'Pick the cells first, then press the button.'],
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
      prompt: 'New sheet: a menu. Make both headings bold.',
      checks: [{ type: 'cellFormat', range: 'A1:B1', bold: true }],
      hints: ['The headings are the two cells in row 1.', 'Drag from A1 across to B1, then tap B.', 'Item and Price should both be bold.'],
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
        { drag: 'B2:B5', say: 'These are amounts of money. Pick them.' },
        { tool: 'currency', say: '$ shows them as money. The numbers themselves do not change.' },
      ],
      prompt: 'Your turn. Show the Share column as percentages: C2 down to C5.',
      checks: [{ type: 'cellFormat', range: 'C2:C5', numFmt: 'percent' }],
      hints: ['Pick the four Share numbers first.', 'Drag from C2 down to C5, then tap %.', '0.5 should now read 50%.'],
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
      prompt: 'Show the three prices as money.',
      checks: [{ type: 'cellFormat', range: 'B2:B4', numFmt: 'currency' }],
      hints: ['Pick the three Price numbers first.', 'Drag from B2 down to B4, then tap $.', '4.5 should now read $4.50.'],
      explain: 'Money format adds the $ sign and always shows two decimal places.',
      tips: ['Money format adds the $ sign and two decimal places.', 'Formatting many cells at once: drag to pick them all first.'],
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
      hints: ['A percentage is "out of 100".', '0.25 is a quarter.', 'A quarter of 100 is 25.'],
      explain: 'Percent means "out of 100", so 0.25 shows as 25%.',
      tips: ['The bar still shows the real number, whatever the format.', BASICS.bar],
    }),
    {
      id: 'xl.u3.l4.e6',
      type: 'grid-task',
      skill: NUMFMT,
      sheet: trip,
      tools: ['bold', 'currency'],
      prompt: 'Tidy this sheet: bold headings, and the three costs as money.',
      checks: [
        { type: 'cellFormat', range: 'A1:B1', bold: true },
        { type: 'cellFormat', range: 'B2:B4', numFmt: 'currency' },
      ],
      hints: ['Two jobs: the headings, then the Cost numbers.', 'Drag A1 to B1 and tap B. Then drag B2 to B4 and tap $.', 'Part and Cost in bold, and $42.00, $120.00, $35.50.'],
      explain: 'Bold headings and money format: the same numbers, far easier to read.',
      tips: ['Do one thing at a time: pick, press, then pick the next cells.', BASICS.free],
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
      hints: ['The headings are the two cells in row 1.', 'Drag from A1 across to B1, then tap B.', 'Choice and Share should both be bold.'],
      explain: 'Pick, then press B.',
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
      hints: ['Pick the three Share numbers first.', 'Drag from B2 down to B4, then tap %.', '0.6 should now read 60%.'],
      explain: '0.6, 0.3 and 0.1 now read 60%, 30% and 10%.',
      tips: tipsFor(NUMFMT),
      solution: [
        { drag: 'B2:B4', say: 'Drag from B2 down to B4.' },
        { tool: 'percent', say: 'Tap %.' },
      ],
    },
  ],
};
