# Gridwise — Creative Direction V2

Approved brief, 26 Nov 2026. This is the design direction for the app from here on. Where it
differs from `roots-to-fruits.md` or the sample theme in `gridwise-plan.md`, this wins.
Progress against it is tracked at the bottom ("Where it stands").

## Objective

Turn Gridwise from a conventional spreadsheet learning app into an immersive, animated
educational world: the teaching method of Duolingo, with the nostalgic charm, environmental
richness and atmosphere of early Pokémon television animation and the berry-growing of
Pokémon Gold and Silver.

**Artistic inspiration only.** Gridwise develops its own original characters, botanical
species, environments and visual identity. Nothing is copied: no existing characters, plants,
music, maps or art.

Audience: adults, teenagers and children old enough to learn computer and spreadsheet skills.

## 1. Artistic identity

Away from educational dashboards and generic vector illustration. The environment has:

- rich, vibrant, naturally balanced colours;
- hand-drawn, cel-shaded animated scenery;
- lush green grass and vegetation;
- rich, textured, loamy brown soil;
- vibrant white root systems;
- blue skies and fluffy clouds;
- soft sunlight and natural shadows;
- imaginative, collectible botanical species;
- subtle environmental animation.

Nostalgic, peaceful, imaginative and rewarding, never infantile.

## 2. Main 1 — above-ground world (Home)

A living farm. About 75–80% of the view is above ground; the remaining 20–25% is a
cross-section of soil showing the top of the root system.

Includes: the learner's plant (the central focus), a farm stall, grass and vegetation, sky
with the animated cloud mascot, developing flowers / branches / fruit, the upper roots.

Later: changing weather, sunlight, rain, wet soil, mud, grass growth and trimming. These set
the mood. They are **never compulsory maintenance**.

## 3. Main 2 — underground learning world

The Roots to Fruits pathway: a stylised white root system growing through rich brown soil.
Roots branch naturally, not as a vertical lesson menu. Small selectable lesson icons sit at
root junctions, secondary branches and root tips.

As the learner progresses: roots extend, new pathways open, completed lessons look
different, and the plant above ground grows to match. The roots are the learner's growing
foundation of spreadsheet knowledge.

## 4. Spatial navigation

One connected world, not separate pages:

| Position | Screen |
|---|---|
| Centre | Main 1 — Farm |
| Below | Main 2 — Underground learning path |
| Left | Games and practice |
| Right | Profile and collections |
| Above | Cloud mascot and learning help |

Vertical and horizontal swipes. Main 1 and Main 2 both allow horizontal moves. Going between
above and below ground feels like the camera travelling through the same place. A persistent
bottom bar (like Duolingo and GOALIE) means gestures are never required.

## 5. Collectible botanical species

A free, random mystery seed at the start, with a reveal. It germinates into one of several
original species: imaginative silhouettes, colours, leaves, flowers and fruit. **Not
anthropomorphic, and not existing Pokémon.**

Stages, tied to learning milestones (knowledge, not time in the app):
Seed → Germination → Roots → Seedling → Trunk → Branches → Flowers → Fruit.

Discovering and growing different species is another reason to come back.

## 6. Cloud mascot

Keeps the recognisable identity of the existing mascot (Cell) and becomes a fluffy, expressive
cloud. Eventually: welcome, happy / excited, thinking, encouraging, sleeping, colour changes,
rain and sunshine, rainbows and celebrations. Lives in the farm's sky and has its own area
above the world. A learning companion and guide.

**Wrong answers and missed days never cause punishing changes to the world.**

## 7. Educational content and wording

Review the Roots content for natural wording, clarity, grammar and technical accuracy. The
farm story gives context without drowning the instruction.

Every lesson follows: introduce → demonstrate → guide → independent practice → apply in a
farm scenario → recap. Concise, conversational, phone-sized. The spreadsheet engine,
keyboard and teaching mechanics stay. Accuracy is never traded for entertainment.

