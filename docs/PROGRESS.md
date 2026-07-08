# Everden — Development Progress

**Last updated:** 2026-07-08 (CHECKIN-036)  
**Play online:** https://everden-chi.vercel.app

> This file is the source of truth. If an agent says "done," check here first.

## Progress dashboard (9 workstreams)

**Headline overall:** `█████████░░░░░░░░░░░` **56%** — average of T1–T8 (T9 Future excluded)

| # | Track | Bar | % | Blocks % when |
|---|-------|-----|---|---------------|
| T1 | **Mechanics & CI** | `██████████████████░░` | **88%** | e2e or CI red |
| T2 | **First 5 minutes** | `████████████████░░░░` | **78%** | wizard broken; Nick eye pending |
| T3 | **Districts & nav** | `████████████████░░░░` | **80%** | scene load fail; nav off-art |
| T4 | **Quests & dialogue** | `████████████████░░░░` | **82%** | quest hard-block; missing fail-forward |
| T5 | **Combat & D&D** | `█████████████████░░░` | **88%** | soft-lock; RAW doc gaps |
| T6 | **Look & feel** | `████████░░░░░░░░░░░░` | **42%** | scout FAIL; Nick eye no |
| T7 | **Art & audio** | `█████░░░░░░░░░░░░░░░` | **25%** | T6b blocked on Nick sketches |
| T8 | **Gated build V1–V5** | `█████████░░░░░░░░░░░` | **48%** | any V-row FAIL |
| T9 | **Groundwork** | `██████░░░░░░░░░░░░░░` | **32%** | (future; does not move headline %) |

**Current milestone:** V4 mechanical PASS (AR-019) — **V2 Nick eye** on wizard + Lilymarket  
**Next gate:** Nick MANUAL_CHECKLIST V2 sign-off  
**Playtests (T8):** Schedulable — V4 agent pre-check green; humans required for alpha

### T1 — Mechanics & CI (88%)

| Item | Status | Owner |
|------|--------|-------|
| 122 unit tests green | ✅ | Agent |
| 16/16 Playwright e2e | ✅ | Agent |
| typecheck + build + CI workflow | ✅ | Agent |
| Save v2 (name, motivation, v1 migrate) | ✅ | Agent |
| QA harness (`__everden`) | ✅ | Agent |
| Wizard e2e (non-qa) | ✅ | Agent — T30 |
| V4 quest rows 7–12 automated | ✅ | Agent — T27 |

### T2 — First 5 minutes (78%)

| Item | Status | Owner |
|------|--------|-------|
| Continue / New Game + overwrite confirm | ✅ | Agent |
| Wizard: species → name → motivation → confirm | ✅ | Agent |
| Five folk incl. tortoise | ✅ | Agent |
| Species/motivation opening narration | ✅ | Agent |
| Pip `{playerName}` + motivation append | ✅ | Agent |
| AR-018 non-QA tortoise playthrough | ✅ | Agent — AR-018 |
| Nick wizard eye test | ⬜ | Nick |

### T3 — Districts & nav (80%)

| Item | Status | Owner |
|------|--------|-------|
| Five districts load (causeway hub) | ✅ | Agent |
| Nav mesh calibrated to backdrop art | ✅ | Agent |
| Exit portals + save restores scene | ✅ | Agent |
| NPC schedule-aware presence | ✅ | Agent |
| Causeway hub landmarks (AR-015) | ✅ | Agent |
| Nick composition eye (all districts) | ⬜ | Nick |
| NPC walk-not-teleport animation | ⬜ | Agent — gated on Nick V2 |

### T4 — Quests & dialogue (82%)

| Item | Status | Owner |
|------|--------|-------|
| Main quest + 5 council endings | ✅ | Agent |
| Ferryman's Toll side quest | ✅ | Agent |
| Wrong Label side quest | ✅ | Agent |
| Fail-forward skill checks (Domet, Grizz, Kess) | ✅ | Agent |
| Readable quest tracker (title + stage) | ✅ | Agent |
| V4 automated main-quest chain (rows 7–11) | ✅ | Agent — AR-019 |
| Second quest with full check/branch pattern | ⬜ | Agent — post-V5 |

### T5 — Combat & D&D (88%)

| Item | Status | Owner |
|------|--------|-------|
| Blackfen encounter + enemy AI | ✅ | Agent |
| Species abilities (5 folk kits) | ✅ | Agent |
| Diplomacy persuade/intimidate | ✅ | Agent |
| BG3 dice duel popup | ✅ | Agent |
| Crit doubles dice only; flat DC checks | ✅ | Agent |
| COMBAT.md deliberate simplifications | ✅ | Agent — T26 |
| V4 combat ability smoke (frog leap) | ✅ | Agent — AR-019 |
| Second combat encounter | ⬜ | Agent — post-V5 |

### T6 — Look & feel (42%)

| Item | Status | Owner |
|------|--------|-------|
| V1 scout G1–G5 (AR-002 PASS) | ✅ | Agent |
| Backdrop crop / nav fixes (AR-009–015) | ✅ | Agent |
| V2 Lilymarket + Pip (AR-003 BORDERLINE) | 🟡 | Nick eye |
| V3 district hub loop (AR-004/015) | 🟡 | Nick eye |
| Title wizard UI polish | 🟡 | AR-018 mechanical PASS; Nick eye pending |
| T6b hand-drawn art swap | ⬜ | Blocked — Nick sketches |

*Cannot exceed ~50% until Nick eye PASS on Lilymarket + wizard.*

### T7 — Art & audio (25%)

| Item | Status | Owner |
|------|--------|-------|
| Interim AI pixel art (31 assets) | ✅ | Agent |
| Procedural fallback + chroma-key | ✅ | Agent |
| Synthesized ambient + SFX (Web Audio) | ✅ | Agent |
| Recorded music / voice | ⬜ | Future |
| Walk/combat animation atlases | ⬜ | Beta phase |
| Hand-drawn final sprites (T6b) | ⬜ | Blocked — Nick |

### T8 — Gated build V1–V5 (48%)

| Phase | Status | AR |
|-------|--------|-----|
| V1 composition + exits | ✅ PASS | AR-002 |
| V2 Lilymarket + Nick eye | 🟡 BORDERLINE | AR-003, AR-016; wizard AR-018 mechanical PASS |
| V3 district hub loop | 🟡 BORDERLINE | AR-004, AR-015 |
| V4 quest + combat | ✅ PASS (mechanical) | AR-019 |
| V5 human alpha (T8) | ⬜ | 3/5 sessions required |

### T9 — Groundwork (32%)

| Item | Status | Owner |
|------|--------|-------|
| Content pipeline doc | ✅ | Agent |
| `docs/design/INTRO_AND_CHARACTER_CREATION.md` | ✅ | Agent |
| `docs/world/species/tortoise.md` | ✅ | Agent — T28 |
| `docs/narrative/QUEST_TEMPLATE.md` | ✅ | Agent — T29 |
| ModLoader smoke test | ✅ | Agent — T29 |
| Leveling / proficiency placeholder docs | ⬜ | Agent |
| Mod packs (`ModLoader.ts`) | ⬜ | Post-V5 |
| Multiplayer stub (`NetworkModule.ts`) | ⬜ | [MULTIPLAYER_FUTURE.md](systems/MULTIPLAYER_FUTURE.md) |

---

## Remaining Work (quick view)

| Priority | Item | Status |
|----------|------|--------|
| ✅ | Multi-track dashboard (T23) | Done — CHECKIN-036 |
| 🟡 | git push to GitHub (T24) | Vercel redeployed; push blocked on workflow OAuth scope |
| ✅ | AR-018 + AR-019 | Done |
| 🟡 | Gated visual QA V2–V3 | Nick eye on Lilymarket + wizard |
| ⬜ | Alpha phase gate (T8 humans) | After Nick V2 sign-off |

**Done recently:** Multi-track PROGRESS dashboard · V4 e2e expansion (16/16) · wizard e2e · COMBAT.md D&D simplifications · tortoise culture doc · ModLoader test · AR-018/019 (CHECKIN-036)

---

## Phase Summary

| Phase | Name | Status | % | Notes |
|-------|------|--------|---|-------|
| 0 | Foundation (repo, constitution) | ✅ Done | 100% | GitHub, docs |
| 0.5 | Nanabozho branding | ✅ Done | 100% | Studio docs, IDEAS.md |
| 1 | World design bible | ✅ Done | 100% | Docs only — not all lore in-game |
| 2 | Web foundation | ✅ Done | 100% | Vite, TS, Three.js, CI, tests |
| 3 | Presentation | 🟡 In progress | **35%** | V1 visual gate — composition + exits (mechanical BG3 engine done) |
| 5 | World simulation | 🟡 In progress | 78% | Clock, NPCs, economy, weather |
| 6 | Narrative | 🟡 In progress | 79% | Main quest, side quests, council, skill checks |
| 7 | Combat | 🟡 In progress | 88% | Dice combat, abilities, diplomacy, vole kit, BG3-style dice-duel popup |
| 8 | Vertical slice | 🟡 In progress | **48%** | Systems ~72%, Experience ~35% until V4 agent PASS |
| 9 | Alpha | 🟡 In progress | **35%** | 30-day weather soak green; 120 unit tests; awaiting human playtests |
| 10 | Beta | ⬜ Not started | 5% | PWA manifest stub |
| 11 | Launch | 🟡 In progress | 40% | **https://everden-chi.vercel.app** |
| 12 | Post-launch | ⬜ Not started | 5% | Mod/network stubs |

---

## What Exists vs What Does NOT

### ✅ Built (checkpoint)

