import { describe, it, expect } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { DataRegistry } from '@/data/DataRegistry';
import { WorldClock } from '@/simulation/WorldClock';
import { WeatherSimulator } from '@/simulation/WeatherSimulator';

/**
 * 7-day weather soak — no crashes, valid weather states throughout.
 */
describe('Weather soak', () => {
  it('simulates 7 in-game days without invalid state', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      locations: [
        {
          id: 'reedwater_basin',
          name: 'Basin',
          biome: 'river',
          travelTimes: {},
          weatherTable: { rain: 0.35, fog: 0.2, clear: 0.45 },
        },
      ],
    });

    const clock = new WorldClock(bus);
    const weather = new WeatherSimulator(bus, data);
    clock.init();
    weather.init();

    const seen = new Set<string>();
    bus.on<{ weather: string }>('weather:changed', (p) => seen.add(p.weather));

    for (let h = 0; h < 7 * 24; h++) {
      clock.update(120);
    }

    expect(['clear', 'rain', 'fog']).toContain(weather.weather);
    expect(seen.size).toBeGreaterThanOrEqual(1);
    expect(clock.day).toBeGreaterThanOrEqual(7);
  });
});
