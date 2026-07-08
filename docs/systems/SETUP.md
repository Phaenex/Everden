# Development Setup

## Requirements

- Node.js 20+
- npm 10+

## Commands

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest unit tests
npm run typecheck # TypeScript check
npm run build     # Production bundle → dist/
npm run preview   # Preview production build
```

## Project Layout

See [ARCHITECTURE.md](ARCHITECTURE.md).

## Adding Content

1. Edit JSON in `public/data/`
2. Match schemas in [DATA_SCHEMA.md](DATA_SCHEMA.md)
3. Reload dev server

## Adding Pixel Art

Place sprites in `public/assets/sprites/`. Use 32×32, nearest-neighbor scaling. See [VISUAL_DIRECTION.md](../art/VISUAL_DIRECTION.md).

## Environment

No `.env` required for local dev. Production deploy uses static hosting (Vercel / Cloudflare Pages / GitHub Pages).