## 8. Games and practice

Simple educational games first: matching pairs, shortcut recognition, shortcut execution,
cell identification, spreadsheet terms. Keep Speed Trial. Grid Master, Snake, Space Invaders,
Puzzle Master and the like come later, possibly premium. Spreadsheet learning stays the
point.

## 9. Animation quality

The finished app uses professionally produced animation and illustration. Investigate
technology that fits React Native / Expo: interactive, skeletal, frame-by-frame, layered.
No major dependency without its compatibility, performance, licence and cost spelled out.

## 10. First step (this stage)

On the `Gitty` branch only: a working visual prototype of Main 1 and Main 2 and the spatial
navigation between them, to settle atmosphere, proportions, composition and the feel of
moving around. Temporary original artwork is fine if clearly marked as temporary. Not every
animation, species, weather system or game yet. Existing learning must keep working. No merge
into `main` and no push without approval.

---

## Where it stands

### Stage 1 prototype (26 Nov 2026)

Built (code in `src/world/`):

- **The world** replaces the old Learn list. One camera moves over one tall painting:
  Cell's sky → the farm → soil and roots. Games (the existing Practice screen) sits to its
  left, Profile to its right.
- **Moving around:** swipe or drag up/down between sky, farm and roots, left/right to Games
  and Profile; the mouse wheel moves up and down on a computer. The bar (side menu on wide
  screens) has Games · Farm · Roots · Profile. Tapping the cloud goes up to the sky. Small
  "‹ Games" / "Profile ›" tabs on the farm hint at the sides. Camera moves take 300 ms (product
  rule 4's limit).
- **Main 1, the farm:** sky and sun, drifting clouds, two layers of hills, a fence, a farm stall,
  a field with flowers, the plant in the middle, and the top 22% of the view is soil with the
  plant's fine roots. A slim one-row HUD (level, XP bar, streak, today's goal) replaces the old
  LevelBar/StatsRow panel. "Up next" with Start / Continue / Practise sits in the soil band.
- **Main 2, the roots:** each unit is a root branching off the taproot, alternating sides and
  deeper as the course goes on. Lessons are pods along it (✓ done, gold and pulsing for next,
  amber for a practice round, dim when locked), each with a little rootlet. Unit tests are the
  ★ diamonds at the junctions. Roots are white as far as the learner has reached and faint
  beyond; the taproot grows along the main path only, and thickens with the plant. Arriving at
  the roots scrolls to the next lesson. A tap opens a card with everything the old list
  offered: Start, Continue, practice round, Start again, Do it again, Take the test.
- **The plant:** one temporary species, *Goldspire* (spiral trunk, teal teardrop leaves, lilac
  bells, golden fruit), drawn for all eight stages, swaying gently. The stage comes from lessons
  passed (`src/world/growth.ts`, unit tested). In development builds a dashed "Stage" chip on
  the farm previews each stage; it is not in production builds.
- **The cloud:** Cell as a cloud: same face, same little selection handle, in the learner's
  chosen colour; it floats and blinks. Moods: neutral, happy, thinking, cheering, sleepy.
  The sky has a greeting, what's next, and a daily tip.

Checked in a phone-sized and a desktop browser: every route, the gestures, the bar, the
lesson card, opening a lesson and coming back. Not yet tried on a real phone in Expo Go.

Decisions:

- **`react-native-svg`** added (15.16.0, via `npx expo install`). It ships inside Expo Go, so the
  "Expo Go only" rule holds. MIT licence, no cost. Curves, gradients and cel shading are not
  workable from plain Views.
- Gestures use React Native's own `PanResponder` and `Animated`, as before. Reanimated and
  gesture-handler are still not dependencies. The camera is moved by JavaScript, not the
  native driver, so a drag can catch it mid-move.
- The world has its own fixed daylight palette (`src/world/palette.ts`). It does not follow
  the dark / light setting; the bar, Games and Profile still do.
