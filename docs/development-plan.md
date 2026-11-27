# Gridwise — Integrated Development Plan

The staged plan from the Integrated Development and Refinement Brief (26 Nov 2026), the audit
behind it, and where each stage stands. Visual direction lives in
[creative-direction-v2.md](creative-direction-v2.md); writing rules in
[editorial-standards.md](editorial-standards.md); lesson and game coverage in
[curriculum-map.md](curriculum-map.md).

## Stage status

| Stage | Scope | Status |
|---|---|---|
| 1 | Audit content, components, games, transitions | **Done** (below) |
| 2 | Roots content overhaul; permanent editorial standards | **Done**: 5 lessons rewritten, then revised after a beginner walkthrough (27 Nov) |
| 3 | Spreadsheet atmosphere; seamless lesson-entry transition (farm and roots routes) | **Done** (27 Nov): beam up the roots and stem, sky grid bends into the lesson's own sheet; return runs it back |
| 4 | New spreadsheet presentation, same engine | **Done** (27 Nov): Workbench, fitted columns, continuing sheet, Name Box and fx, ✕ ✓ |
| 5 | Core games: Match Pairs, Speed Trial (overhaul), Formula Builder, Find the Error, Cell Hunt, Predict the Result | Not started (list revised 27 Nov) |
| 6 | Grid Master into a locked Advanced Arcade | **Done** (code and route kept; entry points removed) |
| 7 | Games, Profile, Lessons, supporting screens to the Farm's standard | Partly: palette, sky, type and buttons done in the Refined pass |
| 8 | Editorial overhaul of the remaining units | Not started |
| 9 | Full testing and visual review | Ongoing per stage |

**Dependencies.** Stage 4 (spreadsheet layout) should settle before Stage 3's transition is
finalised, because the transition must land exactly on the new grid's headers. Stage 5's
games reuse the spreadsheet components, so they follow Stage 4 too. Stage 8 can run in
parallel with any of them.

## Stage 1 audit (26 Nov 2026)

**Content (Roots, now fixed):**
- Entering Data taught "tap twice, delete, retype" to replace a value; Excel replaces by
  selecting and typing, and edits with F2 or a double-click. The controller already behaved
  like Excel; the phone keypad only opened in edit mode. Fixed: content rewritten, and the keys
  open on selection for value-entry tasks.
