# Combat System

Turn-based, tabletop-inspired. Baldur's Gate feel in a browser combat log.

## Core Resolution

```
d20 + abilityMod + speciesMod + itemMod >= targetAC   (attack)
d20 + abilityMod + speciesMod + itemMod >= saveDC   (save)
```

- **Advantage:** roll 2d20, take higher
- **Disadvantage:** roll 2d20, take lower
- **Crit:** natural 20 — double damage dice
- **Fumble:** natural 1 — attack misses regardless of mod

## Species Roles (Launch)

| Species | Role | Key mods |
|---------|------|----------|
| Frog | Mobile | +2 initiative, Leap reposition |
| Toad | Control | +1 poison DC, Fear Croak |
| Turtle | Tank | +2 AC, Shell Block |

## Abilities

Defined in `species.json` → loaded by `SpeciesAbilityRegistry`.

| ID | Species | Action | Effect |
|----|---------|--------|--------|
| `leap` | Frog | Move | 3 tiles, ignore obstacles |
| `tongue_lash` | Frog | Attack | d20+DEX, 1d6 damage |
| `bufotoxin_spit` | Toad | Attack | d20+CON, 1d4 + poison |
| `fear_croak` | Toad | Debuff | WIS save or flee |
| `shell_block` | Turtle | Defense | -1d6 damage 1 turn |
| `withdraw` | Turtle | Defense | Immobile, attacks at disadvantage |
| `ram` | Turtle | Attack | d20+STR, knockback |

## Item Roll Modifiers

```json
{ "rollType": "attack", "bonus": 2, "extraDice": "1d4" }
```

Applied in order: flat bonus → extra dice → species mod → ability mod.

## Turn Order

1. Roll initiative (d20 + DEX mod + species initiative mod)
2. Highest to lowest each round
3. On turn: move + one action (or bonus ability per species cooldown)

## Positioning

8×8 grid for slice encounters. Terrain: water (amphibian bonus), mud (slow), stone (normal).

## Non-Lethal Resolution

- **Flee:** DC 12 DEX check (flat, not contested)
- **Bribe:** CHA check vs enemy greed threshold
- **Diplomacy:** only in story encounters with `diplomacyAllowed: true`

## Example Round (Paper Test)

**Setup:** Player frog vs Poacher toad + Poacher hound (reskin turtle stats low)

1. Frog initiative: d20(14) + 2 = 16
2. Toad initiative: d20(8) + 0 = 8
3. Frog turn: Leap to flank, Tongue Lash → d20(12)+2=14 vs AC 12, hit, 1d6(4) damage
4. Toad turn: Bufotoxin Spit → d20(15)+1=16 vs AC 12, hit, 1d4(2)+poison
5. Frog poison save: d20(11)+0=11 vs DC 12, fail, -2 next roll

Combat log displays each line. Player sees dice results.

## Slice Encounter — Blackfen Poachers

`encounters.json` id: `blackfen_poachers`
- Enemy 1: Toad poacher (control)
- Enemy 2: Turtle thug (tank) — represents hired muscle
- Optional ally: Grizz (toad NPC) if player helped in quest stage 4

## Testing

- EditMode: `DiceRoller`, modifier stacking, initiative sort
- PlayMode: complete encounter without softlock
