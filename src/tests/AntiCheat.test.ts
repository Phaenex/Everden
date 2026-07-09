import { describe, it, expect } from 'vitest';
import { validateWalkTarget } from '../../server/src/services/AntiCheat.js';

describe('AntiCheat', () => {
  const walkable = (x: number, z: number) => Math.abs(x) < 10 && Math.abs(z) < 10;

  it('rejects out-of-bounds targets', () => {
    expect(validateWalkTarget(0, 0, 99, 0, walkable)).toBe(false);
  });

  it('accepts nearby walkable targets', () => {
    expect(validateWalkTarget(0, 0, 2, 1, walkable)).toBe(true);
  });
});
