# Player Agency — What BG3 & Tabletop D&D Do, and How Everden Competes

> Reference doc for design decisions. Not a feature checklist to clone — a map of **feel** we must earn.

---

## What Makes Baldur's Gate 3 Special

| Pillar | What players feel | How Larian does it |
|--------|-------------------|-------------------|
| **Reactivity** | "The world remembers me" | Flags, companion state, ending spreadsheet — choices from hour 1 echo at hour 60 |
| **Dialogue as gameplay** | "I can talk my way out" | Persuasion/Deception/Intimidation are real alternatives to combat, not fake branches |
| **Contrast, not tone** | "These aren't the same answer rephrased" | Expose / support / sell / silence are morally different, not sarcastic vs polite |
| **Identity in dialogue** | "My class/race matters here" | Species-exclusive lines, advantage on relevant checks, different outcomes |
| **Visible dice** | "I earned that win" | Rolls shown in UI; crits and fumbles matter |
| **Combat integration** | "Story and fights are one system" | Fights can be avoided, bargained, or approached creatively |
| **Sacrificed content** | "My path is mine" | NPCs die, companions miss — branches mean unseen content |

Sources: [Eurogamer on Dark Urge design](https://www.eurogamer.net/the-making-of-the-dark-urge-in-baldurs-gate-3), [Game Design Discourse on player choice](https://gamedesigndiscourse.substack.com/p/player-choice-in-baldurs-gate-3).

---

## What Makes Online D&D (Foundry / Roll20) Special

| Pillar | What players feel | How tables do it |
|--------|-------------------|------------------|
| **IC / OOC voice** | "I'm playing a character" | In-character chat, emotes, whispers to GM |
| **Shared dice spectacle** | "Everyone saw that nat 20" | Rolls posted to chat log, group reacts |
| **GM improvisation** | "The world adapts" | Human DM rewrites on the fly when players do weird things |
| **Skill checks as moments** | "Roll persuasion" | DC announced, roll visible, pass/fail changes scene |
| **Theater + tactics** | "Combat when it matters" | Narrative scenes and grid combat coexist |

Everden can't replicate a human GM. We **simulate** GM behavior with: flag memory, scheduled NPCs, reputation, journal callbacks, and skill-check dialogue.

---

## Everden's Identity (What We Do *Differently*)

We are **not** a 100-hour CRPG. We are a **living wetland slice** in the browser:

| Our edge | BG3 doesn't have this |
|----------|----------------------|
| **Biology-driven roles** | Frog/toad/turtle mechanics tied to real amphibian traits |
| **Living simulation** | Weather, economy, NPC schedules tick while you play |
| **Nanabozho ingenuity** | Trickster compromise paths — wit over brute force |
| **Cozy browser session** | 20–40 min vertical slice, save anytime, no install |
| **Field journal** | Discovery codex grows from play, not a wiki |
| **2.5D pixel wetland** | Distinct look — not generic fantasy UE5 |

**Our promise:** *Tabletop honesty in a browser wetland.* Dice visible. Choices contrast. Species matters. The marsh remembers.

---

## Gap Analysis (Jul 2026)

| BG3 / Tabletop pillar | Everden status | Priority |
|----------------------|----------------|----------|
| Visible skill-check dice in dialogue | ✅ Implemented `SkillCheckResolver` | — |
| Species-exclusive dialogue | ✅ `condition.species` + unique lines | — |
| Reputation-gated choices | ✅ `requiresReputation` on choices | — |
| Flag callbacks in NPC text | ✅ `altText` on dialogue nodes | — |
| Combat diplomacy (talk before fight) | ✅ Persuade / Intimidate on eligible encounters | — |
| Contrast choices (council) | ✅ 5 endings | — |
| Journal memory | ✅ Field journal | — |
| Companion party | ❌ Solo player (slice) | Post-launch |
| Full VO + cinematics | ❌ Text + portraits | Art pass |
| 60hr branching | ❌ Intentionally scoped | By design |

---

## Implementation Rules (for agents)

1. **Every consequential choice** must differ in *outcome*, not just dialogue tone.
2. **Skill checks** show d20 + mod + DC in UI before advancing (Foundry-style).
3. **Species lines** must offer different *approach*, not +1 flavor text.
4. **NPCs** reference at least one player flag after quest stage 2 (callback `altText`).
5. **Combat** with `diplomacyAllowed: true` must offer talk options before forcing fight.
6. **Never** auto-pass a skill check — always roll unless DC 0.

See `.cursor/rules/everden-gameplay-guards.mdc` for code enforcement.

---

## Nanabozho Design Lens

The trickster wins through **ingenuity, not size**. Everden choices should include:

- Clever third options (compromise levy + frog platforms)
- Risky shortcuts (sell evidence)
- Silence as power (do nothing — world moves without you)
- Species-appropriate cleverness (frog scouts, toad poisons, turtle endures)

---

*Last updated: CHECKIN-008*
