# Manual Playtest Checklist (Nick)

**Automated first:** run `npm run test:e2e` — covers boot, districts, NPC time-skip stability, examines/flags, Domet dice duel DOM, Blackfen combat no soft-lock, save round-trip, ferry quest hook.

**You own everything below.** Playwright cannot judge composition, feel, or whether the story landed.

**Build:** `npm run dev` or https://everden-chi.vercel.app  
**Fresh save:** clear `localStorage` key `everden_save_v1`, or use title screen (no F1/dev menu for the fresh-player row)

---

## New-game opening (character creation + intro)

- [ ] **Title menu** — Continue (if save exists) and New game; New game warns before overwriting an existing save
- [ ] **Species step** — five folk (frog / toad / turtle / tortoise / vole); each shows role + flavor blurb from data, not just "Mobile/Tank"
- [ ] **Name step** — enter a name or leave blank → defaults to "Traveler"
- [ ] **Motivation step** — pick one arrival reason (investigator / messenger / neighbor); copy makes sense
- [ ] **Confirm sheet** — read-only STR–CHA with mods, AC, initiative, three abilities; matches the species you picked
- [ ] **Opening beat** — on a fresh save, species + motivation flavored narration (3 lines) plays on Causeway before control; "Continue" on lines 1–2, "Begin" on line 3
- [ ] **Control hint** — right after the beat, toast reads "Click to move · [E] to interact · [J] for journal" and stays up long enough to read
- [ ] **Continue skips wizard + beat** — loading a save goes straight to Causeway, no character creation replay
- [ ] **Pip uses your name** — motivation-specific append line after "Word travels fast on the causeway"

---

## Visual & composition (V1 / V2)

Play on a **real 16:9 display** (not a cropped agent viewport).

- [ ] **Causeway** — backdrop fills frame; spawn/exit readable; no giant empty cobblestone dead zone
- [ ] **Lilymarket** — stalls/domes not cropped off top; NPCs on the ground plane, not floating or buried
- [ ] **Croakend** — cottage/readable focal art; NPCs not stacked on each other
- [ ] **Mudwall** — levy/wall art visible; combat trigger area obvious
- [ ] **Ferryman's Rest** — ferry/lamp readable; Grizz placement feels intentional
- [ ] **Sprites** — feet on floor, shadows sensible, no z-fighting through backdrop
- [ ] **UI** — interaction prompt not clipped; dialogue/combat panels fully readable at 1080p
- [ ] **Click ring** — appears on walkable ground only; **no** ring on painted domes/water/walls you can't reach

---

## Feel & navigation

- [ ] **Click-to-move** feels responsive; pathing doesn't zigzag through props
- [ ] **E key** still picks up nearest interactable when standing close
- [ ] Districts feel like **places**, not grey boxes with characters pasted on
- [ ] **Can't walk there** toast only when click is genuinely off-nav — not on obvious paths

---

## NPCs & living world

- [ ] **Schedule logic** — after ~30 in-game minutes (or +6h dev skip), folk who shouldn't be there leave; expected folk appear (e.g. market folk at Lilymarket daytime)
- [ ] **No hour-teleport glitch** — NPCs don't snap/jump every time the clock ticks
- [ ] **Role clarity** — merchant near goods, elder near council/rostrum, ferry hand at rest
- [ ] **Overlap** — no ugly stacks of 3+ NPCs on one tile in normal hours
- [ ] **Vole line** (if playing vole) — Sable Meadowrun at Lilymarket has species-exclusive dialogue

---

## Dice duel pacing (combat + dialogue)

- [ ] **Domet WIS check** — BG3-style duel popup appears (not plain text only); readable d20 + mod + DC
- [ ] **Kess INT check** — same; species-exclusive approach line before/alongside check
- [ ] **Combat attacks** — duel popup on player and enemy swings; not too slow to tolerate
- [ ] **Outcome banner** — SUCCESS/FAIL/HIT/MISS readable before auto-dismiss

---

## Main quest comprehension (*What the Water Remembers*)

**No dev menu.** New save, frog or your pick.

- [ ] Quest is already active from the opening beat (not from talking to Pip) — HUD quest tracker shows "What the Water Remembers: Examine the flooded cellar in Lilymarket.", not a raw id
- [ ] Find **Pip** — he acknowledges you already heard, doesn't pretend to hand out a fresh quest
- [ ] All **four examines** discoverable without guessing (cellar, levy plans, mural, ferry depth)
- [ ] After evidence, **Domet + Kess** conversations make the levy vs Charter conflict understandable
- [ ] **Council vote** — rostrum/examine opens vote; you understand what each choice means
- [ ] Try **at least 2 endings** — they feel distinct (expose / support / compromise / sell / silence)
- [ ] **Post-session:** you can explain "levy vs Charter" in one sentence without notes

---

## Side quests (no dev shortcuts)

- [ ] **Ferryman's Toll** — Grizz toll gripe → Jenna at Lilymarket → report back to Grizz; stages make sense
- [ ] **Wrong Label** — Pondwort → Marta's shelf examine → Marta → Pondwort; tonic mix-up clear

---

## Combat & agency

- [ ] **Blackfen poachers** — Persuade/Intimidate visible **before** first attack
- [ ] Species **abilities** make sense for your folk (frog leap, turtle shell, toad toxin, vole heal/burrow)
- [ ] **Combat log** matches what happened on screen
- [ ] **Flee** works; enemy turns always resolve — no frozen turn indicator

---

## Systems

- [ ] **[J] Journal** — entries appear after examines and major beats; you opened it voluntarily at least once
- [ ] **Weather** — icon changes; rain adds VFX and you notice move/combat difference on frog/toad
- [ ] **Merchants** — Pip/Marta buy flow works when you have gold
- [ ] **Esc pause → save → reload** — species, scene, quest stage, inventory persist
- [ ] **♪ mute** — toggles audio; preference survives reload

---

## Metrics (ask yourself after ~45 min)

| Metric | Pass? | Notes |
|--------|-------|-------|
| Quest comprehension | | Can explain levy vs Charter |
| Agency | | Named a consequence from council or ferry path |
| Skill-check clarity | | Saw d20 + DC before branch (Domet or Kess) |
| Combat clarity | | Used diplomacy OR can explain dice log |
| Immersion | | Opened journal without being told |

---

## Bug filing

GitHub Issues → label `vertical-slice`. Log session in `docs/playtests/SESSION_LOG.md`.

**P0 = stop ship:** crash, save wipe, combat soft-lock, quest hard-blocked.
