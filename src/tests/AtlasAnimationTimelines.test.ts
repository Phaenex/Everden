import { describe, it, expect } from 'vitest';
import {
  sampleAtlasTimeline,
  totalDuration,
  DEFAULT_FROGWIZ_ANIMATIONS,
} from '@/presentation/AtlasAnimationTimelines';

describe('AtlasAnimationTimelines', () => {
  it('totalDuration sums key ms', () => {
    const keys = DEFAULT_FROGWIZ_ANIMATIONS.wave!.keys;
    expect(totalDuration(keys)).toBeGreaterThan(1000);
  });

  it('sampleAtlasTimeline loops wave keys', () => {
    const keys = DEFAULT_FROGWIZ_ANIMATIONS.wave!.keys;
    const total = totalDuration(keys);
    const a = sampleAtlasTimeline(keys, 50, true);
    const b = sampleAtlasTimeline(keys, 50 + total, true);
    expect(a.frameName).toBe(b.frameName);
    expect(a.keyIndex).toBe(b.keyIndex);
  });

  it('wave timeline hits wave frame with sway', () => {
    const keys = DEFAULT_FROGWIZ_ANIMATIONS.wave!.keys;
    const mid = sampleAtlasTimeline(keys, 500, true);
    expect(mid.frameName).toBe('wave');
    expect(Math.abs(mid.swayX)).toBeGreaterThan(0);
  });

  it('cast timeline ramps glow', () => {
    const keys = DEFAULT_FROGWIZ_ANIMATIONS.cast!.keys;
    const charge = sampleAtlasTimeline(keys, 700, true);
    expect(charge.frameName).toBe('cast');
    expect(charge.glow).toBeGreaterThan(0.3);
  });
});
