# Data Schema

All game definitions live in `public/data/`. Loaded at boot by `DataRegistry`.

## File Index

| File | Contents |
|------|----------|
| `species.json` | Species stats, abilities, culture tags |
| `npcs.json` | NPC definitions, schedules, dialogue ids |
| `items.json` | Items, roll modifiers, prices |
| `goods.json` | Trade goods for economy |
| `quests.json` | Quest stages, objectives, flags |
| `dialogue.json` | Dialogue trees |
| `encounters.json` | Combat encounters |
| `locations.json` | Scene nodes, travel times |

## species.json

```json
{
  "id": "frog",
  "name": "Frog Folk",
  "role": "mobile",
  "stats": { "str": 8, "dex": 14, "con": 10, "int": 10, "wis": 10, "cha": 12 },
  "combat": {
    "ac": 12,
    "initiativeMod": 2,
    "abilities": ["leap", "tongue_lash", "amphibious_rush"]
  }
}
```

## npcs.json

```json
{
  "id": "pip_marshwick",
  "name": "Pip Marshwick",
  "species": "frog",
  "faction": "lilymarket_traders",
  "home": "lilymarket_stall_3",
  "workplace": "lilymarket_stall_3",
  "schedule": [
    { "startHour": 8, "endHour": 18, "activity": "work", "location": "lilymarket" }
  ],
  "dialogueId": "pip_intro"
}
```

## items.json

```json
{
  "id": "reed_hop_charm",
  "name": "Reed Hop Charm",
  "type": "trinket",
  "rollModifiers": [
    { "rollType": "attack", "bonus": 1 },
    { "rollType": "initiative", "extraDice": "1d4" }
  ],
  "price": 25
}
```

## quests.json

```json
{
  "id": "what_water_remembers",
  "title": "What the Water Remembers",
  "stages": [
    {
      "id": "cellar",
      "objectives": [{ "type": "examine", "target": "flooded_cellar" }],
      "next": "mason_measure"
    }
  ],
  "rewards": { "gold": 50, "reputation": { "lilymarket_traders": 10 } }
}
```

## dialogue.json

```json
{
  "id": "pip_intro",
  "nodes": [
    {
      "id": "start",
      "speaker": "Pip Marshwick",
      "text": "You picked a wet week to visit Lilypond.",
      "choices": [
        { "text": "What's wrong?", "next": "cellar_hook" },
        { "text": "Just passing through.", "next": "end" }
      ]
    }
  ]
}
```

## Save Format (localStorage key: `everden_save_v1`)

```json
{
  "version": 1,
  "timestamp": 0,
  "modules": {
    "worldState": { "flags": {}, "reputation": {} },
    "worldClock": { "totalMinutes": 0 },
    "questManager": { "active": {}, "completed": [] },
    "inventory": { "items": [] },
    "npcSimulator": { "states": {} }
  }
}
```

## Validation

Types defined in `src/data/types.ts`. Registry validates required fields at load; logs errors, skips invalid entries.
