# Phase 12 — Post-Launch

## Priority Roadmap

| # | Feature | Doc |
|---|---------|-----|
| 1 | New regions + species | IDEAS.md pipeline |
| 2 | JSON mod packs | [MODS.md](../systems/MODS.md) |
| 3 | WebSocket multiplayer | [MULTIPLAYER_FUTURE.md](../systems/MULTIPLAYER_FUTURE.md) |
| 4 | Live seasons / world events | SIMULATION.md extensions |

## Mod Support

Load `/mods/{pack}/data/*.json` and merge into `DataRegistry` at boot.

Stub: `src/core/ModLoader.ts`

## Multiplayer

Dedicated Node server; authoritative dice rolls; state sync for `WorldState` and NPC positions.

Stub: `src/core/NetworkModule.ts`

## Live Ops

- Seasonal world events (flood season global modifier)
- Rotating market events
- Community IDEAS.md → content drops
