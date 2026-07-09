/**
 * Simple load-test harness — spawns N bot clients that walk randomly.
 * Run: npm run loadtest (from server/)
 */
import { Client } from 'colyseus.js';

const URL = process.env.COLYSEUS_URL ?? 'ws://localhost:2567';
const BOTS = Number(process.env.BOTS ?? 50);

async function main(): Promise<void> {
  const client = new Client(URL);
  const rooms = [];
  for (let i = 0; i < BOTS; i++) {
    const room = await client.joinOrCreate('scene', {
      sceneId: 'causeway',
      playerId: `bot-${i}`,
      name: `Bot${i}`,
      species: 'frog',
    });
    rooms.push(room);
    setInterval(() => {
      room.send('walk', { x: (Math.random() - 0.5) * 10, z: (Math.random() - 0.5) * 6 });
    }, 2000 + Math.random() * 3000);
  }
  console.log(`Load test: ${BOTS} bots in ${URL}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
