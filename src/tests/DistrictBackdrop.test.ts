import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { createDistrictBackdropPlane } from '@/presentation/DistrictBackdrop';
import { getBackdropSize, getBackdropQuaternion, getViewExtents, CAMERA_FRUSTUM_HALF_HEIGHT } from '@/presentation/SceneComposition';

describe('DistrictBackdrop', () => {
  it('tryLoadLocationTexture resolves null on 404 without throwing', async () => {
    vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(
      (_url, _onLoad, _prog, onError) => {
        queueMicrotask(() => onError?.(new Error('404')));
        return {} as THREE.Texture;
      },
    );
    const { tryLoadLocationTexture } = await import('@/presentation/DistrictBackdrop');
    await expect(tryLoadLocationTexture('missing.webp')).resolves.toBeNull();
    vi.restoreAllMocks();
  });

  it('createDistrictBackdropPlane renders even when art fails to load', () => {
    vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(
      (_url, _onLoad, _prog, onError) => {
        queueMicrotask(() => onError?.(new Error('404')));
        return {} as THREE.Texture;
      },
    );
    expect(() =>
      createDistrictBackdropPlane({
        id: 'test',
        asset: 'missing.webp',
        x: 0,
        z: 0,
        width: 4,
        height: 2,
      }),
    ).not.toThrow();
    vi.restoreAllMocks();
  });

  it('getBackdropSize returns positive dimensions with width greater than height', () => {
    const { width, height } = getBackdropSize(16 / 9);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    expect(width).toBeGreaterThan(height);
  });

  it('getBackdropQuaternion returns a THREE.Quaternion', () => {
    const quat = getBackdropQuaternion();
    expect(quat).toBeInstanceOf(THREE.Quaternion);
  });

  it('getBackdropSize fits the real image aspect passed in, not an assumed one (regression: was hardcoded to 16/9 while generated art is 3:2, stretching every backdrop ~19%)', () => {
    const realArtAspect = 1536 / 1024; // 3:2 — what the art pipeline actually outputs
    const { width, height } = getBackdropSize(16 / 9, realArtAspect);
    expect(width / height).toBeCloseTo(realArtAspect, 2);
  });

  it('getBackdropSize still covers a 16:9 view when the image is narrower (3:2)', () => {
    const view = getViewExtents(16 / 9);
    const { width, height } = getBackdropSize(16 / 9, 1536 / 1024);
    expect(width).toBeGreaterThanOrEqual(view.width * 0.99);
    expect(height).toBeGreaterThan(0);
  });

  it('getViewExtents height matches the camera\'s actual on-screen span, not double it (regression: was CAMERA_FRUSTUM_HALF_HEIGHT * 2, which quadrupled backdrop area and zoomed every district\'s art in so tight only the plain center ever rendered — buildings/lanterns/market clutter painted at the edges were scaled off-frame, the real cause of districts reading as empty)', () => {
    const view = getViewExtents(16 / 9);
    expect(view.height).toBeCloseTo(CAMERA_FRUSTUM_HALF_HEIGHT, 5);
  });

  it('getBackdropSize at 16:9 with 3:2 art should not exceed the view by more than the intentional overscan margin (regression guard for the 2x oversize bug: margin is 1.06, so width should be within ~10% of the raw view width, not ~110% over it)', () => {
    const view = getViewExtents(16 / 9);
    const { width } = getBackdropSize(16 / 9, 1536 / 1024);
    expect(width).toBeLessThan(view.width * 1.15);
  });
});
