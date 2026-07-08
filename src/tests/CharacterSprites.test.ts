import * as THREE from 'three';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  applyArtToCanvas,
  applyArtToImage,
  applyAppearanceToArtCanvas,
  applyEnemyArtToImage,
  createCharacterMesh,
  createGroundShadow,
  createNameLabel,
  drawCharacterCanvas,
  loadArtCanvas,
  loadEnemyArtCanvas,
  CHARACTER_MESH_SIZE,
  spriteSheetFrameCount,
} from '@/presentation/CharacterSprites';
import { ISO_CAMERA_OFFSET } from '@/presentation/IsometricCamera';

/**
 * happy-dom doesn't implement a real 2D canvas context, so every canvas-touching
 * call in CharacterSprites.ts (procedural drawer AND the chroma-key art loader)
 * needs a minimal fake context here — not just the art path.
 */
function fakeContext() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    imageSmoothingEnabled: true,
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    drawImage: () => {},
    getImageData: (_x: number, _y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
      colorSpace: 'srgb' as PredefinedColorSpace,
    }),
    putImageData: () => {},
    save: () => {},
    restore: () => {},
    scale: () => {},
  };
}

class MockImage {
  static nextShouldFail = true;
  /** Optional per-path override for tests that need some candidates to 404 and others not. */
  static failPredicate: ((src: string) => boolean) | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 4;
  naturalHeight = 4;
  private _src = '';
  set src(value: string) {
    this._src = value;
    const fail = MockImage.failPredicate ? MockImage.failPredicate(value) : MockImage.nextShouldFail;
    queueMicrotask(() => (fail ? this.onerror?.() : this.onload?.()));
  }
  get src(): string {
    return this._src;
  }
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('CharacterSprites art fallback', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => fakeContext() as unknown as CanvasRenderingContext2D,
    );
    vi.stubGlobal('Image', MockImage);
    MockImage.nextShouldFail = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    MockImage.failPredicate = null;
  });

  it('drawCharacterCanvas always returns a canvas (procedural baseline never breaks)', () => {
    const canvas = drawCharacterCanvas('frog', 0);
    expect(canvas.width).toBe(32);
    expect(canvas.height).toBe(32);
  });

  it('loadArtCanvas resolves null on a failed/missing image (404-safe)', async () => {
    MockImage.nextShouldFail = true;
    const result = await loadArtCanvas('frog', 'nonexistent_npc');
    expect(result).toBeNull();
  });

  it('loadArtCanvas resolves a canvas when the image loads', async () => {
    MockImage.nextShouldFail = false;
    const result = await loadArtCanvas('frog', 'pip_marshwick');
    expect(result).not.toBeNull();
  });

  it('loadEnemyArtCanvas tries each candidate id in order before falling back to species art', async () => {
    MockImage.failPredicate = (src) => !src.includes('/sprites/enemies/skadge.png');
    const result = await loadEnemyArtCanvas('toad', ['skadge_the_poacher', 'skadge']);
    expect(result).not.toBeNull();
  });

  it('loadEnemyArtCanvas falls back to species art when every enemy candidate 404s', async () => {
    MockImage.failPredicate = (src) => src.includes('/sprites/enemies/');
    const result = await loadEnemyArtCanvas('toad', ['bogus_name', 'bogus']);
    expect(result).not.toBeNull(); // species path succeeds
  });

  it('loadEnemyArtCanvas resolves null when even the species fallback 404s (never throws)', async () => {
    MockImage.nextShouldFail = true;
    const result = await loadEnemyArtCanvas('toad', ['bogus_name']);
    expect(result).toBeNull();
  });

  it('applyEnemyArtToImage silently keeps the current src when every candidate 404s', async () => {
    MockImage.nextShouldFail = true;
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,fallback';
    applyEnemyArtToImage(img, 'toad', ['bogus']);
    await flush();
    expect(img.src).toBe('data:image/png;base64,fallback');
  });

  it('createCharacterMesh keeps the procedural texture when art fails to load', async () => {
    MockImage.nextShouldFail = true;
    const mesh = createCharacterMesh('frog', 0, 1, 'nonexistent_npc');
    const material = mesh.material as unknown as { map: unknown };
    const proceduralMap = material.map;
    expect(proceduralMap).toBeTruthy();

    await flush();

    expect(material.map).toBe(proceduralMap);
  });

  it('createCharacterMesh swaps in real art once it loads successfully', async () => {
    MockImage.nextShouldFail = false;
    const mesh = createCharacterMesh('frog', 0, 1, 'pip_marshwick');
    const material = mesh.material as unknown as { map: unknown };
    const proceduralMap = material.map;

    await flush();

    expect(material.map).not.toBe(proceduralMap);
  });

  it('applyArtToImage silently keeps the current src on a failed load', async () => {
    MockImage.nextShouldFail = true;
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,fallback';
    applyArtToImage(img, 'frog', 'nonexistent_npc');
    await flush();
    expect(img.src).toBe('data:image/png;base64,fallback');
  });

  it('applyArtToCanvas does not throw when the art image fails to load', async () => {
    MockImage.nextShouldFail = true;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    expect(() => applyArtToCanvas(canvas, 'frog')).not.toThrow();
    await flush();
  });

  it('createCharacterMesh billboards to face the fixed isometric camera (regression: was edge-on)', () => {
    const size = CHARACTER_MESH_SIZE;
    const mesh = createCharacterMesh('frog', 0, size, 'nonexistent_npc');

    // The plane's default front-facing normal is +Z; after billboarding it should
    // point at the camera's horizontal quadrant, not straight along the old
    // arbitrary rotation.x tilt (which left it almost edge-on to an isometric camera).
    const worldNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion);
    const camHorizontal = new THREE.Vector3(ISO_CAMERA_OFFSET.x, 0, ISO_CAMERA_OFFSET.z).normalize();
    expect(worldNormal.dot(camHorizontal)).toBeCloseTo(1, 5);

    // Y-axis-only billboard: the card stays upright, never tilting forward/back.
    expect(worldNormal.y).toBeCloseTo(0, 5);

    // Plane is lifted so it stands on the ground instead of being centered through it.
    expect(mesh.position.y).toBeCloseTo(size / 2, 5);
  });

  it('createNameLabel is hidden by default (shown only for nearby NPC)', () => {
    const label = createNameLabel('Pip Marshwick', CHARACTER_MESH_SIZE);
    expect(label.visible).toBe(false);
  });

  it('CHARACTER_MESH_SIZE is readable in world scale (M1 readability)', () => {
    expect(CHARACTER_MESH_SIZE).toBeGreaterThanOrEqual(2);
  });

  it('CHARACTER_MESH_SIZE is a positive number and createGroundShadow returns a mesh', () => {
    expect(CHARACTER_MESH_SIZE).toBeGreaterThan(0);
    expect(CHARACTER_MESH_SIZE).toBe(3.0);
    const shadow = createGroundShadow();
    expect(shadow).toBeInstanceOf(THREE.Mesh);
    expect(() => createGroundShadow(CHARACTER_MESH_SIZE)).not.toThrow();
  });

  it('spriteSheetFrameCount treats square 1024 exports as 2-frame strips', () => {
    const sheet = document.createElement('canvas');
    sheet.width = 1024;
    sheet.height = 1024;
    expect(spriteSheetFrameCount(sheet)).toBe(2);
  });

  it('drawCharacterCanvas accepts appearance options without throwing', () => {
    const canvas = drawCharacterCanvas('frog', 0, {
      variant: 2,
      build: 1,
      hueShift: 15,
      marking: 'spots',
      wardrobe: { hat: 'reed_hat' },
    });
    expect(canvas.width).toBe(32);
  });

  it('applyAppearanceToArtCanvas applies tint and markings without throwing', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    expect(() =>
      applyAppearanceToArtCanvas(
        canvas,
        'frog',
        { variant: 0, build: 1, hueShift: 25, marking: 'spots', wardrobe: { cloak: 'levy_mantle', hat: 'ferry_kepi' } },
        [{ id: 'levy_mantle', slot: 'cloak', label: 'Mantle', species: ['*'], layer: 'procedural' }],
      ),
    ).not.toThrow();
  });
});
