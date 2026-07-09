import type { WardrobeDefinition } from '@/data/types';
import type { CharacterAppearance, CharacterWardrobe } from '@/gameplay/CharacterAppearance';
import { cropOpaqueBounds } from './CharacterSprites';


const CANVAS_SIZE = 32;
// Where a hat's vertical center should land, as a fraction of body height (0 = top). Hat art
// sits in the middle of its 1024² PNG, so mapping it full-frame drops it on the chest — instead
// we crop to the hat's opaque bounds and re-center it on the head.
const HAT_CENTER_Y = 0.16;
/** Per-hat vertical nudge (fraction of body height) and optional scale tweak. */
const HAT_TUNE: Record<string, { dy?: number; scale?: number }> = {
  marsh_hood: { dy: -0.04, scale: 0.92 },
  mudwall_helm: { dy: 0.05, scale: 0.88 },
  reed_hat: { dy: 0 },
  lily_bloom: { dy: -0.02, scale: 0.95 },
};
/** Shelled folk have lower visible heads relative to the portrait frame. */
const SPECIES_HAT_DY: Record<string, number> = {
  turtle: 0.04,
  tortoise: 0.05,
};
/** Accessories map into a smaller chest/neck band, not the full body rect. */
const ACCESSORY_REGION_SCALE = 0.42;
const ACCESSORY_CENTER_Y = 0.58;
const WARDROBE_ART_BASE = '/assets/sprites/wardrobe';
const BUILD_SLUGS = ['slim', 'medium', 'heavy'] as const;
const CLOAK_IDS = new Set([
  'basin_cloak',
  'ferry_shawl',
  'croakend_weave',
  'levy_mantle',
  'rain_poncho',
  'elder_robe',
]);
const BUILD_AWARE_ITEMS = new Set(['ferry_kepi', 'basin_cloak', 'marsh_hood']);
/** AI brooch PNG is a full scallop — procedural pin until asset is regenerated. */
const PROCEDURAL_ONLY_ITEMS = new Set(['shell_brooch']);

/** Lightweight chromakey: removes near-corner-color pixels from a white-bg item PNG. */
function chromaKeyItem(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const frame = ctx.getImageData(0, 0, c.width, c.height);
  const d = frame.data;
  const r0 = (d[0]! + d[(c.width - 1) * 4]!) / 2;
  const g0 = (d[1]! + d[(c.width - 1) * 4 + 1]!) / 2;
  const b0 = (d[2]! + d[(c.width - 1) * 4 + 2]!) / 2;
  const hard = 30;
  const soft = 46;
  for (let i = 0; i < d.length; i += 4) {
    const dist = Math.max(Math.abs(d[i]! - r0), Math.abs(d[i + 1]! - g0), Math.abs(d[i + 2]! - b0));
    const nearWhite = d[i]! > 235 && d[i + 1]! > 235 && d[i + 2]! > 235;
    if (dist < hard || nearWhite) d[i + 3] = 0;
    else if (dist < soft) d[i + 3] = Math.round(d[i + 3]! * (dist - hard) / (soft - hard));
  }
  ctx.putImageData(frame, 0, 0);
  return c;
}

const _wardrobeItemCache = new Map<string, Promise<HTMLCanvasElement | null>>();

/**
 * Extract one garment frame from an animation strip by splitting on transparent gutters.
 * Cloak sheets are 1536×1024 with 4 portrait frames (384px each), so the old `round(w/h)`
 * frame-count guess returned 2 and grabbed two cloaks at once. Gutter-splitting finds the
 * real frame boundaries regardless of count, so a static portrait gets one clean cloak.
 */
