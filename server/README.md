# Everden Colyseus Server

Authoritative multiplayer room server for Everden districts.

## Dev

```bash
npm install --prefix server
npm run server:dev
```

Server listens on `http://localhost:2567` (WebSocket).

## Client

Set in `.env.local`:

```
VITE_COLYSEUS_URL=ws://localhost:2567
```

## Load test (16 bots)

```bash
cd server && BOTS=16 npm run loadtest
```

## Deploy (Fly.io)

```bash
cd server && fly deploy
```

Set `VITE_COLYSEUS_URL` on Vercel to the Fly WebSocket URL.

## Architecture

- `SceneRoom` — one room per district instance (up to 50 players)
- Shared `MovementSim` + `NavMesh` — server validates walk intents
- `PartyService` — up to 16 members per party
- `NpcAuthority` — server-side NPC positions
- `CombatAuthority` — turn-order validation for shared combat
- `AntiCheat` — walk target bounds + speed clamps
