# D&D Rules & Lore Authenticity Review

> First review pass using the new **D&D Rules Referee** (`~/.claude/agents/game-dev/dnd-rules-referee.md`) and **D&D Game Master** (`~/.claude/agents/game-dev/dnd-game-master.md`) agent criteria, checked against the open SRD 5.1/5.2 ruleset. This is a **docs/tooling deliverable** — no gameplay code changed, no Systems/Experience % moves. See CHECKIN-033 in `docs/PROGRESS.md`.

## Scope

Reviewed against SRD 5.1/5.2 RAW (rules as written):

- `src/gameplay/CombatManager.ts`
- `src/gameplay/SkillCheckResolver.ts`
- `src/gameplay/DiceRoller.ts`
- `src/gameplay/DiceDuelTypes.ts`
- `public/data/species.json`, `public/data/abilities.json`
- `docs/systems/COMBAT.md`, `docs/design/PLAYER_AGENCY.md`
- `docs/narrative/VERTICAL_SLICE.md`, `public/data/dialogue.json` (read-only — owned by other in-progress work, not edited here)

## Summary

| Category | Count | Meaning |
|---|---|---|
| ✅ Faithful to RAW | 7 | Matches real 5e mechanics/math exactly |
| 🟡 Deliberate simplification | 6 | Reasonable for a single-encounter browser slice, fine as-is |
| 🔴 Genuine inconsistency / opportunity | 5 | Worth a deliberate decision or a small fix |

Everden's core resolution engine (`d20 + modifier vs target number`) is genuinely 5e underneath the reskin, not just cosmetically similar. The gaps found are narrow and specific, not systemic.

---

## ✅ Faithful to RAW

1. **Ability modifiers.** `statMod()` in `CombatManager.ts` and the inline modifier math in `SkillCheckResolver.roll()` both compute `Math.floor((stat - 10) / 2)` — this is the exact SRD formula, not an approximation. No off-by-one, no rounding-toward-zero bug (which is the single most common implementation mistake — `(stat-10)/2 | 0` truncates toward zero and gets negative modifiers wrong; Everden's `Math.floor` doesn't).
2. **Advantage/disadvantage mechanics.** `DiceRoller.d20()` rolls exactly two d20s and takes the max (advantage) or min (disadvantage) — never more than two dice regardless of how many sources apply.
3. **Advantage/disadvantage cancellation.** `resolveAttack()` correctly cancels an advantage-then-disadvantage combination back to a flat roll (`advantage === 'advantage' ? 'normal' : 'disadvantage'`) instead of letting both apply or stacking a third die. This is a rule most homebrew implementations get wrong; Everden gets it right.
4. **Critical hit / fumble on attack rolls.** `resolveAttack()`'s `const hit = !fumble && (crit || total >= target.ac)` correctly makes a natural 20 always hit and a natural 1 always miss, independent of the total — exactly RAW for attack rolls specifically.
5. **Initiative rolled once per encounter.** `rollInitiative()` is called exactly once in `startEncounter()`, fixing turn order for the whole fight — matches RAW (initiative isn't re-rolled every round).
6. **Fail-forward dialogue design already exists.** Every skill-check dialogue choice in `dialogue.json` (`downstream_win`/`downstream_fail`, `charter_win`/`charter_fail`, `toll_persuade`/`toll_fail`) has a distinct `failNext` node — failing Domet's Insight check still gets you "examine the site yourself," failing Grizz's Persuasion check still starts the ferry quest via Jenna. This is genuine DM-style fail-forward, not a dead-end retry loop, and it's already live in three of Everden's four skill checks. Worth calling out explicitly since it would have been an easy thing to get wrong.
7. **Council vote's five-outcome branch structure.** `docs/narrative/VERTICAL_SLICE.md`'s benefits/suffers table for the council vote (`kess_stopped`/`levy_supported`/`kess_compromise`/`evidence_sold`/`vote_default`) is a strong, concrete example of choices differing in *outcome*, not tone — matches `PLAYER_AGENCY.md` rule 1 and is the right template for future branching content.

---

## 🟡 Deliberate simplifications (reasonable for scope, worth labeling as intentional)

1. **No proficiency-bonus-by-level system.** Species get a flat, non-scaling combat package (`ac`, `initiativeMod`) instead of level + proficiency bonus, because Everden has no character leveling yet. Correct call for current scope — flagged in the new Rules Referee doc so this curve (+2 at 1–4, scaling to +6 at 17–20) is used correctly the moment leveling is added, instead of an ad hoc number.
2. **No death-save system.** `target.hp <= 0` means immediate removal from combat rather than 5e's unconscious + 3-success/3-failure death-save loop. Reasonable for a single-player slice with no ally-revival mechanic — there's currently no reason a downed combatant would ever need to come back.
3. **No short/long rest or per-ability resource pools.** Abilities are limited only by "one thing per turn," not a daily/per-rest use count. Fine while no ability has a "once per day" style restriction; flagged for revisit the moment one does.
4. **`poisoned` is a lightweight, one-shot version of the real condition.** RAW poisoned is disadvantage on attack rolls *and* ability checks, persisting until cured. Everden's version is a flat −2 to the attacker's *next* attack roll only, then it clears itself. A fine simplification for a project without a "cure poison" mechanic — but nothing in code comments or docs currently says "this is a simplified poisoned, not the real condition," so a future reader could reasonably assume it's RAW-accurate when it isn't. Recommend a one-line comment near the `poisoned` handling in `resolveAttack()`.
5. **No separate bonus-action slot.** `attack()` and `useAbility()` both unconditionally call `endTurn()`, so there's no way to use a movement-flavored ability (`leap`) and still attack the same turn, even though the ability's own description ("reposition up to 3 tiles") reads like a 5e bonus action or free movement, not a full action. Reasonable simplification for a single-action-per-turn browser combat loop, but worth naming explicitly since it does cost some tactical depth a real D&D turn would have.
6. **Intimidate keyed to STR instead of CHA.** RAW Intimidation is a Charisma skill. Everden's `attemptDiplomacy('intimidate', ...)` uses the actor's STR modifier instead. This reads as a deliberate, well-motivated reskin choice consistent with the project's own species-biology design philosophy (a turtle's intimidation is physical bulk, not social presence) rather than an error — but it's worth stating explicitly as an intentional departure so it doesn't get "fixed" back to CHA by someone assuming it's a bug.

