import { describe, it, expect } from 'vitest';
import { RoomRegistry } from '../../server/src/services/RoomRegistry.js';

describe('RoomRegistry', () => {
  it('finds available instance with capacity', () => {
    const reg = new RoomRegistry(50);
    reg.register('room-a', 'causeway');
    reg.setPlayerCount('room-a', 10);
    expect(reg.findAvailableInstance('causeway')).toBe('room-a');
    reg.setPlayerCount('room-a', 50);
    expect(reg.findAvailableInstance('causeway')).toBeNull();
  });
});
