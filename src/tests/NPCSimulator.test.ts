import { describe, it, expect } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { DataRegistry } from '@/data/DataRegistry';
import { NPCSimulator } from '@/simulation/NPCSimulator';
import type { NPCDefinition } from '@/data/types';

const mockNpcs: NPCDefinition[] = [
  {
    id: 'npc_a',
    name: 'Test NPC',
    species: 'frog',
    faction: 'test',
    home: 'home',
    workplace: 'work',
    schedule: [
      { startHour: 8, endHour: 12, activity: 'work', location: 'lilymarket' },
      { startHour: 12, endHour: 18, activity: 'work', location: 'mudwall' },
    ],
    dialogueId: 'test',
    position: { x: 0, y: 0, z: 0 },
  },
];

describe('NPCSimulator soak', () => {
  it('completes 7 days of hourly ticks without stuck state', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({ npcs: mockNpcs });
    const sim = new NPCSimulator(bus, data);
    sim.init();

    let hour = 8;
    for (let h = 0; h < 7 * 24; h++) {
      bus.emit('time:hour', { hour, day: Math.floor(h / 24) + 1 });
      hour = (hour + 1) % 24;
    }

    const state = sim.getState('npc_a');
    expect(state).toBeDefined();
    expect(state!.location).toMatch(/lilymarket|mudwall/);
  });

  it('matches overnight schedule windows the same way NpcPresence does', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      npcs: [
        {
          id: 'night_npc',
          name: 'Night',
          species: 'frog',
          faction: 'test',
          home: 'home',
          workplace: 'work',
          schedule: [{ startHour: 18, endHour: 8, activity: 'sleep', location: 'ferry_rest' }],
          dialogueId: 'test',
          position: { x: 0, y: 0, z: 0 },
        },
      ] as never,
    });
    const sim = new NPCSimulator(bus, data);
    sim.init();

    bus.emit('time:hour', { hour: 20, day: 1 });
    expect(sim.getState('night_npc')!.location).toBe('ferry_rest');

    bus.emit('time:hour', { hour: 10, day: 2 });
    expect(sim.getState('night_npc')!.location).toBe('ferry_rest');
  });
});
