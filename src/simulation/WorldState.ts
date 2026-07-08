import type { EventBus } from '@/core/EventBus';
import type { ISaveable } from '@/core/IGameModule';

export type FlagValue = boolean | string | number;

export interface WorldStateData {
  flags: Record<string, FlagValue>;
  reputation: Record<string, number>;
}

/**
 * Global world flags and faction reputation.
 */
export class WorldState implements ISaveable {
  readonly saveKey = 'worldState';
  private flags: Record<string, FlagValue> = {};
  private reputation: Record<string, number> = {};

  constructor(private eventBus: EventBus) {}

  setFlag(key: string, value: FlagValue): void {
    this.flags[key] = value;
    this.eventBus.emit('world:flag', { key, value });
  }

  getFlag(key: string): FlagValue | undefined {
    return this.flags[key];
  }

  hasFlag(key: string, value?: FlagValue): boolean {
    if (value === undefined) return key in this.flags;
    return this.flags[key] === value;
  }

  addReputation(faction: string, amount: number): void {
    this.reputation[faction] = (this.reputation[faction] ?? 0) + amount;
    this.eventBus.emit('reputation:changed', { faction, value: this.reputation[faction] });
  }

  getReputation(faction: string): number {
    return this.reputation[faction] ?? 0;
  }

  serialize(): WorldStateData {
    return { flags: { ...this.flags }, reputation: { ...this.reputation } };
  }

  deserialize(data: unknown): void {
    const state = data as WorldStateData;
    this.flags = { ...state.flags };
    this.reputation = { ...state.reputation };
  }
}
