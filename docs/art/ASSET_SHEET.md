# Asset Sheet — AI Pixel-Art Placeholder Pass

**Status:** Interim art tier. Replaces colored-rectangle procedural sprites everywhere they're visible. Still gets replaced by hand-drawn sketches later (T6b) — same file paths, no code changes needed for that swap.

**Generated:** 2026-07-06/07 · 33 images (5 species anchors + 5 in-game species sprites + 15 NPCs + 2 enemies + 3 items + 6 locations + 1 title key art)

**2026-07-07 regen pass:** All 6 location backdrops were regenerated as empty isometric stages (no baked-in characters). All 22 character sprites (5 species + 15 NPCs + 2 enemies) were regenerated as crisp pixel art on a flat solid background (purple `#6a4a8a` for most; species anchors on flat green/teal) for clean chroma-key. Uniform character height/canvas across the set.

**2026-07-07 framing pass (part 1):** `causeway.webp` is now its own distinct plate (a wooden-plank boardwalk over marsh water) instead of reusing `lilymarket.webp`, wired in `causeway.json`. `croakend.webp` was regenerated brighter/warmer so its clay burrow-shops read (the prior night version went near-black at the edges). Both were requested at 16:9 from the generator.

**2026-07-07 framing pass (part 2 — real fix):** the generator does not honor a requested aspect ratio — every "16:9" request above actually came back as **1536×1024 (3:2)**, same as the original 6 backdrops. The real bug was `SceneComposition.getBackdropSize` **hardcoding** `BACKDROP_IMAGE_ASPECT = 16/9` and shaping the backdrop plane to that assumption, so the true 3:2 texture got stretched ~19% to fill a 16:9-shaped plane, and whatever didn't fit still got cover-fit-cropped by the frustum on top of that. Fixed at the root: `getBackdropSize(screenAspect, imageAspect)` now takes the real image aspect as a parameter, and `SceneLoader.addBackdrop` re-measures `tex.image.width / tex.image.height` once the texture actually loads and rebuilds the plane geometry to match — no more hardcoded assumption anywhere. Regression test: `DistrictBackdrop.test.ts`. `mudwall.webp`, `ferrymans_rest.webp`, and `lilymarket.webp` were also regenerated with their key architecture (rostrum, cottage, stalls) composed further from the vertical edges so the unavoidable ~16% top/bottom cover-fit crop (3:2 image on a 16:9 screen) doesn't cut them off.

**2026-07-07 NPC spread:** Mudwall/Ferryman's Rest/Croakend NPC and object coordinates were spread across much more of each `navPolygon`'s width (previously clustered within ~3-4 world units near the spawn/exit, leaving most of the walkable floor empty) and nudged toward the district's thematically-matching landmark (Elder Domet, the Council Speaker, near the rostrum; Old Myrtle near a dome since her bio says she "sits at the shell dome"; Marta the potion seller next to her own shop object; etc).

All files live under `public/assets/` and are served at `/assets/...` by Vite. Species/NPC/enemy sprites are PNG (need per-pixel alpha for chroma-key transparency). Locations and title art are WebP (photographic-density backdrops, no transparency needed, ~5-8x smaller than PNG at the same visual quality).

## Consistency approach

1. Generated 5 species reference sheets first as style anchors (palette + biology cues from [species.json](../../public/data/species.json) and [species docs](../world/species/)).
2. Generated a clean single-character sprite portrait per species from the same anchor (used in-game; the reference sheet stays in `docs/art/reference/` for art-direction lookup only, not shipped).
3. Generated all 15 named NPCs and 2 enemies referencing their species anchor image, plus a distinguishing prompt detail pulled from their bio/title.
4. Generated 6 world locations and 1 title key art last, same palette family, referencing district descriptions in [REGION_01.md](../world/regions/REGION_01.md).

Palette source: [BRANDING.md](../studio/BRANDING.md) — deep marsh `#1a3c34`, river brown `#4a3728`, reed green `#5c7a52`, mist grey `#8a9a9e`, lantern amber `#d4a054`.

## Species anchors (in-game sprites)

| Species ID | File | Notes |
|---|---|---|
| frog | `sprites/species/frog.png` | Reed green `#5c7a52`, sleek/damp build, mobile role |
| toad | `sprites/species/toad.png` | River brown `#4a3728`, warty/stout build, control role |
| turtle | `sprites/species/turtle.png` | Deep marsh `#1a3c34`, domed shell, tank role |
| tortoise | `sprites/species/tortoise.png` | Muted teal `#2a4c44`, wider/lower shell than turtle, tank role |
| vole | `sprites/species/vole.png` | Small furred build, healer role — in `species.json` since T12 (2026-07-07) |

