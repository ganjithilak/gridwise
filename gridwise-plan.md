# Plan: Hands-on Excel learning app (working title "Gridwise")

## Context

Most Excel-learning apps are quiz-first (tick boxes about what Ctrl+A does), pad lessons with repetition, and slow you down with hearts, waits and long animations. The idea: borrow what actually works from the Duolingo teaching model (bite-sized lessons, a visible path, instant feedback, streaks, spaced review), drop the parts that waste time, and make the learner **do the thing in a real working spreadsheet** instead of answering trivia about it.

### What already exists (checked Nov 2026)

"Hands-on" on its own is not new. Several apps already put a practice grid in front of the learner:

- **Learn Excel: Formulas & Course** (CoddyKit, iOS + Android): practice sheet with a formula bar that recalculates, 120 short lessons, work-problem exercises, AI mentor.
- **Xcell** (iOS): lessons, quizzes, practice tasks and a spreadsheet playground.
- **Solver E** (iOS): 5-minute lessons, daily streaks, real-life cases, AI tutor.
- **SpreadsheetCenter** (web): 150+ exercises typed straight into cells with instant feedback.

So Gridwise has to win on the specifics:

1. **Real spreadsheet handling, not just typing into a cell:** drag to select, fill handle with reference shifting, AutoSum, sort, undo.
2. **Feedback on how you built it:** the formula AST lets feedback say "you summed B2:B5, the data goes to B6" instead of just "wrong".
3. **Fix-the-error exercises** as a core exercise type, not an extra.
4. **No padding:** test out of any unit; skills you've shown you know are not repeated until review.
5. **Can't fake it:** typing the number instead of the formula is caught.
6. **No hearts, ads or timers.**

Step 0 of the build order checks these against the apps above before any code is written.

#### Step 0 result (13 Nov 2026, from store listings and the vendors' own pages; nothing was installed or tried hands-on)

| # | Differentiator | Verdict | Evidence |
|---|---|---|---|
| 1 | Real spreadsheet handling | Looks like a gap, unconfirmed | Every listing describes typing a formula into a cell. None mention drag-select, a fill handle you drag, AutoSum, sort or undo in the practice grid. CoddyKit *teaches* the fill handle in a lesson; whether its sheet supports the gesture needs a hands-on look. |
| 2 | Feedback on how you built it | Partly contested | CoddyKit explains what an error value means; Xcell has "formula validation" and hints; SpreadsheetCenter has "instant feedback". None claim to diagnose the learner's specific mistake (range one row short, wrong column). |
| 3 | Fix-the-error exercises | **Not a gap** | CoddyKit's 20 "Missions" are exactly this (a lookup returning #N/A, a total short because numbers are stored as text) and its tagline is "You learn a formula by breaking it". Xcell has an error-diagnosis lesson. Keep the exercise type, stop counting it as a differentiator. |
| 4 | No padding, test out | Gap | No listing mentions placement, test-out or review scheduling. |
| 5 | Can't fake it | Unknown | Not visible from listings. |
| 6 | No hearts, ads, timers | Gap only against Solver E | Solver E has hearts ("every mistake counts") and costs $99.99. CoddyKit is free with a Pro paywall (10 functions free), Xcell is a small paid app (10 lessons, 8 exercises), SpreadsheetCenter is free with no account. |

What the listings suggest is the clearer gap: **lesson flow**. CoddyKit and Xcell are read-a-lesson, then switch to a separate sheet or playground. SpreadsheetCenter is a browser exercise catalogue built for a desktop keyboard. None describe a phone-first stream of short, checked tasks done in the grid with teach-then-test. That is what the thin slice (step 2) and the 5-person test (step 3) have to prove.

Still worth 15 minutes on your phone before step 3: install CoddyKit's app and see how its Sheet tab handles selection and fill, since that decides differentiator 1.

### Decisions confirmed with you

- **Stack:** Expo React Native + TypeScript (iPhone + Android from one codebase, developed on Windows, tested on your phone through Expo Go).
- **v1 scope:** Excel only, but structured as "courses" so Word/Pages, PowerPoint, Sheets slot in later.
- **Lesson style:** hands-on mini spreadsheet for most exercises; quiz cards only for concepts.
- **Ambition:** playable prototype. No login, progress stored on the device, 3 full units, XP + streaks.

`D:\excel mobel app` is empty, so this is a greenfield build.

## Where the build stands (14 Nov 2026)

Build steps 0 to 2 and 4 to 9 are done. **Step 3 (five people try lesson 1) was skipped** at your call when you said to build the complete app. One person has tried it since: see "After the first trial" below.

What exists:

