import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  clearAtlasCache,
  floodClearMatte,
  getFrameCanvas,
  isMattePixel,
  listFrameNames,
  loadAtlas,
  parseAtlasManifest,
  trimOpaqueBounds,
  type LoadedAtlas,
} from '@/presentation/AtlasFrameLoader';

const FROGWIZ_MANIFEST = {
  meta: {
    image: 'frogwiz_atlas.png',
    size: { w: 362, h: 377 },
    cell: { w: 88, h: 123 },
    padding: 2,
    columns: 4,
    rows: 3,
    anchor: 'bottom-center',
  },
  frames: {
    idle: { x: 5, y: 14, w: 82, h: 111, col: 0, row: 0 },
    walk: { x: 98, y: 14, w: 76, h: 111, col: 1, row: 0 },
    view_front: { x: 2, y: 127, w: 88, h: 123, col: 0, row: 1 },
  },
};

function fakeContext(w = 4, h = 4) {
  const imageData = new Uint8ClampedArray(w * h * 4);
  return {
    imageSmoothingEnabled: true,
    drawImage: () => {},
    clearRect: () => {},
    getImageData: (_x: number, _y: number, width: number, height: number) => ({
      data: imageData.subarray(0, width * height * 4),
      width,
      height,
      colorSpace: 'srgb' as PredefinedColorSpace,
    }),
    putImageData: (img: ImageData, dx: number, dy: number) => {
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const si = (y * img.width + x) * 4;
          const di = ((y + dy) * w + (x + dx)) * 4;
          if (di >= 0 && di < imageData.length) {
            imageData[di] = img.data[si]!;
            imageData[di + 1] = img.data[si + 1]!;
            imageData[di + 2] = img.data[si + 2]!;
            imageData[di + 3] = img.data[si + 3]!;
          }
        }
      }
    },
  };
}

class MockImage {
  static shouldFail = false;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 362;
  naturalHeight = 377;
  set src(_value: string) {
    queueMicrotask(() => (MockImage.shouldFail ? this.onerror?.() : this.onload?.()));
  }
}

describe('AtlasFrameLoader', () => {
  beforeEach(() => {
    clearAtlasCache();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => fakeContext() as unknown as CanvasRenderingContext2D,
    );
    vi.stubGlobal('Image', MockImage);
    MockImage.shouldFail = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('frogwiz_atlas.json')) {
          return {
            ok: true,
            json: async () => FROGWIZ_MANIFEST,
          } as Response;
        }
        return { ok: false } as Response;
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('parseAtlasManifest accepts valid frogwiz shape', () => {
    const m = parseAtlasManifest(FROGWIZ_MANIFEST);
    expect(m?.meta.size.w).toBe(362);
    expect(m?.frames.idle.w).toBe(82);
    expect(m?.frames.idle.h).toBe(111);
    expect(m?.frames.view_front.w).toBe(88);
    expect(m?.frames.view_front.h).toBe(123);
  });

  it('parseAtlasManifest rejects malformed JSON', () => {
    expect(parseAtlasManifest(null)).toBeNull();
    expect(parseAtlasManifest({ meta: {} })).toBeNull();
  });

  it('loadAtlas returns manifest + sheet when fetch and image succeed', async () => {
    const atlas = await loadAtlas('/data/atlas/frogwiz_atlas.json');
    expect(atlas).not.toBeNull();
    expect(atlas!.manifest.meta.anchor).toBe('bottom-center');
    expect(atlas!.sheet.width).toBe(362);
    expect(atlas!.sheet.height).toBe(377);
  });

  it('loadAtlas returns null when image fails', async () => {
    MockImage.shouldFail = true;
    const atlas = await loadAtlas('/data/atlas/frogwiz_atlas.json');
    expect(atlas).toBeNull();
  });

  it('getFrameCanvas crops to frame rect dimensions (raw)', () => {
    const sheet = document.createElement('canvas');
    sheet.width = 362;
    sheet.height = 377;
    const loaded: LoadedAtlas = {
      manifest: parseAtlasManifest(FROGWIZ_MANIFEST)!,
      sheet,
    };
    const idle = getFrameCanvas(loaded, 'idle', false);
    expect(idle?.width).toBe(82);
    expect(idle?.height).toBe(111);
    const front = getFrameCanvas(loaded, 'view_front', false);
    expect(front?.width).toBe(88);
    expect(front?.height).toBe(123);
    expect(getFrameCanvas(loaded, 'missing', false)).toBeNull();
  });

  it('isMattePixel detects white and transparent', () => {
    expect(isMattePixel(255, 255, 255, 255)).toBe(true);
    expect(isMattePixel(10, 120, 10, 0)).toBe(true);
    expect(isMattePixel(40, 140, 30, 255)).toBe(false);
  });

  it('floodClearMatte removes edge-connected white padding', () => {
    const data = new Uint8ClampedArray(6 * 6 * 4);
    // white border
    for (let x = 0; x < 6; x++) {
      for (const y of [0, 5]) {
        const i = (y * 6 + x) * 4;
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
    // green interior blob
    for (let y = 2; y <= 3; y++) {
      for (let x = 2; x <= 3; x++) {
        const i = (y * 6 + x) * 4;
        data[i] = 40;
        data[i + 1] = 140;
        data[i + 2] = 30;
        data[i + 3] = 255;
      }
    }
    floodClearMatte(data, 6, 6);
    expect(data[0 * 4 + 3]).toBe(0);
    expect(data[(2 * 6 + 2) * 4 + 3]).toBe(255);
    const b = trimOpaqueBounds(data, 6, 6, 0);
    expect(b.w).toBeLessThanOrEqual(4);
  });

  it('listFrameNames returns manifest keys in order', () => {
    const m = parseAtlasManifest(FROGWIZ_MANIFEST)!;
    expect(listFrameNames(m)).toEqual(['idle', 'walk', 'view_front']);
  });
});
