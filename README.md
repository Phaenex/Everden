# Everden

**A game by [Nanabozho](docs/studio/NANABOZHO.md)** · *nah-nah-BOH-zhoh*

A living, believable animal-folk fantasy RPG — playable in the browser.

Everden is a 2.5D isometric world where pixel-art characters inhabit Three.js-rendered wetlands, river towns, and layered wilds. Civilizations grow from biology, geography, and history. The world existed long before you arrived.

## Vision

Cozy social worlds · classic tabletop fantasy · MMORPG persistence · living simulation — original IP, not a clone.

**Launch species:** frogs, toads, turtles. Biology drives culture and combat.

## Technical Stack

| Layer | Choice |
|-------|--------|
| Runtime | Browser (WebGL) |
| Build | Vite + TypeScript |
| Rendering | Three.js (2.5D isometric) |
| Data | JSON definitions |
| Architecture | Modular, event-driven, feature-based |
| Tests | Vitest + Playwright |

## Design Pillars

1. **Believability before fun**
2. **Biology shapes culture**
3. **Geography first**
4. **Living world** — NPCs, markets, politics run without the player
5. **Internal consistency** — expand lore, never contradict

## Project Structure

```
Everden/
├── docs/           # Constitution, world bible, studio branding
├── public/data/    # JSON game definitions
├── src/            # TypeScript source
│   ├── core/       # Bootstrap, events, save
│   ├── data/       # Registries
│   ├── presentation/
│   ├── simulation/
│   ├── gameplay/
│   └── ui/
├── index.html
└── package.json
```

## Documentation

| Doc | Description |
|-----|-------------|
| **[Master Build Plan](docs/MASTER_BUILD_PLAN.md)** | **Gated phases V1–V5 + visual QA agents** |
| **[Progress Tracker](docs/PROGRESS.md)** | **Start here — % complete, tasks, check-ins** |
| [Project Constitution](docs/PROJECT_CONSTITUTION.md) | Master design rules |
| [Nanabozho](docs/studio/NANABOZHO.md) | Studio identity |
| [Branding](docs/studio/BRANDING.md) | Visual and tone guide |
| [Ideas Log](docs/IDEAS.md) | Shared brainstorming |
| [Characters](docs/CHARACTERS.md) | Full cast roster |
| [Playtest Protocol](docs/PLAYTEST.md) | Vertical slice QA |
| [Setup](docs/systems/SETUP.md) | Dev environment |

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest
npm run lint     # ESLint
npm run build    # Production bundle
npm run deploy:preview  # Build + deploy to Vercel (everden-chi.vercel.app)
```

## Status

**Systems ~72% · Experience ~42% · Overall ~52%** — V1 scout AR-002 PASS. Play at [everden-chi.vercel.app](https://everden-chi.vercel.app). See [Master Build Plan](docs/MASTER_BUILD_PLAN.md).

## License

All rights reserved. © Nanabozho