---

## 🔴 Genuine inconsistencies / opportunities

1. **The attack-roll crit/fumble rule (auto-succeed on nat 20, auto-fail on nat 1) is applied to non-attack rolls — and inconsistently even within Everden's own code.** RAW: only attack rolls (and, separately, death saving throws) get automatic success/failure on a natural 20/1. Ability checks and saving throws use a flat `total >= DC` with no natural-roll exception. Checking Everden's actual rolls:
   - `SkillCheckResolver.roll()` (dialogue skill checks) and `CombatManager.attemptDiplomacy()` **both** use `roll.natural === 20 || (roll.natural !== 1 && total >= dc)` — attack-roll-style auto success/fail applied to what are mechanically ability checks.
   - `CombatManager.flee()` and the two WIS-save abilities (`fear_croak`, `nibble_distraction`) use a **flat** `total >= dc` with no natural-roll exception at all.

   So the same category of roll ("is this a check or a save") is resolved two different ways in the same file, with no comment explaining why. This is worth a deliberate decision, not a silent fix: either (a) adopt the flat-DC rule everywhere for checks/saves/diplomacy/flee to match RAW, or (b) keep the crit-success/fail flavor for checks and saves as an intentional house rule (common at real tables, and arguably fits the "visible dice, crits and fumbles matter" promise in `PLAYER_AGENCY.md`) and apply it consistently to `flee()`/ability saves too. Either is a legitimate call; the current split-the-difference state isn't.

2. **Critical hit damage doubles the entire total, not just the dice.** `resolveAttack()`: `let damage = this.roller.parseAndRoll(damageDice) + Math.max(0, this.statMod(attacker.stats.str)) + extraDamage; if (crit) damage *= 2;`. RAW doubles only the rolled damage dice on a crit (roll them twice, or double the dice count) — the ability modifier and any flat bonus damage are added **once**, never doubled. Today's code doubles the STR modifier and any item `extraDice` bonus along with the dice, which measurably over-rewards crits (e.g. a `tongue_lash` crit with a +2 STR mod deals `2×(1d6) + 4` under current code vs. the RAW-correct `2×(1d6) + 2`). Small numerically, but a clean, mechanical bug worth a one-line fix (`damage = this.roller.parseAndRoll(damageDice) * (crit ? 2 : 1) + statMod + extraDamage`) rather than a design decision.

