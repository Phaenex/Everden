import type { EventBus } from '@/core/EventBus';
import type { ISaveable } from '@/core/IGameModule';
import type { DataRegistry } from '@/data/DataRegistry';

import type { JournalDefinition } from '@/data/types';

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  category: 'discovery' | 'quest' | 'lore';
  image?: string;
}

export interface JournalState {
  unlocked: string[];
}

/**
 * Discovery codex — unlocks from examines, quests, and world flags.
 */
export class JournalManager implements ISaveable {
  readonly saveKey = 'journal';
  private unlocked = new Set<string>();

  constructor(
    private eventBus: EventBus,
    private data: DataRegistry,
  ) {}

  init(): void {
    this.eventBus.on<{ type: string; target: string }>('objective:complete', (obj) => {
      if (obj.type === 'examine') this.tryUnlock('examine', obj.target);
    });
    this.eventBus.on<{ questId: string }>('quest:completed', (p) => {
      this.tryUnlock('quest_complete', p.questId);
    });
    this.eventBus.on<{ questId: string; stage: string }>('quest:stage', (p) => {
      this.tryUnlock('quest_stage', `${p.questId}:${p.stage}`);
    });
    this.eventBus.on<{ key: string; value: unknown }>('world:flag', (p) => {
      if (p.value === true) this.tryUnlock('flag', p.key);
    });
  }

  getEntries(): JournalEntry[] {
    const defs = this.data.get('journal') as JournalDefinition[];
    return defs
      .filter((d) => this.unlocked.has(d.id))
      .map((d) => ({ id: d.id, title: d.title, body: d.body, category: d.category, image: d.image }));
  }

  unlock(id: string): boolean {
    if (this.unlocked.has(id)) return false;
    const def = (this.data.get('journal') as JournalDefinition[]).find((d) => d.id === id);
    if (!def) return false;
    this.unlocked.add(id);
    this.eventBus.emit('journal:entry', {
      id: def.id,
      title: def.title,
      body: def.body,
      category: def.category,
    });
    return true;
  }

  private tryUnlock(type: JournalDefinition['trigger']['type'], target: string): void {
    const defs = this.data.get('journal') as JournalDefinition[];
    for (const def of defs) {
      if (def.trigger.type !== type || def.trigger.target !== target) continue;
      if (def.trigger.value !== undefined && def.trigger.value !== true) continue;
      this.unlock(def.id);
    }
  }

  serialize(): JournalState {
    return { unlocked: [...this.unlocked] };
  }

  deserialize(data: unknown): void {
    const state = data as JournalState;
    this.unlocked = new Set(state.unlocked ?? []);
  }
}