- Practice and Profile moved to `src/screens/` and are shown inside the world. `/practice` and
  `/profile` still work as links (the games' back buttons use them) and open the world at that
  side.

**All artwork is temporary.** Everything is drawn in code as a stand-in for composition and
mood, not production art.

Known issues:

- On the web with a mouse, a swipe that starts on a lesson pod does not move the camera
  (it starts fine anywhere else). To check on a real phone.
- Games and Profile are still the navy screens, so the sides do not yet look like the world.
- A page in a hidden browser window gets no sizes (see README); the world stays blank there
  unless `gridwise.pollLayout` is set.

### Stage 1b refinements (26 Nov 2026)

From the second brief (environmental detail and interface styling, with a reference image
for level of detail, not to copy). Same art style, proportions, navigation and architecture.

Built:

- **Spreadsheet atmosphere:** a fine white grid on the inside of a sphere round the world
  (`env/SkyDome.tsx`). It is a real perspective projection: columns fan out from the zenith
  overhead and rows bow, flattening into the horizon. Column letters run across the farm's sky,
  row numbers down the first column. Faint enough to leave the sky in charge. Not interactive yet.
- **Hills planted:** a far orchard and a vineyard; on the near hill an apple orchard (with a
  pear or two), staked tomatoes, grapevines, oranges and plums; rim light and ploughed lines for
  shading and texture. The centre of the field stays clear for the tree and a future farmer.
- **Stall upgraded:** "Golden Apples" board, shelves of jam, oil and milk, pies, a basket of
  pears, crates of apples, golden apples, pears and plums, hanging grapes, a lantern, a potato
  sack and a crate of carrots and tomatoes. The produce is the lessons' produce.
- **Foreground:** a watering can and a pumpkin. An **earthworm** pops out near the seed now and then.
- **Scarecrow and birds:** behind the fence, with intermittent events: fly-bys, flocks,
  perching (and hopping to the hat), circling, a gathering that scatters, hat stolen and
  dropped, hat blown off, and the occasional dropping on the hat. The scarecrow wobbles and
  startles.
- **Cell:** rebuilt from the original icon (`assets/icon.png`): Cell's blue and deep rim, its
  arch eyes, half-moon grin and corner handle, on a rounder, shaded, fluffier body. 11 moods and
  5 effects (rain, sunshine, rainbow, sparkles), blinking, glancing, bouncing, colour shifts.
  On the farm it wanders the sky and has its own moments (a shower that ends in a rainbow).
- **Interface:** translucent glass panels with thin gold edges and a soft golden glow, a
  dimensional gold button, a serif italic display face for titles, and gold-accented bar icons.
  Applied to the farm, the sky, the roots card and labels, and the bar. Four tabs kept.

Details of every animation component, how to extend them, and their limits:
[world-animation-components.md](world-animation-components.md).

Not done in this pass (next, per "Consistency across Gridwise"): Games, Profile and the lesson
screens still use the navy theme. The gold kit (`src/world/ui/Gold.tsx`) is ready to apply.

### Still to design or build

- Production art and animation. Recommended route: painted background layers as images
  (sky, hills, stall, soil texture) with **Rive** for the plant, the cloud and its expressions
  (state machines, small files, has an Expo-compatible runtime but needs a development build,
  so it would end the Expo Go-only rule). Lottie is the Expo Go-friendly alternative but has no
  interactive state machine. Decide before commissioning an artist.
- The seed reveal and more species; a collection on the Profile side.
- Weather, day/night, wet soil, grass growth (atmosphere only).
- Cloud expressions beyond the current set, rain / sun / rainbow effects.
- Games, Profile and the lesson screens restyled with the world's gold kit.
- The sky grid as navigation into above-ground Branches and Fruit exercises.
- Stall stock driven by the learner's own spreadsheet work.
- The farm stall has no job yet (a future home for fruit / rewards?).
- The content review in section 7, and the six-step lesson method across every lesson.
- The simple games in section 8.
