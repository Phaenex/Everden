import { describe, it, expect, beforeAll } from 'vitest';
import { migrateAppearance, hueShiftToSkinTone, patternIdFromVariant } from '../../shared/appearance/migrate';
import { parseAppearanceJson, isAppearanceJsonSafe } from '../../shared/appearance/validate';
import type { SpeciesAppearanceRegistry } from '../../shared/appearance/AppearanceTypes';
import { setSpeciesAppearanceRegistry } from '@/data/SpeciesAppearanceRegistry';
import { PlayerProfile } from '@/gameplay/PlayerProfile';
import { defaultAppearance } from '@/gameplay/CharacterAppearance';

const REG: SpeciesAppearanceRegistry = {
  frog: {
    playable: true,
    skinRamps: ['#4c7842', '#3a8a58', '#2e8a68', '#6a8832', '#207858', '#5a7040'],
    eyeRamps: ['#c8e8c0', '#f0d080'],
    crestColorRamps: ['#4c7842', '#c8a040'],
    patterns: [
      { id: 'moss', label: 'Moss', sheetSuffix: 'p1' },
      { id: 'reed', label: 'Reed', sheetSuffix: 'p2' },
      { id: 'marsh', label: 'Marsh', sheetSuffix: 'p3' },
      { id: 'bog', label: 'Bog', sheetSuffix: 'p4' },
    ],
    crests: [{ id: 'none', label: 'Bare' }],
    markings: ['none', 'spots', 'stripes'],
    wardrobeSlots: ['hat', 'cloak', 'accessory', 'held'],
  },
  tortoise: {
    playable: true,
    skinRamps: ['#5a6840', '#4a5838', '#6a7850'],
    eyeRamps: ['#f0c060'],
    crestColorRamps: ['#5a6840'],
    patterns: [
      { id: 'loam', label: 'Loam', sheetSuffix: 'p1' },
      { id: 'fern', label: 'Fern', sheetSuffix: 'p2' },
      { id: 'oak', label: 'Oak', sheetSuffix: 'p3' },
      { id: 'stone', label: 'Stone', sheetSuffix: 'p4' },
    ],
    crests: [{ id: 'none', label: 'Bare' }],
    markings: ['none', 'spots'],
    wardrobeSlots: ['hat', 'cloak', 'accessory', 'held'],
  },
};

beforeAll(() => {
  setSpeciesAppearanceRegistry(REG);
});

describe('appearance migrate v3→v4', () => {
  it('maps variant index to patternId', () => {
    expect(patternIdFromVariant('frog', 2, REG)).toBe('marsh');
    const app = migrateAppearance(
      { variant: 1, build: 2, hueShift: 10, marking: 'spots', wardrobe: { hat: 'shell_cap' } },
      'tortoise',
      REG,
    );
    expect(app.patternId).toBe('fern');
    expect(app.build).toBe(2);
    expect(app.marking).toBe('spots');
    expect(app.wardrobe.hat).toBe('shell_cap');
    expect(app.skinTone).toBe(hueShiftToSkinTone(10, 3));
  });

  it('preserves v4 fields when already migrated', () => {
    const app = migrateAppearance(
      {
        ...defaultAppearance('moss'),
        skinTone: 2,
        eyeColor: 1,
        patternIntensity: 40,
        markingIntensity: 80,
      },
      'frog',
      REG,
    );
    expect(app.skinTone).toBe(2);
    expect(app.eyeColor).toBe(1);
    expect(app.patternIntensity).toBe(40);
    expect(app.markingIntensity).toBe(80);
  });
});

describe('appearanceJson validate', () => {
  it('rejects oversized or invalid JSON', () => {
    expect(isAppearanceJsonSafe('')).toBe(false);
    expect(isAppearanceJsonSafe('[]')).toBe(false);
    expect(isAppearanceJsonSafe('{"build":1}')).toBe(true);
  });

  it('parseAppearanceJson migrates safely', () => {
    const app = parseAppearanceJson('{"variant":3,"marking":"stripes"}', 'frog', REG);
    expect(app.patternId).toBe('bog');
    expect(app.marking).toBe('stripes');
  });
});

describe('PlayerProfile appearance v4', () => {
  it('serializes migrated appearance from legacy setFromCreation', () => {
    const profile = new PlayerProfile();
    profile.setFromCreation(
      'tortoise',
      'Myrtle',
      'neighbor',
      { str: 12, dex: 8, con: 16, int: 12, wis: 14, cha: 10 },
      {
        variant: 1,
        build: 2,
        hueShift: 10,
        marking: 'spots',
        wardrobe: { hat: 'shell_cap' },
      } as never,
    );
    const ser = profile.serialize();
    expect(ser.appearance?.patternId).toBe('fern');
    expect(ser.appearance?.build).toBe(2);
    expect(ser.appearance?.wardrobe.hat).toBe('shell_cap');
    expect(ser.appearance?.marking).toBe('spots');
  });

  it('deserializes legacy v3 appearance blobs', () => {
    const profile = new PlayerProfile();
    profile.deserialize({
      species: 'frog',
      appearance: { variant: 0, build: 1, hueShift: 0, marking: 'none', wardrobe: {} },
    });
    expect(profile.appearance.patternId).toBe('moss');
    expect(profile.appearance.skinTone).toBeDefined();
  });
});
