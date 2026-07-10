import { describe, it, expect } from 'vitest';
import {
  bobOffsetY,
  nextWalkLeg,
  resolveAtlasFrameName,
} from '@/presentation/AtlasSpriteAnimator';

describe('AtlasSpriteAnimator helpers', () => {
  it('resolveAtlasFrameName maps action states', () => {
    expect(resolveAtlasFrameName('idle', null, 0)).toBe('idle');
    expect(resolveAtlasFrameName('walk', null, 0)).toBe('walk');
    expect(resolveAtlasFrameName('walk', null, 1)).toBe('idle');
    expect(resolveAtlasFrameName('wave', null, 0)).toBe('wave');
    expect(resolveAtlasFrameName('cast', null, 0)).toBe('cast');
  });

  it('resolveAtlasFrameName uses directional views when idle + direction set', () => {
    expect(resolveAtlasFrameName('idle', 'front', 0)).toBe('view_front');
    expect(resolveAtlasFrameName('idle', 'left', 0)).toBe('view_left');
    expect(resolveAtlasFrameName('walk', 'left', 0)).toBe('walk');
  });

  it('bobOffsetY oscillates with different amplitude for walk vs idle', () => {
    expect(bobOffsetY('idle', 0)).toBe(0);
    expect(Math.abs(bobOffsetY('idle', 225))).toBeGreaterThan(1);
    expect(Math.abs(bobOffsetY('walk', 105))).toBeGreaterThan(2);
  });

  it('nextWalkLeg toggles after WALK_LEG_MS', () => {
    expect(nextWalkLeg(100, 0, 0)).toEqual({ leg: 0, swapAt: 0 });
    expect(nextWalkLeg(500, 0, 0)).toEqual({ leg: 1, swapAt: 500 });
    expect(nextWalkLeg(600, 1, 500)).toEqual({ leg: 1, swapAt: 500 });
    expect(nextWalkLeg(950, 1, 500)).toEqual({ leg: 0, swapAt: 950 });
  });
});