function extractWardrobeFrame(sheet: HTMLCanvasElement, frameIndex: number): HTMLCanvasElement {
  const w = sheet.width;
  const h = sheet.height;
  const sctx = sheet.getContext('2d');
  const full = () => {
    const o = document.createElement('canvas');
    o.width = w;
    o.height = h;
    const c = o.getContext('2d')!;
    c.imageSmoothingEnabled = false;
    c.drawImage(sheet, 0, 0);
    return o;
  };
  if (!sctx) return full();
  const { data } = sctx.getImageData(0, 0, w, h);
  const col = new Float64Array(w);
  for (let y = 0; y < h; y++) {
    const base = y * w;
    for (let x = 0; x < w; x++) if (data[(base + x) * 4 + 3]! > 24) col[x]++;
  }
  const raw: Array<[number, number]> = [];
  let start = -1;
  for (let x = 0; x < w; x++) {
    if (col[x]! > 1 && start < 0) start = x;
    else if (col[x]! <= 1 && start >= 0) {
      raw.push([start, x - 1]);
      start = -1;
    }
  }
  if (start >= 0) raw.push([start, w - 1]);
  const minGutter = Math.max(4, Math.floor(w * 0.02));
  const bands: Array<[number, number]> = [];
  for (const b of raw) {
    const prev = bands[bands.length - 1];
    if (prev && b[0] - prev[1] - 1 < minGutter) prev[1] = b[1];
    else bands.push([b[0], b[1]]);
  }
  if (bands.length === 0) return full();
  const idx = Math.min(Math.max(0, frameIndex), bands.length - 1);
  const [x0, x1] = bands[idx]!;
  const fw = x1 - x0 + 1;
  const out = document.createElement('canvas');
  out.width = fw;
  out.height = h;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, x0, 0, fw, h, 0, 0, fw, h);
  return out;
}

function tryLoadWardrobeImage(path: string): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(chromaKeyItem(img));
    img.onerror = () => resolve(null);
    img.src = path;
  });
}

function wardrobeLoadPaths(itemId: string, build = 1): string[] {
  const slug = BUILD_SLUGS[Math.min(2, Math.max(0, build))] ?? 'medium';
  const paths: string[] = [];
  if (BUILD_AWARE_ITEMS.has(itemId)) {
    paths.push(`${WARDROBE_ART_BASE}/${itemId}_${slug}.png`);
  }
  if (CLOAK_IDS.has(itemId)) {
    paths.push(`${WARDROBE_ART_BASE}/${itemId}_sheet.png`);
  }
  paths.push(`${WARDROBE_ART_BASE}/${itemId}.png`);
  return paths;
}

/** Load a single wardrobe item overlay (item only, chromakeyed). */
export function loadWardrobeItemCanvas(
  itemId: string,
  build = 1,
  frameIndex = 0,
): Promise<HTMLCanvasElement | null> {
  return loadWardrobeItemPng(itemId, build, frameIndex);
}

function loadWardrobeItemPng(
  itemId: string,
  build = 1,
  frameIndex = 0,
): Promise<HTMLCanvasElement | null> {
  const cacheKey = `${itemId}:${build}:${frameIndex}`;
  const cached = _wardrobeItemCache.get(cacheKey);
  if (cached) return cached;
  const p = (async () => {
    if (PROCEDURAL_ONLY_ITEMS.has(itemId)) return null;
    for (const path of wardrobeLoadPaths(itemId, build)) {
      const sheet = await tryLoadWardrobeImage(path);
      if (!sheet) continue;
      if (path.endsWith('_sheet.png')) return extractWardrobeFrame(sheet, frameIndex);
      return sheet;
    }
    return null;
  })();
  _wardrobeItemCache.set(cacheKey, p);
  return p;
}

export interface WardrobeRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Blit a full garment PNG into a pixel rectangle (used for cloaks filling the body margin). */
function blitPngInRegion(gfx: CanvasRenderingContext2D, png: HTMLCanvasElement, r: WardrobeRegion): void {
  gfx.save();
  gfx.imageSmoothingEnabled = false;
  gfx.drawImage(png, 0, 0, png.width, png.height, r.x, r.y, r.w, r.h);
  gfx.restore();
}

/** Draw a procedural 32-grid item mapped into a pixel rectangle. */
function drawItemInRegion(gfx: CanvasRenderingContext2D, itemId: string, r: WardrobeRegion): void {
  gfx.save();
  gfx.imageSmoothingEnabled = false;
  gfx.translate(r.x, r.y);
  gfx.scale(r.w / CANVAS_SIZE, r.h / CANVAS_SIZE);
  drawItemById(gfx, itemId);
  gfx.restore();
}

/**
 * Blit a hat PNG onto the head: crop to the hat's opaque bounds, keep the author's size scale
 * (full PNG → body width), and re-center it at HAT_CENTER_Y so it lands on the crown/brow line
 * instead of the chest.
 */
