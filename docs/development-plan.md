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
| 2 | Roots content overhaul; permanent editorial standards | **Done**: 5 lessons rewritten, standards and curriculum map written |
| 3 | Spreadsheet atmosphere; seamless lesson-entry transition (farm and roots routes) | Not started. A first transition exists (`src/world/transition/`) |
| 4 | New spreadsheet presentation, same engine | Not started. One fix done: keys open on selection for value entry |
| 5 | Core games: Match Pairs, Shortcut Match, Cell Hunter, Formula Builder, Error Detective; Speed Trial overhaul | Not started |
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
- Story breaks: figs (not farm produce), a pets practice sheet, an abrupt opening ("The farm
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

## Approved vs deferred

Approved and in scope: everything in the brief's stages 1–9.

Deferred: payment or premium restrictions; farmer avatar; Space Invaders and Puzzle Master
arcade games; production artwork (see creative direction).

## Performance requirements

- Static scenery drawn once per screen size; ambient life paused off screen.
- Transitions on the native driver; no layout work during a transition.
- Lesson data is synchronous (bundled), so nothing loads during a transition.
- Target: no dropped frames on a mid-range phone in Expo Go (not yet measured on device).
