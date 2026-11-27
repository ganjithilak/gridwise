import type { Lesson } from '@/lessons/types';

import { table } from '../build';
import { BASICS, tipsFor } from '../tips';

const COPY = 'xl.copy';
const CUT = 'xl.cut';

/** Hours planned for each job on the farm. Tuesday's plan is the same as Monday's. */
const plan = table(['Job', 'Mon', 'Tue'], [['Watering', 2, null], ['Weeding', 3, null], ['Packing', 1, null]]);
/** Who is on which job today. */
const jobs = table(['Job', 'Who'], [['Milking', 'Ana'], ['Feeding', null], ['Stall', 'Ben']]);
/** The stall's takings, with the formula in D2 only. */
const order = table(['Produce', 'Price', 'Kg', 'Takings'], [['Carrots', 3, 10], ['Apples', 4, 8]], { cells: { D2: '=B2*C2' } });
/** The day's jobs in the order they will be done. */
const hours = table(['Job', 'Hours'], [['Watering', 2], ['Weeding', 3], ['Packing', 1]], { rows: 5 });
/** Practice: what goes on each table at the market stall. */
const seats = table(['Table', 'Produce'], [['Front', 'Apples'], ['Middle', null], ['Back', 'Pears']]);
/** Practice: pickers' pay, with the formula in D2 only. */
const pay = table(['Picker', 'Rate', 'Hours', 'Pay'], [['Ana', 25, 8], ['Ben', 30, 6]], { cells: { D2: '=B2*C2' } });

