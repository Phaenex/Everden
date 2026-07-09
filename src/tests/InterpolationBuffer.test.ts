import { describe, it, expect } from 'vitest';
import { InterpolationBuffer } from '@/net/InterpolationBuffer';

describe('InterpolationBuffer', () => {
  it('interpolates between snapshots', () => {
    const buf = new InterpolationBuffer(100);
    buf.push(0, 0, 0, 1000);
    buf.push(10, 0, 0, 1100);
    const sample = buf.sample(1150);
    expect(sample).not.toBeNull();
    expect(sample!.x).toBeGreaterThan(0);
    expect(sample!.x).toBeLessThan(10);
  });
});
