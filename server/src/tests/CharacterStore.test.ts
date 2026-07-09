import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CharacterStore } from '../services/CharacterStore.js';

describe('CharacterStore', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'everden-char-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('saves and loads character snapshots', () => {
    const store = new CharacterStore(dir);
    store.save({
      playerId: 'p1',
      name: 'Croaker',
      species: 'frog',
      appearanceJson: '{}',
      updatedAt: 1,
    });
    const loaded = store.load('p1');
    expect(loaded?.name).toBe('Croaker');
    expect(loaded?.species).toBe('frog');
  });
});
