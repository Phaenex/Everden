# Phase 9 — Alpha

## Goals

- Second settlement in Reedwater Basin
- District travel via scene exits (causeway hub)
- Vole folk species (healer + stealth)
- 30-day region simulation without corruption

## Deliverables

| Item | Path |
|------|------|
| Vole culture + combat | [vole.md](../world/species/vole.md) |
| Content pipeline | [CONTENT_PIPELINE.md](../systems/CONTENT_PIPELINE.md) |
| Scene districts | `public/data/scenes/*.json` |
| Travel | Exit portals + [SceneLoader](../../src/presentation/SceneLoader.ts) |

## Travel System

- **Scene exits** — walk to visible portal, click or [E] to load next district
- Save restores `sceneState.currentSceneId`
- Legacy `TravelManager` retired from bootstrap (tests may remain)

## Alpha Gate

- [ ] V1–V4 agent gates PASS ([GATE_MATRIX.md](../playtests/GATE_MATRIX.md))
- [ ] 30-day sim soak passes
- [ ] District loop: Causeway → Lilymarket / Croakend / Mudwall / Ferry → Causeway
- [ ] Vole healer encounter in combat
- [ ] All regression tests green
- [ ] **T8:** 5 human sessions, 3/5 pass [PLAYTEST.md](../PLAYTEST.md)
- [ ] 4-hour crash-free human session

## Prerequisites

Do **not** start T8 until [MASTER_BUILD_PLAN.md](../MASTER_BUILD_PLAN.md) phases V1–V4 are PASS in [AGENT_RUNS.md](../playtests/AGENT_RUNS.md).