function blitHatOnHead(
  gfx: CanvasRenderingContext2D,
  png: HTMLCanvasElement,
  r: WardrobeRegion,
  itemId: string,
  speciesId: string,
): void {
  const b = cropOpaqueBounds(png, 0);
  const tune = HAT_TUNE[itemId] ?? {};
  const speciesDy = SPECIES_HAT_DY[speciesId] ?? 0;
  const itemScale = tune.scale ?? 1;
  const scale = (r.w / png.width) * itemScale;
  const dw = b.w * scale;
  const dh = b.h * scale;
  const centerY = HAT_CENTER_Y + (tune.dy ?? 0) + speciesDy;
  const dx = r.x + r.w / 2 - dw / 2;
  const dy = r.y + r.h * centerY - dh / 2;
  gfx.save();
  gfx.imageSmoothingEnabled = false;
  gfx.drawImage(png, b.x, b.y, b.w, b.h, dx, dy, dw, dh);
  gfx.restore();
}

/** Blit a small accessory onto the chest/neck band instead of scaling to full body width. */
function blitAccessoryOnBody(
  gfx: CanvasRenderingContext2D,
  png: HTMLCanvasElement,
  r: WardrobeRegion,
  itemId: string,
): void {
  const b = cropOpaqueBounds(png, 0);
  const pinScale = itemId === 'levy_pin' ? 0.28 : itemId === 'shell_brooch' ? 0.22 : ACCESSORY_REGION_SCALE;
  const baseW = r.w * pinScale;
  const scale = baseW / b.w;
  const dw = b.w * scale;
  const dh = b.h * scale;
  const dx = r.x + r.w / 2 - dw / 2;
  const dy = r.y + r.h * ACCESSORY_CENTER_Y - dh / 2;
  gfx.save();
  gfx.imageSmoothingEnabled = false;
  gfx.drawImage(png, b.x, b.y, b.w, b.h, dx, dy, dw, dh);
  gfx.restore();
}

function accessoryRegion(r: WardrobeRegion): WardrobeRegion {
  const w = r.w * ACCESSORY_REGION_SCALE;
  const h = r.h * 0.35;
  return {
    x: r.x + (r.w - w) / 2,
    y: r.y + r.h * (ACCESSORY_CENTER_Y - 0.12),
    w,
    h,
  };
}

function speciesAllowed(item: WardrobeDefinition, speciesId: string): boolean {
  return item.species.includes('*') || item.species.includes(speciesId);
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillRect(x, y, w, h);
}

/* ── Hats (drawn on top of body) ── */

function drawReedHat(ctx: CanvasRenderingContext2D): void {
  // Straw-yellow — reads on green folk.
  ctx.fillStyle = '#e8c86a';
  px(ctx, 5, 5, 22, 3);
  px(ctx, 7, 2, 18, 3);
  ctx.fillStyle = '#c49a30';
  px(ctx, 8, 8, 16, 2);
  ctx.fillStyle = '#fff0b0';
  px(ctx, 10, 3, 12, 1);
}

function drawShellCap(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#c8a060';
  px(ctx, 8, 4, 16, 5);
  ctx.fillStyle = '#8a6040';
  px(ctx, 10, 2, 12, 2);
  ctx.fillStyle = '#f0d090';
  px(ctx, 11, 6, 10, 1);
}

function drawMudwallHelm(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#b0a890';
  px(ctx, 9, 4, 14, 4);
  ctx.fillStyle = '#706858';
  px(ctx, 10, 3, 12, 1);
  ctx.fillStyle = '#e0d8c0';
  px(ctx, 12, 5, 8, 1);
  ctx.fillStyle = '#f0c14b';
  px(ctx, 14, 6, 4, 1);
}

function drawLilyBloom(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ff90c8';
  px(ctx, 11, 1, 4, 4);
  px(ctx, 17, 1, 4, 4);
  ctx.fillStyle = '#ff50a0';
  px(ctx, 14, 2, 4, 3);
  ctx.fillStyle = '#ffe080';
  px(ctx, 15, 3, 2, 2);
  ctx.fillStyle = '#90d050';
  px(ctx, 14, 5, 4, 2);
}

function drawFerryKepi(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8a3020';
  px(ctx, 9, 5, 14, 3);
  px(ctx, 11, 3, 10, 2);
  ctx.fillStyle = '#f0c14b';
  px(ctx, 11, 7, 10, 2);
  ctx.fillStyle = '#fff0c0';
  px(ctx, 13, 4, 6, 1);
}

