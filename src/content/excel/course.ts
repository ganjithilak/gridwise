import { isGrid, isScored, type Course, type Lesson } from '@/lessons/types';

import { goldenApplesFarm } from './unit-00-start-here/lesson-00-golden-apples-farm';
import { meetTheGrid } from './unit-00-start-here/lesson-01-meet-the-grid';
import { typeInACell } from './unit-00-start-here/lesson-02-type-in-a-cell';
import { rowsAndColumns } from './unit-00-start-here/lesson-03-rows-and-columns';
import { arrows } from './unit-00-start-here/lesson-04-arrows';
import { unit1Test } from './unit-01-first-formulas/checkpoint';
import { addItUp } from './unit-01-first-formulas/lesson-01-add-it-up';
import { theAverage } from './unit-01-first-formulas/lesson-02-the-average';
import { smallestBiggestCount } from './unit-01-first-formulas/lesson-03-smallest-biggest-count';
import { autoSum } from './unit-01-first-formulas/lesson-04-autosum';
import { fillDown } from './unit-01-first-formulas/lesson-05-fill-down';
import { lockIt } from './unit-01-first-formulas/lesson-06-lock-it';
import { unit2Test } from './unit-02-make-it-think/checkpoint';
import { trueOrFalse } from './unit-02-make-it-think/lesson-01-true-or-false';
import { ifLesson } from './unit-02-make-it-think/lesson-02-if';
import { countAndAddMatches } from './unit-02-make-it-think/lesson-03-count-and-add-matches';
import { lookItUp } from './unit-02-make-it-think/lesson-04-look-it-up';
import { whenThingsGoWrong } from './unit-02-make-it-think/lesson-05-when-things-go-wrong';
import { unit3Test } from './unit-03-getting-around/checkpoint';
import { select } from './unit-03-getting-around/lesson-01-select';
import { copyAndMove } from './unit-03-getting-around/lesson-02-copy-and-move';
import { sortAndUndo } from './unit-03-getting-around/lesson-03-sort-and-undo';
import { makeItReadable } from './unit-03-getting-around/lesson-04-make-it-readable';
import { cafeWeek } from './unit-04-put-it-to-work/lesson-01-cafe-week';
import { markTheClass } from './unit-04-put-it-to-work/lesson-02-mark-the-class';

/**
 * Every lesson goes Teach, Lesson, Apply. A lesson that does not say which of its tasks
 * is the practical one gets its last task on the sheet marked as that: lessons are
 * written to end on a job set in a real situation.
 */
function withApply(lesson: Lesson): Lesson {
  if (lesson.exercises.some((exercise) => exercise.apply)) return lesson;
  const last = [...lesson.exercises].reverse().find((exercise) => isScored(exercise) && isGrid(exercise));
  if (!last) return lesson;
  return { ...lesson, exercises: lesson.exercises.map((exercise) => (exercise === last ? { ...exercise, apply: true } : exercise)) };
}

const lessons = (...list: Lesson[]): Lesson[] => list.map(withApply);

export const excelCourse: Course = {
  id: 'xl',
  title: 'Spreadsheets',
  simulator: 'spreadsheet',
  skills: [
    { id: 'xl.spreadsheet.purpose', name: 'Understanding spreadsheets' },
    { id: 'xl.cell.address', name: 'Finding a cell' },
    { id: 'xl.cell.type', name: 'Entering and correcting data' },
    { id: 'xl.select.column', name: 'Selecting a whole column' },
    { id: 'xl.select.row', name: 'Selecting a whole row' },
    { id: 'xl.keys.move', name: 'Moving with the arrow keys' },
    { id: 'xl.select.extend', name: 'Extending a selection' },
    { id: 'xl.formula.arithmetic', name: 'Formulas with + - * /' },
    { id: 'xl.sum.range', name: 'SUM over a range' },
    { id: 'xl.average', name: 'AVERAGE' },
    { id: 'xl.minmax', name: 'MIN and MAX' },
    { id: 'xl.count', name: 'COUNT' },
    { id: 'xl.autosum', name: 'AutoSum' },
    { id: 'xl.fill', name: 'Filling a formula' },
    { id: 'xl.absolute', name: 'Locking a cell with $' },
    { id: 'xl.compare', name: 'Comparing with > < =' },
    { id: 'xl.if', name: 'IF' },
    { id: 'xl.countif', name: 'COUNTIF' },
    { id: 'xl.sumif', name: 'SUMIF' },
    { id: 'xl.xlookup', name: 'XLOOKUP' },
    { id: 'xl.vlookup', name: 'VLOOKUP' },
    { id: 'xl.iferror', name: 'Handling errors' },
    { id: 'xl.select.range', name: 'Selecting a range' },
    { id: 'xl.select.all', name: 'Selecting everything' },
    { id: 'xl.copy', name: 'Copy and paste' },
    { id: 'xl.cut', name: 'Cut and paste' },
    { id: 'xl.sort', name: 'Sorting' },
    { id: 'xl.undo', name: 'Undo' },
    { id: 'xl.bold', name: 'Bold' },
    { id: 'xl.numfmt', name: 'Currency and percentage formats' },
  ],
  // Roots to fruits: strong foundations first, then core skill, then more advanced
  // functions, and at the end real jobs that use all of it.
  units: [
    {
      id: 'xl.u0',
      title: 'Start Here',
      summary: 'Understand the spreadsheet itself: cells, rows, columns and getting around.',
      stage: 'roots',
      intro: true,
      lessons: lessons(goldenApplesFarm, meetTheGrid, typeInACell, rowsAndColumns, arrows),
    },
    {
      id: 'xl.u1',
      title: 'First Formulas',
      summary: 'Work out the farm’s totals, averages and takings with formulas.',
      stage: 'trunk',
      lessons: lessons(addItUp, theAverage, smallestBiggestCount, autoSum, fillDown, lockIt),
      checkpoint: unit1Test,
    },
    {
      id: 'xl.u2',
      title: 'Make It Think',
      summary: 'Formulas that compare, decide and look things up in the farm’s records.',
      stage: 'branches',
      lessons: lessons(trueOrFalse, ifLesson, countAndAddMatches, lookItUp, whenThingsGoWrong),
      checkpoint: unit2Test,
    },
    {
      id: 'xl.u3',
      title: 'Getting Around Faster',
      summary: 'Select, copy, sort, undo and format. Take it at any point in the course.',
      stage: 'branches',
      optional: true,
      lessons: lessons(select, copyAndMove, sortAndUndo, makeItReadable),
      checkpoint: unit3Test,
    },
    {
      id: 'xl.u4',
      title: 'Put It to Work',
      summary: 'Two projects away from the farm, using everything you have learned.',
      stage: 'fruit',
      lessons: lessons(cafeWeek, markTheClass),
    },
  ],
};
