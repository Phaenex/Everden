# Habbo-Style Sprite Spec (layered + animation-ready)

Matches the reference frogs (isometric 3/4, thick black outlines, cell shading). All layers share one grid so outfits and idle motion composite without hand nudging.

## Body builds (Baldur's Gate–style)

Three builds per species, separate PNG sheets:

| `build` | Label | File pattern |
|---------|-------|--------------|
| 0 | Slim | `sprites/species/{id}_slim_p{n}.png` |
| 1 | Medium (default) | `sprites/species/{id}_medium_p{n}.png` |
| 2 | Stout | `sprites/species/{id}_heavy_p{n}.png` |

`p{n}` is p1–p4 (maps to `appearance.variant` 0–3). Falls back `_p1` → legacy `{id}_{build}.png` → `{id}.png` → procedural.

## Canvas

| Property | Value |
|----------|-------|
| Frame size | **128×128 px** per frame |
| Background | Flat **white** `#FFFFFF` (chromakey at load) |
| Facing | **SE isometric** (Habbo default — body turned slightly right, feet on ground line) |
| Filter | Nearest neighbor only |

## Anchor grid (same on every layer)

```
y=0–28   hat slot (empty on body sheet)
y=28–52  head + face
y=52–88  torso + arms (cloak wraps here; arms stay on top for held items)
y=88–108 legs
y=108–120 feet baseline (character "stands" on y≈112)
x=64     horizontal center (foot midpoint)
```

Feet center **(64, 112)** is the ground contact point. Billboards and depth sort use this.

## Layer order (draw back → front)

1. `cloak` — behind body; transparent hole at head/arms
2. `body` — species base (no clothing)
3. `accessory` — neck/chest (scarf, beads)
4. `hat` — on head
5. `held` — weapon/tool in front of body (future slot)

## File paths

| Asset | Path |
|-------|------|
| Species body (idle sheet) | `public/assets/sprites/species/{id}.png` |
| Wardrobe overlay | `public/assets/sprites/wardrobe/{itemId}.png` |
| Held item overlay | `public/assets/sprites/wardrobe/held_{itemId}.png` |

One PNG per species for slice: **2-frame horizontal strip** `256×128` (idle A | idle B). Loader uses frame 0 until animation is wired; frame 1 is a 1–2px vertical bob for future idle loop.

## Wardrobe overlay rules

- Same **128×128** frame size and **SE isometric** angle as body.
- **Only draw the item** — rest of canvas stays white (keyed out).
- Hat brims sit at **y≈30–42**; cloak covers **y≈50–100** with head cutout.
- Do not redraw the body on item PNGs.

## AI prompt template (body)

```
Pixel art game sprite sheet, 2 frames side by side in one 256x128 image (128x128 per frame).
[SPECIES]. BASE BODY ONLY — no hat, cloak, weapon, or clothing.
Match Habbo Hotel isometric style: SE 3/4 view facing bottom-right, thick black 1px outlines,
cell shading light from top-left, [TEXTURE]. Large round eyes [EYE COLOR] sclera black pupil.
Feet centered on bottom edge y=112. Frame 2 is identical pose with body shifted 2px down (idle bob).
Plain white background, no text.
```

## AI prompt template (wardrobe overlay)

```
Pixel art wardrobe overlay only, 128x128, white background, SE isometric Habbo angle matching
frog body reference. [ITEM DESCRIPTION]. Item only — no character body. Black outlines,
cell shading. Position: [hat top-center | cloak body with head hole | accessory neck].
No text.
```

## Species palette notes

| ID | Body | Eyes | Texture |
|----|------|------|---------|
| frog | lime `#5cb838` + shadow `#2e7028` | tan sclera | dark green stipple spots |
| toad | golden brown `#8a6830` | amber | warty bumps |
| turtle | forest green `#3a7848` | brown | domed shell hump behind head |
| tortoise | olive `#5a6840` | amber | wide flat shell, wrinkled neck |
| vole | brown-grey `#8a7868` | black | large pink inner ears, cream belly |

## Code hooks

- `loadArtCanvas(species)` → body sheet (frame 0 for now)
- `applyWardrobeOverlayAsync(canvas, appearance, …)` → PNG overlays per slot
- Procedural `drawCharacterCanvas` remains fallback if PNG missing
