# Character Customization

How Everden's slice creator compares to BG3/MMO norms, and what's deferred.

## Slice (shipped in vertical slice)

| Feature | Everden slice | BG3 / MMO reference |
|---------|---------------|---------------------|
| Species / "class" | 5 folk; species = combat ability package | BG3: race + class; MMO: race + class |
| Stats | 5e point-buy (27 pts) + racial +2/+1 | BG3 standard point-buy; many MMOs use sliders or templates |
| Body look | Procedural: pattern, hue, markings | BG3: presets + sliders; MMO: morph targets |
| Gear look | 3 wardrobe slots (hat/cloak/accessory), procedural layers | Full armor dye / transmog (post-launch) |
| Identity | Name + arrival motivation | BG3 origin; MMO backstory often cosmetic |
| Live preview | Center portrait updates on every tab change | Expected in modern creators |
| Tab navigation | Any step in one click | BG3 camp mirror is in-game only |

## Post-launch (not in this overhaul)

- **Leveling / proficiency** — see [`LEVELING.md`](../systems/LEVELING.md)
- **In-game appearance mirror** (e.g. Mudwall guild mirror) — respec look without new game
- **Hand-drawn sprite sheets** (T6b) — wardrobe PNG overlays optional; procedural baseline stays
- **Pick-your-loadout abilities** — species remains the combat kit for slice
- **Full transmog / dye channels**

## Data paths

- Appearance + stats: `PlayerProfile` save v3
- Wardrobe catalog: `public/data/wardrobe.json`
- Racial bonuses: `public/data/species.json` → `racialBonuses`

## Tests

- `src/tests/PointBuy.test.ts` — pool math, racial apply
- `src/tests/PlayerProfile.test.ts` — v3 serialize, migration flag
- `e2e/character-creation.spec.ts` — tabbed creator flow
