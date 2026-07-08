import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DataRegistry } from '@/data/DataRegistry';
import { ModLoader } from '@/core/ModLoader';

describe('ModLoader', () => {
  let data: DataRegistry;
  let loader: ModLoader;

  beforeEach(() => {
    data = new DataRegistry();
    data.loadFromObject({
      npcs: [
        { id: 'pip_marshwick', name: 'Pip', species: 'frog' },
        { id: 'elder_domet', name: 'Domet', species: 'turtle' },
      ] as never,
    });
    loader = new ModLoader(data);
  });

  it('merges mod NPCs by id without dropping base entries', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'pip_marshwick', name: 'Pip (mod)', species: 'frog' }, { id: 'mod_npc', name: 'Mod Only', species: 'vole' }],
    });
    vi.stubGlobal('fetch', fetchMock);

    await loader.loadMod('/mods/test_pack', {
      id: 'test_pack',
      name: 'Test Pack',
      version: 1,
      dataFiles: ['npcs.json'],
    });

    const npcs = data.get('npcs');
    expect(npcs).toHaveLength(3);
    expect(npcs.find((n) => n.id === 'pip_marshwick')?.name).toBe('Pip (mod)');
    expect(npcs.find((n) => n.id === 'mod_npc')?.name).toBe('Mod Only');
    expect(npcs.find((n) => n.id === 'elder_domet')?.name).toBe('Domet');

    vi.unstubAllGlobals();
  });

  it('skips missing mod files without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false }),
    );

    await expect(
      loader.loadMod('/mods/empty', {
        id: 'empty',
        name: 'Empty',
        version: 1,
        dataFiles: ['npcs.json'],
      }),
    ).resolves.toBeUndefined();

    expect(data.get('npcs')).toHaveLength(2);
    vi.unstubAllGlobals();
  });
});
