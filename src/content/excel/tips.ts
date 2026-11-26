/**
 * Tips that are true in any lesson. A lesson mixes these with tips of its own; the
 * content lint makes sure no lesson shows the same one twice.
 */
export const BASICS = {
  tapTwice: 'Tap a cell once to pick it. Tap it again to type in it.',
  enter: 'Press Enter when you have finished typing.',
  backspace: 'Tapped the wrong thing? The ⌫ key takes it back out.',
  bar: 'The bar above the grid shows what is really in the cell.',
  name: "A cell's name is its column letter, then its row number.",
  free: 'A wrong answer costs nothing. Fix it and check again.',
  hint: 'Stuck? The Hint button gives one small nudge at a time.',
  headings: 'The words in row 1 are headings. They say what each column holds.',
  labels: 'The words in column A say what each row is about.',
  back: 'The arrow at the top goes back a step, so you can read it again.',
} as const;

export const FORMULAS = {
  equals: 'Every formula starts with =',
  tapCell: 'Tap a cell to put it in your formula. No need to type its name.',
  shows: 'The cell shows the answer. The bar above it shows the formula.',
  updates: "Change a number and the formula's answer updates by itself.",
  swap: 'Tapped the wrong cell? Tap the right one and it swaps.',
  bracket: 'No need to close the last bracket. Enter does it for you.',
  range: 'A range is the first cell, a colon, then the last cell.',
  colon: 'A colon means "through". A1:A3 is A1, A2 and A3.',
  fn: 'A function does the working out. You just give it the cells.',
  long: 'A formula can be as long as you need.',
  drag: 'You can drag across cells to pick a whole range in one go.',
  check: 'Read your formula in the bar before you press Enter.',
} as const;

/** Two tips for each skill, for practice rounds and unit tests, where there is no lesson around them. */
export const BY_SKILL: Record<string, readonly [string, string]> = {
  'xl.spreadsheet.purpose': ['A spreadsheet organises information into rows and columns.', BASICS.labels],
  'xl.cell.address': [BASICS.name, BASICS.headings],
  'xl.cell.type': [BASICS.tapTwice, BASICS.enter],
  'xl.select.column': ['Ctrl + Space selects the whole column of the active cell.', 'Ctrl goes with columns. Shift goes with rows.'],
  'xl.select.row': ['Shift + Space selects the whole row of the active cell.', 'Both shortcuts end with Space. Only the first key differs.'],
  'xl.keys.move': ['Each press of an arrow moves one cell.', 'An arrow at the edge of the sheet does nothing.'],
  'xl.select.extend': ['With Shift held, an arrow stretches instead of moving.', 'Shift works with all four arrows.'],
  'xl.formula.arithmetic': [FORMULAS.equals, FORMULAS.tapCell],
  'xl.sum.range': [FORMULAS.range, FORMULAS.bracket],
  'xl.average': ['AVERAGE adds the numbers up, then divides by how many there are.', FORMULAS.range],
  'xl.minmax': ['MIN finds the smallest number. MAX finds the biggest.', FORMULAS.bracket],
  'xl.count': ['COUNT says how many cells have a number in them.', FORMULAS.range],
  'xl.autosum': ['Σ writes =SUM( for you and guesses the range.', 'Look at the range Σ guessed before you press Enter.'],
  'xl.fill': ['The small square on the corner of a cell is the fill handle.', 'Filling copies a formula and moves its cells along with it.'],
  'xl.absolute': ['$ pins a cell in place, so a fill cannot move it.', 'Tap a cell, then $, to lock it. A1 becomes $A$1.'],
  'xl.compare': ['> means "greater than". < means "less than".', 'A question in a cell is answered TRUE or FALSE.'],
  'xl.if': ['IF has three parts: a question, then two possible answers.', 'Words inside a formula go in "quote marks".'],
  'xl.countif': ['COUNTIF needs two things: where to look, and what to look for.', 'A rule like ">100" goes in quote marks, sign first.'],
  'xl.sumif': ['SUMIF needs three things: where to look, what for, what to add.', 'Matching words ignores capitals: north finds North.'],
  'xl.xlookup': ['XLOOKUP asks: find what, look where, bring back from where.', 'If nothing matches, a lookup shows #N/A.'],
  'xl.vlookup': ['VLOOKUP counts columns from the left of the table, starting at 1.', 'End VLOOKUP with FALSE, or it may guess a near match.'],
  'xl.iferror': ['IFERROR has two parts: the formula, then what to show if it fails.', 'An error value starts with #. It is a message, not a crash.'],
  'xl.select.range': ['Drag across cells to pick more than one.', 'Tap any single cell to let go of a block.'],
  'xl.select.all': ['A shortcut is two keys: hold the first, press the second.', 'On a Mac the key is Cmd. On Windows it is Ctrl.'],
  'xl.copy': ['Copy leaves the original where it is.', 'Pick where the top-left corner should land, then paste.'],
  'xl.cut': ['Cut is for moving: the original goes when you paste.', 'The dashed outline shows what is waiting to be pasted.'],
  'xl.sort': ['Sort moves whole rows, so each name keeps its own numbers.', 'Tap a cell in the column to sort by, then the sort button.'],
  'xl.undo': ['Undo takes back one step at a time.', 'Undo works on typing, sorting, filling and pasting alike.'],
  'xl.bold': ['Bold is for headings and totals.', 'Pick the cells first, then press the button.'],
  'xl.numfmt': ['A format changes how a number looks, never the number itself.', 'Money format adds the $ sign and two decimal places.'],
};

export const tipsFor = (skill: string): string[] => [...BY_SKILL[skill]];
