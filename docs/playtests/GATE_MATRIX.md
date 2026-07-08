# Gate Matrix — Phase → Agents → AR log

Quick reference. Full rubrics: [VISUAL_QA_AGENTS.md](../systems/VISUAL_QA_AGENTS.md).

| Phase | Required agents | Gates | AR id | Blocks next phase if |
|-------|-----------------|-------|-------|----------------------|
| V1 | visual-scout, fresh-player | G1–G5 | AR-002 | any FAIL |
| V2 | visual-scout, fresh-player, **Nick eye** | G3, G4, composition | AR-003, AR-015, AR-016 | FAIL or Nick no |
| V3 | district-explorer | 5 districts + return | AR-004, AR-015 | any district FAIL |
| V4 | quest-runner, combat-tester | PLAYTEST 7–16 | AR-005, AR-006, AR-016, AR-019 | P0 or row FAIL |
| V5 | Humans only | PLAYTEST 1–23 | SESSION_LOG | <3/5 pass |

## Scout gates (G1–G5)

| Id | Scene | Action |
|----|-------|--------|
| G1 | Causeway | New game spawn screenshot |
| G2 | Causeway | 3 click-move points + debug ring |
| G3 | Lilymarket | Enter from causeway |
| G4 | Lilymarket | Click Pip → dialogue |
| G5 | Any | Return to causeway |

Screenshots: `docs/playtests/screenshots/AR-NNN-Gn.png`

## Latest runs

See [AGENT_RUNS.md](AGENT_RUNS.md).