Full-size reference sheets (art-direction only, not loaded by the game): `docs/art/reference/{species}_reference.png`.

## Named NPCs (15) — `sprites/npcs/{npcId}.png`

| File (npcId) | Name | Species | Distinguishing detail used |
|---|---|---|---|
| `pip_marshwick.png` | Pip Marshwick | frog | Market Factor, busiest fish stall in Lilymarket — regenerated 2026-07-07 (original had baked-in signage text) |
| `elder_domet.png` | Elder Shellen Domet | turtle | Council Speaker, eldest, Great Spill survivor |
| `kess_ridge.png` | Kess Ridge | turtle | Levy Foreman, tool belt, hard glare |
| `grizz_burrowman.png` | Grizz Burrowman | toad | Ferry Operator, forty years of depth marks |
| `marta_clayhollow.png` | Marta Clayhollow | toad | Potion Seller, apron, clay jars |
| `jenna_leapwell.png` | Jenna Leapwell | frog | River Courier, always mid-leap — regenerated 2026-07-07 (original had a baked-in name banner) |
| `tor_stoneback.png` | Tor Stoneback | turtle | Mason Captain, stone-lifter build |
| `fern_reedweaver.png` | Fern Reedweaver | frog | Reed Weaver, youngest stall owner — regenerated 2026-07-07 (original had a baked-in sign) |
| `old_myrtle.png` | Old Myrtle Shellsong | tortoise | Chronicle Keeper, scroll, elder posture |
| `croaker_finn.png` | Croaker Finn | frog | Stall Apprentice, Pip's nephew |
| `silt_ferryhand.png` | Silt | toad | Ferry Hand, young, lantern-filler |
| `bramble_guard.png` | Bramble | frog | Causeway Guard, leap-trained |
| `pondwort.png` | Pondwort | toad | Alchemy Apprentice, Marta's student |
| `elder_thatch.png` | Elder Thatch | turtle | Chapel Warden, tends the Sunken Chapel |
| `rivulet.png` | Rivulet | frog | Tadpole Teacher, unusually patient |

## Enemies (2) — `sprites/enemies/{id}.png`

| File | Name | Species | Encounter |
|---|---|---|---|
| `skadge.png` | Skadge the Poacher | toad | `blackfen_poachers` |
| `bulk.png` | Bulk | turtle | `blackfen_poachers` |

## Items (3) — `items/{itemId}.png`

| File | Item | Type |
|---|---|---|
| `reed_hop_charm.png` | Reed Hop Charm | trinket (attack +1, initiative +1d4) |
| `clay_phial.png` | Clay Phial of Tonic | consumable (save +2) |
| `shell_fragment.png` | Shell Fragment Amulet | trinket (defense +2) |

## World locations (6) — `locations/{id}.webp`

| File | Location | Notes |
|---|---|---|
| `causeway.webp` | Reedwater Causeway (hub) | Wooden plank boardwalk over marsh water, reeds/lanterns/lily pads at edges — distinct plate (was reusing lilymarket.webp) |
| `lilymarket.webp` | Lilymarket district | Floating lily-pad stalls, frog merchants — regenerated, stalls composed lower/more-central |
| `mudwall.webp` | Mudwall district | Ring of domed stone buildings + council rostrum, flood walls — regenerated, rostrum pulled down from the top edge |
| `croakend.webp` | Croakend district | Clay burrow-shops, toad night market, warmer lanterns — regenerated brighter |
| `sunken_chapel.webp` | Sunken Chapel (ruin) | Half-submerged, faded three-species mural |
| `ferrymans_rest.webp` | Ferryman's Rest (outpost) | Single dock, toad ferry family cottage |
| `blackfen_outlet.webp` | Blackfen Outlet (encounter zone) | Dead trees, bog water, poacher camp |

## Title / key art (1, optional)

| File | Use |
|---|---|
| `title_key_art.webp` | Title screen backdrop — wide sunset establishing shot of the river town |

## Wardrobe item overlays — `sprites/wardrobe/{itemId}.png`

Added 2026-07-08. Each file is a **128×128 PNG on a white background** containing only the wardrobe item, positioned to composite correctly on top of the species body sprite. The loader (`WardrobeLayers.ts → loadWardrobeItemPng`) chromakeys the white background and draws the result at full canvas size over the body. Falls back to procedural drawing if the file is absent or 404.

**Positioning guide (for a 128×128 canvas, character body ~centered):**

