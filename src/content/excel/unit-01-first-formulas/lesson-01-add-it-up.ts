import type { CellInput, SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { table, task } from '../build';
import { tipsFor } from '../tips';

const ARITHMETIC = 'xl.formula.arithmetic';
const SUM_RANGE = 'xl.sum.range';

const bold = { bold: true };

/** A market stall's week. Profit and the totals are filled in as the lesson goes on. */
function week(extra: Record<string, CellInput> = {}): SheetSpec {
  return {
    cols: 4,
    rows: 7,
    grid: [
      ['Day', 'Sales', 'Costs', 'Profit'],
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
 * Fresh data for the last two exercises: what a cafe sold. Seven rows, like the week,
 * so cells stay a comfortable size on a small phone with the keyboard open.
 */
function cafe(lastRow: string): SheetSpec {
  return {
    cols: 3,
    rows: 7,
    grid: [
      ['Item', 'Units', 'Sales'],
      ['Coffee', 40, 120],
      ['Tea', 25, 50],
      ['Hot choc', 15, 45],
      ['Muffins', 30, 90],
      ['Cookies', 50, 75],
      [lastRow],
    ],
    formats: { 'A1:C1': bold, A7: bold },
  };
}

/** Different numbers for the practice round: a bakery's morning. */
const bakery = table(
  ['Bake', 'Made', 'Sold', 'Left'],
  [
    ['Buns', 40, 28],
    ['Pies', 15, 9],
    ['Rolls', 60, 45],
  ],
  { footer: 'Total' },
);

export const addItUp: Lesson = {
  id: 'xl.u1.l1',
  title: 'Add it up',
  summary: 'Your first formulas: take away, add, and total a whole column.',
  recap: [
    'Every formula starts with =.',
    'A formula uses cells, not typed numbers, so it updates by itself.',
    'SUM adds every cell in a range, like =SUM(D2:D6).',
  ],
  newSkills: [ARITHMETIC, SUM_RANGE],
  hideKeys: ['$', ','],
  exercises: [
    {
      id: 'xl.u1.l1.e1',
      type: 'demo',
      skill: ARITHMETIC,
      sheet: week(),
      script: [
        { tap: 'D2', say: 'Each box is a cell. This one is D2: column D, row 2.' },
        { tap: 'D2', say: 'Tap it again to type in it.' },
        { key: '=', say: '= starts a formula. It tells the cell to work something out.' },
        { tap: 'B2', say: "Tap B2 to use Monday's sales." },
        { key: '-', say: 'Minus...' },
        { tap: 'C2', say: "...Monday's costs." },
        { key: 'enter', say: 'Enter. The cell works out the answer: 40.' },
      ],
      prompt: "Your turn. Work out Tuesday's profit in D3.",
      checks: [{ type: 'outcome', cell: 'D3', reference: '=B3-C3' }],
      hints: [
        'Profit is sales minus costs.',
        'Tap D3 twice. Then = , the sales cell, - , the costs cell.',
        '=B3-C3',
      ],
      explain: 'A formula uses the cells, not the numbers in them. Change B3 and D3 updates by itself.',
      tips: [
        'Every formula starts with =',
        'Tap a cell once to pick it. Tap it again to type in it.',
        'Press Enter when your formula is finished.',
      ],
      solution: [
        { tap: 'D3', say: 'Tap D3, then tap it again to type.' },
        { tap: 'D3' },
        { key: '=', say: 'Start with =' },
        { tap: 'B3', say: "Tuesday's sales..." },
        { key: '-', say: '...minus...' },
        { tap: 'C3', say: "...Tuesday's costs." },
        { key: 'enter', say: 'Enter. 95 - 60 = 35.' },
      ],
    },
    {
      id: 'xl.u1.l1.e2',
      type: 'grid-task',
      skill: ARITHMETIC,
      sheet: week({ D2: '=B2-C2', D3: '=B3-C3' }),
      prompt: "Work out Wednesday's profit in D4.",
      checks: [{ type: 'outcome', cell: 'D4', reference: '=B4-C4' }],
      hints: [
        'Same idea as the two rows above, one row down.',
        "= , Wednesday's sales, - , Wednesday's costs.",
        '=B4-C4',
      ],
      explain: "Same shape, new row. Each row's formula points at its own cells.",
      tips: [
        'Tap a cell to put it in your formula. No need to type its name.',
        "A cell's name is its column letter, then its row number.",
        'The cell shows the answer. The bar above it shows the formula.',
      ],
      solution: [
        { tap: 'D4', say: 'Tap D4, then tap it again to type.' },
        { tap: 'D4' },
        { key: '=', say: 'Start with =' },
        { tap: 'B4', say: "Wednesday's sales..." },
        { key: '-', say: '...minus...' },
        { tap: 'C4', say: "...Wednesday's costs." },
        { key: 'enter', say: 'Enter. 140 - 90 = 50.' },
      ],
    },
    {
      id: 'xl.u1.l1.e3',
      type: 'grid-task',
      skill: ARITHMETIC,
      sheet: week(PROFIT_ROWS),
      prompt: "Add up the week's sales in B7. Put + between the five cells.",
      checks: [{ type: 'outcome', cell: 'B7', reference: '=B2+B3+B4+B5+B6' }],
      hints: [
        'You need all five Sales cells, Monday to Friday.',
        '= , tap B2, + , tap B3, + ... all the way down to B6.',
        '=B2+B3+B4+B5+B6',
      ],
      explain: "That works, but it's a lot of tapping. Next: a quicker way to add many cells.",
      tips: [
        'Tapped the wrong thing? The ⌫ key takes it back out.',
        'A formula can be as long as you need.',
        "Change a number and the formula's answer updates by itself.",
      ],
      solution: [
        { tap: 'B7', say: 'Tap B7, then tap it again to type.' },
        { tap: 'B7' },
        { key: '=', say: 'Start with =' },
        { tap: 'B2', say: 'Tap each Sales cell, with + in between.' },
        { key: '+' },
        { tap: 'B3' },
        { key: '+' },
        { tap: 'B4' },
        { key: '+' },
        { tap: 'B5' },
        { key: '+' },
        { tap: 'B6' },
        { key: 'enter', say: 'Enter. The week adds up to 625.' },
      ],
    },
    {
      id: 'xl.u1.l1.e4',
      type: 'demo',
      skill: SUM_RANGE,
      sheet: week({ ...PROFIT_ROWS, B7: '=B2+B3+B4+B5+B6' }),
      script: [
        { tap: 'C7', say: 'Now the Costs total, the quick way.' },
        { tap: 'C7' },
        { key: 'SUM', say: 'SUM adds up a whole group of cells.' },
        { tap: 'C2', say: 'Tap the first cell...' },
        { key: ':', say: '...then the colon, which means "through"...' },
        { tap: 'C6', say: '...then the last cell. C2:C6 is called a range.' },
        { key: 'enter', say: 'Enter. SUM adds C2 through C6: 400.' },
      ],
      prompt: 'Your turn. Total the Profit column in D7 with SUM.',
      checks: [
        { type: 'outcome', cell: 'D7', reference: '=SUM(D2:D6)' },
        { type: 'formulaUses', cell: 'D7', fn: 'SUM' },
      ],
      hints: [
        'SUM adds a whole range in one go.',
        'Tap SUM, tap the first Profit cell, press : and tap the last one.',
        '=SUM(D2:D6)',
      ],
      explain: 'D2:D6 is a range: every cell from D2 through D6. SUM adds them all.',
      tips: [
        'A colon means "through". A1:A3 is A1, A2 and A3.',
        'The SUM key types the = and the bracket for you.',
        'No need to close the bracket. Enter does it for you.',
      ],
      solution: [
        { tap: 'D7', say: 'Tap D7, then tap it again to type.' },
        { tap: 'D7' },
        { key: 'SUM', say: 'Tap SUM.' },
        { tap: 'D2', say: 'First Profit cell...' },
        { key: ':', say: '...colon...' },
        { tap: 'D6', say: '...last Profit cell.' },
        { key: 'enter', say: 'Enter. The profit for the week is 225.' },
      ],
    },
    {
      id: 'xl.u1.l1.e5',
      type: 'grid-task',
      skill: SUM_RANGE,
      sheet: cafe('Total'),
      prompt: 'New sheet: a cafe. Total the Units in B7 with SUM.',
      checks: [
        { type: 'outcome', cell: 'B7', reference: '=SUM(B2:B6)' },
        { type: 'formulaUses', cell: 'B7', fn: 'SUM' },
      ],
      hints: [
        'Which key adds up a whole range?',
        'SUM, the first Units cell, : , the last Units cell.',
        '=SUM(B2:B6)',
      ],
      explain: 'One short formula, however many rows there are. That is why SUM beats a chain of +.',
      tips: [
        'A range is the first cell, a colon, then the last cell.',
        'Tapped the wrong cell? Tap the right one and it swaps.',
        'SUM can add 5 cells or 500. The formula stays just as short.',
      ],
      solution: [
        { tap: 'B7', say: 'Tap B7, then tap it again to type.' },
        { tap: 'B7' },
        { key: 'SUM', say: 'Tap SUM.' },
        { tap: 'B2', say: 'First Units cell...' },
        { key: ':', say: '...colon...' },
        { tap: 'B6', say: '...last Units cell.' },
        { key: 'enter', say: 'Enter. 160 units sold.' },
      ],
    },
    {
      id: 'xl.u1.l1.e6',
      type: 'grid-task',
      skill: SUM_RANGE,
      sheet: cafe('Drinks'),
      prompt: 'Coffee, Tea and Hot choc are the drinks. Total their Sales in C7.',
      checks: [
        { type: 'outcome', cell: 'C7', reference: '=SUM(C2:C4)' },
        { type: 'formulaUses', cell: 'C7', fn: 'SUM' },
      ],
      hints: [
        "You don't need the whole column this time.",
        "SUM, the first drink's Sales, : , the last drink's Sales.",
        '=SUM(C2:C4)',
      ],
      explain: 'A range can be any block of cells. You decide where it starts and stops.',
      tips: [
        'A range is one block of cells, with no gaps in it.',
        'Read the labels in column A to find the rows you need.',
        'A wrong answer costs nothing. Fix it and check again.',
      ],
      solution: [
        { tap: 'C7', say: 'Tap C7, then tap it again to type.' },
        { tap: 'C7' },
        { key: 'SUM', say: 'Tap SUM.' },
        { tap: 'C2', say: "Coffee's sales..." },
        { key: ':', say: '...colon...' },
        { tap: 'C4', say: "...Hot choc's sales. Stop there." },
        { key: 'enter', say: 'Enter. Drinks made 215.' },
      ],
    },
  ],
  practice: [
    task({
      id: 'xl.u1.l1.p1',
      skill: ARITHMETIC,
      sheet: bakery,
      prompt: 'How many Buns are left? Made minus Sold, in D2.',
      cell: 'D2',
      formula: '=B2-C2',
      hints: ['Left is what was made, minus what was sold.', 'Tap D2 twice. Then = , the Made cell, - , the Sold cell.'],
      explain: 'Made minus Sold: 40 - 28 leaves 12.',
      tips: tipsFor(ARITHMETIC),
    }),
    task({
      id: 'xl.u1.l1.p2',
      skill: SUM_RANGE,
      sheet: bakery,
      prompt: 'Total everything that was Made, in B5. Use SUM.',
      cell: 'B5',
      formula: '=SUM(B2:B4)',
      uses: 'SUM',
      hints: ['SUM adds a whole range in one go.', 'Tap SUM, the first Made cell, press : and tap the last one.'],
      explain: 'SUM adds B2 through B4: 115 bakes in all.',
      tips: tipsFor(SUM_RANGE),
    }),
  ],
};
