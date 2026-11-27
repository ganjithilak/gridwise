import type { SheetSpec } from '@/engine';
import { LIMITS, type Checkpoint } from '@/lessons/types';

import { predict, table, task } from '../build';
import { tipsFor } from '../tips';

const bold = { bold: true };

/** Crates picked against each crop's target. */
const gym = table(['Crop', 'Crates', 'Target', 'Met?'], [['Tomatoes', 14, 12], ['Potatoes', 9, 12], ['Carrots', 12, 12]]);
/** Quality scores for the next bins of apples. */
const grades = table(['Bin', 'Score', 'Result'], [['Bin 4', 38], ['Bin 5', 64], ['Bin 6', 40]]);
/** The jobs list for the week. */
const tasks = table(['Job', 'Status'], [['Fencing', 'Done'], ['Pruning', 'Open'], ['Spraying', 'Done'], ['Mowing', 'Done']], { footer: 'Done' });
/** The month's spending, by kind. */
const spend = table(['Kind', 'Cost'], [['Feed', 30], ['Fuel', 45], ['Feed', 25], ['Rent', 400]], { footer: 'Feed cost' });
/** Takings per staff member at each market. Saturday's stall ran on an honesty box. */
const ratio = table(['Market', 'Takings', 'Staff', 'Each'], [['Fri', 900, 3], ['Sat', 500, 0], ['Sun', 800, 4]]);

const prices: SheetSpec = {
  cols: 5,
  rows: 5,
  grid: [
    ['Item', 'Price', '', 'Find', 'Price'],
    ['Jam', 6, null, 'Milk'],
    ['Milk', 2, null, 'Oil'],
    ['Oil', 9],
    ['Pie', 4],
  ],
  formats: { 'A1:E1': bold },
};

/** The test at the end of Unit 2. Pass it without the lessons and the unit is skipped. */
export const unit2Test: Checkpoint = {
  id: 'xl.u2.test',
  title: 'Make It Think: Test',
  passMark: LIMITS.checkpointPassMark,
  exercises: [
    task({
      id: 'xl.u2.test.e1',
      skill: 'xl.compare',
      sheet: gym,
      prompt: 'Did the tomatoes pick more than their target? Ask in D2.',
      cell: 'D2',
      formula: '=B2>C2',
      moreChips: ['<'],
      hints: ['You are asking: is Crates greater than Target?', 'Select D2. Then = , the Crates cell, > , the Target cell.'],
      explain: '14 is more than 12, so the answer is TRUE.',
      tips: tipsFor('xl.compare'),
    }),
    predict({
      id: 'xl.u2.test.e2',
      skill: 'xl.compare',
      sheet: gym,
      prompt: 'This formula is in D4. What will it show?',
      cell: 'D4',
      formula: '=B4>=C4',
      options: ['TRUE', 'FALSE', '12', '0'],
      hints: ['>= means “at least”.', 'Both cells hold 12.', 'Is 12 at least 12?'],
      explain: '12 is at least 12, so >= gives TRUE.',
      tips: tipsFor('xl.compare'),
    }),
    task({
      id: 'xl.u2.test.e3',
      skill: 'xl.if',
      sheet: grades,
      prompt: 'Show "Pass" if the score is at least 40, otherwise "Fail". Use C2.',
      cell: 'C2',
      formula: '=IF(B2>=40,"Pass","Fail")',
      uses: 'IF',
      hints: ['Three parts: the question, the text if true, the text if not.', 'IF , B2 >= 40 , comma , "Pass" , comma , "Fail"'],
      explain: '38 is not at least 40, so IF shows the second answer: Fail.',
      tips: tipsFor('xl.if'),
    }),
    task({
      id: 'xl.u2.test.e4',
      skill: 'xl.countif',
      sheet: tasks,
      prompt: 'How many jobs are Done? Count them in B6.',
      cell: 'B6',
      formula: '=COUNTIF(B2:B5,"Done")',
      uses: 'COUNTIF',
      moreChips: ['"Open"'],
      hints: ['Where to look, then what to look for.', 'COUNTIF , the Status cells , comma , "Done"'],
      explain: 'Three of the four Status cells say Done.',
      tips: tipsFor('xl.countif'),
    }),
    task({
      id: 'xl.u2.test.e5',
      skill: 'xl.sumif',
      sheet: spend,
      prompt: 'Add up the cost of everything marked Feed, in B6.',
      cell: 'B6',
      formula: '=SUMIF(A2:A5,"Feed",B2:B5)',
      uses: 'SUMIF',
      hints: ['Three parts: where to look, what for, and what to add up.', 'SUMIF , the Kinds , comma , "Feed" , comma , the Costs'],
      explain: 'The two Feed rows cost 30 and 25: 55 in all.',
      tips: tipsFor('xl.sumif'),
    }),
    task({
      id: 'xl.u2.test.e6',
      skill: 'xl.xlookup',
      sheet: prices,
      prompt: 'Look up the price of the item in D2, in E2.',
      cell: 'E2',
      formula: '=XLOOKUP(D2,A2:A5,B2:B5)',
      uses: 'XLOOKUP',
      hints: ['Three parts: what to find, where to look, where the answer is.', 'XLOOKUP , D2 , comma , the Items , comma , the Prices'],
      explain: 'It found Milk in the Items and returned its price: 2.',
      tips: tipsFor('xl.xlookup'),
    }),
    task({
      id: 'xl.u2.test.e7',
      skill: 'xl.vlookup',
      sheet: prices,
      prompt: 'Look up the price of the item in D3, with VLOOKUP.',
      cell: 'E3',
      formula: '=VLOOKUP(D3,A2:B5,2,FALSE)',
      uses: 'VLOOKUP',
      hints: ['Four parts: what to find, the whole table, which column, FALSE.', 'VLOOKUP , D3 , comma , A2 : B5 , comma , 2 , comma , FALSE'],
      explain: 'VLOOKUP found Oil in the first column and read the 2nd: 9.',
      tips: tipsFor('xl.vlookup'),
    }),
    task({
      id: 'xl.u2.test.e8',
      skill: 'xl.iferror',
      sheet: ratio,
      prompt: 'Saturday had no staff. Write Each in D3 so it shows 0, not an error.',
      cell: 'D3',
      formula: '=IFERROR(B3/C3,0)',
      uses: 'IFERROR',
      hints: ['Each is Takings divided by Staff, wrapped in IFERROR.', 'IFERROR , B3 / C3 , comma , 0'],
      explain: '500 divided by 0 fails, so IFERROR shows the 0 you gave it.',
      tips: tipsFor('xl.iferror'),
    }),
  ],
};
