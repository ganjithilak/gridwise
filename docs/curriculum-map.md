# Gridwise — Curriculum Map

What each lesson introduces (I), reinforces (R) and requires (Q), how it fits the Golden
Apples Farm story, and which games reinforce it. Skill ids are those in
`src/content/excel/course.ts`. Status: **rewritten** to the editorial standards, or
**original** (still to be reviewed in Stage 8).

## Narrative arc

The learner has been entrusted with running Golden Apples Farm for a growing season.

| Stage | Story | Units |
|---|---|---|
| Roots: foundations | Recording produce, stock and prices; reading and correcting the records | Start here |
| Trunk: developing the business | Totals, averages, stock left, revenue and profit with formulas | First formulas |
| Branches: improving operations | Comparing crops, suppliers and customers; categorising; working faster | Make it think; Getting around faster (side) |
| Fruit: applying knowledge | Independent projects, including beyond the farm | Put it to work |

## Roots — Start here (rewritten)

| Lesson | Story | I | R | Q |
|---|---|---|---|---|
| 0 Welcome to Golden Apples Farm | A new season; why the farm needs records | spreadsheet purpose | — | — |
| 1 Cells and References | The stall's fruit price list | cell address | purpose | — |
| 2 Entering and Correcting Data | Keeping the stock record up to date | cell type (replace, edit, confirm, cancel) | cell address | cell address |
| 3 Selecting Rows and Columns | Reviewing stock and wholesale customers | select column, select row | cell address | cell address |
| 4 Moving Around the Sheet | Navigating the stock record and customer orders | arrow keys, extend selection | select row/column (in a choice) | cell address |

**Dataset continuity (stock record, kg / price per kg):**

| | Carrots | Potatoes | Tomatoes | Apples |
|---|---|---|---|---|
| Lesson 0 (start of season) | 100 / $2.50 | 200 / $3.00 | 50 / $6.00 | — |
| Lesson 2 opens (a month in) | 15 / $2.50 | 120 / $3.00 | 30 / $6.00 | 80 / $4.00 |
| Lesson 2 ends | 115 / $3.00 | 110 / $2.75 | 80 / $6.00 | 100 / $4.50 |
| Lessons 3 and 4 | as lesson 2 ends | | | |

Lesson 0 also tracks stock sent to the roadside stall (carrots 100 picked, 40 sent, 60 left).
Practice rounds use separate records (stall deliveries, orchard pickers, supplier orders,
harvest log) so they assess the skill on unfamiliar data.

## Trunk — First formulas (original)

| Lesson | I | Q | Suggested story (Stage 8) |
|---|---|---|---|
| Add it up | formula arithmetic, SUM range | cell address, type | Harvest totals; stock left after stall deliveries |
| The average | AVERAGE | SUM range | Average daily sales at the stall |
| Smallest, biggest, how many | MIN/MAX, COUNT | ranges | Best and worst selling days; how many deliveries |
| AutoSum | AutoSum | SUM range | Weekly expense totals |
| Fill down | fill handle | formulas | Revenue per product (stock × price) down the list |
| Lock it with $ | absolute references | fill | Revenue after a fixed levy or price rise |

## Branches — Make it think (original)

| Lesson | I | Q | Suggested story (Stage 8) |
|---|---|---|---|
| True or false | comparisons | formulas | Which crops met their target |
| IF | IF | comparisons | Flagging stock to reorder |
| Count and add what matches | COUNTIF, SUMIF | ranges, comparisons | Sales by product or customer |
| Look it up | XLOOKUP, VLOOKUP | ranges | Supplier price list lookups |
| When things go wrong | IFERROR | lookups | Missing suppliers, #N/A, #DIV/0! |

## Branches (side) — Getting around faster (original)

| Lesson | I | Q |
|---|---|---|
| Select | select range (drag), select all | extend selection |
| Copy and move | copy, cut | select range |
| Sort and undo | sort, undo | select |
| Make it readable | bold, number formats | select |

## Fruit — Put it to work (original)

Two projects with no new skills: a café's week (unit 1 skills) and marking a class (unit 2
skills). These intentionally leave the farm, to show the skills transfer to work and home.
A farm project (season summary: harvest, sales, expenses, profit) is a candidate addition.

## Game-to-curriculum map

| Game | Status | Reinforces | Unlocks after |
|---|---|---|---|
| Match Pairs | planned (Stage 5) | terms, functions, errors, symbols, shortcuts | per category: the lesson that teaches it |
| Shortcut Match | planned (Stage 5) | shortcuts taught so far, Windows or Mac | each shortcut's lesson |
| Cell Hunter | planned (Stage 5) | cell address, select row/column, ranges, arrows | Cells and References |
| Formula Builder | planned (Stage 5) | arithmetic, SUM, AVERAGE, MIN/MAX, COUNT, then later functions | First formulas |
| Error Detective | planned (Stage 5) | ranges, references, IFERROR, error values | First formulas; harder after Make it think |
| Speed Trial | built; overhaul planned | shortcut recognition and execution | **issue:** level 1 tests copy/paste/undo before they are taught |
| Grid Master | locked in Advanced Arcade | cell references, Shift + arrows | — |
