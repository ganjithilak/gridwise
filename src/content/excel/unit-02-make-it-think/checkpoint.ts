import type { SheetSpec } from '@/engine';
import { LIMITS, type Checkpoint } from '@/lessons/types';

import { predict, table, task } from '../build';
import { tipsFor } from '../tips';

const bold = { bold: true };

const gym = table(['Member', 'Visits', 'Goal', 'Met?'], [['Ida', 14, 12], ['Jay', 9, 12], ['Kit', 12, 12]]);
const grades = table(['Pupil', 'Mark', 'Result'], [['Uma', 38], ['Vic', 64], ['Wes', 40]]);
const tasks = table(['Task', 'Status'], [['Paint', 'Done'], ['Tile', 'Open'], ['Wire', 'Done'], ['Sand', 'Done']], { footer: 'Done' });
const spend = table(['Kind', 'Cost'], [['Food', 30], ['Fuel', 45], ['Food', 25], ['Rent', 400]], { footer: 'Food cost' });
const ratio = table(['Shop', 'Sales', 'Staff', 'Each'], [['East', 900, 3], ['West', 500, 0], ['Mid', 800, 4]]);

const prices: SheetSpec = {
  cols: 5,
  rows: 5,
  grid: [
    ['Fruit', 'Price', '', 'Find', 'Price'],
    ['Kiwi', 2, null, 'Lime'],
    ['Lime', 1, null, 'Fig'],
    ['Fig', 4],
    ['Pear', 3],
  ],
  formats: { 'A1:E1': bold },
};

/** The test at the end of Unit 2. Pass it without the lessons and the unit is skipped. */
export const unit2Test: Checkpoint = {
  id: 'xl.u2.test',
  title: 'Make it think: test',
  passMark: LIMITS.checkpointPassMark,
  exercises: [
    task({
      id: 'xl.u2.test.e1',
      skill: 'xl.compare',
      sheet: gym,
      prompt: 'Did Ida go more often than her Goal? Ask in D2.',
      cell: 'D2',
      formula: '=B2>C2',
      moreChips: ['<'],
      hints: ['You are asking: are the Visits greater than the Goal?', 'Tap D2 twice. Then = , the Visits cell, > , the Goal cell.'],
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
      hints: ['>= means "at least".', 'Both cells hold 12.', 'Is 12 at least 12?'],
      explain: '12 is at least 12, so >= gives TRUE.',
      tips: tipsFor('xl.compare'),
    }),
    task({
      id: 'xl.u2.test.e3',
      skill: 'xl.if',
      sheet: grades,
      prompt: 'Show "Pass" if the Mark is at least 40, else "Fail". Use C2.',
      cell: 'C2',
      formula: '=IF(B2>=40,"Pass","Fail")',
      uses: 'IF',
      hints: ['Three parts: the question, the word if true, the word if not.', 'IF , B2 >= 40 , comma , "Pass" , comma , "Fail"'],
      explain: '38 is not at least 40, so IF shows the second word: Fail.',
      tips: tipsFor('xl.if'),
    }),
    task({
      id: 'xl.u2.test.e4',
      skill: 'xl.countif',
      sheet: tasks,
      prompt: 'How many tasks are Done? Count them in B6.',
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
      prompt: 'Add up the Cost of everything marked Food, in B6.',
      cell: 'B6',
      formula: '=SUMIF(A2:A5,"Food",B2:B5)',
      uses: 'SUMIF',
      hints: ['Three parts: where to look, what for, and what to add up.', 'SUMIF , Kinds , comma , "Food" , comma , Costs'],
      explain: 'The two Food rows cost 30 and 25: 55 in all.',
      tips: tipsFor('xl.sumif'),
    }),
    task({
      id: 'xl.u2.test.e6',
      skill: 'xl.xlookup',
      sheet: prices,
      prompt: 'Look up the Price of the fruit in D2, in E2.',
      cell: 'E2',
      formula: '=XLOOKUP(D2,A2:A5,B2:B5)',
      uses: 'XLOOKUP',
      hints: ['Three parts: what to find, where to look, where the answer is.', 'XLOOKUP , D2 , comma , the Fruits , comma , the Prices'],
      explain: 'It found Lime in the Fruits and brought back its Price: 1.',
      tips: tipsFor('xl.xlookup'),
    }),
    task({
      id: 'xl.u2.test.e7',
      skill: 'xl.vlookup',
      sheet: prices,
      prompt: 'Look up the Price of the fruit in D3, with VLOOKUP.',
      cell: 'E3',
      formula: '=VLOOKUP(D3,A2:B5,2,FALSE)',
      uses: 'VLOOKUP',
      hints: ['Four parts: what to find, the whole table, which column, FALSE.', 'VLOOKUP , D3 , comma , A2 : B5 , comma , 2 , comma , FALSE'],
      explain: 'VLOOKUP found Fig in the first column and read the 2nd: 4.',
      tips: tipsFor('xl.vlookup'),
    }),
    task({
      id: 'xl.u2.test.e8',
      skill: 'xl.iferror',
      sheet: ratio,
      prompt: 'West has no Staff. Write Each in D3 so it shows 0, not an error.',
      cell: 'D3',
      formula: '=IFERROR(B3/C3,0)',
      uses: 'IFERROR',
      hints: ['Each is Sales divided by Staff, wrapped in IFERROR.', 'IFERROR , B3 / C3 , comma , 0'],
      explain: '500 divided by 0 fails, so IFERROR shows the 0 you gave it.',
      tips: tipsFor('xl.iferror'),
    }),
  ],
};
