import type { Lesson } from '@/lessons/types';

import { table } from '../build';
import { BASICS, tipsFor } from '../tips';

const COPY = 'xl.copy';
const CUT = 'xl.cut';

const plan = table(['Task', 'Mon', 'Tue'], [['Email', 2, null], ['Calls', 3, null], ['Notes', 1, null]]);
const jobs = table(['Job', 'Who'], [['Wash', 'Ann'], ['Cook', null], ['Shop', 'Bo']]);
const order = table(['Item', 'Price', 'Qty', 'Cost'], [['Pens', 2, 10], ['Pads', 4, 5]], { cells: { D2: '=B2*C2' } });
const hours = table(['Task', 'Hours'], [['Email', 2], ['Calls', 3], ['Notes', 1]], { rows: 5 });
const seats = table(['Seat', 'Guest'], [['Front', 'Kai'], ['Middle', null], ['Back', 'Lou']]);
const pay = table(['Name', 'Rate', 'Hours', 'Pay'], [['Sam', 12, 8], ['Jo', 15, 6]], { cells: { D2: '=B2*C2' } });

export const copyAndMove: Lesson = {
  id: 'xl.u3.l2',
  title: 'Copy and move',
  summary: 'Copy cells to a new place, or move them there.',
  recap: [
    'Copy leaves the original where it is. Cut moves it.',
    'Pick where the top-left cell should land, then paste.',
    'A copied formula moves its cells along, just like a fill.',
  ],
  newSkills: [COPY, CUT],
  exercises: [
    {
      id: 'xl.u3.l2.e1',
      type: 'demo',
      skill: COPY,
      sheet: plan,
      tools: ['copy', 'paste'],
      script: [
        { tap: 'B2', say: 'Pick the cell to copy.' },
        { tool: 'copy', say: 'Copy. A dashed outline shows what is waiting.' },
        { tap: 'C2', say: 'Pick where it should go.' },
        { tool: 'paste', say: 'Paste. Now both cells hold 2.' },
      ],
      prompt: 'Your turn. Copy B3 into C3.',
      checks: [
        { type: 'cellValue', cell: 'C3', equals: 3 },
        { type: 'cellValue', cell: 'B3', equals: 3 },
      ],
      hints: ['Four steps: pick, Copy, pick the new place, Paste.', 'Tap B3, tap Copy, tap C3, tap Paste.', 'C3 should show 3, and B3 should still show 3.'],
      explain: 'Copy leaves the original alone and makes a second one.',
      tips: ['Copy leaves the original where it is. Cut moves it.', 'The dashed outline shows what is waiting to be pasted.'],
      solution: [
        { tap: 'B3', say: 'Tap B3, the cell to copy.' },
        { tool: 'copy', say: 'Tap Copy.' },
        { tap: 'C3', say: 'Tap C3, where it should go.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
    {
      id: 'xl.u3.l2.e2',
      type: 'grid-task',
      skill: COPY,
      sheet: plan,
      tools: ['copy', 'paste'],
      prompt: 'Tue is the same as Mon. Copy all three Mon numbers across.',
      checks: [
        { type: 'cellValue', cell: 'C2', equals: 2 },
        { type: 'cellValue', cell: 'C3', equals: 3 },
        { type: 'cellValue', cell: 'C4', equals: 1 },
      ],
      hints: ['Pick all three Mon numbers first, by dragging.', 'Drag B2 to B4, tap Copy, tap C2, tap Paste.', 'C2, C3 and C4 should show 2, 3 and 1.'],
      explain: 'A whole block copies in one go. You only pick where its top cell lands.',
      tips: ['Pick where the top-left corner should land, then paste.', BASICS.headings],
      solution: [
        { drag: 'B2:B4', say: 'Drag from B2 down to B4.' },
        { tool: 'copy', say: 'Tap Copy.' },
        { tap: 'C2', say: 'Tap C2, where the top of the copy goes.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
    {
      id: 'xl.u3.l2.e3',
      type: 'demo',
      skill: CUT,
      sheet: jobs,
      tools: ['cut', 'paste'],
      script: [
        { tap: 'B2', say: 'Cut is for moving. Pick the cell.' },
        { tool: 'cut', say: 'Cut. It stays where it is until you paste.' },
        { tap: 'B3', say: 'Pick the new place.' },
        { tool: 'paste', say: 'Paste. Ann has moved to Cook, and B2 is empty.' },
      ],
      prompt: 'Your turn. Move Bo from Shop up to Wash: B4 to B2.',
      checks: [
        { type: 'cellValue', cell: 'B2', equals: 'Bo' },
        { type: 'cellValue', cell: 'B4', equals: null },
      ],
      hints: ['Four steps: pick, Cut, pick the new place, Paste.', 'Tap B4, tap Cut, tap B2, tap Paste.', 'B2 should say Bo, and B4 should be empty.'],
      explain: 'Cut and paste moves a cell: it leaves nothing behind.',
      tips: ['Nothing changes when you cut. The move happens on paste.', 'Paste replaces whatever was in the cell before.'],
      solution: [
        { tap: 'B4', say: 'Tap B4, the cell to move.' },
        { tool: 'cut', say: 'Tap Cut.' },
        { tap: 'B2', say: 'Tap B2, where it should go.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
    {
      id: 'xl.u3.l2.e4',
      type: 'grid-task',
      skill: COPY,
      sheet: order,
      tools: ['copy', 'paste'],
      prompt: 'D2 has a formula for Cost. Copy it into D3.',
      checks: [{ type: 'outcome', cell: 'D3', reference: '=B3*C3' }],
      hints: ['Copying a formula works just like copying a number.', 'Tap D2, tap Copy, tap D3, tap Paste.', '=B3*C3'],
      explain: 'A copied formula moves its cells along, just like a fill: D3 uses row 3.',
      tips: ['A copied formula adjusts its cells, like a filled one.', BASICS.bar],
      solution: [
        { tap: 'D2', say: 'Tap D2, the formula to copy.' },
        { tool: 'copy', say: 'Tap Copy.' },
        { tap: 'D3', say: 'Tap D3, where it should go.' },
        { tool: 'paste', say: 'Tap Paste. It became B3 times C3.' },
      ],
    },
    {
      id: 'xl.u3.l2.e5',
      type: 'shortcut-press',
      skill: COPY,
      sheet: plan,
      prompt: 'Copy B4 into C4 with the keys: {mod} + C, then {mod} + V.',
      checks: [
        { type: 'usedShortcut', id: 'copy' },
        { type: 'usedShortcut', id: 'paste' },
        { type: 'cellValue', cell: 'C4', equals: 1 },
      ],
      hints: ['Pick B4 first, then use the keys under the grid.', 'Tap B4. Press {mod} then C. Tap C4. Press {mod} then V.', 'C4 should show 1.'],
      explain: 'C copies and V pastes. They sit side by side on a keyboard.',
      tips: ['C for copy, X for cut (like scissors), V for paste.', 'After a copy you can paste again and again.'],
      solution: [
        { tap: 'B4', say: 'Tap B4, the cell to copy.' },
        { combo: 'copy', say: 'Press {mod}, then C.' },
        { tap: 'C4', say: 'Tap C4, where it should go.' },
        { combo: 'paste', say: 'Press {mod}, then V.' },
      ],
    },
    {
      id: 'xl.u3.l2.e6',
      type: 'grid-task',
      skill: CUT,
      sheet: hours,
      tools: ['cut', 'paste'],
      prompt: 'Move the Calls row to the bottom: A3 and B3 down to row 5.',
      checks: [
        { type: 'cellValue', cell: 'A5', equals: 'Calls' },
        { type: 'cellValue', cell: 'B5', equals: 3 },
        { type: 'cellValue', cell: 'A3', equals: null },
      ],
      hints: ['Pick both cells of the row first, by dragging.', 'Drag A3 to B3, tap Cut, tap A5, tap Paste.', 'A5 should say Calls, and row 3 should be empty.'],
      explain: 'Both cells moved together, and row 3 was left empty.',
      tips: ['Cut and paste can move a whole block at once.', BASICS.free],
      solution: [
        { drag: 'A3:B3', say: 'Drag from A3 across to B3.' },
        { tool: 'cut', say: 'Tap Cut.' },
        { tap: 'A5', say: 'Tap A5, where the row should start.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
  ],
  practice: [
    {
      id: 'xl.u3.l2.p1',
      type: 'grid-task',
      skill: COPY,
      sheet: pay,
      tools: ['copy', 'paste'],
      prompt: "D2 works out Sam's Pay. Copy it into D3 for Jo.",
      checks: [{ type: 'outcome', cell: 'D3', reference: '=B3*C3' }],
      hints: ['Four steps: pick, Copy, pick the new place, Paste.', 'Tap D2, tap Copy, tap D3, tap Paste.', '=B3*C3'],
      explain: 'The copy uses row 3: 15 times 6 is 90.',
      tips: tipsFor(COPY),
      solution: [
        { tap: 'D2', say: 'Tap D2, the formula to copy.' },
        { tool: 'copy', say: 'Tap Copy.' },
        { tap: 'D3', say: 'Tap D3, where it should go.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
    {
      id: 'xl.u3.l2.p2',
      type: 'grid-task',
      skill: CUT,
      sheet: seats,
      tools: ['cut', 'paste'],
      prompt: 'Move Lou from the Back to the Middle: B4 to B3.',
      checks: [
        { type: 'cellValue', cell: 'B3', equals: 'Lou' },
        { type: 'cellValue', cell: 'B4', equals: null },
      ],
      hints: ['Four steps: pick, Cut, pick the new place, Paste.', 'Tap B4, tap Cut, tap B3, tap Paste.', 'B3 should say Lou, and B4 should be empty.'],
      explain: 'Cut and paste moved Lou and left the Back seat empty.',
      tips: tipsFor(CUT),
      solution: [
        { tap: 'B4', say: 'Tap B4, the cell to move.' },
        { tool: 'cut', say: 'Tap Cut.' },
        { tap: 'B3', say: 'Tap B3, where it should go.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
  ],
};
