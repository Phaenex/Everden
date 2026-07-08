import type { GameData } from './types';

const DATA_FILES = [
  'species',
  'npcs',
  'items',
  'goods',
  'quests',
  'dialogue',
  'encounters',
  'locations',
  'abilities',
  'objects',
  'journal',
  'districts',
  'wardrobe',
] as const;

type DataKey = (typeof DATA_FILES)[number];

/**
 * Loads and indexes JSON definitions from public/data/.
 */
export class DataRegistry {
  private data: Partial<GameData> = {};

  async loadAll(): Promise<void> {
    const entries = await Promise.all(
      DATA_FILES.map(async (key) => {
        const res = await fetch(`/data/${key}.json`);
        if (!res.ok) throw new Error(`Failed to load data/${key}.json`);
        const json = await res.json();
        return [key, json] as const;
      }),
    );
    for (const [key, value] of entries) {
      (this.data as Record<string, unknown>)[key] = value;
    }
  }

  /** For tests — inject data without fetch. */
  loadFromObject(data: Partial<GameData>): void {
    this.data = { ...this.data, ...data };
  }

  getAll(): GameData {
    return this.data as GameData;
  }

  get<K extends DataKey>(key: K): GameData[K] {
    return (this.data[key] ?? []) as GameData[K];
  }

  getById<T extends { id: string }>(key: DataKey, id: string): T | undefined {
    const list = this.get(key) as unknown as T[];
    return list.find((item) => item.id === id);
  }
}
