import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';

describe('EventBus', () => {
  it('publishes and subscribes', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('test', fn);
    bus.emit('test', { value: 1 });
    expect(fn).toHaveBeenCalledWith({ value: 1 });
  });

  it('unsubscribes via returned function', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    const off = bus.on('test', fn);
    off();
    bus.emit('test');
    expect(fn).not.toHaveBeenCalled();
  });
});
