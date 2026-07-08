import { describe, it, expect } from 'vitest';
import { SkillCheckResolver } from '@/gameplay/SkillCheckResolver';

describe('SkillCheckResolver', () => {
  it('rolls against DC with visible math', () => {
    const resolver = new SkillCheckResolver();
    resolver.setSeed(42);
    const result = resolver.roll('int', 14, 13, 'History');
    expect(result.modifier).toBe(2);
    expect(result.dc).toBe(13);
    expect(result.natural).toBeGreaterThanOrEqual(1);
    expect(result.natural).toBeLessThanOrEqual(20);
    expect(result.total).toBe(result.natural + result.modifier);
    expect(result.success).toBe(result.total >= 13);
    expect(resolver.formatResult(result)).toContain('History');
    expect(resolver.formatResult(result)).toContain('vs DC 13');
  });

  it('uses flat DC for ability checks — nat 1 can succeed if total meets DC, nat 20 can fail if total does not (RAW)', () => {
    const resolver = new SkillCheckResolver();
    resolver.setSeed(1);
    const lowDc = resolver.roll('cha', 10, 1, 'Easy');
    expect(lowDc.natural).toBeGreaterThanOrEqual(1);
    expect(lowDc.success).toBe(lowDc.total >= 1);

    resolver.setSeed(1);
    const highDc = resolver.roll('cha', 10, 99, 'Impossible');
    expect(highDc.success).toBe(highDc.total >= 99);
    resolver.clearSeed();
  });
});
