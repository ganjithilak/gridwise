import type { Lesson } from '@/lessons/types';

import { demo, fix, predict, table, task, typing } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const IF = 'xl.if';

/** The week's picking against each crop's target, from True or False. */
const targets = table(
  ['Crop', 'Picked', 'Target', 'Result'],
  [
    ['Apples', 120, 100],
    ['Pears', 80, 100],
    ['Plums', 100, 100],
    ['Carrots', 150, 120],
  ],
);

/** Each bin of apples is scored for quality when it reaches the packing shed. */
const exam = table(['Bin', 'Score', 'Result'], [['Bin 1', 72], ['Bin 2', 45], ['Bin 3', 50]]);
/** A picker who picks over 100 kg in a day earns a bonus. */
const bonus = table(['Picker', 'Kg', 'Bonus'], [['Ana', 120], ['Ben', 80], ['Cy', 100]]);
/** Practice: boxing up delivery orders. */
const post = table(['Order', 'Kg', 'Box'], [['River Cafe', 6], ['Bay Deli', 1], ['Town Grocer', 3]]);
/** Practice: pick-your-own entry, cheaper for children. */
const fares = table(['Visitor', 'Age', 'Entry'], [['Sam', 9], ['Jo', 34], ['Lin', 15]]);

export const ifLesson: Lesson = {
  id: 'xl.u2.l2',
  title: 'IF',
  summary: 'Label each crop Met or Short: show one thing or another, depending on a question.',
  recap: [
    'IF has three parts: a question, then two possible answers.',
    'The first answer is shown for TRUE, the second for FALSE.',
    'An answer can be a number, or text in "quote marks".',
  ],
  newSkills: [IF],
  hideKeys: ['$', ':', 'SUM'],
  exercises: [
    demo({
      id: 'xl.u2.l2.e1',
      skill: IF,
      sheet: targets,
      script: typing('D2', '=IF(B2>=C2,"Met","Short")', {
        says: [
          'IF chooses between two answers. Select D2.',
          'Tap IF.',
          'First the question: is Picked...',
          '...at least the Target? Then a comma.',
          'What to show if it is true, then a comma.',
          'Then what to show if it is not.',
          'Enter. 120 is at least 100, so: Met.',
        ],
      }),
      prompt: 'Your turn. Label the pears in D3 in the same way.',
      cell: 'D3',
      formula: '=IF(B3>=C3,"Met","Short")',
      uses: 'IF',
      hints: ['Three parts: the question, the text if true, the text if not.', 'IF , B3 >= C3 , comma , "Met" , comma , "Short"'],
      explain: '80 is not at least 100, so IF shows the second answer: Short.',
      tips: ['IF has three parts: a question, then two possible answers.', 'Commas keep the three parts of IF apart.'],
    }),
    task({
      id: 'xl.u2.l2.e2',
      skill: IF,
      sheet: targets,
      prompt: 'The plums picked exactly their target. Label them in D4.',
      cell: 'D4',
      formula: '=IF(B4>=C4,"Met","Short")',
      uses: 'IF',
      hints: ['The same question: is Picked at least the Target?', 'IF , B4 >= C4 , comma , "Met" , comma , "Short"'],
      explain: '100 is at least 100, so IF shows Met. With > alone, it would have shown Short.',
      tips: ['The first answer is for TRUE. The second is for FALSE.', FORMULAS.bracket],
    }),
    predict({
      id: 'xl.u2.l2.e3',
      skill: IF,
      sheet: targets,
      prompt: 'This formula is in D5. What will it show?',
      cell: 'D5',
      formula: '=IF(B5>=C5,"Met","Short")',
      options: ['Met', 'Short', 'TRUE', '150'],
      hints: ['Answer the question first: is B5 at least C5?', '150 is more than 120, so the question is true.', 'When it is true, IF shows the first of its two answers.'],
      explain: '150 is at least 120, so the question is true and IF shows the first answer.',
      tips: ['Read IF out loud: if this is true, show this, otherwise that.', FORMULAS.shows],
    }),
    {
      id: 'xl.u2.l2.e4',
      type: 'formula-build',
      skill: IF,
      sheet: exam,
      cell: 'C2',
      tokens: ['=IF(', 'B2', '>=', '50', ',', '"Pass"', '"Fail"', '<', 'C2', ')'],
      prompt: 'A bin passes with a score of at least 50. Build the formula from the pieces.',
      checks: [
        { type: 'outcome', cell: 'C2', reference: '=IF(B2>=50,"Pass","Fail")' },
        { type: 'formulaUses', cell: 'C2', fn: 'IF' },
      ],
      hints: ['Start with =IF( and then the question about the score.', 'Question, comma, "Pass", comma, "Fail".', '=IF(B2>=50,"Pass","Fail")'],
      explain: '72 is at least 50, so the question is true and it shows Pass.',
      tips: ['Text inside a formula goes in "quote marks".', BASICS.backspace],
      solution: [
        { chip: '=IF(', say: 'Start with =IF(' },
        { chip: 'B2', say: 'The question: is the score...' },
        { chip: '>=' },
        { chip: '50', say: '...at least 50?' },
        { chip: ',' },
        { chip: '"Pass"', say: 'What to show if it is.' },
        { chip: ',' },
        { chip: '"Fail"', say: 'What to show if it is not.' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    task({
      id: 'xl.u2.l2.e5',
      skill: IF,
      sheet: bonus,
      prompt: 'Over 100 kg in a day earns a bonus of 10, otherwise 0. Use C2.',
      cell: 'C2',
      formula: '=IF(B2>100,10,0)',
      uses: 'IF',
      hints: ['The two answers are numbers this time, so no quote marks.', 'IF , B2 > 100 , comma , 10 , comma , 0'],
      explain: 'IF can show numbers as well as text. 120 is over 100, so Ana’s bonus is 10.',
      tips: ['IF can show numbers as well as text.', 'Numbers go in a formula as they are. Only text needs quote marks.'],
    }),
    fix({
      id: 'xl.u2.l2.e6',
      skill: IF,
      sheet: targets,
      prompt: 'D5 says Short, but the carrots beat their target. Correct the formula.',
      cell: 'D5',
      broken: '=IF(B5>=C5,"Short","Met")',
      formula: '=IF(B5>=C5,"Met","Short")',
      uses: 'IF',
      hints: ['The question is right. Look at the order of the two answers.', 'Select D5 and type the formula again with "Met" first. Typing replaces it.'],
      explain: 'The two answers were the wrong way round. The first is shown when the question is TRUE.',
      tips: ['If IF gives the opposite answer, its two answers may be swapped.', FORMULAS.check],
    }),
  ],
  practice: [
    task({
      id: 'xl.u2.l2.p1',
      skill: IF,
      sheet: post,
      prompt: 'An order over 5 kg goes in a "Big" box, otherwise "Small". Use C2.',
      cell: 'C2',
      formula: '=IF(B2>5,"Big","Small")',
      uses: 'IF',
      hints: ['Three parts: the question, the text if true, the text if not.', 'IF , B2 > 5 , comma , "Big" , comma , "Small"'],
      explain: 'The River Cafe’s 6 kg is over 5, so IF shows Big.',
      tips: tipsFor(IF),
    }),
    task({
      id: 'xl.u2.l2.p2',
      skill: IF,
      sheet: fares,
      prompt: 'Pick-your-own entry is 2 for anyone under 16, otherwise 5. Use C2.',
      cell: 'C2',
      formula: '=IF(B2<16,2,5)',
      uses: 'IF',
      hints: ['The two answers are numbers, so no quote marks.', 'IF , B2 < 16 , comma , 2 , comma , 5'],
      explain: 'Sam is 9, which is under 16, so entry is 2.',
      tips: tipsFor(IF),
    }),
  ],
};
