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
| 5 | Core games: Match Pairs, Speed Trial (overhaul), Formula Builder, Find the Error, Cell Hunt, Predict the Result | **Done** (27 Nov): six games, each asking only what has been taught, harder with play; Speed Trial rebuilt |
| 6 | Grid Master into a locked Advanced Arcade | **Done** (code and route kept; entry points removed) |
| 7 | Games, Profile, Lessons, supporting screens to the Farm's standard | **Done** (27 Nov): the farm's gold kit on every screen through shared Panel, SectionLabel and Button; Classic Farm unchanged |
| 8 | Editorial overhaul of the remaining units | **Done** (27 Nov): units 1–4 on the farm's records in the house voice; formulas typed as in Excel (select, then type); wording rules enforced by test |
| 9 | Full testing and visual review | **Done** (27 Nov): production build, every screen at three sizes and in all three looks; seven defects fixed (below). Physical-phone test still to do |

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

**Content (done in Stage 8, below):** units 1–4 use the old voice and non-farm datasets (shop,
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

## Stage 5: the core games (27 Nov 2026)

Six games on the Games side of the world, built as one family: the same frame under the
spreadsheet sky, the same top bar and progress, intro, choices and results, and the lessons'
own feedback sheet. The sheet games use the real Workbench, Grid and formula bar (Stage 4).

**Rules every game follows**
- **Only what has been taught.** `src/game/taught.ts` works out the taught skills: a lesson's
  `newSkills` once it is finished, a whole unit once it is skipped (unit test passed, or "I've
  used one before" for Start here). Every question is tagged with its skill, and a test plays
  every game at every point in the course to prove nothing untaught is asked.
- **Leans on what is newest.** About half of each go comes from the three most recently
  taught skills.
- **Harder with play** (`tierFor`): tier 1 for a new game, tier 2 after two goes, tier 3 after
  six goes with two stars. Higher tiers give less help (how-to lines go, hints fade) and more
  to choose from (more pairs, more spare pieces, "which formula works?").
- **Accuracy before speed.** Stars come from answers right first time (3: all, 2: three in
  four, 1: finished). Time is a personal best only; only Speed Trial has a clock, and only in
  Timed mode. Records keep best accuracy and best timed go (`bestAccuracy`, `bestTimedMs`,
  optional fields, so existing saves load unchanged).
- **Feedback teaches.** Every miss says which part was right and what to look at; every right
  answer names the idea. Wording follows the editorial standards (no "Amazing!").
- **The engine judges.** Formula answers are worked out by the spreadsheet engine on the sheet
  shown, never by matching text. Questions are generated fresh from farm records (the stall's
  produce), so numbers never repeat the lessons'.

| Game | What it asks | Opens after |
|---|---|---|
| Match Pairs | Two columns of tiles to join: words, references (with a little lit grid), shortcuts (Ctrl or Cmd), symbols, functions, formulas and results, error values, toolbar buttons. Choose a category or Mixed; 4 to 6 pairs a board, two boards a go. | Welcome to Golden Apples Farm |
| Cell Hunt | Select a cell, a whole row or column (with the taught shortcut), a block; get somewhere with the arrows only; name the lit block. Sheets change size every task. | Cells and References |
| Speed Trial | Press the keys for an action, or say what keys do. Seven levels, each opening with its lesson: entering data (Enter, Esc, F2), rows and columns, getting around, stretching, select all, copy/cut/paste, undo and bold. | Entering and Correcting Data |
| Find the Error | Find the faulty cell (tap to inspect, the formula bar shows what is really there), then choose the correction. Typed figures against a docket; short ranges; wrong rows; wrong sign; AVERAGE by hand; MIN for MAX; unlocked $; #DIV/0!; #NAME?; a backwards IF. | Entering and Correcting Data |
| Formula Builder | Build a formula from pieces (the lessons' token tray) for a farm question. At tier 3, a third of the go asks which of three formulas works (one with a syntax slip, one with the wrong function). | Add It Up |
| Predict the Result | Say what a formula will show. Wrong options are real mistakes (multiplying last, a range read short, the wrong function). The answer is then worked out on the sheet. | Add It Up |

**Speed Trial overhaul:** a desktop keyboard (Esc and F keys, Tab, Caps, Enter, both Shifts,
Ctrl ⊞ Alt on Windows, fn ⌃ ⌥ ⌘ on a Mac, full-size inverted-T arrows); every key can be
pressed and a wrong one is explained ("Shift + ↓ stretches the selection down. To move one
cell down: ↓."); hints fade as each shortcut is known; Practice (no clock) and Timed; accuracy
and personal bests. The physical keyboard works on the web.

**Code:** `src/game/` holds the logic (`taught`, `records`, `random`, `farmSheets`, one module
per game, `catalogue`), `src/game/ui/` the shared parts (`GameParts`, `SheetGame`, `useGame`,
`sheet`). Screens: `app/match-pairs.tsx`, `cell-hunt`, `formula-builder`, `find-the-error`,
`predict-the-result`, `speed-trial`. Tests: `src/game/__tests__/coreGames.test.ts` and
`speedTrial.test.ts`.

**Compromises and departures, reported:**
- The brief's separate *Shortcut Match* game is the Shortcuts category of Match Pairs plus
  Speed Trial's recognition questions, following the revised list of six (27 Nov).
- Redo left Speed Trial: no lesson teaches it. Speed Trial's old levels (`trial.1`–`trial.4`)
  are replaced; old records stay in saves but are no longer shown.
- No "advanced challenge" for untaught shortcuts (the first brief allowed one if chosen
  explicitly); everything untaught stays closed, naming the lesson that opens it.
- Lookups (XLOOKUP, VLOOKUP) are only in Match Pairs so far; Formula Builder, Find the Error
  and Predict the Result do not yet ask about them.
- Formula Builder lets a piece be used more than once, as the lessons' token tray does.
- On a Mac in a browser, some shortcuts (Cmd + Space, Ctrl + Space) can be taken by the system
  before the page sees them; the on-screen keys always work.
- Games are not yet linked to the spaced-review schedule (they give XP and count towards the
  streak, but do not mark skills as reviewed).
- Checked in the browser at 375 × 812 and 812 × 375 (sideways: sheet games split like
  lessons, Match Pairs lays its board across), Refined and Classic Farm, Windows and Mac
  keyboards, physical keyboard: every game played through to its results. Not checked on a
  physical phone; the "which formula works?" questions are covered by tests but were not
  reached in the browser.

## Stage 7: one visual language (27 Nov 2026)

Every screen beside the farm now speaks the farm's interface language, through three shared
pieces rather than screen-by-screen styling, so new screens inherit it:

- **`Panel`** (`src/components/Panel.tsx`): a card edged in a fine line of gold with a soft
  golden glow and a highlight along its top, as the farm's glass panels are. It stays solid
  (the palette's surface), not see-through: working screens need crisp text and sheets.
  `glow` marks the one card that matters most; `dashed` marks something not open yet; with
  `onPress` it is a button that presses in.
- **`SectionLabel`**: section headings in the farm's spaced gold capitals ("UP NEXT" style).
- **`Button`**: the primary action is the farm's own polished gold pill (`GoldButton`); the
  secondary is a gold-edged pill; the quiet one is gold words.

Applied to: Games (with a small emblem per game, in the code face), Profile (cards, stats,
badges glowing when earned and dashed until then, settings), the game intros, results,
computer choice and Speed Trial's levels, the welcome screens (now centred, with a line on
why the question is asked), the tour, the lesson results screen, and the lesson's message
card (gold edge and the gold Next pill).

**Tour corrections** (facts that had gone out of date): it shows the farm's own plant
(Goldspire, in fruit) instead of the old cartoon tree; its sheet uses the lessons' fruit
prices; "tap it again to type" is now "select it, then type" (as the course teaches); the
games stop describes the six games instead of Speed Trial and the now-locked Grid Master.

**Classic Farm** is preserved: every piece above checks the world style and keeps the plain
navy cards, grey labels and blue buttons when Classic is chosen. Checked: the cartoon farm,
Games and a lesson in Classic. The one visible change there: Classic's game cards are plain
instead of blue-tinted.

**Reported, not done:**
- Copy on these screens was left to Stage 8 (since done): the results screen said "Flawless!" and
  "Lesson done!" (exclamations the editorial standards avoid), and "Back to the start screen"
  now returns to the world.
- Badges have no artwork yet (a gold diamond stands in); production artwork remains open.
- The lesson screen keeps its Stage 4 layout; only its card and button changed.
- Checked in the browser at 375 × 812 in Refined (dark and light looks) and Classic. Not on a
  physical phone.

## Stage 8: editorial overhaul (27 Nov 2026)

**Content.** Units 1–4 (17 lessons, 3 unit tests) rewritten under their existing exercise IDs.
Every dataset outside the Fruit projects is a farm record; the stall's prices carry over from
Roots; customers and produce match the Roots lessons and the games (pumpkins removed, the
games' customers aligned). Titles are in title case; unit and skill names use the approved
terms (extend, range, currency format). The Fruit projects keep their cafe and classroom on
purpose, and now say so.

**Typing formulas as in Excel.** The old lessons said "tap it again to type", because the phone
keys only opened when a cell was being edited. Now, on any task answered by typing (a value or a
formula), the keys open as soon as a cell is selected, so the lesson can teach Excel's way:
select, then type (typing replaces; a second tap or F2 edits). Worked solutions select once;
fixing a formula types over it. The keys and Check stay in place while typing, and Check
confirms an open entry as Enter would (before, the keys jumped about 50 px when typing began).

**Fill handle.** Its touch area was clipped at the grid's right and bottom edges, so the visible
handle on a last-column cell could not be grabbed at its corner. It is now kept inside the grid.

**Interface copy.** Results screen: "Lesson complete", "Unit passed", "Practice complete" and
"Back to the farm" (no "Flawless!" or exclamation marks). Multiple-choice "Nearly." became "Not
all of them.". Badge descriptions say a unit test also earns a unit's badge.

**Enforced.** A wording test checks every lesson line: no exclamation marks or celebratory
praise, "pick" never for selecting (it stays for the harvest), currency not money format,
AutoSum suggests rather than guesses, no "tap it again to type", Australian spelling.

**Compromises and open items.**
- Tasks with a toolbar (Undo, Sort, Copy) still need a second tap to type, because the toolbar
  and the keys do not both fit under the sheet. The two Undo-on-typing tasks say so ("tap B4
  twice to edit it"), which matches the editing taught in Roots, not Excel's type-to-replace.
- Grid Master (locked in the Advanced Arcade) keeps its old copy ("Bump!", "Yes!", "pick").
- Badges still have no artwork.
- Checked in the browser at 375 × 812 (Refined): a demonstration, typing a formula, typing over a
  broken one, a fill with the keys open, the fill handle at the grid's edge, an Undo task and
  the results screen. Not every lesson was played end to end, and not on a physical phone.

## Stage 9: full testing and visual review (27 Nov 2026)

**Automated.** Typecheck, lint and 2,700 tests pass. The production web build (`expo export -p
web`) succeeds at 2.0 MB. `expo install --check`: every package is on SDK 58, but four are a
patch behind (expo 58.0.25 → ~58.1.0, expo-router, expo-splash-screen, jest-expo). Not updated:
a dependency change, left for the product owner's approval.

**Reviewed** in the browser at 375 × 812, 375 × 667 (the smallest supported phone) and
812 × 375 (landscape), in Refined dark, Refined light and Classic Farm: the Farm, Games,
Profile, welcome, tour, onboarding question, placement test, lessons from units 1–3, every
game's opening screen, a Find the Error round and the results screen.

**Fixed.**
- On a small phone the keys and Check covered the bottom of the sheet (a 5-row lookup sheet lost
  row 5). The space under the sheet now holds both; a 7-row sheet fits with 35 pt cells at
  375 × 667 (44 pt at 375 × 812).
- Games: two game descriptions were cut off mid-sentence; shortened.
- Profile: long lesson and level names were cut off; they now wrap. Grid Master levels (locked
  in the Advanced Arcade) are listed only once played, so no earlier results are lost.
- Match Pairs listed a category as covered while its button was still locked; it now lists only
  the categories that can be chosen.
- Cell Hunt said "block"; it now says "range", as the lessons do.
- Find the Error's docket split "140" from "kg" across lines.
- Unit tests and practice rounds showed the "Lesson" step label; they now say "Test" or
  "Practice". The tour's example pear price now matches the lessons ($5).

**Not covered.** No physical phone (Expo Go) test: needed before release, particularly for
touch feel, haptics and performance (the frame-rate target in Performance requirements is still
unmeasured). Not every lesson was played start to finish in the browser; every exercise's
worked solution is proved solvable by the content tests. Screen-reader use was not tested.

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
