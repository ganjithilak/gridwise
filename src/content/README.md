# Gridwise — Batch 01: Golden Apples Farm (Roots)

Five existing Roots lessons, preserving Tilak’s IDs, imports, exercise types, checks, shortcuts, and course registration. Lessons 4–5 were rethemed from shop/pets/sports to farm inventory, customer orders and harvest records. Lessons 1–3 are retained from the uploaded ZIP.

## Installation
Copy `excel/unit-00-start-here/` files into `src/content/excel/unit-00-start-here/` on a new Git branch. The ZIP also includes the original supporting `excel/course.ts`, `build.ts`, `tips.ts` and later units as reference; do not overwrite those unless needed.

## Quality checks
Static review only: verify in the real repo with `npx tsc --noEmit` and test each exercise in Expo. Source ZIP did not include the lesson engine or package.json, so runtime compatibility and completion times cannot be verified here.

## Learning progression
1. Welcome to Golden Apples Farm — spreadsheet purpose
2. Explore the Spreadsheet — cells and addresses
3. Entering Data — updating inventory and prices
4. Select Farm Rows and Columns — Ctrl+Space / Shift+Space
5. Navigate the Farm Records — arrows and Shift+arrows

## Narrative notes
Lesson exercises instantiate their own sheets. Inventory values in Lessons 4–5 reflect the farm after the deliveries in Lesson 3, but values are not automatically persisted across lessons. Later units are not yet rethemed.

## Next batch ideas
Farm sales log, customer directory, supplier purchase orders, delivery receipts, and stock movement ledger. These should each teach an explicitly mapped skill rather than simply adding story.
