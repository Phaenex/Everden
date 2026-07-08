import { describe, it, expect } from 'vitest';
import {
  POINT_BUY_POOL,
  applyRacial,
  defaultBaseStats,
  recommendedBaseStats,
  stripRacial,
  totalPointCost,
  validatePointBuy,
  adjustBaseStat,
} from '@/gameplay/PointBuy';
import type { SpeciesDefinition } from '@/data/types';

const frogSpecies: SpeciesDefinition = {
  id: 'frog',
  name: 'Frog Folk',
  role: 'mobile',
  color: '#5c7a52',
  racialBonuses: { plus2: 'dex', plus1: 'cha' },
  stats: { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 12 },
  combat: { ac: 12, initiativeMod: 2, abilities: ['leap'] },
};

describe('PointBuy', () => {
  it('defaults to 8 in every stat at zero cost', () => {
    const base = defaultBaseStats();
    expect(totalPointCost(base)).toBe(0);
    expect(validatePointBuy(base).ok).toBe(true);
    expect(validatePointBuy(base).remaining).toBe(POINT_BUY_POOL);
  });

  it('recommended frog spread is valid and strips/applies racial bonuses', () => {
    const base = recommendedBaseStats(frogSpecies);
    expect(base.dex).toBe(12);
    expect(base.cha).toBe(11);
    expect(totalPointCost(base)).toBe(13);
    expect(validatePointBuy(base).ok).toBe(true);
    const final = applyRacial(base, frogSpecies.racialBonuses);
    expect(final).toEqual(frogSpecies.stats);
    expect(stripRacial(final, frogSpecies.racialBonuses)).toEqual(base);
  });

  it('rejects spending more than the pool', () => {
    const greedy = { str: 15, dex: 15, con: 15, int: 15, wis: 8, cha: 8 };
    expect(validatePointBuy(greedy).ok).toBe(false);
  });

  it('adjustBaseStat refuses changes that exceed the pool', () => {
    const maxed = { str: 15, dex: 14, con: 13, wis: 13, int: 9, cha: 8 };
    expect(totalPointCost(maxed)).toBe(27);
    const bumped = adjustBaseStat(maxed, 'con', 1);
    expect(bumped).toEqual(maxed);
  });
});