function drawMarshHood(ctx: CanvasRenderingContext2D): void {
  // Deep indigo, not marsh green — must contrast frog body.
  ctx.fillStyle = '#2a2870';
  px(ctx, 6, 2, 20, 9);
  ctx.fillStyle = '#181848';
  px(ctx, 9, 4, 14, 6);
  ctx.fillStyle = '#5a58b0';
  px(ctx, 7, 10, 18, 2);
  ctx.fillStyle = '#9080e0';
  px(ctx, 10, 3, 4, 1);
}

/* ── Cloaks (drawn behind body) ── */

function drawBasinCloak(ctx: CanvasRenderingContext2D): void {
  // Warm rust — not body-green.
  ctx.fillStyle = '#a04828';
  px(ctx, 3, 11, 26, 16);
  ctx.fillStyle = '#c06840';
  px(ctx, 4, 11, 4, 15);
  px(ctx, 24, 11, 4, 15);
  ctx.fillStyle = '#6a2810';
  px(ctx, 7, 14, 18, 11);
}

function drawFerryShawl(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#c07830';
  px(ctx, 2, 11, 28, 15);
  ctx.fillStyle = '#e09850';
  px(ctx, 3, 11, 5, 13);
  px(ctx, 24, 12, 5, 12);
  ctx.fillStyle = '#803818';
  px(ctx, 8, 22, 16, 4);
}

function drawCroakendWeave(ctx: CanvasRenderingContext2D): void {
  const patches = ['#e85040', '#f0c14b', '#40a0e0', '#e080c0'];
  let i = 0;
  for (let y = 11; y < 28; y += 4) {
    for (let x = 4; x < 28; x += 5) {
      ctx.fillStyle = patches[i % patches.length]!;
      px(ctx, x, y, 4, 3);
      i++;
    }
  }
}

function drawLevyMantle(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1a2840';
  px(ctx, 4, 10, 24, 17);
  ctx.fillStyle = '#f0c14b';
  px(ctx, 4, 10, 24, 2);
  px(ctx, 4, 25, 24, 2);
  ctx.fillStyle = '#e8e0c8';
  px(ctx, 7, 14, 18, 9);
}

function drawRainPoncho(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#306090';
  px(ctx, 2, 9, 28, 18);
  ctx.fillStyle = '#4880b0';
  px(ctx, 4, 11, 24, 14);
  ctx.fillStyle = '#90c0e0';
  px(ctx, 13, 9, 6, 3);
}

function drawElderRobe(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#4a1060';
  px(ctx, 3, 8, 26, 20);
  ctx.fillStyle = '#280838';
  px(ctx, 6, 12, 20, 14);
  ctx.fillStyle = '#f0c14b';
  px(ctx, 14, 10, 4, 6);
  ctx.fillStyle = '#e8b0ff';
  px(ctx, 5, 9, 3, 16);
  px(ctx, 24, 9, 3, 16);
}

/* ── Accessories (drawn on top) ── */

function drawReedCharm(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f0e060';
  px(ctx, 22, 15, 4, 9);
  ctx.fillStyle = '#c09020';
  px(ctx, 23, 14, 2, 2);
  ctx.fillStyle = '#fff8b0';
  px(ctx, 23, 17, 2, 2);
}

function drawClayBead(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#e07040';
  px(ctx, 12, 18, 8, 2);
  ctx.fillStyle = '#ff9050';
  px(ctx, 13, 17, 3, 3);
  px(ctx, 17, 17, 3, 3);
  ctx.fillStyle = '#ffe0a0';
  px(ctx, 15, 16, 2, 2);
}

function drawMarketScarf(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#e03030';
  px(ctx, 8, 14, 16, 3);
  px(ctx, 6, 17, 6, 8);
  ctx.fillStyle = '#ff6060';
  px(ctx, 7, 22, 4, 3);
}

function drawLevyPin(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffe060';
  px(ctx, 12, 15, 8, 6);
  ctx.fillStyle = '#1a2840';
  px(ctx, 14, 16, 4, 4);
  ctx.fillStyle = '#fff8c0';
  px(ctx, 13, 14, 6, 1);
}

