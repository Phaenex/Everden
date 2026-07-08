# Content Pipeline

Workflow for adding world content without code changes.

## Flow

```
Culture sheet (docs/world/species/*.md)
    → JSON definitions (public/data/)
    → NPC placement (npcs.json positions)
    → Dialogue (dialogue.json)
    → Quest hooks (quests.json)
    → Playtest checklist
```

## Checklist — New NPC

1. [ ] Species and faction in culture/faction docs
2. [ ] Entry in `npcs.json` with schedule and position
3. [ ] Dialogue tree in `dialogue.json`
4. [ ] Interactable registered (auto from npcs in bootstrap)
5. [ ] Lore consistency review

## Checklist — New Quest

1. [ ] VERTICAL_SLICE-style outline in `docs/narrative/`
2. [ ] Stages in `quests.json`
3. [ ] World flags documented
4. [ ] Objectives wired (examine, flag, talk)
5. [ ] Debug bot walkthrough

## Checklist — New Species

1. [ ] Culture sheet in `docs/world/species/`
2. [ ] `species.json` + `abilities.json`
3. [ ] Combat role playtest
4. [ ] Placeholder sprite color in VISUAL_DIRECTION

## Art Import

- Sprites: `public/assets/sprites/{species}/{action}_{dir}.png`
- 32×32, transparent PNG
- Atlas optional for Phase 10 polish

## Audio Naming

`public/audio/{biome}/{event}.ogg` — e.g. `reedwater/rain_loop.ogg`
