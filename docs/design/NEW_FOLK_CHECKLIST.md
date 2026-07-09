# Adding a New Folk (Race Plug-in)

Everden’s look system is data-driven. A sixth playable folk should not require hunting hardcoded lists.

## Checklist

1. **Combat / identity** — add entry to [`public/data/species.json`](../../public/data/species.json) (`id`, `name`, `selectRole`, `selectBlurb`, `racialBonuses`, `combat.abilities`).
2. **Abilities** — add ~3 abilities in [`public/data/abilities.json`](../../public/data/abilities.json) with `"species": "{id}"`.
3. **Look registry** — add `{id}` block to [`public/data/speciesAppearance.json`](../../public/data/speciesAppearance.json):
   - `playable: true`
   - `skinRamps`, `eyeRamps`, `crestColorRamps`
   - `patterns[]` with `id`, `label`, `sheetSuffix` (`p1`–`p4`)
   - `crests[]` (at least `{ "id": "none", "label": "Bare" }`)
   - `markings`, `wardrobeSlots`
4. **Body art** — `public/assets/sprites/species/{id}_medium_p1.png` … `_p4.png` (+ optional `{id}.png` anchor). Prefer single-portrait sheets (see [`HABBO_SPRITE_SPEC.md`](../art/HABBO_SPRITE_SPEC.md)).
5. **Crests (optional)** — `public/assets/sprites/crests/{id}_{crestId}.png` matching registry `layer` paths.
6. **Wardrobe allowlists** — add `{id}` (or `"*"`) to relevant items in [`wardrobe.json`](../../public/data/wardrobe.json).
7. **Procedural fallback** — register a drawer in `CharacterSprites.ts` `drawers` map (or accept frog fallback until art ships).
8. **Opening line (optional)** — `OpeningNarration.ts` `SPECIES_OPENING`.
9. **Tests / e2e** — extend creator e2e if the folk is playable; run `npm test && npm run typecheck`.

## Do not

- Hardcode playable IDs in `CharacterCreator` (derived from `playable: true`).
- Hardcode pattern labels (use registry).
- Delete procedural `drawCharacterCanvas` fallback.

## Verify

- Folk tab shows the new card with PNG thumb.
- Look tab skin / eyes / patterns / crests / markings all update the center preview.
- Enter world + Mudwall guild mirror still refresh the mesh.
- Multiplayer join carries `appearanceJson` (v4 schema).