- **Engine:** all 24 functions. 308 formulas are checked against answers computed by your desktop Excel.
- **Spreadsheet:** tap and drag to select, fill handle, AutoSum, bold, money and percent formats, sort, undo, copy / cut / paste, key caps for shortcuts.
- **Exercise types:** all seven in the table further down.
- **Content:** 5 units, 21 lessons, 3 unit tests, 192 exercises. Every exercise is proven solvable by its own worked solution on every test run.
- **Progress:** XP, daily goal, streak with one free freeze a week, review schedule, Practice tab, badges, unit tests that skip a unit. Saved on the device.

Where the build differs from the plan below, on purpose:

| Plan said | Built | Why |
|---|---|---|
| 3 units | A fourth, "Start here", in front: what a cell is, typing in one | Your idea (14 Nov), for people who have never opened a spreadsheet |
| Onboarding asks level and Windows/Mac | First launch asks only "Have you used a spreadsheet before?" (Never / A little / Test me). Windows or Mac is asked the first time a lesson has a shortcut in it | Rule 9: no settings before the first lesson |
| Only "Show me" exercises come back | Also: miss more than one scored exercise in a lesson and a short practice round on those skills, with different numbers, comes before the next lesson opens | Your idea (14 Nov): don't move people on before they have it |
| Sheets up to 6 x 8 | 6 x 7, and 6 x 6 when the task has an extra row of keys | 8 rows can't keep 40 pt cells on a small phone with the keyboard open |
| Function suggestions on the keyboard | A row of ready-made pieces above the keys, set by each exercise: function names, words in quotes, signs like >= | The keypad has no letters, so `"Hit"` has to be one tap |
| `$` typed as a character | Tap a cell, then `$`, and it locks that reference (pressing again cycles, as F4 does) | Typing `$E$2` by hand needs letter keys |
| Unit 3: select, copy/cut/paste, undo | Also sort, bold and number formats, as its 3rd and 4th lessons | They were built in step 5 and had nowhere to be taught |
| Copy and paste by shortcut only | Copy / Cut / Paste buttons too | One shortcut exercise per lesson is the cap, and the lesson needs more practice than that |
| Fix-the-error counted as a differentiator | Kept as an exercise type, not counted | Step 0: CoddyKit already has it |

Not done, or not checked:

- **XLOOKUP is not verified against Excel.** Your Excel answers `#NAME?` to it (it needs Excel 2021 or Microsoft 365), so those 20 workbook rows are skipped and XLOOKUP is tested against Microsoft's documented behaviour instead. The lesson says which versions have it and teaches VLOOKUP alongside.
- **Sound has not been heard.** Three tones are generated by `scripts/make-sounds.js` and wired to right, wrong and lesson-done. They play through `expo-audio`; nobody has listened to them yet.
- **Gestures have not been felt.** Drag-select and the fill handle pass in a browser with simulated drags. A thumb on glass is a different test.
- **Fill does not ripple** (rule 10 mentions it). A filled column appears at once.
- **No Android build.** That needs your Expo account (`eas build`).

### After the first trial (15 Nov 2026)

The web version is online at https://gridwise.expo.app (how to update it is in the README). A friend opened it on his iPhone: the first real phone, and the first person other than us. His verdict: a good start, but it needs more guidance. He also sent a development brief. What was done with it:

| His idea | What was built |
|---|---|
| A welcome that says what the app is and how it works | The first screen now says it in four lines (what it is; watch, try it, use it) above the one question. Still two taps to the first lesson (rule 9), so no guided tour |
| Start by saying what a spreadsheet is and what it is for | Lesson 1's demonstration opens with that, one sentence per step, before columns, rows and cells |
| A real task in two steps: find the cell, then change it | "Type in a cell" has it (the price of Bread). The second step opens with the found cell still picked. Later price changes in that lesson no longer name the cell |
| Feedback that does not give the answer away | A wrong tap in a find-the-cell task now says "Right column, wrong row" instead of naming the cell |
| A recap after each lesson, and a second look at what went wrong | The results screen has "What you learned" (each lesson carries a `recap` of two or three sentences, checked by the content rules) and "Worth another look" (each exercise that was not right first time, with its explanation). The practice round on missed skills was already there |

At first the rest of his brief was left out (landscape, shortcuts in the first module, the game, the tour). On 16 Nov you asked for all of it to be built, and sent a sample theme picture. That is the next section.

Still open from his message: he saw spelling and grammar mistakes. Which ones is not known yet.

### The full brief and the sample theme (16 to 17 Nov 2026)

Built at your request, from his brief:

