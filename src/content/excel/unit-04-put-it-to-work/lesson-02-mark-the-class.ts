import type { SheetSpec } from '@/engine';
import type { Lesson } from '@/lessons/types';

import { fix, table, task, withCells } from '../build';
import { FORMULAS } from '../tips';

const bold = { bold: true };

const pupils: [string, number][] = [
  ['Ava', 72],
  ['Ben', 45],
  ['Cy', 58],
  ['Dee', 31],
];

const RESULT = '=IF(B2>=50,"Pass","Fail")';
const results = { C2: RESULT, C3: '=IF(B3>=50,"Pass","Fail")', C4: '=IF(B4>=50,"Pass","Fail")', C5: '=IF(B5>=50,"Pass","Fail")' };

/** A class's test marks, with a column for whether each pupil passed. */
const marks = table(['Pupil', 'Mark', 'Result'], pupils);
const marksStarted = withCells(marks, { C2: RESULT });
const marksDone = (footer: string): SheetSpec => withCells(table(['Pupil', 'Mark', 'Result'], pupils, { footer }), results);

/** The marks on the left, and on the right a pupil to find with a place for the answer. */
const finder = (who: string): SheetSpec => ({
  cols: 5,
  rows: 5,
  grid: [['Pupil', 'Mark', '', 'Find', 'Mark'], ...pupils.map(([name, mark], i) => [name, mark, null, i === 0 ? who : null])],
  formats: { 'A1:E1': bold },
});

/**
 * Fruit: a teacher's marking, start to finish. Nothing new is taught here. Every step is
 * a real job done with what the "Make it think" unit covered.
 */
export const markTheClass: Lesson = {
  id: 'xl.u4.l2',
  title: 'Project: Mark the Class',
  summary: 'Away from the farm: mark a class’s test, count the passes, look a pupil up.',
  recap: [
    'IF gave each pupil a Pass or a Fail from their Mark.',
    'COUNTIF counted the passes. AVERAGE gave the typical Mark.',
    'A lookup found one pupil, and IFERROR handled a missing one.',
  ],
  newSkills: [],
  exercises: [
    task({
      id: 'xl.u4.l2.e1',
      skill: 'xl.if',
      apply: true,
      sheet: marks,
      prompt: 'A teacher’s marking. In C2, show Pass if the mark is at least 50, else Fail.',
      cell: 'C2',
      formula: RESULT,
      uses: 'IF',
      hints: ['IF needs a question, then the text for yes and the text for no.', 'IF , B2 , >= , 50 , comma , "Pass" , comma , "Fail"'],
      explain: '72 is at least 50, so the question is true and IF shows Pass.',
      tips: ['IF has three parts: a question, then two possible answers.', 'Text inside a formula goes in "quote marks".'],
    }),
    {
      id: 'xl.u4.l2.e2',
      type: 'grid-task',
      skill: 'xl.fill',
      apply: true,
      sheet: marksStarted,
      tools: ['fill'],
      prompt: 'Now mark the rest of the class. Fill the Result down to Dee.',
      checks: [{ type: 'filledResults', range: 'C2:C5', reference: RESULT }],
      hints: ['Select the cell with the formula first.', 'Drag the small square on the corner of C2 down to C5.', 'Ben and Dee should show Fail. Cy should show Pass.'],
      explain: 'Each copy asks about its own row: two passes and two fails.',
      tips: ['The small square on the corner of a cell is the fill handle.', 'One formula, filled down, beats typing it on every row.'],
      solution: [
        { tap: 'C2', say: 'Select C2, the formula to copy.' },
        { fill: 'C2:C5', say: 'Drag its corner down to C5.' },
      ],
    },
    task({
      id: 'xl.u4.l2.e3',
      skill: 'xl.countif',
      apply: true,
      sheet: marksDone('Passed'),
      prompt: 'The head asks how many passed. Count the Pass results in C6.',
      cell: 'C6',
      formula: '=COUNTIF(C2:C5,"Pass")',
      uses: 'COUNTIF',
      hints: ['One function counts only the cells that match.', 'COUNTIF , the Result cells , comma , "Pass"'],
      explain: 'Two of the four Result cells say Pass: Ava and Cy.',
      tips: ['COUNTIF needs two things: where to look, and what to look for.', FORMULAS.range],
    }),
    task({
      id: 'xl.u4.l2.e4',
      skill: 'xl.average',
      apply: true,
      sheet: marksDone('Average'),
      prompt: 'How did the class do overall? Put the average mark in B6.',
      cell: 'B6',
      formula: '=AVERAGE(B2:B5)',
      uses: 'AVERAGE',
      hints: ['There is a function that shares a total over the pupils.', 'AVERAGE , the first Mark , : , the last Mark'],
      explain: 'The four marks add to 206. Shared over 4 pupils, that is 51.5.',
      tips: [FORMULAS.fn, FORMULAS.bracket],
    }),
    task({
      id: 'xl.u4.l2.e5',
      skill: 'xl.xlookup',
      apply: true,
      sheet: finder('Cy'),
      prompt: 'A parent asks about the pupil in D2. Look up their mark in E2.',
      cell: 'E2',
      formula: '=XLOOKUP(D2,A2:A5,B2:B5)',
      uses: 'XLOOKUP',
      hints: ['Three parts: what to find, where to look, where the answer is.', 'XLOOKUP , D2 , comma , the Pupils , comma , the Marks'],
      explain: 'It found Cy among the pupils and returned the mark beside it: 58.',
      tips: ['XLOOKUP asks: find what, look where, return from where.', FORMULAS.check],
    }),
    fix({
      id: 'xl.u4.l2.e6',
      skill: 'xl.iferror',
      apply: true,
      sheet: finder('Eli'),
      prompt: 'Eli is not in this class, so E2 shows #N/A. Make it say "None".',
      cell: 'E2',
      broken: '=XLOOKUP(D2,A2:A5,B2:B5)',
      formula: '=IFERROR(XLOOKUP(D2,A2:A5,B2:B5),"None")',
      uses: 'IFERROR',
      hints: ['Put the whole lookup inside IFERROR, then the text to show.', 'IFERROR , the XLOOKUP as before , ) , comma , "None"'],
      explain: 'The lookup found no Eli, so IFERROR showed "None" in its place.',
      tips: ['#N/A means a lookup could not find what it was asked for.', 'One function can sit inside another. Each needs its own brackets.'],
    }),
  ],
};
