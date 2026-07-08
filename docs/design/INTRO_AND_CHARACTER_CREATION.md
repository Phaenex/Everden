# Intro & Character Creation

Design reference for the BG3/MMO-style character creator and first-five-minutes flow (T2, T22).

## Creator layout

Single screen with **six tabs** (any tab clickable anytime):

| Tab | What the player does |
|-----|----------------------|
| **Folk** | Pick one of five playable species; live portrait + `selectBlurb` from `species.json` |
| **Look** | Body pattern (0–3), hue tint (−30…+30), markings (none/spots/stripes); randomize + reset |
| **Wardrobe** | Hat / cloak / accessory from `wardrobe.json`; **None** always available per slot |
| **Stats** | 5e point-buy — 27 points, scores 8–15 before racial bonuses; **Use folk default** |
| **Story** | Name (max 24, blank → `"Traveler"`) + arrival motivation |
| **Review** | Enter Reedwater Basin when point pool is valid |

**Menu** when save exists: **Continue journey** or **New game** (confirm overwrite).

**Continue** skips the creator and opening narration.

## Point-buy rules

- Standard 5e costs: 8=0, 9=1, …, 15=9
- Pool: **27 points**
- Racial +2/+1 from `species.json` `racialBonuses` applied **after** point-buy
- `species.stats` in JSON = recommended **final** spread (folk default button)

Implementation: [`src/gameplay/PointBuy.ts`](../../src/gameplay/PointBuy.ts)

## Appearance schema (save v3)

```typescript
interface CharacterAppearance {
  variant: number;       // 0–3 procedural pattern
  hueShift: number;      // -30..+30 tint
  marking: 'none' | 'spots' | 'stripes';
  wardrobe: { hat?: string; cloak?: string; accessory?: string };
}
```

Procedural body + wardrobe layers render in [`CharacterSprites.ts`](../../src/presentation/CharacterSprites.ts) + [`WardrobeLayers.ts`](../../src/presentation/WardrobeLayers.ts). Real species/NPC art still swaps in asynchronously when present.

## Playable species

Defined in `public/data/species.json` with `selectBlurb`, `selectRole`, and `racialBonuses`:

| Species | +2 | +1 | Role |
|---------|----|----|------|
| frog | DEX | CHA | Mobile |
| toad | CON | WIS | Control |
| turtle | CON | STR | Tank |
| tortoise | WIS | CON | Tank · Chronicle-minded |
| vole | DEX | WIS | Healer |

Species still defines **combat kit** (AC, initiative, three abilities). Stats are player-built within point-buy.

## Arrival motivations

| Id | Label | World flag |
|----|-------|------------|
| `investigator` | Sent to find the truth | `arrival_investigator` |
| `messenger` | Carrying someone else's worry | `arrival_messenger` |
| `neighbor` | This is your basin too | `arrival_neighbor` |

## What persists (save v3)

`PlayerProfile` (`saveKey: playerProfile`):

- `species`, `name`, `motivation`
- `stats` — **final** scores after racial bonuses
- `appearance` — variant, hue, marking, wardrobe ids

Save version **3** in `SaveSystem.ts`. v2 saves without stats/appearance migrate on load: species default final stats + empty appearance.

## Opening narration

Three lines from `getOpeningNarrationLines()` — skipped on **Continue** and when `?qa=1`.

## QA / e2e skip rules

- `?qa=1` → bypass creator, species from `?species=`, default stats/appearance, skip opening narration
- `?qa=1&keep=1` → do not clear save before QA boot

## Related files

- [`src/ui/characterCreation/CharacterCreator.ts`](../../src/ui/characterCreation/CharacterCreator.ts) — tabbed creator shell
- [`src/ui/TitleScreen.ts`](../../src/ui/TitleScreen.ts) — menu + creator entry
- [`src/core/GameBootstrap.ts`](../../src/core/GameBootstrap.ts) — `PlayerProfile.stats` in combat + dialogue skill checks
- [`public/data/wardrobe.json`](../../public/data/wardrobe.json) — slice wardrobe catalog
