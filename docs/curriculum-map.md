# Gridwise — Curriculum Map

What each lesson introduces (I), reinforces (R) and requires (Q), how it fits the Golden
Apples Farm story, and which games reinforce it. Skill ids are those in
`src/content/excel/course.ts`. Status: every unit is now **rewritten** to the editorial standards
(Roots in Stage 2, the rest in Stage 8).

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
| 0 Welcome to Golden Apples Farm | A new season; why the farm needs records | spreadsheet purpose; the words row, column, cell, select | — | — |
| 1 Cells and References | The stall's fruit price list | cell address | purpose | — |
| 2 Entering and Correcting Data | Keeping the stock record up to date | cell type (replace, edit, confirm, cancel) | cell address | cell address |
| 3 Selecting Rows and Columns | Reviewing stock and wholesale customers | select column, select row; range notation (B1:B5) | cell address | cell address |
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

## Trunk — First Formulas (rewritten, Stage 8)

| Lesson | I | Q | Story |
|---|---|---|---|
| Add It Up | formula arithmetic, SUM range | cell address, type | The stall's week: profit (takings − costs) and totals; the week's harvest |
| The Average | AVERAGE | SUM range | Apples sold over a long weekend; the pickers' bins (a real 0); the stall shut on Sunday (an empty cell) |
| Smallest, Biggest, How Many | MIN/MAX, COUNT | ranges | Pickers' minutes to fill a bin; the stall's price list from Roots; customers who paid |
| AutoSum | AutoSum | SUM range | The month's feed and fuel; crates sold; the stall shut on Wednesday |
| Fill Down | fill handle | formulas | Takings per product (price × kg sold); the stall's week |
| Lock It with $ | absolute references | fill | A 10% rise in crate prices; pickers' bonus rate; each crop's share; the market's fee |

## Branches — Make It Think (rewritten, Stage 8)

| Lesson | I | Q | Story |
|---|---|---|---|
| True or False | comparisons | formulas | Which crops met their picking target; cool-room count against the record |
| IF | IF | comparisons | Met or Short against target; bins graded Pass or Fail; pickers' bonus |
| Count and Add What Matches | COUNTIF, SUMIF | ranges, comparisons | Wholesale orders by delivery route; the harvest log by crop |
| Look It Up | XLOOKUP, VLOOKUP | ranges | Pricing an order from the stall's list; the seed shed; who is on which orchard row |
| When Things Go Wrong | IFERROR | lookups | Kg per tree on replanted rows (#DIV/0!); figs not on the price list (#N/A); SUMM (#NAME?) |

Practice rounds use other farm records (pie kitchen, dairy, orchard temperatures, feed
supplier, paddocks). The wholesale customers are the Roots ones: River Cafe, Hill Market, Town
Grocer, plus Bay Deli. The games use the same customers and the same produce list.

## Branches (side) — Getting Around Faster (rewritten, Stage 8)

| Lesson | I | Q | Story |
|---|---|---|---|
| Select | select range (drag), select all | extend selection | Bins picked this week |
| Copy and Move | copy, cut | select range | The job plan; who is on which job; market tables |
| Sort and Undo | sort, undo | select | Ranking the day's pickers; the stall's stock; the delivery round |
| Make It Readable | bold, number formats | select | The month's costs; the stall's price list; a day at the market |

## Fruit — Put It to Work (reviewed, Stage 8)

Two projects with no new skills: a cafe's week (unit 1 skills) and marking a class (unit 2
skills). They intentionally leave the farm, to show the skills transfer to work and home; each
summary now says so ("Away from the farm"). A farm project (season summary: harvest, sales,
expenses, profit) is still a candidate addition.

## Game-to-curriculum map

Approved list (27 Nov 2026). Games test only what has been taught, and get harder as the
course progresses. All reuse the Workbench sheet (Stage 4).

| Game | Status | Reinforces | Unlocks after |
|---|---|---|---|
| Match Pairs | built (Stage 5) | words, references, shortcuts, symbols, functions, formula results, error values, formatting | per category: the lesson that teaches it |
| Speed Trial | rebuilt (Stage 5) | entering data (Enter, Esc, F2), rows and columns, arrows, stretching, then the side unit's shortcuts | each level when its lessons are finished |
| Formula Builder | built (Stage 5) | arithmetic, SUM, AVERAGE, MIN/MAX, COUNT, $, comparisons, IF, COUNTIF, SUMIF | Add It Up |
| Find the Error | built (Stage 5) | typed values, ranges, references, functions, $, IF, #DIV/0!, #NAME? | Entering and Correcting Data (values); formulas as taught |
| Cell Hunt | built (Stage 5) | cell references, rows and columns, blocks, arrow keys | Cells and References |
| Predict the Result | built (Stage 5) | what a formula returns | Add It Up |
| Grid Master | locked in Advanced Arcade | cell references, Shift + arrows | — |
