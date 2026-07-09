import { describe, it, expect } from 'vitest';
import {
  playableSpeciesIds,
  patternLabel,
  setSpeciesAppearanceRegistry,
  getSpeciesAppearance,
} from '@/data/SpeciesAppearanceRegistry';
import type { SpeciesAppearanceRegistry } from '@/gameplay/CharacterAppearance';

describe('SpeciesAppearanceRegistry', () => {
  it('lists playable species from registry', () => {
    const reg: SpeciesAppearanceRegistry = {
      frog: {
        playable: true,
        skinRamps: ['#4c7842'],
        eyeRamps: ['#c8e8c0'],
        crestColorRamps: ['#4c7842'],
        patterns: [{ id: 'moss', label: 'Moss', sheetSuffix: 'p1' }],
        crests: [{ id: 'none', label: 'Bare' }],
        markings: ['none'],
        wardrobeSlots: ['hat', 'cloak', 'accessory', 'held'],
      },
      ghost: {
        playable: false,
        skinRamps: [],
        eyeRamps: [],
        crestColorRamps: [],
        patterns: [],
        crests: [],
        markings: ['none'],
        wardrobeSlots: ['hat'],
      },
    };
    setSpeciesAppearanceRegistry(reg);
    expect(playableSpeciesIds()).toEqual(['frog']);
    expect(patternLabel('frog', 'moss')).toBe('Moss');
    expect(getSpeciesAppearance('ghost')?.playable).toBe(false);
  });
});
