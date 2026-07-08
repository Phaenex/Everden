# Visual Direction

## Style Target

2.5D isometric. Pixel-art characters in Three.js-lit environments. Timeless wetland palette — not trendy neon.

**References (mood only, not copies):** Baldur's Gate map readability · Habbo social warmth · cozy sim atmosphere

## Camera

- **Type:** Orthographic, fixed isometric angle (~30° elevation, ~45° rotation)
- **Follow:** Smooth lerp on player position
- **Bounds:** Clamped to region bounds per scene

## Sprite Spec (Locked for Slice)

| Property | Value |
|----------|-------|
| Base resolution | 32×32 px per frame |
| Facing | 4-direction (N, E, S, W) |
| Filter | Nearest (no blur) |
| Billboard | Y-axis fixed; face camera quadrant |
| Sort key | `worldY * 1000 + worldX` |

## Environment

- District backdrops are empty stages. Never bake characters, NPCs, or text into location art. Keep a clear central walkable floor.
- Character sprites render on a single flat solid background color distinct from the character, so the load-time chroma key cuts cleanly.
- Low-poly meshes for ground, walls, props
- Reed clusters as alpha-cutout planes or instanced quads
- Water: reflective plane + animated UV scroll
- Lighting: warm sun, cool fill, amber point lights at night (lanterns)

## Palette — Reedwater Basin

See [BRANDING.md](../studio/BRANDING.md). Dominant greens and browns. Lily white accents. Flood scenes add murky olive.

## Layering

1. Ground plane (water, mud, stone causeway)
2. Floor objects (stalls, crates)
3. Characters (depth-sorted sprites)
4. Foreground occluders (reeds, bridge rails) — parallax optional

## Weather VFX

- Rain: particle system, screen-space drizzle
- Fog: distance fog in autumn
- Night: reduced ambient, lantern pools

## Animation (Slice Minimum)

- Idle: 2 frames
- Walk: 4 frames per direction
- Combat: attack flash + log text (no full combat anim required for slice)

## Placeholder Policy

Greybox uses colored capsules/boxes per species until pixel art arrives:
- Frog: `#5c7a52`
- Toad: `#4a3728`
- Turtle: `#1a3c34`

## UI

Field-journal aesthetic. Parchment panels on marsh green. Dice results in monospace.
