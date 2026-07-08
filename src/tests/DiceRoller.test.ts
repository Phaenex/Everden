import { describe, it, expect } from 'vitest';
import { DiceRoller } from '@/gameplay/DiceRoller';

describe('DiceRoller', () => {
  it('rolls within bounds', () => {
    const roller = new DiceRoller();
    for (let i = 0; i < 50; i++) {
      const r = roller.roll(20);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(20);
    }
  });

  it('parses dice notation', () => {
    const roller = new DiceRoller();
    roller.setSeed(42);
    const result = roller.parseAndRoll('2d6');
    expect(result).toBeGreaterThanOrEqual(2);
    expect(result).toBeLessThanOrEqual(12);
  });

  it('is deterministic with seed', () => {
    const a = new DiceRoller();
    const b = new DiceRoller();
    a.setSeed(99);
    b.setSeed(99);
    expect(a.d20().total).toBe(b.d20().total);
  });

  it('advantage takes higher', () => {
    const roller = new DiceRoller();
    roller.setSeed(1);
    const r = roller.d20('advantage');
    expect(r.rolls.length).toBe(2);
    expect(r.total).toBe(Math.max(r.rolls[0]!, r.rolls[1]!));
  });
});
