import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { SceneRoom } from './rooms/SceneRoom.js';

const PORT = Number(process.env.PORT ?? 2567);
const startTime = Date.now();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'everden-colyseus', uptimeSec: Math.floor((Date.now() - startTime) / 1000) });
});

app.get('/metrics', (_req, res) => {
  res.json({
    uptimeSec: Math.floor((Date.now() - startTime) / 1000),
    service: 'everden-colyseus',
  });
});

const httpServer = createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define('scene', SceneRoom);

httpServer.listen(PORT, () => {
  console.log(`Everden Colyseus listening on :${PORT}`);
});
