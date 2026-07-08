import type { EventBus } from '@/core/EventBus';
import type { ISaveable } from '@/core/IGameModule';
import type { ItemDefinition, RollModifier } from '@/data/types';

export interface InventoryState {
  gold: number;
  items: string[];
}

/**
 * Player inventory and equipped roll modifiers.
 */
export class Inventory implements ISaveable {
  readonly saveKey = 'inventory';
  gold = 50;
  items: string[] = [];
  equipped: string[] = [];

  constructor(
    private eventBus: EventBus,
    private getItem: (id: string) => ItemDefinition | undefined,
  ) {}

  addItem(id: string): void {
    this.items.push(id);
    this.eventBus.emit('inventory:changed', { items: [...this.items] });
  }

  equip(id: string): void {
    if (!this.items.includes(id)) return;
    if (!this.equipped.includes(id)) this.equipped.push(id);
  }

  getRollModifiers(rollType: string): RollModifier[] {
    const mods: RollModifier[] = [];
    for (const id of this.equipped) {
      const item = this.getItem(id);
      if (!item?.rollModifiers) continue;
      for (const m of item.rollModifiers) {
        if (m.rollType === rollType || m.rollType === 'all') mods.push(m);
      }
    }
    return mods;
  }

  serialize(): InventoryState & { equipped: string[] } {
    return { gold: this.gold, items: [...this.items], equipped: [...this.equipped] };
  }

  deserialize(data: unknown): void {
    const state = data as InventoryState & { equipped?: string[] };
    this.gold = state.gold;
    this.items = [...state.items];
    this.equipped = [...(state.equipped ?? [])];
  }
}