3. **To-hit is universally DEX-based while damage is universally STR-based, regardless of species or weapon flavor.** RAW ties a given attack to *one* ability score for both the to-hit roll and the damage roll (STR for standard melee, DEX for ranged or finesse weapons) — a character doesn't normally add DEX to hit and STR to damage on the same swing. `resolveAttack()`'s `bonus = dexMod + attacker.initiativeMod` for the to-hit roll, combined with `Math.max(0, this.statMod(attacker.stats.str))` always added to damage, mixes the two conventions on every attack. This has a real, possibly-unintended balance effect: Turtle Folk (DEX 6, mod −2; STR 14, mod +2) are *worse* at landing hits than Frog Folk despite being the "tank," while hitting harder once they connect. That might be a fine, even thematic design choice (slow-but-heavy), but it isn't currently a documented one — worth a deliberate call in `docs/systems/COMBAT.md` either way.

4. **`docs/systems/COMBAT.md` describes `flee` as a "contested DEX check," but the code isn't contested.** `CombatManager.flee()` rolls only the player's `d20 + DEX mod` against a static `DC 12` — there's no enemy roll or enemy DEX involved anywhere in the function. A truly "contested" check in 5e terms would roll for both sides and compare. This is a docs/code mismatch, not a design problem — either fix the doc's wording to "DC 12 DEX check" or make the mechanic genuinely contested (roll the pursuing enemy's DEX too and compare).

5. **`poisoned` and other simplified conditions aren't labeled as simplified anywhere a future contributor would see it before assuming they're RAW.** Related to finding 4 in the simplifications list above, but worth separating out as an actionable opportunity: a short "Deliberate Simplifications" section in `docs/systems/COMBAT.md` (cross-referencing this document) would let future agents and Nick tell "we chose this" apart from "nobody decided this" at a glance, which is exactly the ambiguity the new D&D Rules Referee agent exists to close going forward.

---

## Tone / pacing pass (D&D Game Master criteria)

- **Fail-forward is real, not aspirational** — see faithful finding #6 above. This is the single strongest tabletop-authenticity result in the whole review.
- **Confirm-before-combat** (`UIManager.showConfirm()`, added CHECKIN-030) matches a DM's instinct to telegraph danger rather than force an unavoidable instant fight.
- **Diplomacy-before-combat** on `diplomacyAllowed` encounters matches `PLAYER_AGENCY.md` rule 5 and the "always let the table try to talk first" DM instinct.
- **The Nanabozho lens has at least one strong example** (`kess_compromise` — "modified levy + frog platforms; all factions neutral-positive") showing a genuine clever-third-option choice, not just help-A/help-B/walk-away.
- **Gap, not a bug**: only one quest chain (`What the Water Remembers`) currently exercises the full "stakes stated → check → fail-forward → distinct outcomes" loop end to end. The side quests (`Ferryman's Toll`, `Wrong Label`) are simpler talk-objective chains without their own skill-check/branching structure — reasonable for a vertical slice, but worth knowing this pattern hasn't been proven to generalize to a second quest yet if more side content is planned.

---

## Recommendation

None of these findings block anything currently shipped — Everden's core d20 loop is legitimately D&D underneath the reskin, and the one real mechanical bug found (finding 2, crit damage doubling) is small and isolated. The main value of this pass is turning implicit choices into explicit, documented ones so the next contributor doesn't have to reverse-engineer "was this intentional?" from git blame. Suggested next actions, not committed to here:

1. Decide and document the checks/saves nat-1/nat-20 policy (finding 1) — smallest-effort, highest-clarity fix.
2. Fix the crit-damage-doubling bug (finding 2) — a real one-line correctness fix with a test.
3. Add a short "Deliberate Simplifications" section to `docs/systems/COMBAT.md` referencing this document.

This document itself does not change any gameplay code and does not move the Systems or Experience % in `docs/PROGRESS.md` — see the honesty doctrine in `.cursor/rules/everden-progress.mdc`.
