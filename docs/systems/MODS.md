# Mod Support (Future)

## Manifest

`/mods/my_pack/mod.json`:

```json
{
  "id": "my_pack",
  "name": "My Everden Pack",
  "version": 1,
  "dataFiles": ["species.json", "items.json"]
}
```

## Load Order

1. Base `public/data/`
2. Mod files merge by id (mod overrides base)

## API

`ModLoader.loadAll()` → `DataRegistry.loadFromObject(merged)`

## Safety

- Validate against `src/data/types.ts` shapes
- Reject unknown fields in production builds
- Server validates mod hash on multiplayer join
