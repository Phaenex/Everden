export type AtlasFrameRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  col?: number;
  row?: number;
};

export type OpaqueBounds = { x: number; y: number; w: number; h: number };

const cleanedFrameCache = new WeakMap<LoadedAtlas, Map<string, HTMLCanvasElement>>();

/** True for transparent or near-white/grey matte pixels (AI export halos). */
export function isMattePixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 12) return true;
  if (r > 235 && g > 235 && b > 235) return true;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  return luma > 198 && sat < 32;
}

/** Flood-clear edge-connected matte pixels (white/grey padding around sprites). */
export function floodClearMatte(data: Uint8ClampedArray, w: number, h: number): void {
  if (w <= 0 || h <= 0) return;
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  const trySeed = (x: number, y: number): void => {
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isMattePixel(data[o]!, data[o + 1]!, data[o + 2]!, data[o + 3]!)) return;
    visited[i] = 1;
    queue.push(i);
  };

  for (let x = 0; x < w; x++) {
    trySeed(x, 0);
    trySeed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    trySeed(0, y);
    trySeed(w - 1, y);
  }

  while (queue.length > 0) {
    const i = queue.pop()!;
    const x = i % w;
    const y = (i - x) / w;
    data[i * 4 + 3] = 0;
    if (x > 0) trySeed(x - 1, y);
    if (x < w - 1) trySeed(x + 1, y);
    if (y > 0) trySeed(x, y - 1);
    if (y < h - 1) trySeed(x, y + 1);
  }
}

/** One pass: drop bright pixels that border transparency (leftover fringe). */
export function defringeAtlasData(data: Uint8ClampedArray, w: number, h: number): void {
  if (w <= 2 || h <= 2) return;
  const alpha = (x: number, y: number): number => data[(y * w + x) * 4 + 3]!;
  const clear: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3]! === 0) continue;
      const touchesTransparent =
        (x > 0 && alpha(x - 1, y) === 0) ||
        (x < w - 1 && alpha(x + 1, y) === 0) ||
        (y > 0 && alpha(x, y - 1) === 0) ||
        (y < h - 1 && alpha(x, y + 1) === 0);
      if (!touchesTransparent) continue;
      const luma = 0.299 * data[idx]! + 0.587 * data[idx + 1]! + 0.114 * data[idx + 2]!;
      if (luma > 190) clear.push(idx + 3);
    }
  }
  for (const a of clear) data[a] = 0;
}

/** Crop to non-transparent pixels. */
export function trimOpaqueBounds(data: Uint8ClampedArray, w: number, h: number, pad = 1): OpaqueBounds {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! > 10) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return { x: 0, y: 0, w, h };
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Remove matte padding, defringe, and trim to tight opaque bounds. */
export function cleanAtlasFrame(raw: HTMLCanvasElement): HTMLCanvasElement {
  const w = raw.width;
  const h = raw.height;
  const src = raw.getContext('2d')!;
  const img = src.getImageData(0, 0, w, h);
  floodClearMatte(img.data, w, h);
  defringeAtlasData(img.data, w, h);
  defringeAtlasData(img.data, w, h);
  const b = trimOpaqueBounds(img.data, w, h, 1);

  const out = document.createElement('canvas');
  out.width = b.w;
  out.height = b.h;
  const octx = out.getContext('2d')!;
  octx.imageSmoothingEnabled = false;
  octx.putImageData(img, -b.x, -b.y);
  return out;
}

import type { AtlasAnimations } from './AtlasAnimationTimelines';

export type AtlasManifest = {
  meta: {
    image: string;
    size: { w: number; h: number };
    cell?: { w: number; h: number };
    padding?: number;
    columns?: number;
    rows?: number;
    anchor?: string;
    trimmed?: boolean;
    trimTool?: string;
  };
  frames: Record<string, AtlasFrameRect>;
  animations?: AtlasAnimations;
};

export type LoadedAtlas = {
  manifest: AtlasManifest;
  sheet: HTMLCanvasElement;
};

const atlasCache = new Map<string, Promise<LoadedAtlas | null>>();

function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  return canvas;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Parse manifest JSON without loading the sheet. */
export function parseAtlasManifest(json: unknown): AtlasManifest | null {
  if (!json || typeof json !== 'object') return null;
  const m = json as AtlasManifest;
  if (!m.meta?.size || !m.frames || typeof m.frames !== 'object') return null;
  return m;
}

/** Load manifest + sheet; cached by manifest URL. */
export async function loadAtlas(manifestUrl: string, imageUrl?: string): Promise<LoadedAtlas | null> {
  const cached = atlasCache.get(manifestUrl);
  if (cached) return cached;

  const promise = (async (): Promise<LoadedAtlas | null> => {
    let manifest: AtlasManifest;
    try {
      const res = await fetch(manifestUrl);
      if (!res.ok) return null;
      const parsed = parseAtlasManifest(await res.json());
      if (!parsed) return null;
      manifest = parsed;
    } catch {
      return null;
    }

    const sheetUrl = imageUrl ?? `/assets/sprites/atlas/${manifest.meta.image}`;
    const img = await loadImage(sheetUrl);
    if (!img) return null;

    return { manifest, sheet: imageToCanvas(img) };
  })();

  atlasCache.set(manifestUrl, promise);
  return promise;
}

/** Crop one named frame from a loaded atlas. Returns null if the frame is missing. */
export function getFrameCanvas(atlas: LoadedAtlas, frameName: string, clean = true): HTMLCanvasElement | null {
  if (clean) {
    let cache = cleanedFrameCache.get(atlas);
    if (!cache) {
      cache = new Map();
      cleanedFrameCache.set(atlas, cache);
    }
    const hit = cache.get(frameName);
    if (hit) return hit;
    const raw = getFrameCanvas(atlas, frameName, false);
    if (!raw) return null;
    const trimmed = cleanAtlasFrame(raw);
    cache.set(frameName, trimmed);
    return trimmed;
  }

  const rect = atlas.manifest.frames[frameName];
  if (!rect) return null;

  const out = document.createElement('canvas');
  out.width = rect.w;
  out.height = rect.h;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas.sheet, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
  return out;
}

/** Frame names in manifest key order. */
export function listFrameNames(manifest: AtlasManifest): string[] {
  return Object.keys(manifest.frames);
}

/** Clear cached atlases (tests). */
export function clearAtlasCache(): void {
  atlasCache.clear();
}
