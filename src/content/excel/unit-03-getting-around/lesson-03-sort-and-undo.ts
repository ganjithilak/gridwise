import type { Lesson } from '@/lessons/types';

import { choice, table } from '../build';
import { BASICS, tipsFor } from '../tips';

const SORT = 'xl.sort';
const UNDO = 'xl.undo';

/** Kilograms picked today. Names are in order here and the kilograms are not, so there is something to sort. */
const byName = table(['Picker', 'Kg'], [['Ana', 52], ['Ben', 47], ['Cy', 61], ['Dee', 49]]);
/** The same pickers the other way round: kilograms in order, names not. */
const byScore = table(['Picker', 'Kg'], [['Cy', 61], ['Ana', 52], ['Dee', 49], ['Ben', 47]]);
/** The stall's price list with the stock on hand. */
const menu = table(['Produce', 'Price', 'Stock'], [['Carrots', 3, 40], ['Pears', 5, 12], ['Tomatoes', 6, 25], ['Apples', 4, 8]]);
/** Practice: the delivery round, with each customer's distance from the farm. */
const towns = table(['Customer', 'Km'], [['River Cafe', 21], ['Hill Market', 12], ['Town Grocer', 18], ['Bay Deli', 8]]);

export const sortAndUndo: Lesson = {
  id: 'xl.u3.l3',
  title: 'Sort and Undo',
  summary: 'Rank the day’s pickers, and take back a mistake with Undo.',
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
        { tap: 'B2', say: 'Select a cell in the column to sort by.' },
        { tool: 'sortDesc', say: 'Z→A puts the biggest first. Rows move whole.' },
      ],
      prompt: 'Your turn. Put the kilograms smallest first.',
      checks: [{ type: 'rangeSorted', range: 'B2:B5' }],
      hints: ['One button sorts biggest first, the other smallest first.', 'With a Kg cell selected, tap A→Z.', 'The top number should be 47.'],
      explain: 'A→Z puts numbers smallest first. Each name moved with its kilograms.',
      tips: ['Sort moves whole rows, so each name keeps its own numbers.', 'A→Z is smallest first for numbers, alphabetical for text.'],
      solution: [{ tool: 'sortAsc', say: 'A→Z sorts smallest first.' }],
    },
    {
      id: 'xl.u3.l3.e2',
      type: 'grid-task',
      skill: SORT,
      sheet: byScore,
      tools: ['sortAsc', 'sortDesc'],
      prompt: 'Sort the pickers into alphabetical order by name.',
      checks: [{ type: 'rangeSorted', range: 'A2:A5' }],
      hints: ['Sort by the column that holds the names.', 'Select any name, then tap A→Z.', 'Ana should end up on top.'],
      explain: 'Sorting by Picker put the names in A to Z order, kilograms and all.',
      tips: ['Select a cell in the column to sort by, then tap a sort button.', 'The headings in row 1 stay on top when you sort.'],
      solution: [
        { tap: 'A2', say: 'Select a name, to sort by the Picker column.' },
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
        { tap: 'B3', say: 'Suppose a slip changes a cell by mistake.' },
        { tap: 'B3' },
        { key: '9' },
        { key: 'enter', say: 'Ana’s 52 kg has become 529.' },
        { tool: 'undo', say: 'Undo takes back the last step: 52 again.' },
      ],
      prompt: 'Your turn. Sort by Kg with A→Z, then take it back with Undo.',
      checks: [{ type: 'undid' }, { type: 'cellValue', cell: 'A2', equals: 'Cy' }],
      hints: ['Do the sort first. There is nothing to undo until you have.', 'Select a Kg cell, tap A→Z, then tap Undo.', 'Cy should be back on top.'],
      explain: 'Undo put every row back where it was before the sort.',
      tips: ['Undo takes back one step at a time. Press it again to go further.', 'Unsure what a button does? Try it: Undo is always there.'],
      solution: [
        { tap: 'B2', say: 'Select a Kg cell.' },
        { tool: 'sortAsc', say: 'A→Z sorts smallest first. Ben is on top.' },
        { tool: 'undo', say: 'Undo puts it back.' },
      ],
    },
    {
      id: 'xl.u3.l3.e4',
      type: 'grid-task',
      skill: UNDO,
      sheet: byScore,
      tools: ['undo'],
      prompt: 'Change Dee’s kilograms to 0, then undo it so they read 49 again.',
      checks: [{ type: 'undid' }, { type: 'cellValue', cell: 'B4', equals: 49 }],
      hints: ['Make the change first: tap B4 twice to edit it, delete 49, type 0, Enter.', 'Then tap Undo once.', 'B4 should show 49 again.'],
      explain: 'Undo works on typing too. The 49 came straight back.',
      tips: ['Undo works on typing, sorting, filling and pasting alike.', BASICS.backspace],
      solution: [
        { tap: 'B4', say: 'Select B4, then tap it again to edit.' },
        { tap: 'B4' },
        { key: 'backspace', say: 'Delete the 49.' },
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
      prompt: 'Change Cy’s kilograms to 5, then undo it with {mod} + Z.',
      checks: [
        { type: 'usedShortcut', id: 'undo' },
        { type: 'cellValue', cell: 'B2', equals: 61 },
      ],
      hints: ['Make the change first: tap B2 twice to edit it, delete 61, type 5, Enter.', 'Then press {mod}, and then Z.', 'B2 should show 61 again.'],
      explain: '{mod} + Z is undo in almost every program, not only spreadsheets.',
      tips: ['Z is the undo letter, at the bottom left of the keyboard.', BASICS.enter],
      solution: [
        { tap: 'B2', say: 'Select B2, then tap it again to edit.' },
        { tap: 'B2' },
        { key: 'backspace', say: 'Delete the 61.' },
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
      prompt: 'The stall’s stock. Put the product with the most stock on top.',
      checks: [{ type: 'rangeSorted', range: 'C2:C5', descending: true }],
      hints: ['Sort by the Stock column, biggest first.', 'Select any Stock number, then tap Z→A.', 'Carrots, with 40, should end up on top.'],
      explain: 'Z→A on Stock put the biggest first, and each row stayed together.',
      tips: ['Z→A is biggest first for numbers.', BASICS.headings],
      solution: [
        { tap: 'C2', say: 'Select a Stock number, to sort by it.' },
        { tool: 'sortDesc', say: 'Z→A puts the biggest first.' },
      ],
    },
    choice({
      id: 'xl.u3.l3.e7',
      skill: SORT,
      sheet: byName,
      prompt: 'You sort this table by Kg. What happens to the names?',
      options: ['Each name moves with its own kilograms', 'The names stay where they are', 'The names are sorted A to Z as well'],
      right: 0,
      hints: ['A row belongs together.', 'If the names stayed put, the kilograms would end up beside the wrong picker.', 'Sort moves whole rows.'],
      explain: 'Sort moves whole rows, so the kilograms stay beside their own picker.',
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
      prompt: 'Put the nearest customer on top: sort by Km, smallest first.',
      checks: [{ type: 'rangeSorted', range: 'B2:B5' }],
      hints: ['Sort by the Km column.', 'Select any Km number, then tap A→Z.', 'Bay Deli, at 8 km, should end up on top.'],
      explain: 'A→Z on Km put the smallest first.',
      tips: tipsFor(SORT),
      solution: [
        { tap: 'B2', say: 'Select a Km number.' },
        { tool: 'sortAsc', say: 'A→Z sorts smallest first.' },
      ],
    },
    {
      id: 'xl.u3.l3.p2',
      type: 'grid-task',
      skill: UNDO,
      sheet: towns,
      tools: ['undo', 'sortAsc'],
      prompt: 'Sort the customers A to Z by name, then take it back with Undo.',
      checks: [{ type: 'undid' }, { type: 'cellValue', cell: 'A2', equals: 'River Cafe' }],
      hints: ['Do the sort first. There is nothing to undo until you have.', 'Select a name, tap A→Z, then tap Undo.', 'River Cafe should be back on top.'],
      explain: 'Undo put every row back where it was.',
      tips: tipsFor(UNDO),
      solution: [
        { tap: 'A2', say: 'Select a name.' },
        { tool: 'sortAsc', say: 'A→Z sorts the names.' },
        { tool: 'undo', say: 'Undo puts it back.' },
      ],
    },
  ],
};
