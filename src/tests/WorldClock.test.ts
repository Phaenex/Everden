import { describe, it, expect } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { WorldClock } from '@/simulation/WorldClock';

describe('WorldClock', () => {
  it('starts at day 1 hour 8', () => {
    const bus = new EventBus();
    const clock = new WorldClock(bus);
    clock.init();
    expect(clock.day).toBe(1);
    expect(clock.hour).toBe(8);
  });

  it('advances hours', () => {
    const bus = new EventBus();
    const clock = new WorldClock(bus);
    clock.advanceHours(3);
    expect(clock.hour).toBe(11);
  });

  it('emits hour events on update', () => {
    const bus = new EventBus();
    const clock = new WorldClock(bus);
    let hours = 0;
    bus.on('time:hour', () => hours++);
    clock.update(120);
    expect(hours).toBeGreaterThan(0);
  });

  it('serializes and deserializes', () => {
    const bus = new EventBus();
    const clock = new WorldClock(bus);
    clock.advanceHours(10);
    const data = clock.serialize();
    const clock2 = new WorldClock(bus);
    clock2.deserialize(data);
    expect(clock2.hour).toBe(clock.hour);
  });
});