| His brief | What was built |
|---|---|
| Roots to fruits | Every unit has a stage: Roots ("Start here"), Trunk ("First formulas"), Branches ("Make it think", and the side unit), Fruit ("Put it to work"). The Learn screen draws the course as a plant that colours in as stages are reached, and each unit is tagged with its stage |
| Fruit: real tasks and projects | A new last unit, "Put it to work", with two projects of six practical tasks each: a cafe's week (unit 1 skills) and marking a class (unit 2 skills). Nothing new is taught in them |
| Welcome, onboarding tool, guided tour, demonstration | First launch: a welcome that says what the app is and how lessons work, then a five-stop tour (skippable from every stop, and on the Profile screen to take again), then the level question |
| Teach, Lesson, Apply | The lesson's top bar shows which of the three steps is on screen. Every lesson ends on at least one Apply task (a content rule) |
| First module: the spreadsheet itself, with his wording | Lesson 1's two demonstrations use his sentences, one to a step. Lesson 2 opens with what a cell can hold. The bread task uses his scenario, "$4" (the Cost column is shown as money) and his feedback words |
| Ctrl + Space, Shift + Space, Shift + arrows | Two new lessons in "Start here": "Whole rows and columns" and "Move and stretch with arrows". The sheet can select a whole column or row, move with arrows and stretch a selection; the key strip has Ctrl, Shift, Space and the arrows; real keys work on the web |
| Speed Trial | A game on the Practice tab: a task is named and its shortcut is pressed against the clock. Four levels, eight tasks a go, stars, best times, XP. A real-keyboard layout where the keys in play are lit (more each level) and the keys for the task glow as a hint that fades as the shortcut is learned |
| Profile | A name, a colour for Cell, a level, the lessons finished with best scores, game results, badges |
| Landscape and split screen | A screen wider than it is tall gets the sheet on one half and the lesson with its keys on the other. A button, or a swipe on the lesson half, swaps the sides. Upright stays as it was |

From the sample theme picture: deep navy with electric blue as the app's own look (light and "follow my phone" are on the Profile screen); lesson on the left and sheet on the right by default; a side menu instead of the bottom bar on wide screens; a level ring, name and XP bar heading the Learn screen; a green "Correct!" banner showing the XP earned; "Quick tip".

Not built from the picture, because the app has nothing behind them: Challenges, Career Paths, Leaderboard, gems, notifications, a numbered "Instructions" list that gives the formula (it would hand over the answer; hints still do that one step at a time), and the photographic roots artwork (the plant is drawn from shapes in code).

Rules this changed, on purpose:

- **Rule 1 (no timers):** still true of lessons. Speed Trial is timed; that is the game.
- **Rule 9 (first lesson within two taps):** the tour now comes first. "Skip the tour" keeps it to three.
- **Rule 5 and the shortcut cap:** up to three shortcut exercises in a lesson (was one), for the two keyboard lessons.
- **Rule 10 and 11 (not green):** a right answer is now green, as in the sample.
- **"Deliberately not in this build":** landscape is now in.

Checked by play-through in a browser at phone size and on its side. Not seen by eye this time: the preview window was hidden while it was built, so nothing new has been looked at as a picture, and nothing has been on a real phone.

### Grid Master, World 1 (17 Nov 2026)

Your friend's next idea: a snake game played on the sheet itself, steered with the shortcuts being taught, in five worlds (The Grid, Shortcuts, Formatting, Formulas, Mastery). World 1, "The Grid", is built, as a second game on the Practice tab.

- **The game:** the snake is a selection on a 9 x 9 sheet, its head the active cell, and the head's column letter and row number light up. It moves on its own and is steered with **Shift + an arrow**, the keys that stretch a selection. A plain arrow does not steer; it says why ("An arrow on its own just moves the active cell").
- **His mechanics, in:** the card names a cell to collect, and every collectable looks the same, so the cell reference is the only way to find it. A wrong one makes the snake longer; a green −1 square makes it shorter. Blocked cells, a switch that removes some, and a portal. With every named cell collected, the centre opens.
- **Bonus round:** arrive in the centre one cell long and a shortcut has to be pressed within three seconds. Stars: reaching the centre, arriving short, the bonus.
- **Four levels:** Find the cell; Round the blocks; Through the portal; Open the gate. Each is faster than the one before and opens when the one before is finished. Results are saved with Speed Trial's and shown on the Profile screen.
- **Proved:** a test plays every level to three stars without a wrong cell or a bump, so none can be unwinnable.

Changed from his message, and why:

