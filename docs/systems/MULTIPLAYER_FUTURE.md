# Multiplayer Future

**Status:** Design only. Implement post-launch (Phase 12).

## Goals

- Co-op exploration in same settlement
- Shared world state on dedicated server
- Authoritative dice rolls (anti-cheat)

## Server-Authoritative

| System | Authority |
|--------|-----------|
| Combat rolls | Server |
| World flags | Server |
| NPC sim | Server |
| Player movement | Client predict, server reconcile |
| Chat | Server relay |

## Transport

- WebSocket (Node.js or similar)
- JSON message protocol matching EventBus event names

## Determinism Requirement

Single-player sim must use same tick logic as server. `NPCSimulator` and `EconomySimulator` already designed for deterministic ticks.

## Mod Support Interaction

Clients load base `public/data/` + approved mod packs. Server validates mod manifest hash on join.

## Not Before

- Vertical slice complete
- Save format stable
- 30-day sim soak passes in singleplayer
