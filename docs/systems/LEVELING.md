# Leveling & Proficiency (future)

**Status:** Not implemented. Vertical slice uses flat species combat packages from `public/data/species.json`.

## Planned model (when post-V5 content ships)

| Level | Proficiency bonus (5e) |
|-------|------------------------|
| 1–4 | +2 |
| 5–8 | +3 |
| 9–12 | +4 |
| 13–16 | +5 |
| 17–20 | +6 |

Everden will likely cap earlier for slice scope (e.g. level 5–8 basin).

## What changes when leveling lands

1. **`species.json`** — base stats stay; add `level` or derive from XP in `PlayerProfile`
2. **Combat** — proficiency added to attack rolls, saves, and skill checks per 5e
3. **Abilities** — optional per-rest use counts (see `docs/systems/COMBAT.md` deliberate simplifications)
4. **Quests** — XP grants or milestone level-ups on council / major beats

## What stays slice-simple until then

- No character level UI
- No XP bar
- Species `combat.ac` and `initiativeMod` remain flat (documented in DND_RULES_AUTHENTICITY.md)

## Related

- [COMBAT.md](COMBAT.md) — deliberate simplifications
- [DND_RULES_AUTHENTICITY.md](../design/DND_RULES_AUTHENTICITY.md) — proficiency gap finding
- [PlayerProfile.ts](../../src/gameplay/PlayerProfile.ts) — extend with `level` / `xp` when ready
