# Character Customization

Habbo-depth layered look + BG3-style creator depth, wired into the world (not creator-only).

## Shipped (deep customization engine C0–C5)

| Feature | Everden |
|---------|---------|
| Species / folk | Data-driven via `species.json` + `speciesAppearance.json` (`playable: true`) |
| Body build | Slim / Medium / Stout (scale on medium sheets; build sheets when validated) |
| Skin tone | Per-species ramp swatches (`skinTone` index) |
| Eye color | Per-species ramp swatches (`eyeColor`) |
| Crest / hair | Species-gated crest ids + crest color ramp |
| Body pattern | Named palettes (`patternId`) + **intensity** 0–100 |
| Markings | none / spots / stripes / bands / freckles + **intensity** |
| Wardrobe | hat / cloak / accessory / **held** + per-slot **dye** |
| Live preview | Creator + Mudwall guild looking-glass |
| In-world | Same `composeCharacterArtCanvas` path; `refreshCharacterMesh` on respec |
| Multiplayer | `appearanceJson` on join + `appearance_update` mid-session; remotes rebuild + `animState` walk bob |

## Schema

- Shared types: `shared/appearance/AppearanceTypes.ts` (v4)
- Migrate v3→v4: `shared/appearance/migrate.ts` (`variant` → `patternId`, `hueShift` → nearest `skinTone`)
- Save: `PlayerProfile` always serializes migrated appearance

## Data paths

- Look registry: `public/data/speciesAppearance.json`
- Wardrobe catalog: `public/data/wardrobe.json`
- New folk checklist: [`NEW_FOLK_CHECKLIST.md`](NEW_FOLK_CHECKLIST.md)
- Art: [`HABBO_SPRITE_SPEC.md`](../art/HABBO_SPRITE_SPEC.md)

## World hooks

- **Mudwall** object `guild_mirror` → `AppearanceMirrorUI` → save + `appearance:changed` → net update
- Combat portraits / creator / remotes share compose

## Still deferred

- Hand-drawn T6b sheets from Nick sketches (engine accepts better art when ready)
- Distinct slim/heavy PNG sheets (loader still uses medium + scale until montages are fixed)
- Full transmog catalog / held item art packs

## Tests

- `src/tests/AppearanceMigrate.test.ts`
- `src/tests/SpeciesAppearanceRegistry.test.ts`
- `src/tests/PlayerProfile.test.ts` (legacy create still migrates)
- `e2e/character-creation.spec.ts`
