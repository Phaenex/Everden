import type { DataRegistry } from '@/data/DataRegistry';

export interface ModManifest {
  id: string;
  name: string;
  version: number;
  dataFiles: string[];
}

/**
 * Phase 12 stub — loads JSON mod packs from /mods/{id}/data/.
 */
export class ModLoader {
  constructor(private data: DataRegistry) {}

  async loadMod(basePath: string, manifest: ModManifest): Promise<void> {
    const merged: Record<string, unknown[]> = {};
    for (const file of manifest.dataFiles) {
      const res = await fetch(`${basePath}/data/${file}`);
      if (!res.ok) continue;
      const key = file.replace('.json', '');
      const modData = await res.json();
      const all = this.data.getAll() as unknown as Record<string, { id: string }[]>;
      const existing = all[key] ?? [];
      merged[key] = this.mergeById(existing as { id: string }[], modData);
    }
    this.data.loadFromObject(merged);
  }

  private mergeById<T extends { id: string }>(base: T[], mod: T[]): T[] {
    const map = new Map(base.map((item) => [item.id, item]));
    for (const item of mod) map.set(item.id, item);
    return [...map.values()];
  }
}