export const copyAndMove: Lesson = {
  id: 'xl.u3.l2',
  title: 'Copy and Move',
  summary: 'Copy the farm’s job plan to a new day, or move a job to a new place.',
  recap: [
    'Copy leaves the original where it is. Cut moves it.',
    'Select where the top-left cell should go, then paste.',
    'A copied formula adjusts its references, just as a fill does.',
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
        { say: 'Tuesday’s plan is the same as Monday’s.' },
        { tap: 'B2', say: 'Select the cell to copy.' },
        { tool: 'copy', say: 'Copy. A dashed outline marks what is copied.' },
        { tap: 'C2', say: 'Select where it should go.' },
        { tool: 'paste', say: 'Paste. Now both cells hold 2.' },
      ],
      prompt: 'Your turn. Copy the weeding hours from B3 into C3.',
      checks: [
        { type: 'cellValue', cell: 'C3', equals: 3 },
        { type: 'cellValue', cell: 'B3', equals: 3 },
      ],
      hints: ['Four steps: select, Copy, select the new place, Paste.', 'Select B3, tap Copy, select C3, tap Paste.', 'C3 should show 3, and B3 should still show 3.'],
      explain: 'Copy leaves the original as it is and makes a second one.',
      tips: ['Copy leaves the original where it is. Cut moves it.', 'The dashed outline shows what is ready to paste.'],
      solution: [
        { tap: 'B3', say: 'Select B3, the cell to copy.' },
        { tool: 'copy', say: 'Tap Copy.' },
        { tap: 'C3', say: 'Select C3, where it should go.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
    {
      id: 'xl.u3.l2.e2',
      type: 'grid-task',
      skill: COPY,
      sheet: plan,
      tools: ['copy', 'paste'],
      prompt: 'Copy all three of Monday’s numbers across to Tuesday.',
      checks: [
        { type: 'cellValue', cell: 'C2', equals: 2 },
        { type: 'cellValue', cell: 'C3', equals: 3 },
        { type: 'cellValue', cell: 'C4', equals: 1 },
      ],
      hints: ['Select all three Monday numbers first, by dragging.', 'Drag B2 to B4, tap Copy, select C2, tap Paste.', 'C2, C3 and C4 should show 2, 3 and 1.'],
      explain: 'A whole range copies at once. You only select where its top cell goes.',
      tips: ['Select where the top-left corner should go, then paste.', BASICS.headings],
      solution: [
        { drag: 'B2:B4', say: 'Drag from B2 down to B4.' },
        { tool: 'copy', say: 'Tap Copy.' },
        { tap: 'C2', say: 'Select C2, where the top of the copy goes.' },
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
        { tap: 'B2', say: 'Cut is for moving. Select the cell.' },
        { tool: 'cut', say: 'Cut. Nothing moves until you paste.' },
        { tap: 'B3', say: 'Select the new place.' },
        { tool: 'paste', say: 'Paste. Ana is on feeding; B2 is empty.' },
      ],
      prompt: 'Your turn. Move Ben from the stall to milking: B4 to B2.',
      checks: [
        { type: 'cellValue', cell: 'B2', equals: 'Ben' },
        { type: 'cellValue', cell: 'B4', equals: null },
      ],
      hints: ['Four steps: select, Cut, select the new place, Paste.', 'Select B4, tap Cut, select B2, tap Paste.', 'B2 should say Ben, and B4 should be empty.'],
      explain: 'Cut and paste moves a cell: it leaves nothing behind.',
      tips: ['Nothing changes when you cut. The move happens on paste.', 'Paste replaces whatever was in the cell before.'],
      solution: [
        { tap: 'B4', say: 'Select B4, the cell to move.' },
        { tool: 'cut', say: 'Tap Cut.' },
        { tap: 'B2', say: 'Select B2, where it should go.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
    {
      id: 'xl.u3.l2.e4',
      type: 'grid-task',
      skill: COPY,
      sheet: order,
      tools: ['copy', 'paste'],
      prompt: 'D2 has the formula for takings. Copy it into D3.',
      checks: [{ type: 'outcome', cell: 'D3', reference: '=B3*C3' }],
      hints: ['Copying a formula works just like copying a number.', 'Select D2, tap Copy, select D3, tap Paste.', '=B3*C3'],
      explain: 'A copied formula adjusts its references, just as a fill does: D3 uses row 3.',
      tips: ['A copied formula adjusts its references, as a filled one does.', BASICS.bar],
      solution: [
        { tap: 'D2', say: 'Select D2, the formula to copy.' },
        { tool: 'copy', say: 'Tap Copy.' },
        { tap: 'D3', say: 'Select D3, where it should go.' },
        { tool: 'paste', say: 'Tap Paste. It became =B3*C3.' },
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
      hints: ['Select B4 first, then use the keys under the grid.', 'Select B4. Press {mod} then C. Select C4. Press {mod} then V.', 'C4 should show 1.'],
      explain: 'C copies and V pastes. They sit side by side on a keyboard.',
      tips: ['C for copy, X for cut (like scissors), V for paste.', 'After a copy, you can paste as many times as you need.'],
      solution: [
        { tap: 'B4', say: 'Select B4, the cell to copy.' },
        { combo: 'copy', say: 'Press {mod}, then C.' },
        { tap: 'C4', say: 'Select C4, where it should go.' },
        { combo: 'paste', say: 'Press {mod}, then V.' },
      ],
    },
    {
      id: 'xl.u3.l2.e6',
      type: 'grid-task',
      skill: CUT,
      sheet: hours,
      tools: ['cut', 'paste'],
      prompt: 'Weeding is moving to the end of the day. Move A3:B3 down to row 5.',
      checks: [
        { type: 'cellValue', cell: 'A5', equals: 'Weeding' },
        { type: 'cellValue', cell: 'B5', equals: 3 },
        { type: 'cellValue', cell: 'A3', equals: null },
      ],
      hints: ['Select both cells of the row first, by dragging.', 'Drag A3 to B3, tap Cut, select A5, tap Paste.', 'A5 should say Weeding, and row 3 should be empty.'],
      explain: 'Both cells moved together, and row 3 was left empty.',
      tips: ['Cut and paste can move a whole range at once.', BASICS.free],
      solution: [
        { drag: 'A3:B3', say: 'Drag from A3 across to B3.' },
        { tool: 'cut', say: 'Tap Cut.' },
        { tap: 'A5', say: 'Select A5, where the row should start.' },
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
      prompt: 'D2 works out Ana’s pay. Copy it into D3 for Ben.',
      checks: [{ type: 'outcome', cell: 'D3', reference: '=B3*C3' }],
      hints: ['Four steps: select, Copy, select the new place, Paste.', 'Select D2, tap Copy, tap D3, tap Paste.', '=B3*C3'],
      explain: 'The copy uses row 3: 30 times 6 is 180.',
      tips: tipsFor(COPY),
      solution: [
        { tap: 'D2', say: 'Select D2, the formula to copy.' },
        { tool: 'copy', say: 'Tap Copy.' },
        { tap: 'D3', say: 'Select D3, where it should go.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
    {
      id: 'xl.u3.l2.p2',
      type: 'grid-task',
      skill: CUT,
      sheet: seats,
      tools: ['cut', 'paste'],
      prompt: 'Move the pears from the back table to the middle: B4 to B3.',
      checks: [
        { type: 'cellValue', cell: 'B3', equals: 'Pears' },
        { type: 'cellValue', cell: 'B4', equals: null },
      ],
      hints: ['Four steps: select, Cut, select the new place, Paste.', 'Select B4, tap Cut, select B3, tap Paste.', 'B3 should say Pears, and B4 should be empty.'],
      explain: 'Cut and paste moved the pears and left the back table empty.',
      tips: tipsFor(CUT),
      solution: [
        { tap: 'B4', say: 'Select B4, the cell to move.' },
        { tool: 'cut', say: 'Tap Cut.' },
        { tap: 'B3', say: 'Select B3, where it should go.' },
        { tool: 'paste', say: 'Tap Paste.' },
      ],
    },
  ],
};
