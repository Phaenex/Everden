import { describe, it, expect } from 'vitest';
import { appearanceNeedsProceduralRender, defaultAppearance } from '@/gameplay/CharacterAppearance';

describe('CharacterAppearance', () => {
  it('default appearance can use species PNG in-world', () => {
    expect(appearanceNeedsProceduralRender(defaultAppearance())).toBe(false);
  });

  it('PNG art is attempted for all pattern variants', () => {
    expect(appearanceNeedsProceduralRender({ ...defaultAppearance(), variant: 2 })).toBe(false);
  });
});
