# Everden — Master Build Plan (Gated)

**Source of truth for phase order and visual gates.**  
**Multi-track progress:** [PROGRESS.md](PROGRESS.md) — 9 workstream bars (T1–T9).  
Agent runs: [playtests/AGENT_RUNS.md](playtests/AGENT_RUNS.md).

## Doctrine

1. **No phase N+1** until phase N has latest `AR-NNN` = **PASS** (see [GATE_MATRIX.md](playtests/GATE_MATRIX.md)).
2. **Unit tests** guard mechanics; **scout + persona agents** guard Experience (T6 track).
3. **Agent runs ≠ T8** humans.
4. **Nick eye test** for composition milestones (Lilymarket + title wizard).

## Phase map

| Phase | Goal | Mechanical gate | Visual gate | Experience bump |
|-------|------|-----------------|-------------|-----------------|
| **0** | QA infrastructure | — | — | — |
| **V1** | AR-001 fixes: composition + exits | npm CI | scout G1–G5 + fresh-player → AR-002 | — |
| **V2** | Lilymarket + click Pip + wizard | npm CI | scout G3/G4 + **Nick eye** → AR-003, AR-018 | +10% (~45%) |
| **V3** | District hub loop | npm CI | district-explorer → AR-004 | +5% (~50%) |
| **V4** | Quest + combat on new engine | npm CI | quest-runner + combat-tester → AR-005/006, AR-019 | to ~55% |
| **V5** | Human alpha (T8) | — | 3/5 human sessions | to ~65% |
| **V6+** | Content expansion | — | per feature | blocked until V5 |

## Current focus

**V1 ✅ DONE** (AR-002 PASS)

**Active:** **V2** (Nick eye — Lilymarket composition + title wizard AR-018) + **V4** (quest-runner AR-019, combat-tester automation)

See PROGRESS.md tracks **T2** (onboarding), **T6** (look & feel), **T8** (gated build).

## Agent spec

- [systems/VISUAL_QA_AGENTS.md](systems/VISUAL_QA_AGENTS.md)
- [.cursor/skills/everden-playtest/SKILL.md](../.cursor/skills/everden-playtest/SKILL.md)
- [.cursor/rules/everden-visual-gate.mdc](../.cursor/rules/everden-visual-gate.mdc)

## BG3 engine (mechanical — built, visual — gated)

| Module | Path |
|--------|------|
| Pointer | `src/engine/PointerSystem.ts` |
| Nav | `src/engine/NavMesh.ts`, `NavigationController.ts` |
| Scenes | `src/presentation/SceneLoader.ts`, `public/data/scenes/*.json` |
| Input | `src/gameplay/PlayerController.ts` |

T13 / R3–R6: **mechanical done, visual open** until V2–V4 PASS.

## Do not

- Mark presentation work done on tests alone
- Raise T6 / Experience % while scout FAIL or Nick eye pending
- Count agent browser runs as T8