- Browser game runs (`npm run dev`)
- Reedwater Basin greybox scene
- 16 NPCs with names, schedules, procedural pixel sprites, dialogue
- **Interim AI pixel-art pass** — 31 generated assets (5 species, 15 NPCs, 2 enemies, 3 items, 6 locations, 1 title backdrop) with chroma-key transparency and automatic procedural fallback if any asset 404s (see `docs/art/ASSET_SHEET.md`)
- **Procedural audio pass** — synthesized ambient marsh loop (reacts to weather) + dice/hit/miss/heal/dialogue-tick/toast SFX, all generated with Web Audio oscillators (no asset files), HUD mute toggle, persisted in `localStorage`
- Player species select (frog / toad / turtle / tortoise / vole) via title wizard
- **Five playable folk** — frog, toad, turtle, tortoise, vole via title wizard; vole healer kit + 1 NPC (Sable Meadowrun)
- Main quest **What the Water Remembers** — examine objectives + **5 council endings**
- **Ferryman's Toll** side quest (Grizz → Jenna → Grizz)
- **Wrong Label** side quest (Pondwort → Marta's shelf → Marta → Pondwort)
- **Weather system** — daily rolls, rain/fog/clear, particles, amphibian buffs
- **Field Journal** — [J] codex unlocks from examines, quests, flags
- **Player agency pass** — visible skill checks (INT/WIS/CHA), species-exclusive dialogue, flag callbacks, combat persuade/intimidate
- 1 combat encounter (Blackfen poachers) with **diplomacy option**
- Merchants (Pip, Marta), items, dice modifiers
- Save/load, pause, combat log, **combat ability panel**
- **Travel between Lilypond and Ferryman's Rest** (TravelManager, 1.5h clock advance, save zone)
- **120 unit tests** + 30-day weather soak, CI workflow (includes `lint`)
- Full world bible in `docs/world/`

### ❌ NOT built yet

- **Hand-drawn final art (T6b)** — currently shipping AI-generated placeholder tier, not Nick's sketches
- **Recorded/composed audio** — current pass is synthesized SFX/ambience, not music or voice
- **Travel between settlements**, second settlement *(Ferryman's Rest reachable via ferry — same scene, distinct zone)*
- **Playtest-validated** vertical slice (no external playtests filed — **T8 blocked on Nick**)

---

## Active Task List

| ID | Task | Status | Owner |
|----|------|--------|-------|
| T1 | Council choice UI + 5 endings | ✅ Done | — |
| T2 | Side quest: Ferry toll dispute | ✅ Done | — |
| T3 | Side quest: Pondwort's wrong tonic | ✅ Done | — |
| T4 | Combat ability buttons (leap, shell, toxin) | ✅ Done | — |
| T5 | Weather / rain particles + amphibian buff | ✅ Done | — |
| T6 | Interim AI pixel-art pass (unblocks visuals) | ✅ Done | — |
| T6b | Swap in hand-drawn sketches (same `public/assets/` paths) | ⬜ Blocked | Nick sketches |
| T7 | Journal / discovery codex | ✅ Done | — |
| T8 | External playtest (5 sessions) | 🟡 Schedulable | Agent AR-002 PASS; humans use PLAYTEST.md |
| T9 | Deploy preview to Vercel | ✅ Done | https://everden-chi.vercel.app |
| T10 | Audio pass — ambient loop, dialogue tick, dice/combat SFX | ✅ Done | Synthesized (Web Audio), no asset files |
| T11 | Travel to second settlement (Ferryman's Rest, 1.5h) | ✅ Done | TravelManager + ferry docks |
| T12 | Vole species in-game (species.json, 1 NPC, combat kit) | ✅ Done | — |
| T13 | BG3 engine rebuild | 🟡 Visual V2+ | Mechanical ✅; AR-002 V1 PASS |
| T15 | Gated master build | 🟡 In progress | [MASTER_BUILD_PLAN.md](MASTER_BUILD_PLAN.md) |
| T16 | BG3-style dice duel popup (combat + dialogue rolls) | 🟡 Mechanically done | AR-011/012 PASS; Nick eye test pending |
| T17 | Dev menu (scene jump, time skip, quest shortcuts) | ✅ Done | F1 or ` — AR-012 |
| T18 | Playwright E2E + QA harness | ✅ Done | AR-013 — 8/8 mechanical gates |
| T19 | Core-loop polish (E-prompt, combat confirm, NPC overlap, dev menu pause) | ✅ Done | AR-014 — Nick eye test pending |
| T20 | Causeway hub life + backdrop 2x-oversize crop bug fix + nav sweep | ✅ Done | AR-015 — Nick eye test pending |
| T21 | Intro arc — opening beat, control hint, title flavor, quest tracker, Pip dialogue fix | ✅ Done | AR-016 — real non-QA playthrough verified |
| T22 | Full character creation — wizard, tortoise, name, motivation, save v2, flavored intro, D&D fixes | ✅ Done | AR-017 — 120 unit + 8/8 e2e; Nick wizard eye pending |
| T23 | Multi-track PROGRESS.md dashboard | ✅ Done | CHECKIN-036 |
| T24 | Push + redeploy post-T22 commit | 🟡 Vercel ✅ | git push blocked (workflow scope) |
| T25 | AR-018 non-QA wizard playthrough (tortoise) + screenshots | ✅ Done | AR-018 |
| T26 | D&D authenticity closure (COMBAT.md, poisoned comment) | ✅ Done | — |
| T27 | V4 quest-runner e2e (PLAYTEST rows 7–12) | ✅ Done | AR-019 |
| T28 | tortoise culture sheet | ✅ Done | docs/world/species/tortoise.md |
| T29 | ModLoader smoke test + QUEST_TEMPLATE.md | ✅ Done | 122 unit tests |
| T30 | e2e character-creation.spec.ts (wizard + Continue) | ✅ Done | 3 tests green |

---

## Check-in Log

### CHECKIN-036 — 2026-07-08

**Type:** Multi-track progress dashboard + polish sprint (T23–T30)  
**Agent:** Cursor

**Shipped:**

1. **9-workstream PROGRESS.md** — T1–T9 bars + per-track checklists; updated `everden-progress.mdc` + `MASTER_BUILD_PLAN.md`.
2. **Vercel redeploy** — production https://everden-chi.vercel.app updated (git push still blocked: OAuth workflow scope on `.github/workflows/ci.yml`).
3. **AR-018** — tortoise/messenger wizard path + 5 screenshots; `e2e/character-creation.spec.ts` (3 tests).
4. **AR-019** — V4 quest-runner + combat-tester: main quest stage chain, Kess INT + species line, council expose, frog leap ability smoke.
5. **T26** — `COMBAT.md` deliberate simplifications; poisoned comment in `CombatManager.ts`.
6. **T28/T29** — `tortoise.md`, `QUEST_TEMPLATE.md`, `ModLoader.test.ts` (2 tests).

**Tests:** 122 unit + 16/16 Playwright e2e green.

**T6 unchanged** — Nick eye still required for wizard UI + Lilymarket composition before Experience bump.

**Next:** Nick MANUAL_CHECKLIST V2; fix git push (workflow scope or push without ci.yml change).

---

### CHECKIN-035 — 2026-07-08

**Type:** Character creation wizard + save v2 + D&D mechanical fixes (follows CHECKIN-034 intro arc)  
**Agent:** Cursor (session resumed after connection loss)

**Why:** user approved full "Perfect the Beginning" scope — tortoise, name, motivation, confirm sheet, Continue/New Game — plus D&D referee findings (crit dice-only, flat DC checks).

**Shipped:**

1. **`TitleScreen.ts`** — species → name → motivation → confirm sheet; Continue/New Game + overwrite confirm.
2. **Five folk** — tortoise in `species.json`; data-driven blurbs; save v2 (`name`, `motivation`).
3. **Flavored intro** — `OpeningNarration.ts`; Pip `{playerName}` + motivation append lines.
4. **D&D fixes** — crit doubles dice only; skill checks/diplomacy flat DC; `COMBAT.md` flee wording.
5. **QA regression fix** — `?qa=1&keep=1` loads save via `mode: 'continue'` (e2e save round-trip was failing).

**Tests:** 120 unit tests, typecheck, build, 8/8 Playwright e2e all green.

**Experience % unchanged** — wizard UI not Nick eye-tested this run (machine load extreme); mechanical gates green.

**Next:** Nick wizard eye test (tortoise path); deploy after commit; V2 composition approval still open.

---

### CHECKIN-034 — 2026-07-07

**Type:** "Intro arc" — first authored new-player opening, from title screen through the first quest hook confirmation (follows CHECKIN-032; runs parallel to/independent of CHECKIN-033's docs-only D&D rules pass)  
**Agent:** Cursor

**Why:** user asked "what's logically next, and next after, until we have an intro to test." Mapped the actual new-player experience first — mechanically the game worked, but nothing acknowledged the player: quest auto-granted silently with raw ids in the HUD, no one greeted you, no control hints, and Pip's dialogue still had a `start_quest` action that was dead code (quest was always already active by the time you could reach him). Decided (with user sign-off) to keep the instant auto-grant for clear direction from second 1, but fix Pip's reaction to acknowledge prior knowledge instead of pretending to hand out a fresh quest.

**Checkpoints, all shipped this session:**

1. **Quest tracker readability** — `QuestManager.emitStage()` now looks up and emits `title`/`stageDescription` from `quests.json` on every `quest:stage` event; HUD reads `What the Water Remembers: Examine the flooded cellar in Lilymarket.` instead of `Quest: what_water_remembers — cellar`.
2. **Opening narration beat** — new `UIManager.showNarration()` (reuses the dialogue panel, so it locks movement via existing `dialogue:opened`/`dialogue:closed` wiring, no new lock logic). Fires once on a brand-new save after Causeway loads: 3 lines establishing the flood/levy/council-vote premise and nudging toward Lilymarket. Skipped in QA mode so e2e stays deterministic.
3. **First-time control hint** — `showToast` gained an optional duration param; a 6s toast (`Click to move · [E] to interact · [J] for journal`) fires right after the opening beat closes.
4. **Title screen flavor pass** — one-line premise blurb + a per-species one-liner (updates live on button click) instead of just "Frog · Mobile" etc.
5. **Pip dialogue fix** — rewrote the dead `quest_hook`/`start_quest` branch into `already_knew`, with choice text "I already heard — that's why I'm here." and a reaction that doesn't pretend to grant a quest that's already running.
6. **Full verification** — real (non-QA, no scene-warp) click-through playtest: title → species pick → opening beat → control hint → click-walked to Lilymarket → talked to Pip, confirmed the new reaction live. Screenshots + full writeup in AR-016.

**Tests:** 4 new (QuestManager quest:stage payload, UIManager `showNarration` × 2, `showToast` duration) — 110 unit tests total, all green. Typecheck, build, and 8/8 Playwright e2e all green.

**Deployed:** production, https://everden-chi.vercel.app.

**Experience % unchanged for now** — this is UX/copy/systems work (not a composition/backdrop fix), lower visual risk, but still the first thing every player sees; noted for Nick's look alongside the CHECKIN-031 backdrop fix rather than claiming it as an automatic pass.

**Next:** this closes the "intro" arc the user asked for — title through first quest-hook confirmation is now a real authored sequence, testable end to end. Still waiting on Nick's V2 approval before NPC walk-not-teleport or further content depth (per CHECKIN-031/032).

---

### CHECKIN-033 — 2026-07-07

**Type:** Docs/tooling — D&D 5e rules & tone authenticity subagents + first review pass (no gameplay change)  
**Agent:** Cursor

**Why:** Nick wants ongoing design/implementation work checked against real D&D 5e rules and DM conventions so the reskin (frog/toad/turtle/vole instead of human fantasy races) stays "true to heart" D&D, not just d20-flavored.

**Added two new subagents** at `~/.claude/agents/game-dev/`, matching the existing Game Designer / Narrative Designer / Level Designer frontmatter convention exactly (`model`/`name`/`description`/`color`/`emoji`/`vibe`/`tools`, no invented format):
- **`dnd-rules-referee.md`** ("D&D Rules Referee") — mechanical SRD 5.1/5.2 accuracy: ability modifiers, proficiency-by-level, the DC ladder, advantage/disadvantage, attack rolls vs saves vs checks, real 5e condition definitions, initiative, death saves, rests. Lists exact Everden file paths (`CombatManager.ts`, `SkillCheckResolver.ts`, `DiceRoller.ts`, `species.json`, `abilities.json`) and what "true to D&D" looks like in each.
- **`dnd-game-master.md`** ("D&D Game Master") — tabletop DM tone/pacing: fail-forward design, meaningful-choice contrast, species-approach agency, encounter fairness, session pacing for a 20–40 min slice, the Nanabozho ingenuity lens. Explicitly built on top of Everden's own existing `docs/design/PLAYER_AGENCY.md` doctrine rather than a generic rubric.

Split into two agents (mechanics vs. tone) deliberately, mirroring how Game Designer/Narrative Designer/Level Designer already split by concern in this project's agent roster.

**First review pass** — `docs/design/DND_RULES_AUTHENTICITY.md` — used the new agents' own criteria against the current combat/skill-check system. Headline findings: ability-modifier math, advantage/disadvantage (including cancellation), attack-roll crit/fumble, once-per-encounter initiative, and the existing dialogue fail-forward branches (`downstream_fail`/`charter_fail`/`toll_fail`) are all genuinely RAW-faithful — this isn't just a d20 costume on a different system. Real findings: (1) `SkillCheckResolver.roll()` and `attemptDiplomacy()` apply the attack-roll nat-1/nat-20 auto-fail/succeed rule to what are mechanically ability checks (not RAW, and inconsistent with `flee()`/the two WIS-save abilities in the same codebase, which use a flat DC compare), (2) critical-hit damage doubling (`damage *= 2`) doubles the STR modifier and item bonus damage along with the dice — RAW only doubles the dice, (3) `docs/systems/COMBAT.md` calls `flee` a "contested DEX check" but the code has no enemy roll at all, (4) to-hit is universally DEX-based while damage is universally STR-based regardless of species/weapon flavor, which quietly disadvantages the tank species' accuracy, (5) the `poisoned` condition is an unlabeled lightweight version of the real 5e condition. None of these block anything currently shipped; they're flagged as decisions to make explicit, not bugs found to break something live.

**Not gameplay work** — no files under `src/`, `public/data/`, `index.html`, or `src/styles/` were touched, to avoid conflicting with the separate in-progress intro-arc background session. **Systems and Experience % are unchanged** — this is a documentation/process deliverable, not a code, content, or visual change, per this repo's honesty doctrine.

**Verification:** no code changed, so `npm test`/`typecheck`/`build` weren't required for this session's changes; not run.

**Next:** if picked up, the three suggested follow-ups in `DND_RULES_AUTHENTICITY.md` are: decide and document the checks/saves nat-1/nat-20 policy, fix the crit-damage-doubling bug with a regression test, and add a "Deliberate Simplifications" section to `docs/systems/COMBAT.md`.

---

### CHECKIN-032 — 2026-07-07

**Type:** Systems-track parallel work while Nick's V2 eye test (CHECKIN-031) is pending — closes the one documented gap from AR-014/CHECKIN-030  
**Agent:** Cursor

**Bug:** `CombatManager`'s enemy-turn delay (`beginTurn` → `runEnemyTurn`) used a raw `setTimeout(..., 500)`. When `DevMenu` opens and calls `GameLoop.stop()` to pause the sim, that raw wall-clock timer keeps running anyway and fires the enemy's turn mid-pause — the one known limitation called out (but not fixed) when dev-menu pausing was added in CHECKIN-030.

**Root cause:** `CombatManager` was never registered as an `IGameModule` with `GameLoop`, so it had no `update(dt)` hook to gate on — the only tool available at the time was a real-time timer, which by definition can't respect a pause.

**Fix:** `CombatManager` now implements `IGameModule` (`init`/`update`/`dispose`) and is registered via `loop.addModule(this.combatManager)` in `GameBootstrap`, same pattern as `WorldClock`. The enemy-turn delay is now a `pendingEnemyTurn: { actorId, remaining }` counted down inside `update(dt)` instead of `setTimeout` — when `GameLoop.stop()` freezes the RAF loop, nothing calls `update()`, so the enemy turn freezes right along with everything else, exactly like world time and NPC schedules already do.

**Tests:** rewrote the 6 existing `CombatManager.test.ts` cases that used `vi.advanceTimersByTime(600)` to drive `combat.update(0.6)` instead (the fake-timer trick no longer applies since nothing schedules real timers). Added a new regression test that seeds heavily-skewed initiative so the enemy always goes first, advances 5 real seconds of fake wall-clock time with zero `update()` calls and asserts the enemy turn does *not* fire, then confirms it does fire once `update(dt)` actually accumulates 0.6s — directly proving the pause-safety property the bug report needed.

**Verified:** 106 unit tests (+1) green across 10 consecutive runs (checked for initiative/dice flakiness), typecheck clean, build clean, 8/8 Playwright e2e green including the real-browser combat encounter test (now genuinely paced by `requestAnimationFrame`, ~18s wall time instead of an instant fake-timer skip — this is expected, not a regression).

**Deployed:** redeployed to production at https://everden-chi.vercel.app.

**Not gated by Nick's eye test** — no visual/composition change, pure combat-logic correctness fix. Experience % unaffected either way.

**Next:** still waiting on Nick's V2 approval before touching Checkpoint 4 (NPC walk-not-teleport) or Checkpoint 5 (resume content depth).

---

### CHECKIN-031 — 2026-07-07

**Type:** "Nail Core Loop Basics" plan, Checkpoints 1+2 — Causeway hub life + full nav sweep + backdrop-crop bug (follows CHECKIN-030)  
**Agent:** Cursor

**Checkpoint 1 — Causeway hub:** the hub had `"npcs": []`, `"objects": []` — the only district with zero placed content, confirmed live before starting. Added `causeway_waystone` and `causeway_lantern` as `examine` objects, each with a new procedural billboard prop (`src/presentation/PropSprites.ts` — pixel-art waystone/lantern drawn on canvas, billboarded like character sprites) since the hub's backdrop plate has no landmarks of its own to click. Added `fennick_farrow`, a vole peddler NPC with a 24/7 hub-anchored schedule and a full dialogue tree (`fennick_intro`, with a vole-exclusive line). Re-verified with `getScreenLayout()` — no overlap, prompts hidden until in-radius.

**Checkpoint 2 — full nav sweep surfaced a real bug, not just a content gap:** walked the whole loop (Causeway ↔ each of the 4 districts). Croakend's first screenshot showed a flat repeating tile floor with zero buildings — but `croakend.webp` is a fully painted mud-hut courtyard with buildings on all sides (confirmed by opening the raw asset). Traced it to `SceneComposition.getViewExtents()`: it computed the camera's visible height as `CAMERA_FRUSTUM_HALF_HEIGHT * 2` (22), but `IsometricCamera` already uses that same constant as the camera's *full* on-screen span (`top`/`bottom` = ±`frustumSize/2`, visible height = `frustumSize` = 11). The extra `* 2` quadrupled every backdrop plane's area, so the camera only ever showed a tight zoomed-in crop of the exact center of each district's art — every building, lantern, and stall painted at the edges was scaled off-frame. **This is very likely the real explanation for "the world looks empty" across several sessions of backdrop regenerations that never actually fixed the underlying frame math.**

**Fix:** one line (`getViewExtents` now uses `CAMERA_FRUSTUM_HALF_HEIGHT` directly, not `*2`), with a comment explaining the misleading constant name. Verified live on all 5 districts — full painted scenes now render: Causeway's crates/lanterns/reeds/lily-pond edges, Croakend's ring of mud huts + dock, Lilymarket's market stalls with awnings, Mudwall's domed stone temples, Ferryman's Rest's hut/jetty/barrels. Screenshots in `docs/playtests/screenshots/AR_{causeway_v3,croakend_v2,lilymarket_v2,mudwall_v2,ferrymans_rest_v2}.png`.

**Side effect fixed:** the wider correct view revealed 3 NPC pairs that read as visually close now that they're not hidden by the crop — Lilymarket's 6 NPCs and Mudwall's `tor_stoneback`/`kess_ridge`. Respread using `projectToScreen` math: Lilymarket's worst pair went from ~107-165px to ~145px screen separation (zigzag layout across the full walkable width), Mudwall's pair went from ~112px to ~147px. Not perfect (6 NPCs in a 2.3-unit-deep district has real limits) but meaningfully better.

**Tests:** 2 new regression tests in `DistrictBackdrop.test.ts` — `getViewExtents` height must equal `CAMERA_FRUSTUM_HALF_HEIGHT` exactly (locks the *2 bug from recurring), and `getBackdropSize` width must stay within the intentional 1.06x overscan margin instead of ballooning back to ~2x.

**Verified:** 105 unit tests (+2) + 8/8 Playwright e2e + typecheck + build all green. Full 5-district round trip confirmed via `getState().sceneId` at every hop, not just visually. Ferryman's Rest night-only NPCs confirmed correctly absent at hour 12 and present at hour 20 (schedule working as designed, not a bug).

**Experience % unchanged** — this is a real, verified composition fix but the doctrine's Nick eye test is still the gate, and this is exactly the kind of visual change that needs a real-display confirmation, not another agent's word for it. See AR-015 for the full write-up.

**Deployed:** redeployed to production, confirmed live via a real browser hit against https://everden-chi.vercel.app (not just localhost) — Checkpoint 3's Nick ask points at a real link, not screenshots alone.

**Next:** Nick's yes/no on the deployed build is the actual next gate — Checkpoint 4 (NPC walk-not-teleport) and Checkpoint 5 (resume content depth) are both explicitly gated on his approval per the plan's own flowchart. Not starting either speculatively.

---

### CHECKIN-030 — 2026-07-07

**Type:** Core-loop bug fixes from Nick's live playtest feedback (follows CHECKIN-029)  
**Agent:** Cursor

**Nick reported (verbatim themes):** backdrops better; NPCs still moving/clipping too much; sprite/NPC logic "kind of sucks still"; click-to-move good but `[E]` shows constantly even far from anything; random combat appeared and vanished before he could react; dev menu blocks things in the background and doesn't pause the sim; focus on the initial world/navigation before questing.

**Root causes found and fixed (all verified live in-browser, not just read from code):**
1. Interaction radii (2.0–3.0 world units) covered almost the entire depth of these ~3-unit-deep districts, and every spawn point sat almost on top of its own return exit. Shrunk `objects.json` radii to 1.0–1.5, NPC default 1.8→1.1, moved all 4 leaf-district spawns clear, exit radii→0.8. Verified: fresh spawn in all 4 districts shows zero live interaction prompt.
2. `blackfen_poachers` combat started instantly on interact with no confirmation. Added `UIManager.showConfirm()` — "Fight" / "Back away" now gates every `type: 'combat'` trigger. Also gated `PlayerController`'s `[E]` handler behind `interactionLocked` so mashing E can't queue a second trigger while a panel is already open. Verified both branches live (Fight → `combatActive: true`; Back away → stays `false`).
3. NPC "clipping" was real screen-space overlap, not just the clock. Added `SceneManager.projectToScreen`/`getActorWorldPosition` + `window.__everden.getScreenLayout()`/`projectToScreen()` (real camera-projection math, not eyeballed screenshots) and used it to prove the isometric camera's screen position is linear in `(x−z, x+z)` — Elder Domet and Old Myrtle were ~2.75 world units apart but nearly identical `x−z`, landing fully stacked on screen. Respread Mudwall (4 NPCs) and Lilymarket (6 NPCs) using the real projection math; re-screenshotted, no more stacked figures (2 pairs in the crowded Lilymarket cluster remain "cozy," noted for Nick's eye test). Also slowed `WorldClock` 0.5→0.25 min/real-sec so hourly schedule teleport-pop happens half as often.
4. Dev menu never paused the world. Added `DevMenuActions.onToggle` → `GameLoop.stop()`/`start()` in `GameBootstrap`. Verified: hour frozen while panel open, resumes on close. Known residual gap (documented, not silently dropped): combat's enemy-turn `setTimeout` isn't tied to the loop, so it still fires while paused — same as the existing Esc-menu gap.

**New reusable QA tooling** (not throwaway): `getScreenLayout`/`projectToScreen` on `window.__everden` — lets future NPC-placement work verify against the real camera math instead of trusting screenshots (which have had tab-focus staleness artifacts in this environment before, per AR-011).

**Tests added (regression guards, per QA checklist):** `PlayerController.test.ts` (4 — E fires with a target in range, doesn't fire with nothing nearby, ignores E while a dialogue/confirm panel is open, doesn't treat an out-of-radius target as nearest) + `UIManager.test.ts` (3 — `showConfirm` renders text and blocks the callback until a button is clicked, confirm button fires the callback, cancel button doesn't).

**Verified:** 98 unit tests (+7) + 8/8 Playwright e2e + typecheck + build green after every change. Live QA-harness verification for all 5 fixes (see AR-014 for full detail) — not claimed from code-reading alone.

**Experience % unchanged** — these are real fixes to the core loop but Nick eye test is still the gate; 2 Lilymarket NPC pairs remain visually "cozy" in a small 6-NPC district and the schedule-teleport-not-walk limitation is unchanged (just less frequent).

**Next:** Nick re-test the initial-world loop specifically — spawn in each district and confirm no stray `[E]`, walk near Blackfen Poachers and confirm the fight now asks first, look at Mudwall/Lilymarket NPC spacing, and confirm F1 dev menu now visibly freezes the clock/NPCs.

---

### CHECKIN-029 — 2026-07-07

**Type:** Playwright E2E + QA harness (follows CHECKIN-028)  
**Agent:** Cursor

**Nick asked:** wire Playwright automation, then provide manual checklist.

**Added**
- `window.__everden` QA API (`?qa=1` auto-boot, `?keep=1` preserves save on reload)
- `e2e/vertical-slice.spec.ts` — 8 mechanical gates (boot, districts, NPC time-skip, examines, Domet duel, Blackfen combat, save, ferry quest)
- `docs/playtests/MANUAL_CHECKLIST.md` — human-only sign-off list
- CI runs `npm run test:e2e` after build

**Verified:** 91 unit tests + 8 e2e tests green; typecheck + build clean.

**Experience % unchanged** — automation covers mechanics only; Nick eye test still pending.

**Next:** Nick runs MANUAL_CHECKLIST.md (~45 min, no dev menu for fresh-player rows).

---

### CHECKIN-028 — 2026-07-07

**Type:** Nick feedback — NPC glitch, dev menu, dialogue dice (follows CHECKIN-027)  
**Agent:** Cursor (Opus) — autonomous pass

**Nick reported:** NPCs glitching on movement; too many NPCs with no logic; needs dev menu to sim faster; dice duel didn't show for dialogue skill checks (Domet WIS check still plain text).

**Root causes found:**
1. **Glitch teleport** — `NPCSimulator` fired `npc:moved` every in-game hour with abstract world coords `(2,0)` etc.; `SceneManager` snapped scene sprites there instantly. Removed that listener.
2. **Too many NPCs** — every scene JSON NPC spawned regardless of schedule. Now `npcPresentInScene()` filters by hour + district before spawn; hour ticks add/remove NPCs in-place.
3. **Dice only in combat** — dialogue skill checks still used inline `skill-roll` text. Now calls `DiceDuelOverlay.show()` with You vs speaker portraits before Continue.
4. **Clustered sprites** — respread coords in croakend/lilymarket/mudwall scene JSON.

**Added:** `DevMenu` (F1 or backtick) — jump districts, +1/+6 hours, quest stage shortcuts, examine-all flag, start Blackfen fight, +50 gold. Enabled by default; `?nodev=1` hides on shared links.

**Verified:** 91 tests + typecheck + build green. Deployed https://everden-chi.vercel.app

**Next:** Nick hard-refresh, press F1, try Mudwall Domet skill check for duel popup, watch NPCs over a few hour skips.

---

### CHECKIN-027 — 2026-07-07

**Type:** Feature — BG3-style dice duel animation (follows CHECKIN-026)  
**Agent:** Cursor (Opus)

**Nick:** "I also want to spend time on making the dice animation for the vs and make it like a duel when the dice are rolled you know like baldurs gate and other games."

**What changed**
- `CombatManager` now emits a structured `combat:dice_duel` event (`DiceDuelEvent`) alongside every existing `combat:log` roll-type entry that's a "roll vs a DC/AC": attacks (`resolveAttack`), `flee`, `attemptDiplomacy`, and the two WIS-save abilities (`fear_croak`, `nibble_distraction`). Carries actor/target (id, name, speciesId, isEnemy), natural roll, modifier, total, dc, and a pre-computed outcome (`crit`/`hit`/`miss`/`fumble`/`success`/`fail`) — no new game-state, purely additive.
- New `src/presentation/DiceDuelOverlay.ts` — self-contained popup mounted by `UIManager`, subscribes to `combat:dice_duel`, queues events (so back-to-back rolls in the same round never overlap mid-animation). Shows attacker-vs-target portraits, a diamond-shaped d20 that cycles random faces for ~700ms before landing on the real roll, then a breakdown line (`natural+mod = total vs dc`) and a color-coded outcome banner (gold crit-glow, green hit/success, gray miss, red fumble/nat-1-glow).
- Named-enemy portraits reuse the existing NPC-art fallback pattern: new `loadEnemyArtCanvas`/`applyEnemyArtToImage` in `CharacterSprites.ts` try `sprites/enemies/{slug}.png` (full name slug, then first word — so "Skadge the Poacher" resolves to the already-shipped `skadge.png`) before falling back to species art. Same never-throws contract as the existing `loadArtCanvas`.
- Solo rolls (flee) render without a target portrait — a shield glyph + "DC 12" stand in for the missing "vs".

**Verified live** (see AR-011): triggered `blackfen_poachers` via a temporary QA hook (reverted). Confirmed real enemy/species art loaded into portraits (not just the procedural fallback — checked via `img.src` data-URL length), breakdown math and outcome-banner CSS class matched the actual roll (`MISS` → `.duel-miss`). The screenshot tool in this environment crops to a smaller sub-viewport than the real `window.innerWidth` (1920×1080 vs. ~819×600 captured) — caught via `getBoundingClientRect()` showing UI elements positioned outside the crop — worked around with `Emulation.setDeviceMetricsOverride({width:960,height:540})` for an honest screenshot instead of trusting a misleadingly-cropped one.

**Tests:** 89 total (+11) — `DiceDuelOverlay.test.ts` (enemy-name-to-asset-slug helper), `CharacterSprites.test.ts` (+4, enemy-art fallback chain), `CombatManager.test.ts` (+4, duel-event emission for attack/flee/diplomacy/save, outcome self-consistency checked against the actual roll math rather than hardcoded numbers since dice are unseeded in most of these). `npm test` run 20x locally to rule out flakiness from the unseeded rolls; one real flake found and fixed (a stale `duels` array capturing an earlier enemy-turn attack event before the ability-under-test ran). `npm run typecheck && npm run build` clean.

**Honesty:** this is a new presentation feature layered onto already-tested combat math — Systems % moves (real code + tests), **Experience % does not** (Nick eye test pending — the popup's pacing/timing/readability on a real display is the open question, not correctness). Diplomacy/save rolls picking a "representative" enemy target for the vs-card (there's no single mechanical target for diplomacy) is a cosmetic choice, not a rules change.

**Next:** Nick eye test — does the ~1.6s-per-roll pacing feel right mid-fight, is the die easy to read, do the portraits look good at 64px. Only combat rolls get the popup today; dialogue skill checks (`SkillCheckResolver`) still use the old plain text line — worth revisiting once the combat version is confirmed to feel good.

---

### CHECKIN-026 — 2026-07-07

**Type:** navPolygon-vs-art recalibration (follows CHECKIN-025)  
**Agent:** Cursor (Opus) — solo autonomous session while Nick away

**Nick:** "i also able to click in the backgrounds places i cant go either... not sure if was fixed with all was just done"

**Root cause:** different bug from CHECKIN-025's aspect-ratio fix (that one's still correct). `mudwall.json` / `ferry_rest.json` / `croakend.json` / `lilymarket.json` had their `navPolygon` / `ground` / NPC / object / exit coordinates authored against the *old* backdrop compositions, and were never recalibrated when those 4 backdrops got regenerated in CHECKIN-025 (new domes, rostrum, cottage, stall positions). Clicking outside `navPolygon` doesn't get rejected — `NavigationController.walkTo` → `nav.nearestWalkable()` snaps to the closest point *on* the polygon boundary — so wherever that boundary visually overlapped a painted structure, clicking there (or even just clicking past it) walked the player onto the structure.

**How verified without guesswork:** `IsometricCamera` is an `OrthographicCamera` whose vertical frustum bounds are fixed and whose horizontal bounds only ever *widen* on wider-aspect screens — so a world point that projects safely inside frame on a narrower test viewport is provably at least as safe on Nick's real (wider) display. Added a temporary `window.__everden.project(x, z)` hook running the real `THREE.Vector3.project(camera)` math, walked each district's `navPolygon` corners down until all 4 landed within a comfortable ±0.5 NDC band (clear of where these compositions put edge structures), then reflowed spawn/exit/npc/object coordinates to fit inside the smaller polygon, keeping existing groupings (Marta still next to her shop, etc). Left `causeway.json` untouched — it's the 4-exit hub and wasn't one of the districts implicated by the report.

**Verified:** 78 unit tests + typecheck + build green (data-only change; `nearestWalkable`/`walkTo` logic itself already covered by `NavMesh.test.ts`). Re-screenshotted all 4 districts post-reflow — NPCs/objects sit on open floor. Deployed https://everden-chi.vercel.app.

**Honesty:** Experience % held — **Nick eye test still pending**. Walkable area shrank ~45-55% in these 4 districts as the safety trade-off; if that reads as too cramped once Nick's on a real screen, the next move is widening the safe zone per-district using his actual screenshots rather than the conservative math proxy used here.

**Next:** Nick eye test on the live build — confirm no more clicking into domes/walls, and whether the tighter walkable areas feel too small.

---

### CHECKIN-025 — 2026-07-07

**Type:** Real bug fixes from Nick's live 16:9 screenshots (follows CHECKIN-024)  
**Agent:** Cursor (Opus) — solo autonomous session while Nick away

**Why:** Nick sent 6 screenshots from his actual browser. Three concrete, reproducible bugs — not more "needs eye-testing," these had certain root causes:

1. **Stray ring showing in a spot never clicked** — the click-to-move marker was never hidden after arrival and got explicitly re-added (already disposed!) into the next scene on every district change, carrying stale world coordinates from the old scene into the new one.
2. **UI text cropped at the top of the browser** — `.interaction-prompt` (`position:absolute; bottom:2rem`, meant to anchor to the viewport) was nested inside `.hud` (also `position:absolute`), so its `bottom` offset resolved against the ~40px hud box instead of the screen, pushing it above the visible page.
3. **NPCs clustered in a mostly-empty district, not "doing anything"** — the real bug behind AR-008's diagnosis: the image generator does not honor a requested aspect ratio. Every "16:9" backdrop (including the two just regenerated in CHECKIN-024) actually came back 1536×1024 (3:2). `SceneComposition.getBackdropSize` was hardcoding `16/9` as the art's aspect, so the backdrop plane was shaped wrong and the real texture got stretched **and** over-cropped — chopping off Mudwall's rostrum/domes and Ferryman's cottage almost entirely.

**Changed**
- `SceneManager`: `debugMarker` is nulled (not re-added) on scene clear; new `hideClickMarker()` called on arrival and on any entity pick
- `UIManager`: `prompt` mounted directly on `#ui-root` instead of nested in `.hud`
- `SceneComposition.getBackdropSize` now takes the real `imageAspect` as a parameter instead of a hardcoded constant; `SceneLoader.addBackdrop` re-measures `tex.image.width/height` once loaded and rebuilds the plane geometry to match — self-correcting regardless of what the art pipeline actually outputs
- Regenerated `mudwall.webp`, `ferrymans_rest.webp`, `lilymarket.webp` with their landmarks (rostrum, cottage, stalls) pulled away from the frame edges so the unavoidable ~16% cover-fit crop (3:2 art on a 16:9 screen) doesn't cut them off
- Spread NPC/object coordinates in `mudwall.json`/`ferry_rest.json`/`croakend.json` across much more of each district's walkable width, positioned near a thematically-matching landmark where one exists (Council Speaker near the rostrum, Old Myrtle near a dome per her bio, potion seller by her own shop, Ferry Operator near the dock)
- Added 2 regression tests in `DistrictBackdrop.test.ts` for the aspect bug

**Verified:** 78 unit tests + typecheck + build green. Live scene-graph inspection (not just screenshots) confirms: marker doesn't survive a scene change; backdrop plane aspect now exactly matches the real texture aspect (1.5 = 1.5) for all 5 districts. Deployed https://everden-chi.vercel.app.

**Honesty:** Experience % held — **Nick eye test still pending**. The automation browser tooling couldn't reliably screenshot a clean full 1280×720 frame even after forcing the viewport, so final confirmation that domes/cottage/stalls are now fully in-frame is Nick's screenshots, not mine.

**Next:** Nick eye test on the live build; if any district still looks off, it's likely the remaining ~16% top/bottom crop inherent to putting 3:2 art on a 16:9 screen — worth deciding then whether to switch to contain-fit + matched background color instead of chasing exact-fill crops forever.

---

### CHECKIN-024 — 2026-07-07

**Type:** Backdrop framing + two new plates (follows CHECKIN-023, closes AR-007 gaps)  
**Agent:** Cursor (Opus) — solo autonomous session while Nick away

**Why:** AR-007 flagged two gaps — `causeway.json` reused `lilymarket.webp`, and Croakend read "plain." Investigated both.

**Root cause of "plain":** the fixed per-district camera cover-fits each backdrop to a **16:9** frustum, but all backdrops are **3:2 (1280×854)**, so on a 16:9 display the left/right edge scenery crops and you see mostly the empty central floor. Croakend was worst because its detail is all at the edges (and the night art went near-black there). The Croakend *art* was actually fine — the framing was eating it.

**Changed**
- `causeway.webp` — new distinct plate (wooden boardwalk over marsh water, reeds/lanterns/lily pads), `causeway.json` rewired off `lilymarket.webp`
- `croakend.webp` — regenerated brighter/warmer so the clay huts read
- Both generated at **native 16:9** (the aspect the code frames for → no crop on a 16:9 display)
- Docs: ASSET_SHEET framing note + location table, AR-008 logged

**Verified:** 76 unit tests + typecheck + build green. Causeway verified rendering in-game (HUD + floor). Full-frame check of the 16:9 plates blocked by the non-16:9 Cursor webview (crops edges) + `preserveDrawingBuffer:false` capture lag — needs a real 16:9 display. Deployed https://everden-chi.vercel.app.

**Honesty:** Experience % held — **Nick eye test still pending** and is now the real gate for the framing. Lilymarket/Mudwall/Ferry are still 3:2 and will crop their edges on wide monitors until re-genned at 16:9 (or backdrop sizing switches to contain-fit).

**Next (with Nick):** eye-test the two new 16:9 plates on a 16:9 screen, then either re-gen the other 3 at 16:9 or switch to contain-fit + matched bg color so nothing ever crops.

---

### CHECKIN-023 — 2026-07-07

**Type:** Visual cohesion pass — empty-stage backdrops + crisp sprites (follows CHECKIN-022)  
**Agent:** Cursor (Opus art/render; Composer for JSON/docs/tests)

**Root cause (from screenshot):** backdrops were *finished* iso paintings with baked-in crowds; big soft billboards pasted on top at mismatched scale = "layers on layers." Asset problem first, compositing second.

**Changed**
- Regenerated 5 district backdrops as **empty iso stages** (no characters/text, floor fills frame) + 5 species anchors + 15 NPCs + 2 enemies as crisp pixel sprites on flat `#1a3c34` bg for clean chroma
- `SceneComposition.ts`: cover-fit backdrop sizing (keeps 16:9, no stretch), `getBackdropQuaternion` camera-facing plane, killed brown wedge
- `SceneManager` + `GameBootstrap`: **fixed per-district camera** (`lockCameraTo`) — whole stage frames on one screen instead of chasing the player off the art
- `CharacterSprites`: `CHARACTER_MESH_SIZE` 2.2→3.0, size-scaled feet-anchored shadows, tighter chroma for flat bg
- Composer: scene JSON navPolygon/NPC slots aligned to painted floors; ASSET_SHEET/VISUAL_DIRECTION docs; sizing/nav regression tests

**Verified:** 76 unit tests + typecheck + build green. **AR-007** — all 5 districts screenshotted (fresh save, frog); sprites now stand *in* the scene. Deployed https://everden-chi.vercel.app.

**Honesty:** Experience % held — this is a scout/agent PASS, **Nick eye test still pending** per gameplay-guards. Croakend stage art is plainer than the rest; `causeway.json` still reuses `lilymarket.webp` (both docks). This is the 2.5D painted-stage + pixel-sprite look, not mesh-built 3D.

**Next:** Nick eye test on live build; optional distinct causeway plate + richer Croakend stage.

---

### CHECKIN-019 — 2026-07-07

**Type:** Gated Master Build — docs + V1 implementation + scout AR-002  
**Agent:** Cursor

**Docs:** `MASTER_BUILD_PLAN.md`, `GATE_MATRIX.md`, PROGRESS/ALPHA/PLAYTEST/README reconciled

**V1 code**
- SceneLoader: backdrop aligned to ground, district tints, visible exit rings + labels
- PointerSystem: prefer NPC picks over object pickers
- SceneManager: larger NPC pick colliders; lilymarket spawn/nav fix
- UIManager: "Click or [E]" on exits

**Agent runs:** AR-002 PASS (G4 Pip dialogue verified); AR-003/004 BORDERLINE; AR-005 partial; AR-006 deferred to T8

**Next:** Nick eye test Lilymarket; human T8 sessions

### CHECKIN-020 — 2026-07-07

**Type:** Free movement pass (NavMesh + NavigationController)  
**Agent:** Cursor

**Changed**
- NavMesh: direct line-of-sight walk when path stays inside polygon (no grid stepping on open ground)
- Finer A* grid (0.18m) + string-pull only when corners block a straight line
- NavigationController: runtime path shortcutting toward next hop or final click target

**Tests:** 71 green (NavMesh direct-line + concave L-shape regression)

**Next:** Nick playtest feel; Lilymarket eye test

### CHECKIN-021 — 2026-07-07

**Type:** Visual composition + free movement (root cause fix)  
**Agent:** Cursor

**Root cause:** Walk area was a tiny visible brown 3D slab (4.4×9m); clicks only registered on that mesh. Free-path NavMesh changes from CHECKIN-020 never felt different on the live site (not deployed) and couldn't help within a postage-stamp floor.

**Changed**
- Removed visible brown walk slab — backdrop art is the floor
- Expanded nav polygons to ~17×6 world units (full camera frustum) on all 5 scenes
- Causeway exits spread left/right/back instead of clustered on slab
- PointerSystem: click anywhere → project to y=0 ground plane; snap to nearest walkable
- SceneLoader: invisible pick floor sized to nav bounds; backdrop centered on play area
- Deployed to production

**Next:** Nick hard-refresh + feel test; still not true "walk inside art" (2.5D backdrop, not mesh terrain)

### CHECKIN-022 — 2026-07-07

**Type:** Visual compositing pass (layers / cut-off / blend)  
**Agent:** Cursor

**Root cause:** Horizontal water plane read as grey diamond slab in iso view; backdrop too small + heavy fog clipped sprites; chroma key ate sprite highlights; NPCs stacked; no ground shadows.

**Changed**
- Removed water base plane (diamond slab)
- `SceneComposition.ts`: frustum-sized backdrop, ground haze, bottom fade into marsh fog
- Character ground shadows + improved 4-corner chroma key with soft fringe
- Fog pushed back (fog weather was clipping heads at 12–30u)
- Camera frustum +0.5u headroom; depth sort uses spec `z*1000+x`
- Lilymarket NPCs spread across full width; subtler exit markers

**Next:** Nick screenshot after hard refresh; T6b hand-drawn sprites with real alpha still the real fix

---

### CHECKIN-018 — 2026-07-07

**Type:** Visual QA agent stack + honesty correction  
**Agent:** Cursor

**Added**
- `docs/systems/VISUAL_QA_AGENTS.md` — scout + 4 persona agents, rubrics, routing
- `.cursor/rules/everden-visual-gate.mdc` — browser gates before Experience %
- `.cursor/skills/everden-playtest/SKILL.md` — how agents play, not just test
- `docs/playtests/AGENT_RUNS.md` — AR-001 logged (scout FAIL)

**Honesty**
- Rolled Experience **55% → 35%** — prior bump was test-driven, not play-verified
- AR-001: click-move PASS, Croakend transition PASS, backdrop/slab FAIL, Lilymarket/Pip not E2E, exits invisible

**Next:** Fix visual blockers → re-run scout → Nick eye test

---

### CHECKIN-017 — 2026-07-07

**Type:** BG3 engine rebuild R1–R6 complete  
**Agent:** Cursor

**Engine (new)**
- `PointerSystem` — raycast ground/entity picks + unit tests
- `SceneKernel` — background/ground/actors/foreground layers
- `NavMesh` + `NavigationController` — polygon A*, click-to-move, combat/dialogue lock
- `SceneLoader` + `public/data/scenes/*.json` — causeway hub, lilymarket, croakend, mudwall, ferry_rest
- `GameBootstrap` rewritten — scene-scoped NPCs/objects, exit portals, save restores scene id

**Input**
- `PlayerController` — click ground walk, click entity walk-then-interact, E shortcut, cursor states
- Fixed player mesh disposed on first `loadScene` (detach before kernel clear)

**QA**
- `npm run lint && npm test && npm run typecheck && npm run build` — 69 tests green
- Browser: causeway loads with single backdrop + walk slab + player sprite; district HUD updates
- `docs/PLAYTEST.md` updated for click-to-move + district transitions

**Still open**
- Nick eye test on Lilymarket composition (backdrop alignment polish)
- T8 human playtests
- Production redeploy: https://everden-chi.vercel.app (2026-07-07)

---

### CHECKIN-016 — 2026-07-07

**Type:** BG3 engine rebuild — honesty reset + R0  
**Agent:** Cursor

**Why we're restarting presentation**
- Nick screenshot confirmed failure: 6 location `.webp` planes stacked in one void, 16 NPCs piled up, WASD on a tiny slab — not a game
- Prior CHECKIN-015 M1–M9 completion claims **reverted** for Experience track
- **Systems stay ~72%** — quest/combat/dialogue/save/sim are real and kept

**New plan:** R1 pointer → R2 click nav → R3 Lilymarket scene → R4 click-interact → R5 district transitions → R6 QA

---

### CHECKIN-015 — 2026-07-07

**Type:** Master Build Plan M1–M9 agent execution + deploy  
**Agent:** Cursor

**M1 — Lilypond visual rebuild ✅**
- Character scale `2.2`, camera frustum `10.5`, name labels hidden by default (only `interaction:nearby` NPC)
- `DistrictBackdrop.ts` loads `/assets/locations/*.webp` on billboard planes; distance culling (7u) stops backdrop stacking
- `EnvironmentBuilder` — causeway, water UV scroll, low-opacity collision hints, edge reeds
- `public/data/districts.json` + HUD district name; spawn causeway `(0.5, 1.2)` facing Lilymarket
- Browser gate: spawn (no label soup), Lilymarket backdrop + district HUD, Pip dialogue portrait, 63 tests green

**M2 — UI brand pass ✅**
- Fixed undefined `--amber` → `--lantern`; added `--flood`; combat log off default blue

**M3 — Character presentation ✅**
- Scale constants exported; billboard regression tests extended

**M4–M7 — Agent verification ✅**
- Browser: Pip dialogue with portrait, district tracking, interaction prompts
- Combat soft-lock regression (CHECKIN-013) remains green in `CombatManager.test.ts`
- Systems (journal, merchants, save, weather, audio) previously wired — spot-checked in browser

**M8 — Ferry travel ✅**
- `TravelManager` Lilypond ↔ Ferryman's Rest (+1.5h clock), save/load zone, ferry dock interactables

**M9 — Alpha prep ✅ (partial)**
- 63/63 tests, 30-day weather soak, production deploy https://everden-chi.vercel.app

**M10 — BLOCKED on Nick**
- Plan requires 5 **real human** playtests; agents cannot substitute. Protocol: `docs/PLAYTEST.md`

**M11–M12 — Open**
- Hand-drawn art (T6b), composed audio, trailer/press kit still Nick/studio tasks

**Verification:** `npm run lint && npm test && npm run typecheck && npm run build` — all green (63 tests)

---

### CHECKIN-014 — 2026-07-07

**Type:** Master Build Plan — M0 honest progress reset + M1 start  
**Agent:** Cursor

**M0 — Progress honesty**
- Split tracking into **Systems (70%)**, **Experience (25%)**, **Overall (40%)** — stops conflating "tests pass" with "looks like a game"
- T8 playtests **paused** until M1 visual gate; agent browser runs do not count as external playtests
- Added T13–T20 mapped to Master Build milestones M1–M12
- Lowered Phase 3 Presentation from misleading 89% to **35%** until 3D world uses location art

**Why screenshots looked wrong**
- Location art (`public/assets/locations/*.webp`) existed on disk but was **never loaded** by `EnvironmentBuilder.ts`
- Characters were 1×1 unit meshes in a 14-unit camera frustum — tiny
- All 16 NPC name labels rendered at once in a ~5-unit spawn cluster

**M1 in progress this session:** readability + district backdrops (see next CHECKIN when M1 gate passes)

---

### CHECKIN-013 — 2026-07-07

**Type:** Audit / bugfix pass (requested review of CHECKIN-012's work for errors and gaps)  
**Agent:** Cursor

**Critical fix — combat could permanently soft-lock**
- `CombatManager.endTurn()`'s dead-actor skip check was `getCurrentActor()?.hp === 0`, but `getCurrentActor()` already filters to `hp > 0` — so that condition could never be true and the skip loop always stopped after exactly one step. Landing on a dead combatant's turn slot made `beginTurn()` silently return `undefined`: no `combat:turn` event, no enemy turn scheduled, `isPlayerTurn()` stuck `false` forever. Permanent freeze, reload required.
- This is not a new bug — it's been there since combat shipped (CHECKIN-005) and affects the game's *only* encounter, `blackfen_poachers` (3 combatants: player + Skadge + Bulk), any time the non-last enemy in turn order dies first. Caught by a code-reviewer subagent pass, not by the existing suite — every prior `CombatManager.test.ts` scenario used exactly one enemy, so a mid-order death was never exercised.
- Fix: added `isDeadOrMissing()` that looks up the raw combatant by id instead of trusting the already-filtered getter, and a `getTurnOrder()` test hook. New regression test builds a real 3-combatant fight, seeds initiative deterministically, kills the middle-order enemy, and asserts the next actor is the *last* one (not `undefined`, not the dead one). Ran 15x locally to confirm no flakiness.
- Also fixed a related, smaller bug in the same review: `cheek_poultice`'s heal-target filter (`c.team === actor.team || c.team === 'ally'`) would wrongly exclude the actual player if a vole ever fought on the `ally` team instead of `player`. Changed to `c.team !== 'enemy'`, matching how `checkVictory` already groups sides.
- Live-verified in the real browser build (not just unit tests): triggered `blackfen_poachers` directly via a temporary debug hook (removed after), fought it out with a turtle, watched Skadge die mid-fight, confirmed combat kept running (attack buttons, log updates, eventual legitimate "Defeated" screen) instead of freezing — no console errors.
- Documented both the root-cause pattern and the enemy-AI gap (below) in `everden-gameplay-guards.mdc` so this class of bug gets caught by the next reviewer even without a subagent pass.

**Gaps found, not fixed (documented for later, not currently reachable)**
- `runEnemyTurn`'s attack-ability allowlist doesn't recognize vole's abilities (`burrow_hide`/`cheek_poultice`/`nibble_distraction`) — a vole *enemy* would always plain-attack instead of using its kit. No vole enemy exists in `encounters.json` today, so not a live bug, but flagged in the guard rules before someone adds one.

**Smaller fixes / doc hygiene**
- `npm run lint` was broken (`eslint` referenced in `package.json` but never installed — `command not found`, exit 127). Installed `eslint` + `typescript-eslint`, added `eslint.config.js` (flat config), fixed the script, added it to `ci.yml`. Runs clean across all 51 source files.
- `AudioManager`'s "miss" SFX only matched the literal string `"Miss."`, so a critical-fumble miss (different log text) played no sound at all. Now matches `/miss|fumble/i`. Added a regression test for both cases.
- `docs/CHARACTERS.md`, `docs/PLAYTEST.md`, `docs/playtests/SESSION_LOG.md`, `docs/world/species/vole.md`, and `docs/art/ASSET_SHEET.md` all still described vole as unreleased/"not yet in species.json" or listed only 3 species — stale from before CHECKIN-012. Updated all five to reflect vole actually being playable. Added `docs/world/factions/vale_wanderers.md` (existed in data as of CHECKIN-012 but had no faction doc, unlike every other faction).

**Verification**
- `npm run lint && npm test && npm run typecheck && npm run build` — all clean, 57/57 tests (+1 net: +2 new regression tests, `AudioManager.test.ts` count unaffected by the miss/fumble split since it replaced planning, see diff)
- Redeployed to production (`everden-chi.vercel.app`)

**Tests:** 57 total (+2)

---

### CHECKIN-012 — 2026-07-07

**Type:** Feature pass — T12 (Vole species) + T10 (Audio)  
**Agent:** Cursor

**T12 — Vole Folk playable**
- `species.json`: `vole` entry — healer role, low STR/CON, high DEX/WIS/initiative (fits "small, quick, fragile healer" bio), 3 abilities
- `abilities.json` + `CombatManager.useAbility`: 3 new mechanics, not just flavor text —
  - `burrow_hide` — reuses the existing `burrowed` condition (attacks against the actor have disadvantage), same mechanic as toad's `burrow`
  - `cheek_poultice` — heals 1d8+1 HP. Deliberately **ignores** the `targetId` the UI passes (every ability button currently sends the first enemy's id — see `bindCombatActions` in `UIManager.ts`) and instead heals whichever combatant on the actor's own side has the lowest HP%. Documented this trap in the gameplay guard rule so the next heal-type ability doesn't repeat the bug.
  - `nibble_distraction` — WIS save (DC 12) or the target is `stunned`; added a `stunned` check in `beginTurn` (same pattern as the existing `fleeing` skip) so the condition actually costs the target a turn instead of being decorative
  - Added `'heal'` to `AbilityDefinition['type']` (was unused elsewhere in code, safe additive change)
- `npcs.json` + `dialogue.json`: added Sable Meadowrun, a wandering vole healer/trader at Lilymarket, with a vole-exclusive dialogue line (`condition.species: "vole"`) — matches the existing species-flavor-line pattern used for Kess Ridge
- `index.html`: 4th species button ("Vole · Healer") on the title screen; no other UI/main.ts changes needed since species selection was already fully data-driven
- Vole procedural sprite + real AI art already existed from the earlier art pass (T6) — this task only needed to make the species selectable and give it a mechanical identity
- 5 new tests in `CombatManager.test.ts` (heal targeting ignores bad targetId, burrow_hide applies disadvantage, stunned skips a turn) — all deterministic (no reliance on unseeded initiative RNG, fixed a timer-ordering bug in an early draft of these tests where `vi.useFakeTimers()` was installed after the enemy's real `setTimeout` had already been scheduled)

**T10 — Procedural audio pass**
- New `src/presentation/AudioManager.ts` — every sound is synthesized with Web Audio oscillators/gain envelopes (ambient marsh drone pad, dice-roll tick, hit thump, miss whiff, heal chime, dialogue tick, toast blip). Zero audio asset files to source, license, or ship, consistent with the art pipeline's "never break on a missing asset" philosophy (there's simply nothing to be missing).
- `AudioManager.unlock()` is called synchronously inside `GameBootstrap.start()` before its first `await`, so it runs inside the same call stack as the title screen's "Start" click — required by browser autoplay policy, or the `AudioContext` stays permanently suspended.
- `AudioManager.bindEvents()` self-subscribes to `combat:log` (roll/hit/miss/heal sounds, tracking log length so it never replays sounds for lines it already handled), `combat:started` (resets that tracker), `weather:changed` (ambient intensity ramps with rain/fog/clear), and `ui:toast` (added one `eventBus.emit('ui:toast', {})` line to `UIManager.showToast`). No changes needed to `CombatManager` itself.
- HUD mute toggle (`♪ On` / `♪ Off`) wired through `UIManager.bindAudioToggle`, state persisted in `localStorage`
- 7 new tests in `AudioManager.test.ts` — mute persistence across instances, safe no-ops before `unlock()`/while muted, event-driven SFX triggering, and the "don't replay already-handled log lines" guard

**Verification**
- `npm test` — 55/55 passing (+7 audio, +5 vole ability = +12 since CHECKIN-011's 45)
- `npm run typecheck` / `npm run build` — clean
- Live browser check: 4th species button renders correct vole preview, no console errors; mute button toggles with correct visual state; dialogue still works with tick sound wired in; no regressions to existing NPCs/dialogue
- Redeployed to production (`everden-chi.vercel.app`)

**Tests:** 55 total (+12)

---

### CHECKIN-011 — 2026-07-07

**Type:** Critical bugfix — NPCs were nearly invisible in the 3D world  
**Agent:** Cursor

**What happened**
A follow-up browser QA pass on CHECKIN-010 reported "NPCs render as 3D geometric shapes, not pixel-art sprites." Investigation showed that was a misdiagnosis of a much older, more serious bug: `createCharacterMesh` billboarded every character with a bare `mesh.rotation.x = -0.35`, which never accounted for the isometric camera's 45° yaw (`IsometricCamera` sits at a `(10, 12, 10)` offset from its target, not straight down +Z). The result: every character card — player, all 15 NPCs, both enemies — rendered almost perfectly edge-on to the camera, appearing as a barely-visible sliver regardless of whether the texture was procedural or real art. Confirmed first-hand via saved browser screenshots (not just subagent text descriptions) before and after the fix.

**Fix**
- Exported `ISO_CAMERA_OFFSET` from `IsometricCamera.ts` as the single source of truth for the camera's fixed offset (used in both the constructor and `update()`, replacing duplicated literals).
- `CharacterSprites.ts` now computes a static `BILLBOARD_ROTATION` quaternion once, aligning each plane's normal to the camera's horizontal direction (Y-axis-only rotation — matches `docs/art/VISUAL_DIRECTION.md`'s "Y-axis fixed; face camera quadrant" spec) instead of the old arbitrary X tilt. Safe to compute once because the isometric camera translates but never rotates.
- Lifted each character mesh by `size / 2` on Y so it stands on the ground plane instead of being centered through it (half was previously hidden below y=0).
- Added `side: THREE.DoubleSide` to the character material as a defensive measure against winding-order surprises.
- This was a pre-existing bug, not something introduced by the CHECKIN-010 art pass — it affected the procedural placeholder sprites too, for the entire life of the project so far. It just wasn't visually caught before because no one had inspected a real screenshot closely at this camera angle.

**Verification**
- New regression test in `src/tests/CharacterSprites.test.ts`: asserts the mesh's world-space normal dot-products to ~1 against the camera's horizontal direction (fully facing, not edge-on), confirms it stays upright (no Y component on the normal), and confirms the ground-standing Y offset. **45 tests total (+1)**, all green.
- `npm run typecheck` / `npm run build` clean.
- Confirmed via two rounds of live browser screenshots (saved to disk and viewed directly, not just described by a subagent): before the fix, NPCs were invisible slivers next to their name labels; after, small but clearly visible textured character sprites render under each name label.
- Redeployed to production (`everden-chi.vercel.app`).

**Known residual gap**
- Character sprites are still visually small at the default camera zoom (`frustumSize = 14` in `IsometricCamera`) — correct now, but not a close-up "hero" view. Camera framing/zoom tuning is a separate design decision, not filed as a bug here. Worth a look during T8 playtests.
- Fixed 3 of 15 NPC portraits that had baked-in text/signage from the original AI generation pass (Pip Marshwick, Jenna Leapwell, Fern Reedweaver) — regenerated clean, no-text versions referencing the frog species anchor. Re-audited the remaining 12 NPCs + 2 enemies + 5 species sheets by eye; all clean.

**Tests:** 45 total (+1)

---

### CHECKIN-010 — 2026-07-06

**Type:** Interim AI pixel-art pass (T6) + code integration  
**Agent:** Cursor

**Art generated (31 assets + 1 title key art)**
- 5 species anchors + 5 in-game species sprites (frog, toad, turtle, tortoise, vole)
- 15 named NPC portraits + 2 combat enemy portraits, reference-chained to species anchors
- 3 item icons (Reed Hop Charm, Clay Phial, Shell Fragment Amulet)
- 6 world location scenes (Lilymarket, Mudwall, Croakend, Sunken Chapel, Ferryman's Rest, Blackfen Outlet)
- 1 title-screen key art backdrop
- Resized/converted for web: sprites/items stayed PNG at 256×256 (chroma-key transparency), locations/title converted to WebP — cut the pass from ~40MB to ~3MB

**Pipeline**
- `public/assets/{sprites/species,sprites/npcs,sprites/enemies,items,locations}/{id}.{png|webp}` convention
- `docs/art/ASSET_SHEET.md` — full catalog with source data ids and style notes
- `docs/art/reference/{species}_reference.png` — full anchor sheets kept for art direction, not shipped

**Code integration**
- `CharacterSprites.ts`: `loadArtCanvas`/`applyArtToImage`/`applyArtToCanvas` — chroma-keys the plain-background renders, tries named-NPC art then species art then `null`; `createCharacterMesh` renders procedural instantly and swaps the texture in asynchronously on success. Procedural drawer untouched — permanent fallback.
- Dialogue portraits now resolve by `npcId` (threaded `GameBootstrap.openDialogue` → `UIManager.showDialogue`), falling back to species, falling back to procedural.
- Title screen species picker, merchant item icons (hide on 404), and journal entries (`image` field, 2 wired: chapel mural, ferry depth) all try real art with graceful fallback.
- Title screen backdrop uses layered CSS background (gradient + key art) — gradient alone still renders if the image is missing.

**Guardrail**
- `.cursor/rules/everden-art-pipeline.mdc` — asset convention + "fallback must never be deleted" rules
- `src/tests/CharacterSprites.test.ts` (7 tests) — mocks `Image`/canvas context to prove the procedural fallback survives 404s and swaps correctly on success

**Verification**
- `npm test` — 44/44 passing (+7)
- `npm run typecheck` / `npm run build` — clean
- Curl-verified all 25 asset URLs referenced by code/data (species, NPCs, items, locations, title) resolve 200 against the dev server — catches id/path typos that a visual pass alone could miss
- Fixed `deploy:preview` to pass `--prod` — a prior preview-only deploy had left `everden-chi.vercel.app` aliased to a 2-hour-old build; redeployed to production and confirmed the live CSS bundle now contains the art-pass rules (`merchant-item`, `journal-card img`, `title_key_art`)
- An automated in-browser click-through QA pass was attempted via a subagent but stalled/timed out; not blocking given the asset-path + unit-test + live-CSS verification above, but a human playtest pass is still recommended before calling T6 fully verified

**Tests:** 44 total (+7)

---

### CHECKIN-009 — 2026-07-06

**Type:** Deploy + playtest prep  
**Agent:** Cursor

**T9 — Live preview**
- Deployed to Vercel: **https://everden-chi.vercel.app**
- Linked `astral-productions/everden` to GitHub `Phaenex/Everden`
- Fixed `deploy:preview` script (scope + project name)

**T8 — Playtest ready**
- Rewrote `docs/PLAYTEST.md` for current slice (skill checks, side quests, diplomacy, journal)
- Added `docs/playtests/SESSION_LOG.md` template

**Docs**
- **Remaining Work** quick-view table at top of PROGRESS.md
- README checkpoint % updated

---

### CHECKIN-008 — 2026-07-06

**Type:** Player agency / competitive design pass  
**Agent:** Cursor

**Research**
- `docs/design/PLAYER_AGENCY.md` — BG3, tabletop, and Everden differentiators

**Gameplay**
- `SkillCheckResolver` — visible d20 checks in dialogue (Foundry-style roll line in UI)
- Species-exclusive lines on Kess (frog/toad/turtle approaches)
- Skill checks: Domet (WIS Insight), Kess (INT History), Grizz ferry (CHA Persuasion)
- `altText` flag callbacks — Pip remembers council evidence
- Combat diplomacy — Persuade (CHA) / Intimidate (STR) on Blackfen poachers
- Rain gives amphibians advantage on persuade in combat

**Rules**
- Extended `everden-gameplay-guards.mdc` with skill-check, species, diplomacy guards

**Tests:** 37 total (+6)

---

### CHECKIN-007 — 2026-07-06

**Type:** Feature pass (T3 + T5 + T7) + simulation  
**Agent:** Cursor

**T3 — Wrong Label quest**
- Pondwort → examine Marta's label shelf → tell Marta → reassure Pondwort
- Quest-gated dialogue on all three NPCs
- `marta_label_shelf` examine object + journal entry

**T5 — Weather**
- `WeatherSimulator` — daily rolls from `locations.json`, spring rain boost
- `RainVFX` particle overlay, scene lighting shifts, HUD weather icon
- Rain: frogs/toads +15% move speed, others -15%; combat `amphibious_rush` in rain
- 7-day weather soak test

**T7 — Field Journal**
- `journal.json` + `JournalManager` (saveable)
- [J] toggles codex; toasts on new discoveries
- Auto-unlock from examines, quest stages, completions, flags

**T9 — Deploy**
- `npm run deploy:preview` script added (needs Vercel CLI auth)

**Tests:** 31 total (+9)

---

### CHECKIN-006 — 2026-07-06

**Type:** Gap closure + rules  
**Agent:** Cursor

**Fixes**
- `poisoned` / `advantage` / `withdraw` / `burrowed` / `amphibious_rush` affect combat rolls
- `withdraw`, `burrow`, `amphibious_rush` abilities implemented
- `fleeing` enemies skip their turn
- Quest-gated dialogue (`questStage`, `notQuestCompleted`) — Grizz/Jenna ferry lines
- `PlayerProfile` save for species (load restores correct combat sprite/stats)
- World interaction blocked during combat
- Integration test: full main quest examine → council → outcome

**Rules added**
- `.cursor/rules/everden-gameplay-guards.mdc` — anti-patterns for combat/quest/save/dialogue
- `.cursor/rules/everden-qa-checklist.mdc` — mandatory checks before claiming done

**Tests:** 22 total (+4)

---

### CHECKIN-005 — 2026-07-06

**Type:** Review / bugfix pass  
**Agent:** Cursor

**Critical fixes**
- Combat soft-lock: enemies now take turns automatically (attack/abilities)
- Save/load no longer resets main quest to stage 1
- Starter items only granted on new game (not every load)
- Bufotoxin / tongue_lash no longer double-advance turns
- Shell Block now actually reduces incoming damage
- Combat UI no longer flashes player buttons on enemy initiative
- Multi-enemy fights: separate Attack button per enemy

**Quest / dialogue fixes**
- Dialogue actions fire once on node entry (no duplicate `quest_outcome`)
- Ferry quest: objectives complete via dialogue nodes (Jenna toll info, Grizz report line)
- Quest tracker refreshes on load and on quest start

**Tests added:** QuestManager (3), CombatManager enemy turn (1) — **18 total**

**Known gaps (not fixed this pass)**
- ~~poisoned / advantage~~ fixed CHECKIN-006
- ~~Grizz report line always visible~~ fixed CHECKIN-006
- No audio, art, weather VFX, journal

---

### CHECKIN-004 — 2026-07-06

**Type:** Feature pass  
**Agent:** Cursor

- **T1:** Council vote dialogue at rostrum / Elder Domet — 5 branching outcomes with rep, flags, gold
- **T2:** Ferryman's Toll side quest wired (talk objectives on Grizz + Jenna)
- **T4:** Combat panel with Attack, species abilities, Flee — refreshes each player turn
- Fixed `GameBootstrap` interaction wiring, `UIManager` constructor, combat CSS

**Still open:** T3 tonic quest, weather VFX, art, audio, journal, deploy

---

### CHECKIN-003 — 2026-07-06

**Type:** Feature pass  
**Agent:** Cursor

- Added procedural pixel characters (frog/toad/turtle/tortoise)
- Expanded to 15 NPCs with bios, titles, dialogue
- Title screen species picker
- `objects.json` — merchants, examine nodes
- Named combat enemies (Skadge, Bulk)
- `docs/CHARACTERS.md`

**Still open:** side quests, council branching, art, audio, deploy

---

### CHECKIN-002 — 2026-07-06

**Type:** Plan implementation (checkpoint)

- Full web stack: Vite + Three.js + simulation + combat
- World bible phases 0–1
- One quest chain data + 8 NPCs (later expanded to 15)
- Phases 9–12 documentation only

---

### CHECKIN-001 — 2026-07-06

**Type:** Foundation

- GitHub repo, constitution, Nanabozho branding
- Master plan (web pivot)

---

## Next Recommended Steps

1. Run 5 external playtests (T8) — log in `docs/playtests/`; NPCs are now actually visible in the 3D world (CHECKIN-011) and there's a real 4th species + audio (CHECKIN-012), so first impressions should be meaningfully better
2. Travel to Ferryman's Rest (T11) — smallest second-settlement slice
3. Consider a real composed/recorded audio pass later — current one is synthesized SFX, functional but plain
4. Swap in Nick's hand-drawn sketches when ready (T6b) — drop into the same `public/assets/...` paths, zero code changes needed

---

## Progress Bar Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Phase deliverables met |
| 🟡 | Partially implemented |
| ⬜ | Not started or docs only |
| 🔴 | Blocked |

**Update rule:** Any agent that ships work must update this file + append a CHECKIN entry before ending the session.
