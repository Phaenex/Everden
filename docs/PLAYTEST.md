# Vertical Slice Playtest Protocol

**Build:** `npm run dev` · preview URL in [PROGRESS.md](PROGRESS.md) after T9 deploy  
**Fresh save:** clear `localStorage` key `everden_save_v1` (or use title → New Game)

## Agent mapping (automated pre-check — not T8)

| PLAYTEST rows | Tool | Phase |
|---------------|------|-------|
| Mechanical (save, combat soft-lock, duel DOM, quest flags, districts) | `npm run test:e2e` | V4 |
| 1–6 | everden-visual-scout | V1 |
| 7–12 | everden-quest-runner | V4 |
| 13–16 | everden-combat-tester | V4 |
| 22 | everden-district-explorer | V3 |
| Visual/feel/narrative | [MANUAL_CHECKLIST.md](playtests/MANUAL_CHECKLIST.md) | V5 (T8) |
| All sign-off | Humans only | V5 (T8) |

See [playtests/GATE_MATRIX.md](playtests/GATE_MATRIX.md) and [systems/VISUAL_QA_AGENTS.md](systems/VISUAL_QA_AGENTS.md).

---

## Session checklist (~35 min)

### Boot & movement
1. [ ] Title screen — Nanabozho credit; **Continue** or **New game** (overwrite confirm if save exists)
2. [ ] Character wizard (new game only) — species (5 folk incl. tortoise) → name → motivation → confirm stat sheet → Enter
3. [ ] Opening narration beat on Causeway — species + motivation flavored (3 lines, "Continue"/"Begin"); skipped on Continue/load
4. [ ] First-time control hint toast after the beat ("Click to move · [E] to interact · [J] for journal")
5. [ ] **Click-to-move** on causeway — crosshair cursor, debug ring on ground click; **E** still works for nearest interact
6. [ ] HUD shows time, weather icon, district name, mute toggle, quest tracker (real quest title + stage description, not raw ids)
7. [ ] Walk to **Enter Lilymarket** exit → loads Lilymarket scene (one backdrop, ≤6 NPCs)

### Main quest — *What the Water Remembers*
7. [ ] Quest is already active from the opening beat (auto-granted on new game, not on talking to Pip). **Click Pip** (walk-then-talk) — he acknowledges you already heard, doesn't re-grant anything
8. [ ] Examine **flooded cellar**, **levy plans**, **chapel mural**, **ferry depth marks** — stages advance (may require district transitions via causeway exits)
9. [ ] Talk to **Domet** (Mudwall) — WIS Insight skill check visible (d20 line in dialogue)
10. [ ] Talk to **Kess** (Mudwall) — species-exclusive line + INT History check on Charter line
11. [ ] Council vote at rostrum — **5 distinct outcomes** (expose / support / compromise / sell / silence)

### Side quests
12. [ ] **Ferryman's Toll** — Grizz (Ferryman's Rest) → Jenna (Lilymarket) → Grizz
13. [ ] **Wrong Label** — Pondwort (Croakend) → Marta's label shelf → Marta → Pondwort

### Combat & agency
14. [ ] **Blackfen poachers** (Mudwall) — Persuade / Intimidate buttons before attacking
15. [ ] Combat log shows dice; species abilities work (leap, shell, toxin, or vole's burrow/heal/stun kit)
16. [ ] Flee works; enemy turns resolve without soft-lock

### Systems
17. [ ] **[J] Journal** — entries unlock from examines and quest beats
18. [ ] Weather changes (wait in-game or advance time) — rain VFX, move speed shift
19. [ ] Merchants (Pip, Marta) — buy/sell if you have gold
20. [ ] **Esc** pause · save · reload — quest stage, species, scene, inventory persist
21. [ ] HUD **♪** button mutes/unmutes ambient + SFX, persists across reload

### Living world
22. [ ] District transitions: Causeway ↔ Lilymarket ↔ Croakend ↔ Mudwall ↔ Ferryman's Rest (exit portals, no teleport hack)
23. [ ] If you picked vole, find **Sable Meadowrun** at Lilymarket — check for the vole-only dialogue line

---

## Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Quest comprehension | Player explains levy vs Charter | Ask after session |
| Agency | Player names a choice consequence | Council or ferry path |
| Skill-check clarity | Player saw d20 + DC before branch | Domet or Kess |
| Combat clarity | Player used diplomacy OR explains dice log | Blackfen |
| Immersion | Player opened journal voluntarily | [J] |

---

## Bug filing

GitHub Issues → label `vertical-slice`. Copy steps from [playtests/SESSION_LOG.md](playtests/SESSION_LOG.md).

---

## Definition of done (Phase 8 gate)

- [ ] 5 external sessions logged in `docs/playtests/`
- [ ] No P0 bugs open (crash, soft-lock, save wipe)
- [ ] Main quest completable without dev console
- [ ] All checklist rows pass on at least 3/5 sessions

See [PROGRESS.md](PROGRESS.md) for overall %.