function drawShellBrooch(ctx: CanvasRenderingContext2D): void {
  // Small coral scallop pin, not a white block (AR-035: read as a fan shell, not missing art).
  ctx.fillStyle = '#7a4a30';
  px(ctx, 14, 20, 5, 1);
  ctx.fillStyle = '#f2b6a0';
  px(ctx, 14, 18, 5, 2);
  px(ctx, 15, 17, 3, 1);
  ctx.fillStyle = '#d98c74';
  px(ctx, 15, 18, 1, 2);
  px(ctx, 17, 18, 1, 2);
  ctx.fillStyle = '#ffd8c0';
  px(ctx, 16, 17, 1, 1);
}

function drawHopWhistle(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#c09040';
  px(ctx, 9, 19, 10, 2);
  ctx.fillStyle = '#ffe060';
  px(ctx, 18, 18, 4, 4);
  ctx.fillStyle = '#806020';
  px(ctx, 19, 19, 2, 2);
}

type WardrobeDrawer = (ctx: CanvasRenderingContext2D) => void;

const HAT_DRAW: Record<string, WardrobeDrawer> = {
  reed_hat: drawReedHat,
  shell_cap: drawShellCap,
  mudwall_helm: drawMudwallHelm,
  lily_bloom: drawLilyBloom,
  ferry_kepi: drawFerryKepi,
  marsh_hood: drawMarshHood,
};

const CLOAK_DRAW: Record<string, WardrobeDrawer> = {
  basin_cloak: drawBasinCloak,
  ferry_shawl: drawFerryShawl,
  croakend_weave: drawCroakendWeave,
  levy_mantle: drawLevyMantle,
  rain_poncho: drawRainPoncho,
  elder_robe: drawElderRobe,
};

const ACCESSORY_DRAW: Record<string, WardrobeDrawer> = {
  reed_charm: drawReedCharm,
  clay_bead: drawClayBead,
  market_scarf: drawMarketScarf,
  levy_pin: drawLevyPin,
  shell_brooch: drawShellBrooch,
  hop_whistle: drawHopWhistle,
};

export const WARDROBE_ITEM_IDS = [
  ...Object.keys(HAT_DRAW),
  ...Object.keys(CLOAK_DRAW),
  ...Object.keys(ACCESSORY_DRAW),
] as const;

/** Procedural wardrobe item draw for thumbnails / fallback. */
export function drawItemByIdProcedural(ctx: CanvasRenderingContext2D, itemId: string): boolean {
  return drawItemById(ctx, itemId);
}

function drawItemById(ctx: CanvasRenderingContext2D, itemId: string): boolean {
  const drawer = HAT_DRAW[itemId] ?? CLOAK_DRAW[itemId] ?? ACCESSORY_DRAW[itemId];
  if (!drawer) return false;
  drawer(ctx);
  return true;
}

function resolveItem(
  wardrobe: CharacterWardrobe,
  slot: keyof CharacterWardrobe,
  wardrobeItems: WardrobeDefinition[],
  speciesId: string,
): string | undefined {
  const id = wardrobe[slot];
  if (!id) return undefined;
  const def = wardrobeItems.find((w) => w.id === id);
  if (!def || !speciesAllowed(def, speciesId)) return undefined;
  return id;
}

/** Cloaks — call before the body sprite. */
export function applyWardrobeBackLayers(
  ctx: CanvasRenderingContext2D,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
  speciesId: string,
): void {
  const id = resolveItem(appearance.wardrobe, 'cloak', wardrobeItems, speciesId);
  if (id) drawItemById(ctx, id);
}

/** Hats and accessories — call after the body sprite. */
export function applyWardrobeFrontLayers(
  ctx: CanvasRenderingContext2D,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
  speciesId: string,
): void {
  const hatId = resolveItem(appearance.wardrobe, 'hat', wardrobeItems, speciesId);
  const accId = resolveItem(appearance.wardrobe, 'accessory', wardrobeItems, speciesId);
  if (hatId) drawItemById(ctx, hatId);
  if (accId) drawItemById(ctx, accId);
}

/** @deprecated use back + front split */
export function applyWardrobeLayers(
  ctx: CanvasRenderingContext2D,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
  speciesId: string,
): void {
  applyWardrobeBackLayers(ctx, appearance, wardrobeItems, speciesId);
  applyWardrobeFrontLayers(ctx, appearance, wardrobeItems, speciesId);
}