- **Not a copy of Nokia's Snake.** Same kind of game, its own name (his "Grid Master") and its own look.
- **"Shift + A" is not a spreadsheet shortcut.** It types a capital A. The bonus asks for Shift + Space (select the row) or Ctrl + Space (select the column) instead: real shortcuts, the same on Windows and Mac, already taught in "Whole rows and columns".
- **No swiping to steer.** The point is the keys; on a phone they are on screen, and Shift stays held once tapped.

Not built yet: Worlds 2 to 5. Formatting (fill colour, font colour, borders), Find, redo and dates need adding to the sheet first. His later games (a falling-blocks puzzle and others) would also need their own look rather than copying Tetris.

## Product rules (what makes it not trash)
1. **No hearts, lives, energy, ads or timers.** Wrong answers cost nothing.
2. **No padding.** A skill you get right first try twice is not shown again until its review date. Repetition only targets what you actually missed.
3. **Test out of anything.** Every unit has a "Skip ahead" checkpoint (8 exercises, pass = 7 of 8). Onboarding asks "new / used it a bit / test me" and "Windows or Mac?".
4. **Fast.** Lessons are 6-8 exercises, 2-3 minutes. Feedback appears instantly; every transition is under 300 ms and tap-through.
5. **Do, don't recite.** Default exercise is a task in a live grid. Multiple choice is capped at about 1 in 5 exercises.
6. **Teach before testing.** Every new skill is introduced with a short "watch, then do it" step before it is tested. Every exercise has a 3-step hint ladder.
7. **Never stuck, fix it on the spot.** A wrong answer shows what went wrong and leaves the learner's work in place so they can fix it right there, as many times as they like. It no longer counts as "first try correct", but nothing is lost and they are not moved on. After two wrong checks a "Show me" button appears: it plays the worked solution step by step, marks the skill weak (it goes to Practice) and brings the exercise back once at the end of the lesson. Every lesson can always be finished.
8. **Real scenarios.** Each unit uses a small business dataset (sales tracker, monthly budget, staff list), not abstract A/B/C cells.
9. **Simple first.** When a feature and simplicity pull in different directions, simplicity wins.
   - One thing to do per screen, and one obvious main button.
   - No instructions to read before starting: the first lesson opens within two taps of launching the app, with no sign-up and no settings.
   - Plain words, no jargon the lesson hasn't taught yet ("cell", "range" and "formula" are each introduced before they are used).
   - Big touch targets: grid cells and keys at least 44 pt tall wherever the screen allows, and never below 40.
   - Nothing on screen that the current exercise doesn't need (no toolbar buttons that do nothing in this task).
   - A mistake never loses work: anything the learner typed stays until they change it.
10. **Fun, without the wait.** Learning should feel like a game, but the fun never costs the learner time (rule 4 still holds).
    - **The grid reacts.** A correct answer makes the result cell pop and the referenced cells flash in their colours; a full column filling down ripples. The spreadsheet itself is the reward, not a pop-up over it.
    - **Sound and haptics** on correct, wrong, lesson complete and streak (one switch in Profile turns both off).
    - **Streak, XP and a daily goal** shown on the home screen, and a combo counter inside a lesson for answers right first time.
    - **A short celebration at the end of a lesson** (confetti over the results, under 1 second, tap to skip), never between exercises.
    - **Friendly, light wording** in prompts and feedback: encouraging when right, never scolding when wrong.
    - **Playful scenarios:** a cafe, a lemonade stand, a football team's stats, not "Dataset 1".
    - **Milestones:** a badge for finishing a unit and for streaks of 7 and 30 days.
    - **An original mascot** (working name "Cell"): a small rounded square, like a single spreadsheet cell with a face, in the app's accent colour.
      - Drawn from simple shapes in code (no image files or animation library), so it is cheap to make and stays sharp at any size.
      - Five expressions: neutral, happy, thinking, cheering, oops.
      - Appears on the home screen, beside hints (thinking), in feedback (happy or oops) and on the results screen (cheering). It never covers the grid and never blocks a tap.
      - It reacts in place with a quick bounce or blink (under 300 ms). No walk-on animations, no speech the learner has to dismiss.
    - Not copied from Duolingo: no owl or bird, no green, no hearts, no guilt-trip reminders, no league tables in v1.
