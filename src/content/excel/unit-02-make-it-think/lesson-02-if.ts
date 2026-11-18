import type { Lesson } from '@/lessons/types';

import { demo, fix, predict, table, task, typing } from '../build';
import { BASICS, FORMULAS, tipsFor } from '../tips';

const IF = 'xl.if';

const targets = table(
  ['Seller', 'Sales', 'Target', 'Result'],
  [
    ['Ann', 120, 100],
    ['Bo', 80, 100],
    ['Cy', 100, 100],
    ['Di', 150, 120],
  ],
);

const exam = table(['Pupil', 'Mark', 'Result'], [['Ali', 72], ['Bea', 45], ['Cal', 50]]);
const bonus = table(['Seller', 'Sales', 'Bonus'], [['Ann', 120], ['Bo', 80], ['Cy', 100]]);
const post = table(['Parcel', 'Kilos', 'Size'], [['Books', 6], ['Socks', 1], ['Lamp', 3]]);
const fares = table(['Rider', 'Age', 'Fare'], [['Sam', 9], ['Jo', 34], ['Lin', 15]]);

export const ifLesson: Lesson = {
  id: 'xl.u2.l2',
  title: 'IF',
  summary: 'Show one thing or another, depending on a question.',
  recap: [
    'IF has three parts: a question, then two possible answers.',
    'The first answer is shown for TRUE, the second for FALSE.',
    'An answer can be a number, or words in "quote marks".',
  ],
  newSkills: [IF],
  hideKeys: ['$', ':', 'SUM'],
  exercises: [
    demo({
      id: 'xl.u2.l2.e1',
      skill: IF,
      sheet: targets,
      script: typing('D2', '=IF(B2>C2,"Hit","Miss")', {
        says: [
          'IF picks between two answers. Tap D2 twice.',
          'Tap IF.',
          'First the question: are the Sales...',
          '...greater than the Target? Then a comma.',
          'Then what to show if that is true, and a comma.',
          'Then what to show if it is not.',
          'Enter. 120 beats 100, so it says Hit.',
        ],
      }),
      prompt: 'Your turn. Do the same for Bo in D3.',
      cell: 'D3',
      formula: '=IF(B3>C3,"Hit","Miss")',
      uses: 'IF',
      hints: ['Three parts: the question, the word if true, the word if not.', 'IF , B3 > C3 , comma , "Hit" , comma , "Miss"'],
      explain: '80 does not beat 100, so IF shows the second word: Miss.',
      tips: ['IF has three parts: a question, then two possible answers.', 'Commas keep the three parts of IF apart.'],
    }),
    task({
      id: 'xl.u2.l2.e2',
      skill: IF,
      sheet: targets,
      prompt: 'Cy only has to reach the target. Use >= in D4.',
      cell: 'D4',
      formula: '=IF(B4>=C4,"Hit","Miss")',
      uses: 'IF',
      hints: ['Same as before, but the question is "at least".', 'IF , B4 >= C4 , comma , "Hit" , comma , "Miss"'],
      explain: '100 is at least 100, so the question is true and IF shows Hit.',
      tips: ['The first answer is for TRUE. The second is for FALSE.', FORMULAS.bracket],
    }),
    predict({
      id: 'xl.u2.l2.e3',
      skill: IF,
      sheet: targets,
      prompt: 'This formula is in D5. What will it show?',
      cell: 'D5',
      formula: '=IF(B5>C5,"Hit","Miss")',
      options: ['Hit', 'Miss', 'TRUE', '150'],
      hints: ['Answer the question first: is B5 greater than C5?', '150 is greater than 120, so the question is true.', 'When it is true, IF shows the first of its two words.'],
      explain: '150 beats 120, so the question is true and IF shows the first word.',
      tips: ['Read IF out loud: if this is true, show this, otherwise that.', FORMULAS.shows],
    }),
    {
      id: 'xl.u2.l2.e4',
      type: 'formula-build',
      skill: IF,
      sheet: exam,
      cell: 'C2',
      tokens: ['=IF(', 'B2', '>=', '50', ',', '"Pass"', '"Fail"', '<', 'C2', ')'],
      prompt: 'Build it from the pieces: Pass if the Mark is at least 50, else Fail.',
      checks: [
        { type: 'outcome', cell: 'C2', reference: '=IF(B2>=50,"Pass","Fail")' },
        { type: 'formulaUses', cell: 'C2', fn: 'IF' },
      ],
      hints: ['Start with =IF( and then the question about the Mark.', 'Question, comma, the word if true, comma, the word if not.', '=IF(B2>=50,"Pass","Fail")'],
      explain: '72 is at least 50, so the question is true and it shows Pass.',
      tips: ['Words inside a formula go in "quote marks".', BASICS.backspace],
      solution: [
        { chip: '=IF(', say: 'Start with =IF(' },
        { chip: 'B2', say: 'The question: is the Mark...' },
        { chip: '>=' },
        { chip: '50', say: '...at least 50?' },
        { chip: ',' },
        { chip: '"Pass"', say: 'The word to show if it is.' },
        { chip: ',' },
        { chip: '"Fail"', say: 'The word to show if it is not.' },
        { key: 'enter', say: 'Enter.' },
      ],
    },
    task({
      id: 'xl.u2.l2.e5',
      skill: IF,
      sheet: bonus,
      prompt: 'Give a Bonus of 10 if Sales are over 100, otherwise 0. Use C2.',
      cell: 'C2',
      formula: '=IF(B2>100,10,0)',
      uses: 'IF',
      hints: ['The two answers are numbers this time, so no quote marks.', 'IF , B2 > 100 , comma , 10 , comma , 0'],
      explain: 'IF can show numbers as well as words. 120 is over 100, so the bonus is 10.',
      tips: ['IF can show numbers as well as words.', 'Numbers go in a formula as they are. Only words need quote marks.'],
    }),
    fix({
      id: 'xl.u2.l2.e6',
      skill: IF,
      sheet: targets,
      prompt: 'D5 says Miss, but Di beat the target. Fix the formula.',
      cell: 'D5',
      broken: '=IF(B5>C5,"Miss","Hit")',
      formula: '=IF(B5>C5,"Hit","Miss")',
      uses: 'IF',
      hints: ['The question is right. Look at the order of the two words.', 'Delete back to the first comma, then "Hit" , comma , "Miss".'],
      explain: 'The two words were the wrong way round. The first one is for TRUE.',
      tips: ['If IF gives the opposite answer, its two answers may be swapped.', FORMULAS.check],
    }),
  ],
  practice: [
    task({
      id: 'xl.u2.l2.p1',
      skill: IF,
      sheet: post,
      prompt: 'Mark a parcel "Big" if it weighs over 5 kilos, else "Small". Use C2.',
      cell: 'C2',
      formula: '=IF(B2>5,"Big","Small")',
      uses: 'IF',
      hints: ['Three parts: the question, the word if true, the word if not.', 'IF , B2 > 5 , comma , "Big" , comma , "Small"'],
      explain: '6 kilos is over 5, so IF shows Big.',
      tips: tipsFor(IF),
    }),
    task({
      id: 'xl.u2.l2.p2',
      skill: IF,
      sheet: fares,
      prompt: 'The fare is 2 for anyone under 16, otherwise 5. Use C2.',
      cell: 'C2',
      formula: '=IF(B2<16,2,5)',
      uses: 'IF',
      hints: ['The two answers are numbers, so no quote marks.', 'IF , B2 < 16 , comma , 2 , comma , 5'],
      explain: 'Sam is 9, which is under 16, so the fare is 2.',
      tips: tipsFor(IF),
    }),
  ],
};
