import { describe, it, expect } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { WorldClock } from '@/simulation/WorldClock';
import { TravelManager } from '@/gameplay/TravelManager';

describe('TravelManager', () => {
  it('travels between lilypond and ferry rest and advances clock', () => {
    const bus = new EventBus();
    const clock = new WorldClock(bus);
    clock.init();
    const startHour = clock.hour;
    const travel = new TravelManager(bus, clock);
    const moved: Array<{ x: number; z: number }> = [];
    bus.on<{ x: number; y: number; z: number }>('player:moved', (p) => moved.push({ x: p.x, z: p.z }));

    const dest = travel.travel('ferry_rest');
    expect(dest?.name).toContain('Ferry');
    expect(travel.getZone()).toBe('ferry_rest');
    expect(clock.hour).not.toBe(startHour);
    expect(moved.at(-1)).toEqual({ x: -4.5, z: -3.5 });

    travel.travel('lilypond');
    expect(travel.getZone()).toBe('lilypond');
  });

  it('persists zone through serialize/deserialize', () => {
    const bus = new EventBus();
    const clock = new WorldClock(bus);
    const travel = new TravelManager(bus, clock);
    travel.travel('ferry_rest');
    const saved = travel.serialize();
    const fresh = new TravelManager(bus, clock);
    fresh.deserialize(saved);
    expect(fresh.getZone()).toBe('ferry_rest');
  });
});