/** Overlay equipped wardrobe on an existing portrait (e.g. after species PNG loads). */
export function applyWardrobeOverlay(
  target: HTMLCanvasElement,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
  speciesId: string,
): void {
  const ctx = target.getContext('2d');
  if (!ctx) return;
  const w = target.width;
  const h = target.height;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(w / CANVAS_SIZE, h / CANVAS_SIZE);
  applyWardrobeBackLayers(ctx, appearance, wardrobeItems, speciesId);
  applyWardrobeFrontLayers(ctx, appearance, wardrobeItems, speciesId);
  ctx.restore();
}

/**
 * PNG-first cloak layer (behind body). Tries build-aware paths and animated `_sheet.png`.
 */
export async function applyWardrobeBackOverlayAsync(
  target: HTMLCanvasElement,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
  speciesId: string,
  cloakFrameIndex = 0,
  region?: WardrobeRegion,
): Promise<void> {
  const ctx = target.getContext('2d');
  if (!ctx) return;
  const gfx = ctx;
  const build = appearance.build ?? 1;
  gfx.imageSmoothingEnabled = false;

  const cloakId = resolveItem(appearance.wardrobe, 'cloak', wardrobeItems, speciesId);
  if (!cloakId) return;
  // Cloak fills the whole (padded) canvas so its collar sits at the neck and the drape shows
  // in the side/bottom margin around the body — the body is drawn on top afterwards.
  const cloakRect: WardrobeRegion = { x: 0, y: 0, w: target.width, h: target.height };
  const png = await loadWardrobeItemPng(cloakId, build, cloakFrameIndex);
  if (png) {
    blitPngInRegion(gfx, png, cloakRect);
    return;
  }
  drawItemInRegion(gfx, cloakId, region ?? cloakRect);
}

/**
 * PNG-first hat and accessory layers (in front of body).
 */
export async function applyWardrobeFrontOverlayAsync(
  target: HTMLCanvasElement,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
  speciesId: string,
  region?: WardrobeRegion,
): Promise<void> {
  const ctx = target.getContext('2d');
  if (!ctx) return;
  const gfx = ctx;
  const build = appearance.build ?? 1;
  gfx.imageSmoothingEnabled = false;
  // Front items align to the body rect so hats land on the head even when the canvas has
  // extra cloak margin around the body.
  const r: WardrobeRegion = region ?? { x: 0, y: 0, w: target.width, h: target.height };

  async function drawItem(itemId: string | undefined, isHat: boolean, isAccessory: boolean): Promise<void> {
    if (!itemId) return;
    const png = await loadWardrobeItemPng(itemId, build, 0);
    if (png) {
      if (isHat) blitHatOnHead(gfx, png, r, itemId, speciesId);
      else if (isAccessory) blitAccessoryOnBody(gfx, png, r, itemId);
      else blitPngInRegion(gfx, png, r);
      return;
    }
    const region = isAccessory ? accessoryRegion(r) : r;
    drawItemInRegion(gfx, itemId, region);
  }

  const hatId = resolveItem(appearance.wardrobe, 'hat', wardrobeItems, speciesId);
  const accId = resolveItem(appearance.wardrobe, 'accessory', wardrobeItems, speciesId);
  await drawItem(hatId, true, false);
  await drawItem(accId, false, true);
}

/**
 * PNG-first wardrobe overlay. Tries to load each equipped item from
 * /assets/sprites/wardrobe/{itemId}.png (128×128, white background).
 * Falls back to procedural drawing when the PNG is not found.
 * @deprecated Prefer back + front split via composeCharacterArtCanvas.
 */
export async function applyWardrobeOverlayAsync(
  target: HTMLCanvasElement,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
  speciesId: string,
  cloakFrameIndex = 0,
): Promise<void> {
  await applyWardrobeBackOverlayAsync(target, appearance, wardrobeItems, speciesId, cloakFrameIndex);
  await applyWardrobeFrontOverlayAsync(target, appearance, wardrobeItems, speciesId);
}

export function filterWardrobeForSpecies(
  items: WardrobeDefinition[],
  speciesId: string,
): WardrobeDefinition[] {
  return items.filter((item) => speciesAllowed(item, speciesId));
}