| Slot | Vertical range | Notes |
|------|---------------|-------|
| Hat | top 0–45px | brim of hat sits at ~y 35–45, crown extends to y 5–10 |
| Cloak | full canvas, body area transparent | make a "hole" where head+arms poke out |
| Accessory | 55–90px vertically, centered | neck/chest zone |

**Item IDs (file names, white-background PNG):**

Hats: `reed_hat`, `shell_cap`, `mudwall_helm`, `lily_bloom`, `ferry_kepi`, `marsh_hood`

Cloaks: `basin_cloak`, `ferry_shawl`, `croakend_weave`, `levy_mantle`, `rain_poncho`, `elder_robe`

Accessories: `reed_charm`, `clay_bead`, `market_scarf`, `levy_pin`, `shell_brooch`, `hop_whistle`

### AI generation prompts for species sprites (DALL-E 3 / Midjourney)

All share this **base style** (append species-specific detail at the end):

```
Pixel art game character sprite, [SPECIES DETAIL], single character centered
on a flat white background, front-facing chibi proportions, large round head
and short stocky body, thick dark pixel outlines, round expressive eyes with
[EYE COLOR] iris and small black pupil, no items no clothing no weapons,
arms slightly out at sides, thick stubby legs, flat-footed stance,
clean pixel art style, no text no words no signage
```

| Species | SPECIES DETAIL | EYE COLOR |
|---------|---------------|-----------|
| frog | bright lime-green frog, smooth shiny skin, small darker green spots on back, lighter cream belly, wide grin | golden-yellow |
| toad | golden-brown toad, stockier and wider body than frog, wart texture on skin, cream belly, stoic expression | amber-gold |
| turtle | forest-green turtle, large domed shell visible from front as hump behind head, short neck, small head, hexagonal shell pattern, tiny arm nubs | dark brown |
| tortoise | olive-green tortoise, heavier flatter shell than turtle with concentric ring pattern, wrinkled neck and legs, wide flat feet, ancient look | dark amber |
| vole | warm brown-grey small rodent, round body, very large round ears with pink inner ear, small pink nose, cream off-white belly, whisker lines | black |

### AI generation prompts for wardrobe overlay sprites

Use the hat/cloak/accessory item name + this base:

```
Pixel art item sprite, [ITEM DESCRIPTION], centered at [POSITION] of a
128x128 white canvas, item only no character body visible, clean pixel art
with dark outlines, no text no words
```

| Item ID | ITEM DESCRIPTION | POSITION |
|---------|-----------------|----------|
| reed_hat | wide woven straw hat, natural tan color, frog-market style | top-center |
| ferry_kepi | dark red military cap with gold trim | top-center |
| shell_cap | rounded brown shell-shaped cap | top-center |
| mudwall_helm | grey stone-texture rounded helmet, gold visor stripe | top-center |
| lily_bloom | pink lily flower hair ornament with yellow center | top-center |
| marsh_hood | deep indigo hooded cowl covering head | top-center |
| basin_cloak | rust-brown cloak with lighter edge trim, open at front | center, body-covering, transparent head area |
| ferry_shawl | warm orange-tan travel shawl, wraps shoulders and body | center, body-covering, transparent head area |
| croakend_weave | patchwork cloak with red/yellow/blue/pink fabric patches | center, body-covering, transparent head area |
| levy_mantle | dark navy mantle with gold stripe border top and bottom | center, body-covering, transparent head area |
| rain_poncho | steel-blue waterproof poncho | center, body-covering, transparent head area |
| elder_robe | deep purple ceremonial robe with gold collar jewel | center, body-covering, transparent head area |
| market_scarf | red neck scarf with flowing tail | chest/neck area |
| clay_bead | orange clay bead necklace | neck area |
| reed_charm | small gold charm on a stick/reed | hip/hand area |

---

## Pipeline notes

- All prompts explicitly requested "no text, no words, no signage, no letters" — early generations leaked text/signage before this was added; discard any regenerations that still do.
- Sprites/NPCs/enemies/species stay as PNG at 256×256 for chroma-key transparency support (`CharacterSprites.ts` samples a corner pixel and keys out matching background color at load time, since these are plain-background renders rather than true alpha-cut sprites).
- Wardrobe overlays at 128×128 — same chromakey approach, no code change needed per new item.
- Locations/title art are WebP at ≤1600px wide — backdrops don't need transparency, and WebP cuts the interim-art footprint from ~40MB to ~3MB.
- **Procedural fallback is permanent.** If any file here is renamed, deleted, or fails to load, `drawCharacterCanvas`/`createCharacterMesh` keep working exactly as before — see `.cursor/rules/everden-art-pipeline.mdc`.
