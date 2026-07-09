import { describe, it, expect } from 'vitest';
import { WARDROBE_ITEM_IDS, filterWardrobeForSpecies } from '@/presentation/WardrobeLayers';
import type { WardrobeDefinition } from '@/data/types';

const catalog: WardrobeDefinition[] = [
  { id: 'reed_hat', slot: 'hat', label: 'Reed', species: ['frog'], layer: 'procedural' },
  { id: 'basin_cloak', slot: 'cloak', label: 'Cloak', species: ['*'], layer: 'procedural' },
  { id: 'levy_pin', slot: 'accessory', label: 'Pin', species: ['*'], layer: 'procedural' },
];

describe('WardrobeLayers', () => {
  it('registers procedural art for every wardrobe catalog id', () => {
    expect(WARDROBE_ITEM_IDS.length).toBeGreaterThanOrEqual(21);
    expect(WARDROBE_ITEM_IDS).toContain('reed_staff');
    expect(WARDROBE_ITEM_IDS).toContain('clay_lantern');
    expect(WARDROBE_ITEM_IDS).toContain('market_basket');
    for (const id of WARDROBE_ITEM_IDS) {
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it('filterWardrobeForSpecies respects species gates', () => {
    const frogOnly = filterWardrobeForSpecies(catalog, 'frog');
    expect(frogOnly.some((w) => w.id === 'reed_hat')).toBe(true);
    const turtle = filterWardrobeForSpecies(catalog, 'turtle');
    expect(turtle.some((w) => w.id === 'reed_hat')).toBe(false);
    expect(turtle.some((w) => w.id === 'basin_cloak')).toBe(true);
  });
});
