import fs from 'node:fs';
import path from 'node:path';

export interface StoredCharacter {
  playerId: string;
  name: string;
  species: string;
  appearanceJson: string;
  updatedAt: number;
}

/**
 * Durable character snapshot store — JSON files today, Postgres/Firestore later.
 * Online play uses this as save source of truth when connected.
 */
export class CharacterStore {
  constructor(private dir: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  private file(playerId: string): string {
    const safe = playerId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.dir, `${safe}.json`);
  }

  load(playerId: string): StoredCharacter | null {
    try {
      const raw = fs.readFileSync(this.file(playerId), 'utf8');
      return JSON.parse(raw) as StoredCharacter;
    } catch {
      return null;
    }
  }

  save(char: StoredCharacter): void {
    fs.writeFileSync(this.file(char.playerId), JSON.stringify({ ...char, updatedAt: Date.now() }, null, 2));
  }
}

const DATA_DIR = process.env.CHARACTER_STORE_DIR ?? path.join(process.cwd(), 'data', 'characters');
export const characterStore = new CharacterStore(DATA_DIR);
