export interface RollResult {
  rolls: number[];
  total: number;
  natural: number;
}

export type Advantage = 'normal' | 'advantage' | 'disadvantage';

/**
 * Seeded-capable dice roller for combat and checks.
 */
export class DiceRoller {
  private seed: number | null = null;

  setSeed(seed: number): void {
    this.seed = seed;
  }

  clearSeed(): void {
    this.seed = null;
  }

  d20(advantage: Advantage = 'normal'): RollResult {
    const r1 = this.roll(20);
    if (advantage === 'normal') {
      return { rolls: [r1], total: r1, natural: r1 };
    }
    const r2 = this.roll(20);
    const rolls = [r1, r2];
    const total = advantage === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
    return { rolls, total, natural: total };
  }

  parseAndRoll(notation: string): number {
    const match = notation.match(/^(\d+)d(\d+)$/);
    if (!match) return 0;
    const count = parseInt(match[1]!, 10);
    const sides = parseInt(match[2]!, 10);
    let sum = 0;
    for (let i = 0; i < count; i++) sum += this.roll(sides);
    return sum;
  }

  roll(sides: number): number {
    if (this.seed !== null) {
      this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
      return (this.seed % sides) + 1;
    }
    return Math.floor(Math.random() * sides) + 1;
  }
}
