# Gridwise — Editorial Standards

Permanent rules for every learner-facing word: lessons, hints, tips, feedback, Cell's
dialogue, games, onboarding and the interface. The content tests (`src/content/__tests__`)
enforce the measurable parts; this document covers the rest.

## Voice

An experienced, approachable educator who respects the learner's intelligence (ages 12–65,
many learning for work).

- **Australian English** (organise, colour, centre, kilogram), except Excel's own terms
  (Format Cells, AutoSum, Fill Handle are spelled as Excel spells them).
- Natural, complete sentences. No robotic fragments, no baby talk, no exclamation-mark praise.
- Explain *why* as well as *what*, in one short line.
- The farm gives a reason to learn each skill; it never replaces the instruction. One farm
  reference per screen is plenty. No forced agricultural puns.
- Define a term the first time it appears ("the active cell: the cell with the outline").

## Feedback

Feedback reinforces knowledge; it neither celebrates nor criticises.

| Situation | Pattern | Example |
|---|---|---|
| Correct | Title **Correct** / **That's right**, then the reason | "C2 is where column C meets row 2. That name is its cell reference." |
| Nearly right | Say what is right, then what to check | "You're in the correct column. Check the row number and try again." |
| Formula wrong | Name exactly what the formula does (`src/lessons/mistakes.ts`) | "Your formula covers B2:B4, so B5 is left out." |
| Never | "Wrong!", "Amazing!", "Superstar!", "Excellent work!" | — |

A lesson's own `praise` is used only when the task needs its own wording, never for extra
enthusiasm. The explanation (`explain`) never starts with "Correct": the title says it.

## Cell, the mascot

A knowledgeable companion, not a cheerleader. Warm, brief, specific. Cell introduces what is
coming, points out what matters, and stays calm when something goes wrong. It never punishes,
never gushes, and never talks down. Cell's sky speech uses the same voice as lessons.

## Approved terminology

| Use | Not | Notes |
|---|---|---|
| select (a cell) | pick, choose, tap on | "Tap" only for the physical gesture on the phone |
| active cell | current cell, chosen cell | The outlined cell |
| cell reference | cell name, address | "B3": column letter, then row number |
| range | block, area | "B2:B5": first cell, colon, last cell. "Block" is acceptable in Roots before ranges are taught |
| enter (a value) / type | put, write | |
| replace (typing over) / edit (part of an entry) | change | Excel's distinction: typing replaces; F2 or double-click edits |
| formula bar | the bar | Shows what a cell actually contains |
| heading | title, label | Row 1 |
| extend (a selection) | stretch, grow | Shift + arrow |
| currency format | money format | Excel's Number Format name is "Currency" |
| Ctrl / Cmd | Control/Command in prompts | Prompts use `{mod}` where Windows and Mac differ |

## Technical accuracy

Every lesson must describe how Excel actually behaves. Where the phone works differently,
say so.

- **Selecting vs editing.** Typing into a selected cell replaces its contents. To change part
  of an entry: a second tap here; F2 or double-click in Excel.
- **Confirm and cancel.** Enter confirms; ✕ in the formula bar here, Esc in Excel, cancels.
- **Windows vs Mac.** Ctrl + Space selects a column on both (Control, not Command, on a Mac).
  Copy, paste, undo: Ctrl on Windows, Cmd on a Mac (`{mod}` in prompts).
- **Key strip.** On the phone, Ctrl and Shift stay held until used; on a keyboard they are held
  down. Say so when a shortcut is first taught.
- **Formats.** A format changes how a value looks, never the value: enter 2.75, not $2.75.
- **Prerequisites.** Never ask for a shortcut, function, gesture or term before it has been
  demonstrated (`newSkills` must appear in a demo first; enforced).

## Lesson structure

Teach, Lesson, Apply, carried out as:

1. Introduce the concept and why it matters on the farm (demo dialogue, one idea per screen,
   60 characters at most).
2. Demonstrate it (the demo's script).
3. Guided practice (the demo's "Your turn", with hints).
4. Independent practice (grid tasks, fewer hints in the prompt).
5. Apply it to a real farm task (`apply: true`).
6. Recap: two or three points (80 characters each) that also point forward.

Six to eight exercises per lesson (enforced). Orientation lessons may use recognition tasks
instead of practice. Choice questions stay at or below one in five. Each later task in a
lesson should give less help in its prompt than the one before.

## Data and continuity

- Related tasks carry the sheet forward (`withCells`), so the learner's own changes persist.
- Use a fresh dataset for independent practice and assessment.
- Produce in lessons matches the farm stall: apples, golden apples, pears, plums, tomatoes,
  carrots, potatoes (plus preserves, oil, milk, pies). Fruit projects (unit 4) deliberately
  leave the farm to show the skills transfer.
- Figures must stay consistent between lessons; see the dataset notes in
  [curriculum-map.md](curriculum-map.md).

## Length limits (enforced by tests)

Prompt and hint 80 characters; explanation 110; demo caption 60; tip 70; recap point 80;
two or three tips per exercise, never repeated within a lesson, never giving the answer.
