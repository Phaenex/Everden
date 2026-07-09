import { describe, it, expect } from 'vitest';
import { applySeparation } from '@/engine/Separation';

describe('Separation', () => {
  it('pushes overlapping agents apart', () => {
    const offsets = applySeparation([
      { id: 'a', x: 0, z: 0 },
      { id: 'b', x: 0.1, z: 0 },
    ]);
    const a = offsets.get('a')!;
    const b = offsets.get('b')!;
    expect(a.x).toBeLessThan(0);
    expect(b.x).toBeGreaterThan(0);
  });
});
