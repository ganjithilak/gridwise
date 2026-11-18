import type { Lesson } from '@/lessons/types';

import { demo, predict, table, task, typing } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const COMPARE = 'xl.compare';

const targets = table(
  ['Seller', 'Sales', 'Target', 'Hit?'],
  [
    ['Ann', 120, 100],
    ['Bo', 80, 100],
    ['Cy', 100, 100],
    ['Di', 150, 120],
  ],
);

const stock = table(
  ['Item', 'Counted', 'On file', 'Same?'],
  [
    ['Pens', 40, 40],
    ['Pads', 12, 15],
    ['Tape', 9, 9],
  ],
);

const budget = table(
  ['Month', 'Spent', 'Budget', 'Over?'],
  [
    ['Jan', 420, 400],
    ['Feb', 380, 400],
    ['Mar', 400, 400],
  ],
);

export const trueOrFalse: Lesson = {
  id: 'xl.u2.l1',
  title: 'True or false',
  summary: 'Ask a cell a question and get TRUE or FALSE back.',
  recap: [
    'A comparison asks a question. The answer is TRUE or FALSE.',
    '> is more than, < is less than, = is equal, <> is not equal.',
    '>= means "at least" and <= means "at most".',
  ],
  newSkills: [COMPARE],
  hideKeys: ['$', ',', ':', 'SUM'],
  exercises: [
    demo({
      id: 'xl.u2.l1.e1',
      skill: COMPARE,
      sheet: targets,
      script: typing('D2', '=B2>C2', {
        says: [
          'A formula can ask a question. Tap D2 twice.',
          'Start with = as always.',
          'Is the Sales cell...',
          '...greater than the Target cell?',
          'Enter. 120 is more than 100, so the answer is TRUE.',
        ],
      }),
      prompt: 'Your turn. Did Bo beat the target? Ask in D3.',
      cell: 'D3',
      formula: '=B3>C3',
      hints: ['You are asking: are the Sales greater than the Target?', 'Tap D3 twice. Then = , the Sales cell, > , the Target cell.'],
      explain: '80 is not more than 100, so the answer is FALSE.',
      tips: ['A question in a cell gets one of two answers: TRUE or FALSE.', '> means "greater than". < means "less than".'],
    }),
    task({
      id: 'xl.u2.l1.e2',
      skill: COMPARE,
      sheet: targets,
      prompt: 'Cy only has to reach the target. Ask "at least" with >= in D4.',
      cell: 'D4',
      formula: '=B4>=C4',
      moreChips: ['>'],
      hints: ['Reaching the target exactly is good enough here.', 'Tap D4 twice. Then = , the Sales cell, >= , the Target cell.'],
      explain: '100 is not more than 100, but it is at least 100. So >= says TRUE.',
      tips: ['>= means "at least". <= means "at most".', FORMULAS.equals],
    }),
    predict({
      id: 'xl.u2.l1.e3',
      skill: COMPARE,
      sheet: targets,
      prompt: 'This formula is in D4. What will it show?',
      cell: 'D4',
      formula: '=B4>C4',
      options: ['FALSE', 'TRUE', '100', '0'],
      hints: ['Read it as a question: is B4 greater than C4?', 'Both cells hold 100.', 'Is 100 greater than 100? No, it is the same.'],
      explain: 'Equal is not greater. 100 > 100 is FALSE.',
      tips: ['The open side of > faces the bigger number.', FORMULAS.shows],
    }),
    task({
      id: 'xl.u2.l1.e4',
      skill: COMPARE,
      sheet: targets,
      prompt: 'Is Di below target? Ask with < in D5.',
      cell: 'D5',
      formula: '=B5<C5',
      moreChips: ['>'],
      hints: ['Below target means the Sales are less than the Target.', 'Tap D5 twice. Then = , the Sales cell, < , the Target cell.'],
      explain: '150 is not less than 120, so the answer is FALSE. Di is fine.',
      tips: ['TRUE and FALSE are answers the sheet works out. You never type them.', FORMULAS.tapCell],
    }),
    task({
      id: 'xl.u2.l1.e5',
      skill: COMPARE,
      sheet: stock,
      prompt: 'New sheet: a stock check. Does the count match the file? Ask in D2.',
      cell: 'D2',
      formula: '=B2=C2',
      hints: ['To ask "are these the same?" put = between the two cells.', 'Tap D2 twice. Then = , the Counted cell, = , the On file cell.'],
      explain: 'The first = starts the formula. The second one asks "are these equal?"',
      tips: ['= between two cells asks whether they are the same.', BASICS.free],
    }),
    task({
      id: 'xl.u2.l1.e6',
      skill: COMPARE,
      sheet: stock,
      prompt: 'Find the mismatch. In D3, ask whether the two numbers differ.',
      cell: 'D3',
      formula: '=B3<>C3',
      moreChips: ['>', '<'],
      hints: ['"Differ" means "not equal to".', 'Tap D3 twice. Then = , the Counted cell, <> , the On file cell.'],
      explain: '12 is not the same as 15, so "not equal" is TRUE.',
      tips: ['<> means "not equal to".', FORMULAS.updates],
    }),
  ],
  practice: [
    task({
      id: 'xl.u2.l1.p1',
      skill: COMPARE,
      sheet: budget,
      prompt: 'Did Jan go over budget? Ask in D2.',
      cell: 'D2',
      formula: '=B2>C2',
      moreChips: ['<'],
      hints: ['Over budget means Spent is greater than Budget.', 'Tap D2 twice. Then = , the Spent cell, > , the Budget cell.'],
      explain: '420 is more than 400, so the answer is TRUE.',
      tips: tipsFor(COMPARE),
    }),
    task({
      id: 'xl.u2.l1.p2',
      skill: COMPARE,
      sheet: budget,
      prompt: 'Did Mar stay within budget? Ask "at most" with <= in D4.',
      cell: 'D4',
      formula: '=B4<=C4',
      moreChips: ['<'],
      hints: ['Spending exactly the budget still counts as within it.', 'Tap D4 twice. Then = , the Spent cell, <= , the Budget cell.'],
      explain: '400 is at most 400, so the answer is TRUE.',
      tips: tipsFor(COMPARE),
    }),
  ],
};
