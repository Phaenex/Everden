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

## Demo pack (repo)

`public/mods/demo_pack/` — overrides Pip's display name only. Load in dev:

```typescript
import { ModLoader } from '@/core/ModLoader';
await modLoader.loadMod('/mods/demo_pack', { id: 'demo_pack', name: 'Demo', version: 1, dataFiles: ['npcs.json'] });
```

Not auto-loaded at boot yet (post-V5).

## API

`ModLoader.loadAll()` → `DataRegistry.loadFromObject(merged)`

## Safety

- Validate against `src/data/types.ts` shapes
- Reject unknown fields in production builds
- Server validates mod hash on multiplayer join