11. **Own identity.** Original name, palette and mascot. No copying Duolingo's or any other app's look. "Excel" is used descriptively only (it is Microsoft's trademark): not in the app name or icon.

## Architecture

Three layers, each usable without the one above it:

```
app/                          Expo Router screens
  (tabs)/index.tsx            Learn: unit/lesson path map
  (tabs)/practice.tsx         Review queue (weak + due skills)
  (tabs)/profile.tsx          XP, streak, stats, reset
  onboarding.tsx              placement + Windows/Mac choice
  lesson/[lessonId].tsx       lesson player
  lesson/complete.tsx         results screen
src/
  engine/                     PURE TS, no React. Formula + sheet model
    tokenizer.ts  parser.ts  evaluator.ts  functions.ts
    refs.ts                   A1 parsing, $ absolute refs, shifting refs for fill
    sheet.ts                  cells, dependency graph, recalculation, sort, formats
    format.ts                 number display (15 significant digits, currency, percent)
    errors.ts                 #DIV/0! #REF! #NAME? #VALUE! #N/A + plain-English hints
    context.ts                injected "today" date, so TODAY() is deterministic
  spreadsheet/                React Native grid UI on top of engine
    Grid.tsx  Cell.tsx  SelectionOverlay.tsx  FillHandle.tsx
    FormulaBar.tsx  FormulaKeyboard.tsx  Toolbar.tsx  KeyCaps.tsx
    useSheet.ts               hook wrapping a sheet instance + undo stack
  lessons/
    types.ts                  Course / Unit / Lesson / Exercise / Check types
    checks.ts                 validators (see below)
    normalize.ts              formula normalisation before comparing
    mistakes.ts               common-mistake detectors -> one-line feedback
    session.ts                lesson queue: order, fix-in-place attempts, "Show me" requeue (once), scoring
    player/                   LessonPlayer, ProgressBar, FeedbackSheet, HintButton
    player/exercises/         one renderer per exercise type
  progress/
    store.ts                  Zustand + AsyncStorage persist, versioned with migrations
    srs.ts                    per-skill Leitner boxes + due dates
    streak.ts                 daily streak by local date (one free freeze per week, automatic)
  lib/
    clock.ts                  now() used everywhere; faked in tests, shiftable in a debug menu
  content/
    index.ts                  course registry (multi-course ready)
    ids.ts                    permanent IDs + retiredIds
    excel/unit-01-*/lesson-*.ts
  theme/  components/         tokens, Button, Card, Chip, KeyCap
test/
  fixtures/excel-parity.xlsx  golden test cases built in real Excel
```

### Library rule (Expo Go)

On Windows with no paid Apple Developer account, Expo Go is the only way to run the app on an iPhone. So: **only libraries that run inside Expo Go** (Expo SDK modules, react-native-gesture-handler, Reanimated, AsyncStorage, Zustand). Nothing that needs a custom native build. Expo Go on the phone follows the newest Expo SDK; if a new SDK ships during the build and Expo Go updates, upgrade the project to match.

### Formula engine (hand-written, zero dependencies)

Written in-house rather than pulling HyperFormula (GPL/commercial licence, heavy) because a teaching app needs things libraries don't give: an AST to check *how* the learner solved it, and friendly error hints ("you're missing a closing bracket").

- **Grammar:** numbers, strings, booleans, `%`, cell refs (`A1`, `$A$1`), ranges (`B2:B6`), operators `+ - * / ^ &` and comparisons, function calls.
- **Precedence matches Excel:** `:` then unary minus, `%`, `^`, `* /`, `+ -`, `&`, comparisons. Unary minus binds tighter than `^`, so `=-2^2` is 4. `^` runs left to right, so `=2^3^2` is 64.
- **v1 functions (24):** SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, ROUND, IF, AND, OR, NOT, IFERROR, COUNTIF, SUMIF, VLOOKUP, XLOOKUP, LEN, LEFT, RIGHT, UPPER, LOWER, TRIM, CONCAT, TODAY.
- Dependency-tracked recalculation with circular-reference detection.
- `TODAY()` reads the date from an injected context, so exercises and tests give the same answer every day.

#### Excel behaviours to get right

Each of these gets at least one case in the parity workbook:

- **ROUND** rounds half away from zero (`ROUND(-2.5,0)` is -3) and behaves as if the number were decimal (`ROUND(2.675,2)` is 2.68). Plain JS `Math.round` and `toFixed` get both wrong.
- **Type coercion:** `"5"+1` is 6, `TRUE+1` is 2, `"a"+1` is `#VALUE!`.
- **Empty cells** are 0 in arithmetic, `""` with `&`, and skipped by AVERAGE and COUNT.
- **SUM / AVERAGE** skip text inside ranges, but `=A1+A2` with non-numeric text in A1 gives `#VALUE!`.
- **Text comparisons ignore case:** `"a"="A"` is TRUE.
- **COUNTIF / SUMIF criteria** are text (`">100"`, `"<>0"`, `"North"`), support `*` and `?` wildcards, and ignore case.
- **VLOOKUP** defaults to approximate match (needs sorted data); **XLOOKUP** defaults to exact. Both give `#N/A` when nothing matches.
- **IF** with no false branch returns FALSE.
- **Display:** numbers show at most 15 significant digits (`=0.1+0.2` shows 0.3). Equality between floating-point results is copied from what the parity workbook shows, not guessed.

#### Excel parity workbook

`test/fixtures/excel-parity.xlsx` is built by you in real desktop Excel. Each case is a formula over a small data block, and Excel saves its computed result in the file. Jest reads the formulas and saved results with SheetJS (dev dependency only, never shipped in the app), runs each formula through the engine and compares: numbers to within 1e-9, error codes exactly. Excel is the answer key, not memory. Every engine bug found later gets a new row.

### Mini spreadsheet (fits a phone: max 6 columns x 8 rows, no scrolling)

Tap to select, drag for a range, formula bar, tap-a-cell-to-insert-reference while editing, drag fill handle (relative refs shift, `$` refs don't), AutoSum, bold, currency/percent format, sort A-Z / Z-A, undo.

**Screen budget:** designed for the smallest common phone (about 375 x 667 pt, iPhone SE size). Top to bottom: progress bar, one-line prompt, formula bar, grid, then either the formula keyboard or the key caps strip (never both at once), then the Check button. While the formula keyboard is open, the prompt collapses to one line, Enter commits the formula, and Check appears once the keyboard closes. Content lint rejects any exercise that needs more than 6 x 8.

Two mobile-specific pieces:

- **Formula keyboard:** custom keypad (`= ( ) : , $ + - * /`, digits, function suggestions) replacing the system keyboard for formulas, so typing `=SUM(B2:B6)` is not painful on a phone.
- **Key caps strip:** on-screen `Ctrl` (or `Cmd` for Mac learners) / `Shift` / letter keys the learner presses in combination, and the grid reacts (select all highlights the sheet, copy shows marching ants).
  - Labels follow the Windows/Mac choice from onboarding; content stores each shortcut for both platforms.
  - On web with a physical keyboard, the real keys work too. Combos the browser keeps for itself (such as Ctrl+W, Ctrl+T, Ctrl+N) are not taught on web.
  - On a phone this teaches people to *recognise* a shortcut; the web version is where they practise it for real. So `shortcut-press` is capped at one per lesson.

### Exercise types (data-driven, renderer registered per type)

| Type | Learner does | Example |
|---|---|---|
| `demo` | Watches the app do it on the grid, then repeats it on fresh data (not scored) | Watch AutoSum fill B7, then do C7 |
| `grid-task` | Completes a goal in the live grid | "Total the Sales column in B7" |
| `formula-build` | Assembles a formula from token chips | chips: `=` `SUM` `(` `B2` `:` `B6` `)` |
| `fix-formula` | Repairs a broken formula / error cell | `=B2/C2` showing `#DIV/0!` |
| `predict-output` | Says what a formula will return | `=IF(B2>100,"Hit","Miss")` |
| `shortcut-press` | Presses a key combo on the key caps (max 1 per lesson) | "Select the whole sheet" |
| `choice` | Single / multi select (concepts only) | "Which reference stays fixed when filled down?" |

Demonstrations and "Show me" are learner-paced (added 14 Nov 2026 after trying the first build: the auto-playing version went by too fast to read). Each step that has a caption is pointed at and then waits for **Next**, either the button beside the caption or a tap anywhere on the grid below it. Steps with nothing to read follow on by themselves. **Skip** sits in the top bar.

Back, Forward and saving your place (added 14 Nov 2026 after trying the first build: the lesson always reopened at the first tutorial, and there was no way to read a step again):

- **Back and Forward arrows** sit either side of the progress bar. Back moves one step at a time: to the caption before in a demonstration or "Show me", from "your turn" to the end of its demonstration, and from one exercise to the finished one before it.
- An earlier exercise opens as it was left (the learner's own answer, the explanation, **Continue**) under a "Looking back" label. It can be read but not changed, and it never changes the score.
- Forward only goes as far as the learner has already been. It never skips an exercise that hasn't been solved.
- Stepping back never loses work: the sheet being worked on, a half-typed formula included, is set aside and put back on return.
- **The lesson is saved on the device after every step.** Leaving with the cross, closing the app or reloading the page all reopen it at the same exercise, the same tutorial step and the same sheet. The home screen shows **Continue** with "Step 2 of 6", and a quiet **Start again**. Time away is not counted in the lesson time.
- A finished lesson is recorded (best first-try score, times finished) and its saved place is cleared, so **Go again** starts from the beginning.

### Hints

Every scored exercise has 3 hints, revealed one at a time:

1. **Nudge:** "Which function adds things up?"
2. **Structure:** "=SUM( ... ) over the Sales cells"
3. **Answer:** "=SUM(B2:B6)", which the learner then enters themselves.

Hints never cost anything, but an exercise solved with a hint doesn't count as "first try correct" for review scheduling.

### Tips

Added 14 Nov 2026 after trying the build: during "my turn" the space under the grid was empty.

- While the learner is doing an exercise and the keyboard is closed, that space shows **one basic tip** for the exercise: "Every formula starts with =", "Tap a cell to put it in your formula".
- Each exercise has **two or three tips that take turns**: the next one shows each time the space comes back (the keyboard closes, or the learner changes their work after a wrong check), then they start again from the first.
- The tip gives way to the result of a check ("Not quite", "Right answer!", the praise), which appears exactly as before. It is not shown during a demonstration, while typing, or when looking back.
- A tip is about the idea, never the answer. Unlike a hint it is always there and does not affect "first try correct".
- Each exercise carries its own `tips`. Content lint requires two or three per exercise, 70 characters at most each, no tip used twice in a lesson, and rejects a tip that repeats a hint or contains the answer, its range or the target cell.

### Checks (how answers are validated)

**Outcome first.** The default check for `grid-task` and `fix-formula`: the target cell holds the right value, it is a formula, and it still gives the right value when re-run against a **hidden alternate dataset**. Typing the number `150` instead of `=SUM(B2:B6)` fails with a helpful nudge rather than passing.

**Normalise before comparing:** function names and refs upper-cased, spaces removed, `$` ignored unless the exercise is about `$`, reversed ranges put in order (`B6:B2` = `B2:B6`).

**Equivalent formulas pass.** `=B2+B3+B4+B5+B6` passes "total the column" unless the exercise sets `formulaUses`. `formulaUses` is only for exercises whose skill *is* that function. If the value is right but the function isn't used, feedback says "Right answer. Now do it with SUM", and the learner retries on the spot; this doesn't count as a miss.

**Absolute references are checked by behaviour:** the check fills the formula down/across and verifies every result, instead of looking for `$` characters.

**Mistake detectors** (read from the AST) turn common errors into one-line feedback: range one row short or long, wrong column, missing `=`, typed a number, wrong function (AVERAGE for SUM), relative ref that should be absolute.

Validators: `cellValue`, `cellIsFormula`, `formulaUses`, `filledResults` (fill, then check every result), `selectionEquals`, `cellFormat`, `rangeSorted`.

Every exercise carries a permanent `id`, a `skill` tag, a one-line `explain` shown in feedback, 3 `hints`, and a reference `solution`.

### IDs and saved progress

Every skill, lesson and exercise has a permanent ID (e.g. `xl.sum.range`), and progress is keyed by ID. IDs are never reused; removed ones go in `retiredIds`. The persisted store has a version number and a migrate function, so editing or adding content never wipes or corrupts anyone's progress.

## v1 curriculum (3 units, about 15 lessons, about 100 exercises)

1. **First formulas:** `=` and arithmetic, SUM, AVERAGE, MIN / MAX / COUNT, AutoSum, fill down, relative vs absolute (`$`) references. Cell addresses and ranges are taught inside these lessons, at the moment they are first needed.
2. **Make it think:** comparisons, IF, COUNTIF / SUMIF, XLOOKUP (and VLOOKUP), IFERROR.
3. **Getting around faster** (optional side unit, 3-4 lessons, never blocks the main path): selecting, select all, copy / cut / paste, undo. This is where the `shortcut-press` exercises live.

The app opens on formulas because that is where a learner first gets something useful, and because shortcut practice is the weakest fit for a phone.

Each lesson introduces at most 2 new skills, each with a `demo` before it's tested. Each unit ends in a checkpoint that doubles as its test-out (8 exercises, pass = 7 of 8). Later units (not in this build): text and dates, sort / filter, conditional formatting, pivot tables, charts.

## Build order

0. **Look at the competition (about 1 hour).** Try Learn Excel (CoddyKit), Xcell and SpreadsheetCenter. Note what they do well and check that the six differentiators in Context are real gaps. Adjust this plan if they aren't.
1. **Scaffold:** `create-expo-app` (latest SDK, TypeScript strict, Expo Router) in the project folder; Jest, ESLint, theme tokens; web target enabled so screens can be checked in a browser as well as on the phone. Write the Expo Go library rule into the README.
2. **Thin playable slice:** just enough of every layer for one real lesson, built on the final architecture (same folders, types and registries) so later steps extend it rather than replace it.
   - engine: numbers, cell refs, ranges, `+ - * /`, SUM, error values, number display; parity workbook started with these cases
   - grid: tap to select, formula bar, formula keyboard, tap-a-cell-to-insert-reference
   - lessons: `demo` and `grid-task` renderers, outcome checks with normalisation and the hidden dataset, hint ladder, fix-on-the-spot with "Show me" after two wrong checks, results screen
   - content: one 6-exercise lesson ("Add it up": arithmetic and SUM on the sales tracker)
3. **Hand it to 5 people.** Real learners on their own phones (your tutoring students are the obvious group), with no help from you. Write down every place someone hesitates or mis-taps. Continue if:
   - at least 4 of 5 finish lesson 1 without asking for help,
   - median time is under 4 minutes,
   - at least 3 of 5 say they'd do the next lesson.

   If it falls short, fix the biggest problem and test again. If the grid gestures themselves are the problem, simplify (tap-only selection, bigger cells) before building more.
4. **Finish the engine:** all 24 functions, full parity workbook, circular refs.
5. **Finish the spreadsheet:** drag-select, fill handle, AutoSum, bold / currency / percent, sort, undo, key caps (Windows/Mac labels, real keyboard on web).
6. **Finish the lesson framework:** remaining exercise types, all validators and mistake detectors, full session queue.
7. **Progress and motivation:** path map, XP, streak, per-skill review scheduling, Practice tab, unit test-out, onboarding (placement + Windows/Mac).
8. **Content:** author all 3 units.
9. **Polish and share:** haptics, empty states, accessibility labels, app icon; Android APK through EAS Build for friends. iPhone testers use Expo Go for now (TestFlight needs a paid Apple Developer account, deferred).

## Deliberately not in this build

Accounts, cloud sync, leaderboards, payments, push notifications, charts / pivot tables, second course, tablet / landscape layout, AI tutor or free-text questions (competitors have these; reconsider after v1). The course registry, exercise-renderer registry and progress store are shaped so these add on without rewrites (Supabase is the intended backend when the time comes).

## Verification

- `npx jest`
  - **engine:** Excel parity against `excel-parity.xlsx` (every result matches Excel's saved value), precedence traps, each function, error values, reference shifting on fill, circular refs, `TODAY()` with a fixed date.
  - **checks:** each validator passes and fails correctly; normalisation (lowercase, `$`, reversed ranges, spaces); equivalent formulas accepted; hidden-dataset anti-hardcoding; fill-based absolute-reference check; each mistake detector.
  - **content lint:** every exercise's reference solution passes its own checks; every lesson has 6-8 exercises, multiple choice at 20% or less and at most one `shortcut-press`; every new skill has a `demo` before it is tested; every exercise fits 6 x 8 and has 3 hints; IDs are unique, and no ID disappears unless it is moved to `retiredIds`. Broken or unsolvable content fails the test run.
  - **progress:** saved state from the previous store version migrates without losing progress; streak and freeze across day boundaries using the fake clock (local midnight, one missed day, two missed days).
- `npx tsc --noEmit` and `npx expo lint` clean.
- `npx expo start --web`: play lesson 1 end to end in the browser pane. Confirm instant feedback, hints, a wrong answer fixed in place with the typed work kept, "Show me" after two wrong checks playing the worked solution and requeuing once, results screen, XP added. Shortcut exercise works with the real keyboard. Check the layout fits in browser device mode at 375 x 667.
- `npx expo start` + Expo Go on your iPhone: grid gestures (tap, drag-select, fill handle), formula keyboard, key caps, haptics. Gesture feel can only be judged on a real device.
- Manual: force-quit and reopen (progress persists), pass a unit test-out (unit unlocks), shift the date with the debug clock (streak increments, freeze applies after one missed day).

## Risks to know about

- **Standing out:** competitors already offer practice grids. If step 0 or step 3 shows the gestures / feedback / no-padding edge doesn't matter to learners, rethink before building the rest.
- **Scope:** the spreadsheet component is the bulk of the work. The thin slice and 5-person test (steps 2-3) are the checkpoint to judge whether the hands-on feel is worth the rest.
- **Excel accuracy:** a teaching app that gets Excel wrong teaches the wrong thing. The parity workbook is the guard; every bug found adds a row.
- **Small screen:** grids are capped at 6 x 8 on purpose; lessons needing wide data wait for a later tablet/landscape pass.
- **Expo Go:** only Expo Go-compatible libraries; expect an SDK upgrade if Expo Go updates mid-build.
- **Folder name has spaces:** fine for Expo Go and EAS cloud builds; local Android Gradle builds can be touchy, so builds go through EAS.
