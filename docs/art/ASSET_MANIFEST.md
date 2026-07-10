# Asset manifest — web vs Godot branch (2026-07-09)

**Full character inventory:** [CHARACTER_ASSET_CATALOG.md](CHARACTER_ASSET_CATALOG.md) — scan of every species/wardrobe/crest/NPC file, godot-rnd diff, and action matrix.

**Purpose:** Honest inventory after recovery. Godot R&D lives on branch `godot-rnd`; playable slice uses `public/assets/` on `main`.

## Summary

| Location | Count (png/webp) | Role |
|----------|------------------|------|
| `public/assets/` (restored HEAD) | ~150 | **Shipped** Everden species, wardrobe, NPCs, locations |
| `apps/client/assets/` (`godot-rnd`) | ~259 | Godot copy + LPC layers + UI packs |
| `docs/art/reference/lpc-character-layers/` | 224 | **Study only** — LPC human paper-doll (not Everden folk) |
| `public/assets/ui/` | 24 | **Ported** GUI/button packs from Godot branch |

## Everden assets (keep on web)

- `public/assets/sprites/species/` — 5 folk × build × pattern sheets
- `public/assets/sprites/wardrobe/` — hats, cloaks, accessories, held
- `public/assets/sprites/crests/` — frog reed/lily crests
- `public/assets/sprites/npcs/`, `enemies/`
- `public/assets/locations/` — 7 district backdrops
- `public/assets/items/`

## Godot-only (do not replace Everden species)

- `character-layers/dmp.png`, `dfp.png`, etc. — LPC human male/female/skeleton
- Reference path: `docs/art/reference/lpc-character-layers/`

## Sync policy

1. **Never** overwrite `public/assets/sprites/species/*.png` with LPC humans.
2. New UI/tilesets from Godot → `public/assets/ui/` or `docs/art/reference/`.
3. Frog #1 redesign → hand Piskel pass per `FROG_CHARACTER_DESIGN.md` before any replace.

## Branch map

| Branch | Contents |
|--------|----------|
| `main` | Vite + Three.js vertical slice (source of truth for play) |
| `godot-rnd` | Godot 4.7 client, LPC compositor, duplicated Everden assets |

## LPC animation contract (study only — phase 6)

Godot branch `apps/client/` implements LPC-style layer compositing for **human** sprites. Use it only to derive an Everden animation contract:

| LPC concept | Everden target |
|-------------|----------------|
| Body + hair + torso + legs layers | Species body sheet + crest slot + wardrobe overlays |
| 4-dir walk cycle strips | Future: `frog_medium_walk_*.png` strips per `characterRigs.json` |
| `character-layers/*.png` naming | Do **not** ship on web; reference in `docs/art/reference/lpc-character-layers/` |

Port when ready: UI packs (`public/assets/ui/`), isometric tiles from `assesets/extracted_tiles/` on `godot-rnd`.

## PoC / study atlases (not shipped Everden folk)

| Asset | Path | Role |
|-------|------|------|
| Frogwiz wizard frog | `public/assets/sprites/atlas/frogwiz_atlas.png` + `public/data/atlas/frogwiz_atlas.json` | **Atlas pipeline PoC** — 12 frames, **wave/cast animation timelines** in JSON `animations` block. Rebuild from source PNGs: `npm run atlas:rebuild-frogwiz` (uses [sharp](https://github.com/lovell/sharp) trim via `scripts/sprite_key_trim.mjs`). Verify at `/atlas-lab.html`. |

**Trim toolchain:** `scripts/sprite_key_trim.mjs` (edge-flood white matte + `sharp.trim()`). Optional CLI: ImageMagick `magick in.png -fuzz 10% -transparent white -trim +repage out.png`. Do **not** use rembg on frog folk — eats belly/cream pixels.

**Animation note:** Wave/cast are timeline composites (idle↔pose blend, sway, cast glow pulse) until multi-frame art exists.
