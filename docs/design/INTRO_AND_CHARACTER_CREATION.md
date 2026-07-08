# Intro & Character Creation

Design reference for the title-screen wizard and first-five-minutes flow (T22, CHECKIN-035).

## Wizard steps

| Step | When | What the player does |
|------|------|----------------------|
| Menu | Save exists in `localStorage` (`everden_save_v1`) | **Continue journey** or **New game** (confirm overwrite) |
| Species | New game only | Pick one of five playable folk; live portrait + `selectBlurb` from `public/data/species.json` |
| Name | New game only | Enter a name (max 24 chars) or leave blank → `"Traveler"` |
| Motivation | New game only | Pick one arrival reason (sets `PlayerProfile.motivation` + world flags) |
| Confirm | New game only | Read-only stat sheet: STR–CHA with 5e mods, AC, initiative, three abilities from `abilities.json` |
| Enter | Confirm | Loads Causeway, grants main quest + starter charm, plays opening narration |

**Continue** skips the wizard and loads the save. Opening narration does **not** replay on continue.

## Playable species (title screen)

Defined in `public/data/species.json` with `selectBlurb` + `selectRole`:

- frog · Mobile
- toad · Control
- turtle · Tank
- tortoise · Tank · Chronicle-minded
- vole · Healer

Tortoise uses the same combat kit as turtle (`shell_block`, `withdraw`, `ram`) with higher CON/WIS and lower DEX.

## Arrival motivations

| Id | Label | World flag | Opening line 2 hook |
|----|-------|------------|---------------------|
| `investigator` | Sent to find the truth | `arrival_investigator` | Hired/asked to look into the flood |
| `messenger` | Carrying someone else's worry | `arrival_messenger` | Delivering a letter, debt, or rumor |
| `neighbor` | This is your basin too | `arrival_neighbor` | Personal stake in the flooding |

Flags are set once on new game via `applyMotivationFlags()` in `PlayerProfile.ts`. Pip's `already_knew` node uses `altText` append lines keyed on these flags.

## What persists (save v2)

`PlayerProfile` (`saveKey: playerProfile`):

- `species`
- `name` (default `"Traveler"`)
- `motivation` (default `"investigator"`)

Save version bumped to **2** in `SaveSystem.ts`. v1 saves without name/motivation still load with defaults.

## Opening narration

Three lines from `getOpeningNarrationLines()` in `OpeningNarration.ts`:

1. Species-flavored (5 variants)
2. Motivation-flavored + shared council-vote stakes
3. Shared Lilymarket nudge

Skipped when `?qa=1` (e2e) or on **Continue** (not a new game).

After the beat: starter-item toast, then control-hint toast.

## QA / e2e skip rules

- `?qa=1` in URL → bypass title wizard, start as frog/Traveler/investigator, skip opening narration
- `?qa=1&keep=1` → do not clear save before QA boot (save round-trip test)

## Dialogue placeholders

- `{playerName}` in dialogue JSON is replaced at runtime in `GameBootstrap.openDialogue()`.

## Related files

- [`src/ui/TitleScreen.ts`](../../src/ui/TitleScreen.ts) — wizard UI
- [`src/main.ts`](../../src/main.ts) — wires TitleScreen → GameBootstrap
- [`src/core/GameBootstrap.ts`](../../src/core/GameBootstrap.ts) — new-game grants, opening beat
- [`public/data/species.json`](../../public/data/species.json) — stat blocks + title copy
- [`public/data/dialogue.json`](../../public/data/dialogue.json) — Pip motivation append lines
