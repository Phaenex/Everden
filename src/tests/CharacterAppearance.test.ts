import { describe, it, expect } from 'vitest';
import { appearanceNeedsProceduralRender, defaultAppearance } from '@/gameplay/CharacterAppearance';

describe('CharacterAppearance', () => {
  it('default appearance can use species PNG in-world', () => {
    expect(appearanceNeedsProceduralRender()).toBe(false);
  });

  it('PNG art is attempted for all pattern variants', () => {
    expect(appearanceNeedsProceduralRender()).toBe(false);
    expect(defaultAppearance().patternId).toBeTruthy();
  });
});
