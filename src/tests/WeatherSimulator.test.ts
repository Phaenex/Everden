import { describe, it, expect } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { DataRegistry } from '@/data/DataRegistry';
import { WeatherSimulator } from '@/simulation/WeatherSimulator';

describe('WeatherSimulator', () => {
  const table = { rain: 0.35, fog: 0.2, clear: 0.45 };

  it('rolls deterministically for the same day', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      locations: [{ id: 'reedwater_basin', name: 'Basin', biome: 'river', travelTimes: {}, weatherTable: table }],
    });
    const a = new WeatherSimulator(bus, data);
    const b = new WeatherSimulator(bus, data);
    a.rollForDay(5);
    b.rollForDay(5);
    expect(a.weather).toBe(b.weather);
  });

  it('emits weather:changed when weather shifts', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      locations: [{ id: 'reedwater_basin', name: 'Basin', biome: 'river', travelTimes: {}, weatherTable: table }],
    });
    const sim = new WeatherSimulator(bus, data);
    let changes = 0;
    bus.on('weather:changed', () => changes++);
    sim.rollForDay(1);
    sim.rollForDay(99);
    expect(changes).toBeGreaterThanOrEqual(1);
  });

  it('gives amphibians faster movement in rain', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      locations: [{ id: 'reedwater_basin', name: 'Basin', biome: 'river', travelTimes: {}, weatherTable: table }],
    });
    const sim = new WeatherSimulator(bus, data);
    sim.weather = 'rain';
    expect(sim.getMovementModifier('frog')).toBeGreaterThan(1);
    expect(sim.getMovementModifier('turtle')).toBeLessThan(1);
  });
});
