import type { ISaveable } from './IGameModule';

const SAVE_KEY = 'everden_save_v1';
const SAVE_VERSION = 3;

export interface SaveFile {
  version: number;
  timestamp: number;
  modules: Record<string, unknown>;
}

/**
 * Versioned localStorage save/load for ISaveable modules.
 */
export class SaveSystem {
  private modules = new Map<string, ISaveable>();

  register(module: ISaveable): void {
    this.modules.set(module.saveKey, module);
  }

  save(): void {
    const modules: Record<string, unknown> = {};
    for (const [key, mod] of this.modules) {
      modules[key] = mod.serialize();
    }
    const file: SaveFile = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      modules,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(file));
  }

  load(): boolean {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const file = JSON.parse(raw) as SaveFile;
      if (file.version > SAVE_VERSION) return false;
      for (const [key, data] of Object.entries(file.modules)) {
        this.modules.get(key)?.deserialize(data);
      }
      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  hasSave(): boolean {
    return SaveSystem.hasExistingSave();
  }

  /** Title screen — check for a save without constructing SaveSystem. */
  static hasExistingSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static clearSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