- Story breaks: figs (farm produce, but outside the established stall inventory), a pets practice sheet, an abrupt opening ("The farm
  is now yours"), produce that did not match the stall.
- Tone: celebratory praise ("Excellent work!", "You got it!"), prompts mentioning untaught
  skills ("To copy the Potatoes row").
- Inconsistent terms: pick / select / tap; stretch / extend; money / currency.
- Practice data duplicated lesson numbers.
- Strengths kept: formula-mistake diagnostics already meet the feedback standard.

**Content (still to do, Stage 8):** units 1–4 use the old voice and non-farm datasets (shop,
pets, sport) and the default formula captions still say "tap it again to type"; welcome, tour
and game copy need the same review; badge names and descriptions.

**Games:** Speed Trial level 1 tests copy, paste and undo before the course teaches them
(they come in the side unit "Getting around faster"). Its keyboard works but its styling
predates the Refined direction. Grid Master works; now locked.

**Transitions:** one overlay transition for all lesson entries; no roots route, no persistent
layer shared with the farm, and it ends on a generic flat grid rather than the lesson's own.

**Components:** the spreadsheet engine, controller, keyboard, checks and 2,600+ tests are
solid and stay. The lesson screen's layout is the part to replace (Stage 4).

## Roots walkthrough (27 Nov 2026)

All five lessons played through on a 375 × 812 and 375 × 667 screen as a first-time user.

| Finding | Fix |
|---|---|
| The opening story moved the selection between unrelated cells on every line | Cell can now speak without touching the sheet (`{ say }` script step); the story is told over a still sheet, then a row, a column and a cell are highlighted as each is named |
| "Cell" and "select" were used in lesson 0 before being defined | Lesson 0 now names rows, columns and cells and says how to select; lesson 1 builds on it instead of repeating it |
| Lesson 1 never said why references matter | Its opening and recap now say: prices are updated by naming cells exactly; formulas rely on references |
| The Name Box was "the top left" | Named as the Name Box (Excel's term) |
| Editing was taught on a value it is quicker to retype; the F2 note was spoken over the Enter step | Captions re-paired; the explanation now gives the real reason (long entries). Practice ends on a correction (500 → 50) instead of a bare selection |
| "You will write formulas next" (the next lesson is rows and columns) | "Formulas come in the next unit" |
| Lesson 3 taught "column" three times running, the second as a repeat demonstration | The repeat demo became a task with less help; the third column task moved to the practice round |
| Ranges such as B1:B5 appeared in explanations without the colon ever being explained | Explained the first time it appears ("The colon means “to”") |
| Lessons 3 and 4 opened on the keys without saying why | Each opens with one line of purpose |

Still true and accepted: lesson 0 is recognition only (select the right cell), by design for an
orientation lesson; every selection task needs a Check press, which keeps the rhythm consistent
with typed tasks.

## Stage 4: the spreadsheet (27 Nov 2026)

One reusable sheet surface for lessons, questions and (Stage 5) games:

- `src/spreadsheet/Workbench.tsx`: the framed window, formula bar on top, grid filling the rest.
- `src/spreadsheet/layout.ts`: columns fitted to their contents (as after an AutoFit in Excel),
  rows up to 44 pt, and the empty rows and columns that follow the data drawn quieter so the
  sheet reads as a real, continuing sheet. Tested in `__tests__/layout.test.ts`.
- `FormulaBar`: Excel's Name Box and fx; ✕ and ✓ while typing (✓ commits without moving, as in
  Excel). `BarFrame` + `Fx` serve screens that show a formula without a live sheet.
- Headings of the selection are lit with a gold bar, as Excel underlines them.
- Keys not yet taught stay in place as faint dashed outlines (the board never moves).
- Engine, controller, checks and keyboard handling unchanged.

**Compromises and departures, reported:**
- Empty rows and columns past the data cannot be selected. The exercise's sheet ends at its
  data so that checks such as "the whole column is B1:B5" stay exact.
- Collapsible instructions (from the earlier brief) were not built. The card is already two or
  three lines and fixed in height; collapsing it would hide the task to gain space the grid
  does not currently need. Revisit if later units need taller sheets.
- During a demonstration the space reserved for the keys stays empty, so the grid does not
  jump when the learner's turn begins.
- Not yet checked on a physical phone; verified in the browser at 375 × 812, 375 × 667 and
  812 × 375 (landscape split).

## Stage 3: the lesson-entry transition (27 Nov 2026)

One continuous move from the World into the lesson's real sheet, replacing the old overlay
that ended on a generic flat grid (now gone).

1. **Beam.** From the roots, light rises from the lesson's node along its root, up the taproot
   and the plant's stem and out through the top of the sky. The World's own camera follows it,
   so the farm really moves past; nothing is a picture of the World. From the farm, the beam
   starts at the foot of the plant. The camera rests over the farm's sky, where the sky grid's
   letters and numbers are in view, rather than climbing to Cell's panel above.
2. **Hand-over.** The sky grid brightens and the sky deepens over the farm (0.3 s). The lesson
   opens underneath, and its Grid reports where its sheet is on screen.
3. **Landing.** The grid bends: the dome's letter band becomes the column headings and its first
   column the row numbers, the view pushes in and settles, and every line comes to rest on the
   lesson's own rows and columns (A on A, 1 on 1). Sky lines beyond the sheet fade as it
   flattens; the lesson appears around the grid in the last third.
4. **Leaving** runs it backwards: the sheet lifts off and curves back into the sky over the
   farm, then the light drains back down to the lesson's place in the roots.

Full ≈ 2.2 s in (roots), ≈ 2.5 s out; Reduced is a 0.3 s fade; Off navigates directly. The
phone's reduce-motion setting turns Full into Reduced.

Code: `src/world/transition/` (`GridTransition` directs, `morph.ts` is the arithmetic, tested
in `__tests__/morph.test.ts`; `stage.ts` is how the World lends its camera and sky and the Grid
reports its sheet). `src/world/env/domeGeometry.ts` is the sky grid's projection, now shared by
the drawing and the transition so they cannot drift apart.

**Also fixed:** the World was emptied and rebuilt behind every lesson (it was measured as zero
size while hidden), restarting the clouds and the plant on return; and leaving a results screen
could open a second World. The World now stays as it was, and returning pops back to it. Its
ambient events (birds, worm, Cell wandering) wait while a lesson is open.

**Compromises and departures, reported:**
- Full mode runs on the JavaScript thread (each frame blends precomputed points and redraws one
  SVG), not the native driver the performance rules ask for: the grid's lines change shape,
  which the native driver cannot animate. Smooth in the browser; not yet measured on a phone.
- During the 0.3 s hand-over the farm below the horizon fades under the sky colour rather than
  becoming part of the sheet.
- When a lesson opens on something without a sheet (a question, or "Which computer do you
  use?"), or a sheet takes longer than 0.7 s to lay out, the grid lands on a stand-in sheet in
  the middle of the screen. Leaving from the results screen (no sheet) starts from the sky grid.
- The beam is drawn light (temporary visual asset); production VFX could add bloom and particles.
- Ambient loops (drifting clouds, the plant's sway) keep running under the lesson so they never
  restart; they are cheap native-driver loops.
- The Grid (spreadsheet) now imports from the World's transition code to report its sheet, a
  one-way dependency kept to two functions.
- Checked in the browser (frame by frame with a slowed clock) at 375 × 812 and 812 × 375 (side
  menu), Refined and Classic Farm, Full, Reduced and Off, roots and farm routes, both directions.
  Not checked: entering from Games (needs skills due for review), leaving from the results
  screen, and a physical phone.

## Approved vs deferred

Approved and in scope: everything in the brief's stages 1–9.

Deferred: payment or premium restrictions; farmer avatar; Space Invaders and Puzzle Master
arcade games; production artwork (see creative direction).

## Performance requirements

- Static scenery drawn once per screen size; ambient life paused off screen.
- Transitions on the native driver where they only move or fade (Reduced, camera travel); the
  Full lesson transition reshapes the grid on the JavaScript thread (see Stage 3). No layout
  work during a transition: its geometry is precomputed once.
- Lesson data is synchronous (bundled), so nothing loads during a transition.
- Target: no dropped frames on a mid-range phone in Expo Go (not yet measured on device).
