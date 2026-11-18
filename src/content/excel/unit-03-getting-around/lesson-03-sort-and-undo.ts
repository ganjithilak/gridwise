import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS, tipsFor } from '../tips';

const SORT = 'xl.sort';
const UNDO = 'xl.undo';

/** Names are in order here and scores are not, so there is something to sort. */
const byName = table(['Player', 'Score'], [['Kim', 52], ['Lee', 47], ['Mo', 61], ['Nia', 49]]);
/** The same players the other way round: scores in order, names not. */
const byScore = table(['Player', 'Score'], [['Mo', 61], ['Kim', 52], ['Nia', 49], ['Lee', 47]]);
const menu = table(['Item', 'Price', 'Stock'], [['Tea', 3, 40], ['Cake', 5, 12], ['Soup', 7, 25], ['Pie', 4, 8]]);
const towns = table(['Town', 'Miles'], [['York', 210], ['Bath', 115], ['Hull', 180], ['Deal', 80]]);

export const sortAndUndo: Lesson = {
  id: 'xl.u3.l3',
  title: 'Sort and undo',
  summary: 'Put a table in order, and take back a mistake.',
  recap: [
    'Sort moves whole rows, so each name keeps its own numbers.',
    'A→Z puts the smallest first. Z→A puts the biggest first.',
    'Undo takes back one step: typing, sorting, filling or pasting.',
  ],
  newSkills: [SORT, UNDO],
  hideKeys: ['=', '+', '-', '*', '/', '(', ')', ':', ',', '$', 'SUM'],
  exercises: [
    {
      id: 'xl.u3.l3.e1',
      type: 'demo',
      skill: SORT,
      sheet: byName,
      tools: ['sortDesc', 'sortAsc'],
      script: [
        { tap: 'B2', say: 'Tap any cell in the column you want to sort by.' },
        { tool: 'sortDesc', say: 'Z→A puts the biggest first. Whole rows move together.' },
      ],
      prompt: 'Your turn. Put the scores smallest first.',
      checks: [{ type: 'rangeSorted', range: 'B2:B5' }],
      hints: ['One button sorts biggest first, the other smallest first.', 'With a Score cell picked, tap A→Z.', 'The top score should be 47.'],
      explain: 'A→Z puts numbers smallest first. Each name moved with its score.',
      tips: ['Sort moves whole rows, so each name keeps its own numbers.', 'A→Z is smallest first for numbers, alphabetical for words.'],
      solution: [{ tool: 'sortAsc', say: 'A→Z sorts smallest first.' }],
    },
    {
      id: 'xl.u3.l3.e2',
      type: 'grid-task',
      skill: SORT,
      sheet: byScore,
      tools: ['sortAsc', 'sortDesc'],
      prompt: 'Sort the players into alphabetical order by name.',
      checks: [{ type: 'rangeSorted', range: 'A2:A5' }],
      hints: ['Sort by the column that holds the names.', 'Tap any name, then tap A→Z.', 'Kim should end up on top.'],
      explain: 'Sorting by Player put the names in A to Z order, scores and all.',
      tips: ['Tap a cell in the column you want to sort by, then the sort button.', 'The headings in row 1 stay on top when you sort.'],
      solution: [
        { tap: 'A2', say: 'Tap a name, to sort by the Player column.' },
        { tool: 'sortAsc', say: 'A→Z puts the names in alphabetical order.' },
      ],
    },
    {
      id: 'xl.u3.l3.e3',
      type: 'demo',
      skill: UNDO,
      sheet: byScore,
      tools: ['undo', 'sortAsc'],
      script: [
        { tap: 'B3', say: 'Suppose you change something by mistake.' },
        { tap: 'B3' },
        { key: '9' },
        { key: 'enter', say: 'Kim has gone from 52 to 529. Oops.' },
        { tool: 'undo', say: 'Undo takes back the last thing you did. 52 again.' },
      ],
      prompt: 'Your turn. Sort by Score with A→Z, then take it back with Undo.',
      checks: [{ type: 'undid' }, { type: 'cellValue', cell: 'A2', equals: 'Mo' }],
      hints: ['Do the sort first. There is nothing to undo until you have.', 'Tap a score, tap A→Z, then tap Undo.', 'Mo should be back on top.'],
      explain: 'Undo put every row back where it was before the sort.',
      tips: ['Undo takes back one step at a time. Press it again to go further.', 'Not sure what a button does? Try it. Undo is always there.'],
      solution: [
        { tap: 'B2', say: 'Tap a score.' },
        { tool: 'sortAsc', say: 'A→Z sorts smallest first. Now Lee is on top.' },
        { tool: 'undo', say: 'Undo puts it back.' },
      ],
    },
    {
      id: 'xl.u3.l3.e4',
      type: 'grid-task',
      skill: UNDO,
      sheet: byScore,
      tools: ['undo'],
      prompt: "Change Nia's score to 0, then undo so it is 49 again.",
      checks: [{ type: 'undid' }, { type: 'cellValue', cell: 'B4', equals: 49 }],
      hints: ['Make the change first: tap B4 twice, clear it, type 0, press Enter.', 'Then tap Undo once.', 'B4 should show 49 again.'],
      explain: 'Undo works on typing too. The 49 came straight back.',
      tips: ['Undo works on typing, sorting, filling and pasting alike.', BASICS.backspace],
      solution: [
        { tap: 'B4', say: 'Tap B4, then tap it again to type.' },
        { tap: 'B4' },
        { key: 'backspace', say: 'Clear the 49.' },
        { key: 'backspace' },
        { key: '0', say: 'Type 0.' },
        { key: 'enter', say: 'Enter. Now it says 0.' },
        { tool: 'undo', say: 'Undo brings the 49 back.' },
      ],
    },
    {
      id: 'xl.u3.l3.e5',
      type: 'shortcut-press',
      skill: UNDO,
      sheet: byScore,
      prompt: "Change Mo's score to 5, then undo it with {mod} + Z.",
      checks: [
        { type: 'usedShortcut', id: 'undo' },
        { type: 'cellValue', cell: 'B2', equals: 61 },
      ],
      hints: ['Make the change first: tap B2 twice, clear it, type 5, press Enter.', 'Then press {mod}, and then Z.', 'B2 should show 61 again.'],
      explain: '{mod} + Z is undo in almost every program, not just spreadsheets.',
      tips: ['Z is the undo letter. It sits at the corner of a keyboard.', BASICS.enter],
      solution: [
        { tap: 'B2', say: 'Tap B2, then tap it again to type.' },
        { tap: 'B2' },
        { key: 'backspace', say: 'Clear the 61.' },
        { key: 'backspace' },
        { key: '5', say: 'Type 5.' },
        { key: 'enter', say: 'Enter. Now it says 5.' },
        { combo: 'undo', say: 'Press {mod}, then Z.' },
      ],
    },
    {
      id: 'xl.u3.l3.e6',
      type: 'grid-task',
      skill: SORT,
      sheet: menu,
      tools: ['sortAsc', 'sortDesc'],
      prompt: 'New sheet: a cafe. Put the item with the most Stock on top.',
      checks: [{ type: 'rangeSorted', range: 'C2:C5', descending: true }],
      hints: ['Sort by the Stock column, biggest first.', 'Tap any Stock number, then tap Z→A.', 'Tea, with 40, should end up on top.'],
      explain: 'Z→A on Stock put the biggest first, and each row stayed together.',
      tips: ['Z→A is biggest first for numbers.', BASICS.headings],
      solution: [
        { tap: 'C2', say: 'Tap a Stock number, to sort by that column.' },
        { tool: 'sortDesc', say: 'Z→A puts the biggest first.' },
      ],
    },
    choice({
      id: 'xl.u3.l3.e7',
      skill: SORT,
      sheet: byName,
      prompt: 'You sort this table by Score. What happens to the names?',
      options: ['Each name moves with its own score', 'The names stay where they are', 'The names are sorted A to Z as well'],
      right: 0,
      hints: ['A row belongs together.', 'If names stayed put, every score would end up beside the wrong player.', 'Sort moves whole rows.'],
      explain: 'Sort moves whole rows, so every score stays beside its own player.',
      tips: ['A sort never splits a row up.', BASICS.hint],
    }),
  ],
  practice: [
    {
      id: 'xl.u3.l3.p1',
      type: 'grid-task',
      skill: SORT,
      sheet: towns,
      tools: ['sortAsc', 'sortDesc'],
      prompt: 'Put the nearest town on top: sort by Miles, smallest first.',
      checks: [{ type: 'rangeSorted', range: 'B2:B5' }],
      hints: ['Sort by the Miles column.', 'Tap any Miles number, then tap A→Z.', 'Deal, at 80 miles, should end up on top.'],
      explain: 'A→Z on Miles put the smallest first.',
      tips: tipsFor(SORT),
      solution: [
        { tap: 'B2', say: 'Tap a Miles number.' },
        { tool: 'sortAsc', say: 'A→Z sorts smallest first.' },
      ],
    },
    {
      id: 'xl.u3.l3.p2',
      type: 'grid-task',
      skill: UNDO,
      sheet: towns,
      tools: ['undo', 'sortAsc'],
      prompt: 'Sort the towns A to Z by name, then take it back with Undo.',
      checks: [{ type: 'undid' }, { type: 'cellValue', cell: 'A2', equals: 'York' }],
      hints: ['Do the sort first. There is nothing to undo until you have.', 'Tap a town, tap A→Z, then tap Undo.', 'York should be back on top.'],
      explain: 'Undo put every row back where it was.',
      tips: tipsFor(UNDO),
      solution: [
        { tap: 'A2', say: 'Tap a town.' },
        { tool: 'sortAsc', say: 'A→Z sorts the names.' },
        { tool: 'undo', say: 'Undo puts it back.' },
      ],
    },
  ],
};
