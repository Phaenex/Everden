import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { createPropMesh } from '@/presentation/PropSprites';

/** happy-dom has no real 2D canvas context — same fake used by CharacterSprites.test.ts. */
function fakeContext() {
  return {
    fillStyle: '',
    clearRect: () => {},
    fillRect: () => {},
  };
}

describe('PropSprites', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => fakeContext() as unknown as CanvasRenderingContext2D,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a billboard mesh for known prop kinds', () => {
    expect(createPropMesh('waystone')).toBeInstanceOf(THREE.Mesh);
    expect(createPropMesh('lantern')).toBeInstanceOf(THREE.Mesh);
  });

  it('returns null for an unknown prop kind instead of throwing (regression: object defs with a typo\'d visualProp must not crash scene load)', () => {
    expect(createPropMesh('not_a_real_prop')).toBeNull();
  });

  it('sits on the ground plane (mesh lifted by half its height, matching character billboards)', () => {
    const mesh = createPropMesh('waystone', 2);
    expect(mesh!.position.y).toBe(1);
  });
});
