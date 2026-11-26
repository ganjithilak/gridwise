# Gridwise (working title)

A hands-on spreadsheet learning app: short lessons where you do the task in a real working grid instead of answering trivia about it. The full plan, and where the build stands against it, is in [gridwise-plan.md](gridwise-plan.md). The design direction from 26 Nov 2026 on is [docs/creative-direction-v2.md](docs/creative-direction-v2.md).

## Run it

```bash
npm install
```

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `w` for the browser.

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run lint
```

## What is in it

- 5 units, 21 lessons, 3 unit tests, 192 exercises, all in `src/content/`. The units run roots, trunk, branches, fruit: fundamentals, first formulas, smarter formulas, then real projects.
- A welcome, a tour of the app, and two games: Speed Trial (press the shortcut, against the clock) and Grid Master (a snake on the sheet, steered with Shift + arrows, collecting cells by their references).
- A split layout when the screen is wider than it is tall: sheet on one half, lesson on the other.
- A formula engine with 24 functions, checked against real Excel.
- A mini spreadsheet: select, fill, AutoSum, formats, sort, undo, copy and paste, shortcuts.
- Progress kept on the device: XP, streak, review schedule, badges. No account, no server.

## Library rule: Expo Go only

The app is developed on Windows with no paid Apple Developer account, so **Expo Go is the only way to run it on an iPhone**. That means:

- Only add libraries that run inside Expo Go: Expo SDK modules, AsyncStorage, Zustand, react-native-svg.
- Nothing that needs a custom native build.
- Install Expo packages with `npx expo install <name>` so the version matches the SDK.
- Expo Go on the phone follows the newest Expo SDK. If a new SDK ships and Expo Go updates, upgrade the project to match.

Gestures use React Native's own responder system, so `react-native-gesture-handler` and Reanimated are not installed.

## Layout

```
app/                Expo Router screens: welcome, the world (home), lesson, results
src/engine/         formula + sheet model, pure TypeScript, no React
src/spreadsheet/    the grid, formula bar, keyboard, toolbar, key caps
src/lessons/        exercise types, checks, mistake messages, session queue, lesson player
src/content/        courses, units, lessons (data only)
src/progress/       saved progress, streak, review schedule, practice rounds, which lessons are open
src/game/           the games: Speed Trial and Grid Master, their rules (tested) and their boards
src/lib/            clock (fakeable), sound and vibration
src/theme/          colours, spacing, type
src/world/          the world: farm, roots, sky, plant, cloud, camera (docs/creative-direction-v2.md)
src/world/env/      scenery and ambient life: sky grid, farm, stall, scarecrow, birds, worm (docs/world-animation-components.md)
src/world/ui/       the world's gold glass interface kit, tab icons and ScreenSky
src/world/refined/  the Refined theme's drawings (Classic Farm's are in src/world and src/world/env)
src/world/transition/ the spreadsheet-sky transition into and out of lessons
src/screens/        Practice and Profile, shown at the world's sides
test/fixtures/      excel-parity.xlsx: test cases computed by real Excel
scripts/            builds the parity workbook, the sounds and the icon
```

## Adding or changing a lesson

Lessons are data. `src/content/excel/build.ts` has helpers so a lesson says what the learner should end up with (`formula: '=AVERAGE(B2:B5)'` in `cell: 'B6'`) and the taps of the worked solution are worked out from that.

1. Write the lesson next to the others and add it to `src/content/excel/course.ts`.
2. Run `npm test`. The content rules check every exercise: its worked solution really solves it, it is not already solved when it opens, its sheet fits a phone, its text fits its space, its tips do not give the answer away.
3. The test run lists any new IDs that are missing from `src/content/ids.ts`. Add them. **An ID is never renamed or reused**: saved progress is keyed by it. Content that is removed has its ID moved to `RETIRED_IDS`.

Each lesson needs a `recap`: two or three sentences saying what it taught, shown on the results screen.

Each lesson needs a `practice` pool: a couple of extra exercises per new skill on different numbers. Learners who miss too many in the lesson get these as a short round before the next lesson opens.

## Excel parity workbook

`test/fixtures/excel-parity.xlsx` is the answer key for the formula engine. Each sheet has a small data block in columns A to F and test formulas in column J. Excel's own computed results are saved in the file, and `npm test` runs every formula through the engine and compares.

To add a case, either:

- open the workbook in desktop Excel, add a formula in the next free row of column J (a note in column H is optional), and save; or
- add it to `test/fixtures/parity-seed.json` and run the script below, which opens Excel in the background and appends only the cases that are not there yet.

```powershell
.\scripts\build-parity-workbook.ps1
```

If the engine disagrees with Excel, the test run fails. A function the installed Excel is too old to know (XLOOKUP needs Excel 2021 or Microsoft 365) shows as skipped rather than failed; rebuild the workbook on a newer Excel and those rows are checked like any other.

`xlsx` (SheetJS) is a dev dependency used only to read this file in tests. It is never bundled into the app.

## Letting someone else try it

**As a web link (nothing to install, works on any phone).** The web version is online at **https://gridwise.expo.app**, on Expo's hosting. The link is public: anyone who has it can open the app. Each person's progress is kept in their own browser.

On an iPhone, opening the link in Safari and choosing Share, then Add to Home Screen, makes it open full screen like an app, under the app's own icon.

The link keeps showing the version that was last put online. After changing the app, build the web version and put it online again:

```bash
npx expo export --platform web
```

```bash
npx eas-cli@latest deploy --prod
```

That needs this computer to be signed in to the Expo account that owns the project (`extra.eas.projectId` in `app.json`). To sign in, run the command below; it opens a page from expo.dev in the browser.

```bash
npx eas-cli@latest login
```

It also has a switch for testing on this computer only. A page in a hidden browser window is never told how big its parts are, so the sheet does not draw there. Running `sessionStorage.setItem('gridwise.pollLayout', '1')` in the page and reloading makes it look sizes up itself. It does nothing on the public link.

`public/index.html` is the page the web version loads into. It holds what only matters in a phone's browser: the Home Screen settings, and switching off the browser's own gestures (double-tap zoom, long-press text selection, scrolling while you drag across the sheet) where they would fight the app's.

**In Expo Go (the real phone app, with vibration).** The other person installs Expo Go, and this computer has to stay on and online while they use it.

```bash
npx expo start --tunnel
```

To look at the built web version on this computer first:

```bash
npx expo serve
```

## Sounds and icon

Both are generated by code, so nothing in the app comes from anywhere else. Change the numbers in the script and run it again. The icon script also writes `public/apple-touch-icon.png`, the icon the web version gets on an iPhone's Home Screen.

```bash
node scripts/make-sounds.js
```

```bash
node scripts/make-icon.js
```
