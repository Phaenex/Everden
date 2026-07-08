import { describe, it, expect } from 'vitest';
import { appearanceNeedsProceduralRender, defaultAppearance } from '@/gameplay/CharacterAppearance';

describe('CharacterAppearance', () => {
  it('default appearance can use species PNG in-world', () => {
    expect(appearanceNeedsProceduralRender(defaultAppearance())).toBe(false);
  });

  it('any Look or Outfit choice keeps procedural player sprite', () => {
    expect(appearanceNeedsProceduralRender({ ...defaultAppearance(), hueShift: 10 })).toBe(true);
    expect(appearanceNeedsProceduralRender({ ...defaultAppearance(), marking: 'spots' })).toBe(true);
    expect(appearanceNeedsProceduralRender({ ...defaultAppearance(), variant: 2 })).toBe(true);
    expect(
      appearanceNeedsProceduralRender({ ...defaultAppearance(), wardrobe: { hat: 'ferry_kepi' } }),
    ).toBe(true);
  });
});
