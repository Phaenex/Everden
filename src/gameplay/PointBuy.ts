import type { SpeciesDefinition, SpeciesStats } from '@/data/types';

export const POINT_BUY_POOL = 27;
export const STAT_MIN = 8;
export const STAT_MAX = 15;

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

const COST_TABLE: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export function pointCost(score: number): number {
  return COST_TABLE[score] ?? 0;
}

export function defaultBaseStats(): SpeciesStats {
  return { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
}

export function totalPointCost(base: SpeciesStats): number {
  return STAT_KEYS.reduce((sum, key) => sum + pointCost(base[key]), 0);
}

export function validatePointBuy(base: SpeciesStats): { ok: boolean; spent: number; remaining: number } {
  let spent = 0;
  for (const key of STAT_KEYS) {
    const score = base[key];
    if (score < STAT_MIN || score > STAT_MAX) {
      return { ok: false, spent, remaining: POINT_BUY_POOL - spent };
    }
    spent += pointCost(score);
  }
  return { ok: spent <= POINT_BUY_POOL, spent, remaining: POINT_BUY_POOL - spent };
}

export function applyRacial(
  base: SpeciesStats,
  bonuses: SpeciesDefinition['racialBonuses'],
): SpeciesStats {
  if (!bonuses) return { ...base };
  const result = { ...base };
  result[bonuses.plus2] = result[bonuses.plus2] + 2;
  result[bonuses.plus1] = result[bonuses.plus1] + 1;
  return result;
}

/** Strip racial bonuses to recover point-buy base from a recommended final spread. */
export function stripRacial(
  final: SpeciesStats,
  bonuses: SpeciesDefinition['racialBonuses'],
): SpeciesStats {
  if (!bonuses) return { ...final };
  const base = { ...final };
  base[bonuses.plus2] = base[bonuses.plus2] - 2;
  base[bonuses.plus1] = base[bonuses.plus1] - 1;
  return base;
}

export function recommendedBaseStats(species: SpeciesDefinition): SpeciesStats {
  if (species.racialBonuses) {
    return stripRacial(species.stats, species.racialBonuses);
  }
  return { ...species.stats };
}

export function recommendedFinalStats(species: SpeciesDefinition): SpeciesStats {
  return { ...species.stats };
}

export function clampStat(score: number): number {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, score));
}

export function adjustBaseStat(base: SpeciesStats, key: keyof SpeciesStats, delta: number): SpeciesStats {
  const next = { ...base, [key]: clampStat(base[key] + delta) };
  const validation = validatePointBuy(next);
  if (!validation.ok) return base;
  return next;
}
