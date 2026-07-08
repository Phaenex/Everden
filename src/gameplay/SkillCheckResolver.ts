import { DiceRoller, type Advantage } from './DiceRoller';
import type { SpeciesStats } from '@/data/types';

export interface SkillCheckResult {
  success: boolean;
  natural: number;
  modifier: number;
  total: number;
  dc: number;
  stat: keyof SpeciesStats;
  label: string;
}

/**
 * d20 skill checks for dialogue and diplomacy — same math as combat.
 */
export class SkillCheckResolver {
  private roller = new DiceRoller();

  setSeed(seed: number): void {
    this.roller.setSeed(seed);
  }

  clearSeed(): void {
    this.roller.clearSeed();
  }

  roll(
    stat: keyof SpeciesStats,
    statValue: number,
    dc: number,
    label = 'Check',
    bonus = 0,
    advantage: Advantage = 'normal',
  ): SkillCheckResult {
    const modifier = Math.floor((statValue - 10) / 2) + bonus;
    const roll = this.roller.d20(advantage);
    const total = roll.total + modifier;
    const success = total >= dc;

    return {
      success,
      natural: roll.natural,
      modifier,
      total,
      dc,
      stat,
      label,
    };
  }

  formatResult(r: SkillCheckResult): string {
    const outcome = r.success ? 'Success' : 'Failure';
    return `${r.label}: d20(${r.natural})${r.modifier >= 0 ? '+' : ''}${r.modifier}=${r.total} vs DC ${r.dc} — ${outcome}`;
  }
}
