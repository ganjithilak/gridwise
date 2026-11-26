# World animation components

The living parts of the world, each built to be reused and extended on its own. All are
temporary artwork drawn in code (`react-native-svg`), animated with React Native's
`Animated` on the native driver. No extra libraries.

## The event clock: `useAmbient` (`src/world/env/ambient.ts`)

Creative Direction V2 asks for *intermittent* events, not constant loops. Every scene with
events uses one hook:

```ts
useAmbient(sceneName, active, events, [minGapMs, maxGapMs], firstDelayMs);
```

- `events` is a list of `{ name, weight?, run(done) }`. `run` starts the event, calls `done()`
  when it ends, and may return a stop function.
- While `active`, it waits a random gap, picks an event by weight, runs it, waits for `done`,
  and goes again. **One event per scene at a time.**
- When `active` goes false (the camera has left the farm) or the component unmounts, the
  running event is stopped and the clock pauses. Nothing animates off screen.
- To add behaviour, add an entry to the scene's list. Nothing else changes.

**Reviewing events (development builds only).** On the farm, the dashed **▶ Play an event**
chip steps through every event of every scene in turn. In the browser console:

```js
gridwiseAmbient.scenes()                       // every scene and its events
gridwiseAmbient.trigger('scarecrow', 'hatSteal')
```

A manual trigger interrupts whatever that scene is doing.

## Components

| Component | File | Props | Behaviour |
|---|---|---|---|
| `ScarecrowScene` | `env/ScarecrowScene.tsx` | `width, ground, at, active, children` | Scarecrow behind the fence plus up to 6 birds. `children` (the fence and field) is drawn between them. Events: `flyby`, `flock`, `perch` (may hop to the hat), `circle`, `gather` (then scatter), `hatSteal`, `hatBlow`, `dropping`. Scarecrow reactions: wobble, a startled "!". |
| `Bird` | `env/Bird.tsx` | `rig, mode, size` | One original songbird. `mode`: `hidden` / `flying` (wings flap) / `perched` (wings folded, feet). The scene animates its `rig` (`pos`, `face`, `show`, `hop`). Reusable anywhere. |
| `Earthworm` | `env/Earthworm.tsx` | `x, ground, active, scale` | Pops out of a hole at any soil line. Events: `peek`, `emerge` (looks both ways, wiggles), `wave`. |
| `CloudMascot` | `CloudMascot.tsx` | `mood, effect, size, onPress, alive` | Cell as a cloud. 11 moods: `neutral, happy, excited, thinking, curious, surprised, confused, encouraging, celebrating, sleeping, yawning`. 5 effects: `none, rain, sunshine, rainbow, sparkles`. Floats, squash-and-stretch bounce on each mood change, blinks and glances about (open-eyed moods), colour shifts with mood and weather, and takes the learner's Cell colour. |
| `CloudEffects` | `CloudMascot.tsx` | `effect, size, height` | The weather/celebration layer on its own, for use with other characters later. |
| `WanderingCloud` | `CloudMascot.tsx` | `area, size, active, onPress` | Cell drifting round an area of sky, with events: `curious`, `happy`, `thinking`, `yawn`, `sunshine`, `shower` (rain, then a rainbow). |
| `DriftingCloud` | `Scenery.tsx` | `y, size, width, seconds, start` | Background clouds that loop across the sky. |
| `Goldspire` | `Goldspire.tsx` | `stage, ripe, height` | The plant, 8 growth stages, gentle sway. |

Static scenery, memoised so it costs nothing per frame: `SkyDome` (the spreadsheet
atmosphere), `FarmBackdrop` (hills, orchards, tomatoes, vines), `FarmForeground` (fence, field,
stall, watering can, pumpkin), `Stall`, and the produce pieces in `env/Produce.tsx`
(`FruitTree`, `TomatoRow`, `VineRow`, `GrapeBunch`, `Fruit`, `WateringCan`, `Pumpkin`, `PotatoSack`).

## Interface kit (`src/world/ui/Gold.tsx`)

`GlassPanel` (translucent, thin gold edge, top sheen, gold glow), `GoldButton` (dimensional gold
with a reflection), `GoldLink`, `GoldChip`, the `display` title style (system serif italic) and
`tagStyle`. `ui/TabIcons.tsx` draws the bar's four icons.

## Performance

- Scenery is static SVG, drawn once per screen size.
- Every moving part uses the native driver, except the world camera (see `camera.ts`).
- Ambient scenes pause when the farm is off screen, and run one event at a time each.
- Worst case on the farm: 3 scenes running at once (scarecrow + birds, worm, Cell), 4 background
  clouds, the plant's sway and Cell's float. On the web every native-driver animation runs on
  JavaScript instead, so a slow phone browser will feel it before the Expo Go app does.

## Technical limitations

- **Not yet tried on a real phone.** Frame rate with everything running is unmeasured.
  React Native's `Animated` drives the moves; the SVG drawings themselves are not animated
  per frame (shapes move as whole views), which keeps the cost down.
- **Birds cannot follow curves exactly.** Flights are chains of straight legs (16 to the
  circle); smooth enough at this size. True path animation would need Reanimated or Rive.
- **Bird and scarecrow positions are computed for the scarecrow at rest.** If it is mid-wobble
  when a bird lands, the bird can be off by a pixel or two.
- **SVG text** (sky letters, stall signs) uses the device's fonts, so it can look slightly
  different between iPhone, Android and the web.
- **`backdropFilter` blur** on glass panels works on the web only; on phones the glass is
  translucent without blur. A real blur on native needs `expo-blur` (in Expo Go), not added yet.
- **Fast Refresh** keeps the old camera and event scripts while developing; reload the page
  after changing `camera.ts` or an event script.
- Production art (Rive or Lottie for Cell, the birds and the scarecrow) would replace these
  drawings but can keep the same props and event names.
