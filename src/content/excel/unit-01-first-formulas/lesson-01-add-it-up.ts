import type { CellInput, SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { table, task } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const ARITHMETIC = 'xl.formula.arithmetic';
const SUM_RANGE = 'xl.sum.range';

const bold = { bold: true };

/**
 * The roadside stall's week: what it took and what it cost to run. Profit and the totals
 * are filled in as the lesson goes on, and each task opens on the sheet the last one left.
 */
function week(extra: Record<string, CellInput> = {}): SheetSpec {
  return {
    cols: 4,
    rows: 7,
    grid: [
      ['Day', 'Takings', 'Costs', 'Profit'],
      ['Mon', 120, 80],
      ['Tue', 95, 60],
      ['Wed', 140, 90],
      ['Thu', 110, 70],
      ['Fri', 160, 100],
      ['Total'],
    ],
    cells: extra,
    formats: { 'A1:D1': bold, A7: bold },
  };
}

const PROFIT_ROWS = {
  D2: '=B2-C2',
  D3: '=B3-C3',
  D4: '=B4-C4',
  D5: '=B5-C5',
  D6: '=B6-C6',
};

/**
 * Fresh data for the last two exercises: the week's harvest and what it sold for. Seven
 * rows, like the week, so cells stay a comfortable size on a small phone with the keys open.
 */
function harvest(lastRow: string): SheetSpec {
  return {
    cols: 3,
    rows: 7,
    grid: [
      ['Produce', 'Picked (kg)', 'Takings'],
      ['Apples', 40, 120],
      ['Pears', 25, 50],
      ['Plums', 15, 45],
      ['Carrots', 30, 90],
      ['Potatoes', 50, 75],
      [lastRow],
    ],
    formats: { 'A1:C1': bold, A7: bold },
  };
}

/** Different numbers for the practice round: the pie kitchen's morning. */
const bakery = table(
  ['Pies', 'Baked', 'Sold', 'Left'],
  [
    ['Apple', 40, 28],
    ['Pear', 15, 9],
    ['Plum', 60, 45],
  ],
  { footer: 'Total' },
);

export const addItUp: Lesson = {
  id: 'xl.u1.l1',
  title: 'Add It Up',
  summary: 'Work out the stall’s profit and totals with your first formulas.',
  recap: [
    'Every formula starts with =. Tapping a cell adds its reference.',
    'A formula uses cell references, so it recalculates when a value changes.',
    'SUM adds a range, such as =SUM(D2:D6). Next: an average.',
  ],
  newSkills: [ARITHMETIC, SUM_RANGE],
  hideKeys: ['$', ','],
  exercises: [
    // Teach: a formula works something out from other cells.
    {
      id: 'xl.u1.l1.e1',
      type: 'demo',
      skill: ARITHMETIC,
      sheet: week(),
      script: [
        { say: 'The stall needs its profit: takings minus costs.' },
        { tap: 'D2', say: 'Select D2, the cell for Monday’s profit.' },
        { key: '=', say: '= starts a formula. The cell works it out.' },
        { tap: 'B2', say: 'Tap B2. Its reference goes into the formula.' },
        { key: '-', say: 'Then minus...' },
        { tap: 'C2', say: '...and Monday’s costs, in C2.' },
        { key: 'enter', say: 'Enter. D2 shows the result: 40.' },
      ],
      prompt: 'Your turn. Work out Tuesday’s profit in D3.',
      checks: [{ type: 'outcome', cell: 'D3', reference: '=B3-C3' }],
      hints: ['Profit is takings minus costs.', 'Select D3. Then = , the takings cell, - , the costs cell.', '=B3-C3'],
      explain: 'The formula uses cell references, not numbers. Change B3 and D3 recalculates.',
      tips: [FORMULAS.equals, FORMULAS.tapCell, 'Press Enter when the formula is finished.'],
      solution: [
        { tap: 'D3', say: 'Select D3.' },
        { key: '=', say: 'Start with =' },
        { tap: 'B3', say: 'Tuesday’s takings...' },
        { key: '-', say: '...minus...' },
        { tap: 'C3', say: '...Tuesday’s costs.' },
        { key: 'enter', say: 'Enter. 95 - 60 = 35.' },
      ],
    },
    {
      id: 'xl.u1.l1.e2',
      type: 'grid-task',
      skill: ARITHMETIC,
      sheet: week({ D2: '=B2-C2', D3: '=B3-C3' }),
      prompt: 'Work out Wednesday’s profit in D4.',
      checks: [{ type: 'outcome', cell: 'D4', reference: '=B4-C4' }],
      hints: ['The same calculation as the two rows above, one row down.', '= , Wednesday’s takings, - , Wednesday’s costs.', '=B4-C4'],
      explain: 'Same calculation, new row. Each row’s formula refers to its own cells.',
      tips: [FORMULAS.shows, BASICS.name, FORMULAS.swap],
      solution: [
        { tap: 'D4', say: 'Select D4.' },
        { key: '=', say: 'Start with =' },
        { tap: 'B4', say: 'Wednesday’s takings...' },
        { key: '-', say: '...minus...' },
        { tap: 'C4', say: '...Wednesday’s costs.' },
        { key: 'enter', say: 'Enter. 140 - 90 = 50.' },
      ],
    },
    {
      id: 'xl.u1.l1.e3',
      type: 'grid-task',
      skill: ARITHMETIC,
      sheet: week(PROFIT_ROWS),
      prompt: 'Add up the week’s takings in B7. Put + between the five cells.',
      checks: [{ type: 'outcome', cell: 'B7', reference: '=B2+B3+B4+B5+B6' }],
      hints: ['You need all five takings cells, Monday to Friday.', '= , B2 , + , B3 , + … and so on down to B6.', '=B2+B3+B4+B5+B6'],
      explain: 'That works, but it takes a lot of tapping. There is a quicker way to add many cells.',
      tips: [BASICS.backspace, FORMULAS.long, FORMULAS.updates],
      solution: [
        { tap: 'B7', say: 'Select B7.' },
        { key: '=', say: 'Start with =' },
        { tap: 'B2', say: 'Tap each takings cell, with + between.' },
        { key: '+' },
        { tap: 'B3' },
        { key: '+' },
        { tap: 'B4' },
        { key: '+' },
        { tap: 'B5' },
        { key: '+' },
        { tap: 'B6' },
        { key: 'enter', say: 'Enter. The week took 625.' },
      ],
    },
    // Teach: SUM and the range.
    {
      id: 'xl.u1.l1.e4',
      type: 'demo',
      skill: SUM_RANGE,
      sheet: week({ ...PROFIT_ROWS, B7: '=B2+B3+B4+B5+B6' }),
      script: [
        { tap: 'C7', say: 'Now the week’s costs, the quicker way.' },
        { key: 'SUM', say: 'SUM adds every cell in a range.' },
        { tap: 'C2', say: 'Tap the first cell...' },
        { key: ':', say: '...then the colon, which means “to”...' },
        { tap: 'C6', say: '...then the last cell. C2:C6 is a range.' },
        { key: 'enter', say: 'Enter. SUM adds C2 to C6: 400.' },
      ],
      prompt: 'Your turn. Total the Profit column in D7 with SUM.',
      checks: [
        { type: 'outcome', cell: 'D7', reference: '=SUM(D2:D6)' },
        { type: 'formulaUses', cell: 'D7', fn: 'SUM' },
      ],
      hints: ['SUM adds a whole range at once.', 'Tap SUM, the first Profit cell, : , then the last one.', '=SUM(D2:D6)'],
      explain: 'D2:D6 is a range: every cell from D2 to D6. SUM adds them all.',
      tips: [FORMULAS.colon, 'The SUM key types the = and the bracket for you.', FORMULAS.bracket],
      solution: [
        { tap: 'D7', say: 'Select D7.' },
        { key: 'SUM', say: 'Tap SUM.' },
        { tap: 'D2', say: 'The first Profit cell...' },
        { key: ':', say: '...the colon...' },
        { tap: 'D6', say: '...and the last Profit cell.' },
        { key: 'enter', say: 'Enter. The week’s profit is 225.' },
      ],
    },
    {
      id: 'xl.u1.l1.e5',
      type: 'grid-task',
      skill: SUM_RANGE,
      apply: true,
      sheet: harvest('Total'),
      prompt: 'This week’s harvest. Total the kilograms picked in B7 with SUM.',
      checks: [
        { type: 'outcome', cell: 'B7', reference: '=SUM(B2:B6)' },
        { type: 'formulaUses', cell: 'B7', fn: 'SUM' },
      ],
      hints: ['Which key adds a whole range?', 'SUM, the first Picked cell, : , the last Picked cell.', '=SUM(B2:B6)'],
      explain: 'One short formula, however many rows there are. That is why SUM is better than a chain of +.',
      tips: [FORMULAS.range, FORMULAS.check, 'SUM can add 5 cells or 500. The formula stays just as short.'],
      solution: [
        { tap: 'B7', say: 'Select B7.' },
        { key: 'SUM', say: 'Tap SUM.' },
        { tap: 'B2', say: 'The first Picked cell...' },
        { key: ':', say: '...the colon...' },
        { tap: 'B6', say: '...and the last one.' },
        { key: 'enter', say: 'Enter. 160 kg picked this week.' },
      ],
    },
    {
      id: 'xl.u1.l1.e6',
      type: 'grid-task',
      skill: SUM_RANGE,
      apply: true,
      sheet: harvest('Fruit'),
      prompt: 'Apples, pears and plums are the fruit. Total their takings in C7.',
      checks: [
        { type: 'outcome', cell: 'C7', reference: '=SUM(C2:C4)' },
        { type: 'formulaUses', cell: 'C7', fn: 'SUM' },
      ],
      hints: ['You do not need the whole column this time.', 'SUM, the apples’ takings, : , the plums’ takings.', '=SUM(C2:C4)'],
      explain: 'A range can be any block of cells next to each other. You decide where it starts and ends.',
      tips: ['A range has no gaps: every cell from the first to the last.', BASICS.labels, BASICS.free],
      solution: [
        { tap: 'C7', say: 'Select C7.' },
        { key: 'SUM', say: 'Tap SUM.' },
        { tap: 'C2', say: 'The apples’ takings...' },
        { key: ':', say: '...the colon...' },
        { tap: 'C4', say: '...to the plums’ takings. Stop there.' },
        { key: 'enter', say: 'Enter. The fruit took 215.' },
      ],
    },
  ],
  practice: [
    task({
      id: 'xl.u1.l1.p1',
      skill: ARITHMETIC,
      sheet: bakery,
      prompt: 'How many apple pies are left? Baked minus Sold, in D2.',
      cell: 'D2',
      formula: '=B2-C2',
      hints: ['Left is what was baked, minus what was sold.', 'Select D2. Then = , the Baked cell, - , the Sold cell.'],
      explain: 'Baked minus Sold: 40 - 28 leaves 12.',
      tips: tipsFor(ARITHMETIC),
    }),
    task({
      id: 'xl.u1.l1.p2',
      skill: SUM_RANGE,
      sheet: bakery,
      prompt: 'Total all the pies baked, in B5. Use SUM.',
      cell: 'B5',
      formula: '=SUM(B2:B4)',
      uses: 'SUM',
      hints: ['SUM adds a whole range at once.', 'Tap SUM, the first Baked cell, : , then the last one.'],
      explain: 'SUM adds B2 to B4: 115 pies in all.',
      tips: tipsFor(SUM_RANGE),
    }),
  ],
};
