# Simulation Design

## Time Model

- **Real-time ratio:** 1 game hour = 2 real minutes (configurable)
- **Calendar:** 24 hours/day, 30 days/month, 4 months/season, 4 seasons/year
- **Start:** Day 1, Spring, 08:00 — flood season approaching

## Tick Scheduler

| Event | Frequency | Systems |
|-------|-----------|---------|
| `tick:frame` | Every frame | Presentation, player |
| `tick:minute` | Every game minute | Animations, short timers |
| `tick:hour` | Every game hour | NPC schedule transitions |
| `tick:day` | Every game day | Economy update, quest timers |
| `tick:season` | Every 120 days | Weather tables, migration hooks |

## Off-Screen Simulation

NPCs continue schedules when off-camera. Positions update in `NPCSimulator` state; sprites sync when in view distance.

## Determinism

- `DiceRoller` accepts optional seed for combat replays
- `NPCSimulator` uses seeded RNG for path variance (debug reproducibility)
- Save/load must restore exact state

## Economy (Settlement Scale)

```
newPrice = basePrice * (demand / supply) * seasonalMod * eventMod
```

- Supply changes on NPC buy/sell and player trades
- Demand shifts with season and world flags
- Prices clamped to `[base * 0.25, base * 4]`

## NPC Schedule Resolution

Each hour:
1. For each NPC, find matching schedule entry for current hour
2. If location differs, pathfind to target
3. Emit `npc:activity` event

## Soak Test Requirements

- 7 in-game days unattended: no stuck NPCs, prices in bounds
- Save at day 3, load, continue to day 7 — state matches continuous run
- 15 NPCs budget: sim tick < 2ms on mid-range laptop

## Weather

Per-biome tables in `locations.json`. Current weather affects:
- Movement speed (mud, rain)
- Amphibian combat advantage (rain = frog/toad buff)
- Market demand (firewood in winter)

## Scoped checkpoint (not started): NPC walk-not-teleport

Flagged during the "Nail Core Loop Basics" pass (CHECKIN-031 / AR-015) as a recurring piece of feedback ("NPC logic kind of sucks," "NPCs still moving and clipping too much") whose root cause is real but bigger than a bug fix — this is new Simulation-phase work, scoped here so it doesn't get silently folded into a "quick fix" later.

**Current behavior (confirmed by reading the code, not guessing):**

- `NPCSimulator.onHour()` (`src/simulation/NPCSimulator.ts`) tracks each NPC's abstract world location/x/z and emits `npc:moved` on a schedule change — CHECKIN-028 already stopped `SceneManager` from listening to that event directly, so it no longer causes an in-view teleport.
- What still happens: `GameBootstrap.spawnSceneNpcs()` / `refreshNpcPresence()` (`src/core/GameBootstrap.ts`) add or remove an NPC's 3D actor at a **fixed, static x/z** (`scene.json`'s own `npcs[].x/z` slot for that district) the instant `npcPresentInScene()` flips from false to true or vice versa. There is no walk-in/walk-out, no fade, no path — the actor pops into existence already standing in its slot, and disappears the same way. This is correct and intentional for cross-district transitions (an NPC scheduled in Croakend has no reason to be pathable from Lilymarket), but it reads as jarring when the player is standing in the same scene at the hour boundary and watches someone appear/vanish mid-frame.
- Within a single scene, once spawned, an NPC's position is otherwise static for the rest of that schedule entry (no idle wander, no repositioning) — the "clipping" reports are more likely the screen-space overlap issue fixed in AR-014/AR-015 than actual movement glitching, but worth re-confirming once this checkpoint ships since it changes the visual behavior at hour boundaries.

**Proposed direction (design only, not implemented):**

1. **Spawn/despawn fade** (smallest lift): cross-fade the actor's material opacity over ~0.4-0.6s on add/remove in `spawnSceneNpcs`/`refreshNpcPresence` instead of a hard pop. Removes the "instant pop" jarring without touching pathing at all.
2. **Walk-to-edge-and-off** (medium lift, more "alive"): when an NPC is despawning because their schedule moved them to a different scene, instead of removing immediately, briefly path them (reusing `NavMesh`/`NavigationController`'s existing A*) to the nearest scene exit position and remove only once they reach it; the reverse on spawn (appear at the entry exit, walk to their slot). Only meaningful while the player is actually in that scene to see it — off-screen transitions can stay instant, matching "Off-Screen Simulation" above.
3. **Intra-scene idle movement** (largest lift, separate from teleport-fixing): a short wander/idle-walk loop so NPCs aren't statue-still for their entire schedule block. Needs its own pass on collision-avoidance vs other NPCs/player and shouldn't be bundled with the fix above.

**Why deferred rather than done alongside Checkpoints 1-2:** this needs its own test coverage (`NPCSimulator`/`GameBootstrap` currently have no notion of an NPC being "in transit"), a decision on which of the 3 options above is worth the cost for a still-small vertical slice, and shouldn't be rushed in the same pass as a hub-content + rendering-bug fix. Composition and nav fundamentals come first per `everden-progress.mdc` doctrine; this is real Phase 5 (World simulation) depth work, not a core-loop blocker.

**Definition of done when this is picked up:** unit tests for whichever option is chosen (fade timing, or transit-state add/remove, or wander bounds), a live-verified before/after screenshot pair, and an AR-NNN log entry — same process as every other checkpoint in this doc.
