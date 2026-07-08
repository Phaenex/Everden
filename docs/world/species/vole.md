# Vole Folk

**Combat role:** Healer  
**Status:** ✅ In the vertical slice (T12, 2026-07-07) — playable from the title screen

## Biology

- Small burrowing mammal; excellent hearing
- Can flatten body to hide in undergrowth
- Short lifespan (2–3 years) but rapid reproduction
- Herbivorous; stores food in cheek pouches

## Combat Kit (Implemented)

| Ability | Type | Effect |
|---------|------|--------|
| Burrow Hide | Utility | Burrow; attacks against you have disadvantage this round (same mechanic as toad's Burrow) |
| Cheek Poultice | Heal | Restore 1d8+1 HP to whichever ally needs it most (auto-targets — ignores the enemy-focused button the UI passes) |
| Nibble Distraction | Debuff | WIS save (DC 12) or the target is stunned and loses its next turn |

Stats (`public/data/species.json`): STR 6, DEX 14, CON 8, INT 12, WIS 14, CHA 12, AC 11, initiative +3 — fast, perceptive, fragile, matches "small and quick" over "stealthy" since the slice has no dedicated stealth system yet.

**Cut for the vertical slice:** Tremor Sense (passive hidden-enemy detection) — the combat system has no "hidden enemy" concept to hook it into yet. Revisit if/when stealth mechanics exist.

## Culture

- Live in meadow burrows east of Reedwater Basin
- Neutral traders between basin and upland forest — see the `vale_wanderers` faction (`docs/world/factions/vale_wanderers.md`)
- Family clans; healers hold informal authority
- Represented in-game by **Sable Meadowrun**, a wandering healer/trader at Lilymarket (`sable_meadowrun` in `public/data/npcs.json`)

See [IDEAS.md](../IDEAS.md).
