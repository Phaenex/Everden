# Everden — Manual Playtest Checklist (Nick)

**Automated first:** `npm run test:e2e` (8 mechanical gates — boot, districts, NPC skip, examines, Domet duel, Blackfen combat, save, ferry quest)

**Build:** `npm run dev` or https://everden-chi.vercel.app  
**Fresh save:** clear `localStorage` key `everden_save_v1` (no F1/dev menu for fresh-player rows)

Play on a **real 16:9 display**.

---

## New-game opening (intro arc)

- [ ] **Title screen** — premise blurb + per-species flavor line, not just the role word
- [ ] **Opening beat** — 3-line narration on Causeway before you get control (fresh save only)
- [ ] **Control hint toast** — readable, appears right after the beat
- [ ] Reloading a save skips the beat entirely

## Visual & composition

- [ ] **Causeway** — backdrop fills frame; spawn/exit readable; no giant empty dead zone
- [ ] **Lilymarket** — stalls/domes not cropped; NPCs on ground, not floating
- [ ] **Croakend** — cottage/focal art readable; NPCs not stacked
- [ ] **Mudwall** — levy/wall visible; combat area obvious
- [ ] **Ferryman's Rest** — ferry/lamp readable; Grizz placed well
- [ ] **Sprites** — feet on floor, shadows OK, no z-fighting
- [ ] **UI** — prompt/dialogue/combat panels readable at 1080p, not clipped
- [ ] **Click ring** — walkable ground only; not on domes/water/walls

## Feel & navigation

- [ ] Click-to-move responsive; pathing doesn't zigzag through props
- [ ] **E** picks up nearest interactable when close
- [ ] Districts feel like places, not grey boxes
- [ ] "Can't walk there" only on genuinely off-nav clicks

## NPCs & living world

- [ ] Schedule logic after ~30 game minutes (+6h dev skip OK)
- [ ] No hour-teleport glitch
- [ ] Role clarity (merchant at shop, elder at council, etc.)
- [ ] No ugly 3+ NPC stacks
- [ ] **Vole only:** Sable Meadowrun species line at Lilymarket

## Dice duel pacing

- [ ] **Domet WIS** — duel popup; readable d20 + mod + DC
- [ ] **Kess INT** — same; species-exclusive line
- [ ] Combat rolls — popup not too slow
- [ ] Outcome banner (SUCCESS/FAIL/HIT/MISS) readable before dismiss

## Main quest (*What the Water Remembers*) — no dev menu

- [ ] Quest already active from the opening beat — HUD shows the real title/description, not a raw id
- [ ] Find **Pip** — he acknowledges you already heard, doesn't re-grant the quest
- [ ] All **four examines** discoverable (cellar, levy plans, mural, ferry depth)
- [ ] **Domet + Kess** make levy vs Charter understandable
- [ ] **Council vote** — choices make sense
- [ ] Try **2+ endings** — feel distinct
- [ ] Post-session: explain levy vs Charter in one sentence

## Side quests — no dev shortcuts

- [ ] **Ferryman's Toll** — Grizz → Jenna → Grizz
- [ ] **Wrong Label** — Pondwort → Marta's shelf → Marta → Pondwort

## Combat

- [ ] **Blackfen** — Persuade/Intimidate before first attack
- [ ] Species abilities make sense for your folk
- [ ] Combat log matches what happened
- [ ] Flee works; enemy turns always resolve

## Systems

- [ ] **[J] Journal** — entries unlock; you opened it voluntarily once
- [ ] **Weather** — icon changes; rain VFX; frog/toad move buff noticeable
- [ ] **Merchants** — Pip/Marta buy works with gold
- [ ] **Esc pause → save → reload** — species, scene, quest, inventory persist
- [ ] **♪ mute** — toggles audio; survives reload

## Post-session metrics (~45 min)

| Metric | Pass? | Notes |
|--------|-------|-------|
| Quest comprehension | | Explain levy vs Charter |
| Agency | | Named a choice consequence |
| Skill-check clarity | | Saw d20 + DC (Domet or Kess) |
| Combat clarity | | Diplomacy OR can explain dice log |
| Immersion | | Opened journal without being told |

## Bugs

GitHub Issues → label `vertical-slice`. Log in `docs/playtests/SESSION_LOG.md`.

**P0:** crash, save wipe, combat soft-lock, quest hard-blocked.
