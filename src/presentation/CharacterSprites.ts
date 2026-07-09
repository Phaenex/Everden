import * as THREE from 'three';
import { ISO_CAMERA_OFFSET } from './IsometricCamera';
import type { CharacterAppearance } from '@/gameplay/CharacterAppearance';
import { defaultAppearance, variantFromPatternId } from '@/gameplay/CharacterAppearance';
import type { WardrobeDefinition } from '@/data/types';
import {
  getSpeciesAppearance,
  getSpeciesAppearanceRegistry,
  patternSheetSuffix,
} from '@/data/SpeciesAppearanceRegistry';
import { applyWardrobeBackLayers, applyWardrobeFrontLayers, applyWardrobeBackOverlayAsync, applyWardrobeFrontOverlayAsync } from './WardrobeLayers';
import { SpriteAnimator } from './SpriteAnimator';
import type { EventBus } from '@/core/EventBus';

/**
 * The isometric camera's view direction never changes (it translates but never
 * rotates — see `IsometricCamera`), so a single Y-axis-only rotation, computed once,
 * keeps every character card standing upright while facing the camera's horizontal
 * quadrant (per docs/art/VISUAL_DIRECTION.md "Billboard: Y-axis fixed; face camera
 * quadrant"). Previously this was an arbitrary `rotation.x` tilt that didn't account
 * for the camera's 45° yaw, leaving characters almost edge-on and barely visible.
 */
export const CHARACTER_MESH_SIZE = 3.0;
export const NAME_LABEL_SCALE_X = 1.5;
export const NAME_LABEL_SCALE_Y = 0.38;

/** Re-export for district backdrops that face the same camera quadrant. */
export const BILLBOARD_ROTATION = new THREE.Quaternion().setFromUnitVectors(
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(ISO_CAMERA_OFFSET.x, 0, ISO_CAMERA_OFFSET.z).normalize(),
);

const ART_BASE = '/assets';

/**
 * AI-generated placeholder art (see docs/art/ASSET_SHEET.md) ships as plain-background
 * renders, not true alpha-cut sprites. Sample the corner pixel and key out anything close
 * to it so the art drops onto the same transparent billboard the procedural sprites use.
 */
function sampleCornerColor(
  data: Uint8ClampedArray,
  w: number,
  px: number,
  py: number,
): [number, number, number] {
  const i = (py * w + px) * 4;
  return [data[i]!, data[i + 1]!, data[i + 2]!];
}

function avgCornerBg(data: Uint8ClampedArray, w: number, h: number): [number, number, number] {
  const samples = [
    sampleCornerColor(data, w, 1, 1),
    sampleCornerColor(data, w, w - 2, 1),
    sampleCornerColor(data, w, 1, h - 2),
    sampleCornerColor(data, w, w - 2, h - 2),
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const s of samples) {
    r += s[0];
    g += s[1];
    b += s[2];
  }
  return [r / 4, g / 4, b / 4];
}

function chromaKeyCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const [r0, g0, b0] = avgCornerBg(frame.data, canvas.width, canvas.height);
  const hardThreshold = 30;
  const softThreshold = 46;
  for (let i = 0; i < frame.data.length; i += 4) {
    const dr = Math.abs(frame.data[i]! - r0);
    const dg = Math.abs(frame.data[i + 1]! - g0);
    const db = Math.abs(frame.data[i + 2]! - b0);
    const dist = Math.max(dr, dg, db);
    const r = frame.data[i]!;
    const g = frame.data[i + 1]!;
    const b = frame.data[i + 2]!;
    const nearWhite = r > 222 && g > 222 && b > 222;
    if (dist < hardThreshold || nearWhite) {
      frame.data[i + 3] = 0;
    } else if (dist < softThreshold) {
      const t = (dist - hardThreshold) / (softThreshold - hardThreshold);
      frame.data[i + 3] = Math.round(frame.data[i + 3]! * t);
    }
  }
  defringeEdges(frame.data, canvas.width, canvas.height);
  ctx.putImageData(frame, 0, 0);
  return canvas;
}

/**
 * Kill the white/light halo left when a plain-background render is keyed: any bright,
 * partially- or fully-opaque pixel that borders transparency is background bleed, not
 * the sprite, so drop it. One pass is enough for the 1-2px fringe these AI exports leave.
 */
function defringeEdges(data: Uint8ClampedArray, w: number, h: number): void {
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
  for (const i of clear) data[i] = 0;
}

/** Horizontal sprite sheets use square frames (e.g. 256×128 → 2 frames of 128×128). */
type SheetLayout = 'strip' | 'dual' | 'grid4x2' | 'single';

function countRowSegments(ctx: CanvasRenderingContext2D, w: number, h: number, rowY: number): number {
  const y = Math.floor(h * rowY);
  let segments = 0;
  let inSeg = false;
  for (let x = 0; x < w; x++) {
    const ink = ctx.getImageData(x, y, 1, 1).data[3]! > 30;
    if (ink && !inSeg) {
      segments++;
      inSeg = true;
    }
    if (!ink) inSeg = false;
  }
  return segments;
}

function cellInk(ctx: CanvasRenderingContext2D, x: number, y: number, cw: number, ch: number): number {
  const frame = ctx.getImageData(x, y, cw, ch);
  const d = frame.data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i]! > 30) n++;
  }
  return n;
}

/**
 * Split a 1-D occupancy profile into bands of ink separated by transparent gutters.
 * Gutters shorter than `minGutter` are treated as internal gaps (legs, ears) and merged,
 * so only true pose separators split the sheet. Returns `[start,end]` inclusive ranges.
 */
/**
 * Square sheets sometimes pack two poses side-by-side with a faint gutter the band
 * splitter misses — force a center valley split when both halves carry ink.
 */
function dualPoseColumnSplit(col: Float64Array, w: number): number | null {
  if (w < 64) return null;
  const mid = Math.floor(w / 2);
  let left = 0;
  let right = 0;
  for (let x = 0; x < mid; x++) left += col[x]!;
  for (let x = mid; x < w; x++) right += col[x]!;
  const total = left + right;
  if (total < 20) return null;
  if (left < total * 0.2 || right < total * 0.2) return null;
  const lo = Math.floor(w * 0.36);
  const hi = Math.floor(w * 0.64);
  let bestX = mid;
  let bestVal = col[mid]!;
  for (let x = lo; x <= hi; x++) {
    if (col[x]! < bestVal) {
      bestVal = col[x]!;
      bestX = x;
    }
  }
  const peak = Math.max(...Array.from(col));
  if (bestVal > peak * 0.12) return null;
  return bestX;
}

function splitBands(profile: Float64Array, len: number): Array<[number, number]> {
  let max = 0;
  for (let i = 0; i < len; i++) if (profile[i]! > max) max = profile[i]!;
  if (max <= 0) return [[0, len - 1]];
  const occThresh = Math.max(1, max * 0.02);
  const minGutter = Math.max(4, Math.floor(len * 0.05));
  const runs: Array<[number, number]> = [];
  let start = -1;
  for (let i = 0; i < len; i++) {
    const occupied = profile[i]! > occThresh;
    if (occupied && start < 0) start = i;
    else if (!occupied && start >= 0) {
      runs.push([start, i - 1]);
      start = -1;
    }
  }
  if (start >= 0) runs.push([start, len - 1]);
  if (runs.length === 0) return [[0, len - 1]];
  const merged: Array<[number, number]> = [[runs[0]![0], runs[0]![1]]];
  for (let k = 1; k < runs.length; k++) {
    const prev = merged[merged.length - 1]!;
    const gap = runs[k]![0] - prev[1] - 1;
    if (gap < minGutter) prev[1] = runs[k]![1];
    else merged.push([runs[k]![0], runs[k]![1]]);
  }
  return merged;
}

/**
 * Isolate the single dominant sprite in a square AI sheet. These exports inconsistently
 * hold 1, 2 (side-by-side) or 4 (2×2) poses per build, so instead of guessing a fixed grid
 * we segment by transparent gutters and keep the densest cell. Returns null-safe full-frame
 * when the sheet is a single sprite (no real gutters) so `cropOpaqueBounds` can tighten it.
 */
function segmentDominantCell(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): { x: number; y: number; w: number; h: number } {
  if (w <= 2 || h <= 2) return { x: 0, y: 0, w, h };
  const { data } = ctx.getImageData(0, 0, w, h);
  const col = new Float64Array(w);
  const row = new Float64Array(h);
  for (let y = 0; y < h; y++) {
    const base = y * w;
    for (let x = 0; x < w; x++) {
      if (data[(base + x) * 4 + 3]! > 24) {
        col[x]++;
        row[y]++;
      }
    }
  }
  let colBands = splitBands(col, w);
  const rowBands = splitBands(row, h);
  if (colBands.length <= 1) {
    const splitX = dualPoseColumnSplit(col, w);
    if (splitX !== null && splitX > 4 && splitX < w - 5) {
      colBands = [
        [0, splitX - 1],
        [splitX + 1, w - 1],
      ];
    }
  }
  if (colBands.length <= 1 && rowBands.length <= 1) return { x: 0, y: 0, w, h };
  let best = { x: 0, y: 0, w, h };
  let bestScore = -1;
  for (const [x0, x1] of colBands) {
    for (const [y0, y1] of rowBands) {
      const cw = x1 - x0 + 1;
      const ch = y1 - y0 + 1;
      let n = 0;
      for (let y = y0; y <= y1; y++) {
        const base = y * w;
        for (let x = x0; x <= x1; x++) if (data[(base + x) * 4 + 3]! > 24) n++;
      }
      // Prefer tall portrait cells over dense face close-ups in multi-pose AI sheets.
      const aspect = ch / Math.max(1, cw);
      const portraitBias = aspect >= 1.05 ? 1.35 : aspect <= 0.75 ? 0.45 : 1;
      const score = n * portraitBias;
      if (score > bestScore) {
        bestScore = score;
        best = { x: x0, y: y0, w: cw, h: ch };
      }
    }
  }
  return best;
}

function detectSheetLayout(sheet: HTMLCanvasElement): SheetLayout {
  const w = sheet.width;
  const h = sheet.height;
  if (h <= 0) return 'single';
  if (w >= h * 1.75) return 'strip';
  if (w !== h || w <= 128) return 'single';

  const ctx = sheet.getContext('2d');
  if (!ctx) return 'dual';

  const cols = 4;
  const rows = 2;
  const cw = Math.floor(w / cols);
  const ch = Math.floor(h / rows);
  const cellThreshold = cw * ch * 0.04;
  let activeCells = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (cellInk(ctx, c * cw, r * ch, cw, ch) > cellThreshold) activeCells++;
    }
  }

  const topSegs = countRowSegments(ctx, w, h, 0.28);
  const midSegs = countRowSegments(ctx, w, h, 0.5);
  if (activeCells >= 6 && topSegs >= 4 && midSegs >= 4) return 'grid4x2';
  return 'dual';
}

export function spriteSheetFrameCount(sheet: HTMLCanvasElement, animatedStrip = false): number {
  const layout = detectSheetLayout(sheet);
  if (layout === 'strip') {
    const h = sheet.height;
    return h > 0 ? Math.max(1, Math.round(sheet.width / h)) : 1;
  }
  if (layout === 'dual') return 2;
  if (layout === 'grid4x2') return 1;
  if (animatedStrip && sheet.width >= sheet.height * 1.4) return Math.max(4, Math.round(sheet.width / sheet.height));
  return 1;
}

export function spriteFrameWidth(sheet: HTMLCanvasElement, count: number): number {
  const layout = detectSheetLayout(sheet);
  if (layout === 'grid4x2') return Math.floor(sheet.width / 4);
  if (layout === 'dual') return Math.floor(sheet.width / 2);
  if (count <= 1) return sheet.width;
  return Math.floor(sheet.width / count);
}

export function extractSpriteFrame(sheet: HTMLCanvasElement, frameIndex = 0, _species?: string): HTMLCanvasElement {
  const out = document.createElement('canvas');
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const w = sheet.width;
  const h = sheet.height;

  // Wide sheets are horizontal animation strips — slice by frame index.
  if (h > 0 && w >= h * 1.4) {
    const count = spriteSheetFrameCount(sheet);
    const fw = spriteFrameWidth(sheet, count);
    const idx = Math.min(Math.max(0, frameIndex), Math.max(0, count - 1));
    out.width = fw;
    out.height = h;
    ctx.drawImage(sheet, idx * fw, 0, fw, h, 0, 0, fw, h);
    return out;
  }

  // Square AI sheets hold 1/2/4 inconsistent poses — isolate the single dominant sprite.
  const src = sheet.getContext('2d');
  if (src) {
    const cell = segmentDominantCell(src, w, h);
    out.width = cell.w;
    out.height = cell.h;
    ctx.drawImage(sheet, cell.x, cell.y, cell.w, cell.h, 0, 0, cell.w, cell.h);
    return out;
  }

  out.width = w;
  out.height = h;
  ctx.drawImage(sheet, 0, 0);
  return out;
}

/** Crop to non-transparent pixels — for thumbnails and preview framing. */
export function cropOpaqueBounds(src: HTMLCanvasElement, pad = 1): { x: number; y: number; w: number; h: number } {
  const sctx = src.getContext('2d')!;
  const { data, width, height } = sctx.getImageData(0, 0, src.width, src.height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]! > 10) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return { x: 0, y: 0, w: width, h: height };
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Fit a cropped sprite into a square with smoothing off (thumbs + small swatches). */
export function drawCroppedSprite(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  destX: number,
  destY: number,
  destSize: number,
): void {
  const b = cropOpaqueBounds(src, 2);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(destX, destY, destSize, destSize);
  ctx.drawImage(src, b.x, b.y, b.w, b.h, destX, destY, destSize, destSize);
}

/**
 * Fit portrait art into a preview box using the largest integer upscale when the art is
 * smaller than the box, otherwise downscale with smoothing off — avoids mushy CSS scaling.
 */
export function drawPortraitFit(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  boxW: number,
  boxH: number,
  pad = 8,
): void {
  const b = cropOpaqueBounds(src, 2);
  const innerW = boxW - pad * 2;
  const innerH = boxH - pad * 2;
  const fit = Math.min(innerW / b.w, innerH / b.h);
  const scale = fit >= 1 ? Math.max(1, Math.floor(fit)) : fit;
  const dw = Math.round(b.w * scale);
  const dh = Math.round(b.h * scale);
  const ox = pad + Math.floor((innerW - dw) / 2);
  const oy = pad + Math.floor((innerH - dh) / 2);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0c1814';
  ctx.fillRect(0, 0, boxW, boxH);
  ctx.drawImage(src, b.x, b.y, b.w, b.h, ox, oy, dw, dh);
}

function tryLoadImage(path: string): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(chromaKeyCanvas(img));
    img.onerror = () => resolve(null);
    img.src = path;
  });
}

function patternIndexFromAppearance(species: string, appearance: CharacterAppearance): number {
  if (appearance.patternId) {
    return variantFromPatternId(species, appearance.patternId, getSpeciesAppearanceRegistry());
  }
  return Math.min(3, Math.max(0, appearance.variant ?? 0));
}

/**
 * Named-NPC art first, then species art, then null so callers keep their procedural
 * fallback. Never throws — a missing/failed asset must never break the game.
 */
async function loadArtSheet(
  species: string,
  npcId?: string,
  _build = 1,
  variant = 0,
  patternId?: string,
): Promise<HTMLCanvasElement | null> {
  if (npcId) {
    const npcArt = await tryLoadImage(`${ART_BASE}/sprites/npcs/${npcId}.png`);
    if (npcArt) return npcArt;
  }
  // Medium sheets are the verified single portraits; slim/heavy still use scale transform.
  const slug = 'medium';
  const suffix = patternId
    ? patternSheetSuffix(species, patternId)
    : `p${Math.min(3, Math.max(0, variant)) + 1}`;
  const patterned = await tryLoadImage(
    `${ART_BASE}/sprites/species/${species}_${slug}_${suffix}.png`,
  );
  if (patterned) return patterned;
  const buildDefault = await tryLoadImage(`${ART_BASE}/sprites/species/${species}_${slug}_p1.png`);
  if (buildDefault) return buildDefault;
  const legacyBuild = await tryLoadImage(`${ART_BASE}/sprites/species/${species}_${slug}.png`);
  if (legacyBuild) return legacyBuild;
  return tryLoadImage(`${ART_BASE}/sprites/species/${species}.png`);
}

/** First frame of a species/NPC sheet (single portraits return the whole image). */
export async function loadArtCanvas(
  species: string,
  npcId?: string,
  build = 1,
  variant = 0,
): Promise<HTMLCanvasElement | null> {
  const sheet = await loadArtSheet(species, npcId, build, variant);
  if (!sheet) return null;
  return extractSpriteFrame(sheet, 0);
}

async function loadCrestLayer(species: string, crestId: string | null): Promise<HTMLCanvasElement | null> {
  if (!crestId || crestId === 'none') return null;
  const def = getSpeciesAppearance(species);
  const crest = def?.crests.find((c) => c.id === crestId);
  const path = crest?.layer
    ? `${ART_BASE}/${crest.layer}`
    : `${ART_BASE}/sprites/crests/${species}_${crestId}.png`;
  return tryLoadImage(path);
}

function blitCrest(
  target: HTMLCanvasElement,
  crest: HTMLCanvasElement,
  dyeHex: string | undefined,
): void {
  const ctx = target.getContext('2d');
  if (!ctx) return;
  const layer = document.createElement('canvas');
  layer.width = crest.width;
  layer.height = crest.height;
  const lctx = layer.getContext('2d')!;
  lctx.imageSmoothingEnabled = false;
  lctx.drawImage(crest, 0, 0);
  if (dyeHex) {
    // Only recolor green/olive crest stalks — leave pinks, golds, etc. alone so
    // multi-color crests (lily tuft) keep their art when crestColor is set.
    const img = lctx.getImageData(0, 0, layer.width, layer.height);
    const [tr, tg, tb] = hexToRgb(dyeHex);
    const { data } = img;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]! < 12) continue;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma < 28) continue; // keep outlines
      const isGreenish = g > r + 8 && g > b + 4 && g > 40;
      if (!isGreenish) continue;
      data[i] = Math.round(tr * (luma / 180));
      data[i + 1] = Math.round(tg * (luma / 180));
      data[i + 2] = Math.round(tb * (luma / 180));
    }
    lctx.putImageData(img, 0, 0);
  }
  // Crop opaque bounds and pin to the crown (same idea as hats) — full-frame blit
  // stretches padded 1024² crest art across the whole body.
  const b = cropOpaqueBounds(layer, 0);
  const targetW = target.width * 0.55;
  const scale = targetW / Math.max(1, b.w);
  const dw = b.w * scale;
  const dh = b.h * scale;
  const dx = (target.width - dw) / 2;
  const dy = target.height * 0.02;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(layer, b.x, b.y, b.w, b.h, dx, dy, dw, dh);
}

/**
 * Compose one animation frame: body PNG + look channels + Habbo-style wardrobe overlays.
 * Returns null when art is missing (callers keep procedural fallback).
 */
export async function composeCharacterArtCanvas(
  species: string,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
  frameIndex = 0,
  npcId?: string,
  cloakFrameIndex = 0,
): Promise<HTMLCanvasElement | null> {
  const patternIdx = patternIndexFromAppearance(species, appearance);
  const sheet = await loadArtSheet(
    species,
    npcId,
    appearance.build ?? 1,
    patternIdx,
    appearance.patternId,
  );
  if (!sheet) return null;

  // Pattern intensity: blend base p1 with patterned sheet when intensity < 100.
  let bodyFrameRaw = extractSpriteFrame(sheet, frameIndex, species);
  const intensity = appearance.patternIntensity ?? 100;
  if (intensity < 100 && appearance.patternId) {
    const baseSheet = await loadArtSheet(species, npcId, appearance.build ?? 1, 0, undefined);
    if (baseSheet) {
      const baseFrame = extractSpriteFrame(baseSheet, frameIndex, species);
      bodyFrameRaw = blendCanvases(baseFrame, bodyFrameRaw, intensity / 100);
    }
  }

  const bodyFrame = scaleBodyFrameForBuild(bodyFrameRaw, appearance.build ?? 1);
  applyAppearanceToArtCanvas(bodyFrame, species, appearance, wardrobeItems);

  const crest = await loadCrestLayer(species, appearance.crestId ?? null);
  if (crest) {
    const dye = getSpeciesAppearance(species)?.crestColorRamps[appearance.crestColor ?? 0];
    blitCrest(bodyFrame, crest, dye);
  }

  const hasCloak = !!appearance.wardrobe?.cloak;
  const padX = hasCloak ? Math.round(bodyFrame.width * 0.26) : 0;
  const padBottom = hasCloak ? Math.round(bodyFrame.height * 0.1) : 0;

  const out = document.createElement('canvas');
  out.width = bodyFrame.width + padX * 2;
  out.height = bodyFrame.height + padBottom;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const bodyRegion = { x: padX, y: 0, w: bodyFrame.width, h: bodyFrame.height };

  await applyWardrobeBackOverlayAsync(out, appearance, wardrobeItems, species, cloakFrameIndex, bodyRegion);
  ctx.drawImage(bodyFrame, bodyRegion.x, bodyRegion.y);
  await applyWardrobeFrontOverlayAsync(out, appearance, wardrobeItems, species, bodyRegion);
  return out;
}

function blendCanvases(
  base: HTMLCanvasElement,
  patterned: HTMLCanvasElement,
  t: number,
): HTMLCanvasElement {
  const w = Math.min(base.width, patterned.width);
  const h = Math.min(base.height, patterned.height);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, 0);
  ctx.globalAlpha = Math.max(0, Math.min(1, t));
  ctx.drawImage(patterned, 0, 0, w, h, 0, 0, w, h);
  ctx.globalAlpha = 1;
  return out;
}

export function artSheetFrameCount(sheet: HTMLCanvasElement): number {
  return spriteSheetFrameCount(sheet);
}

/** Swap a 2D `<img>`'s src to real art if/when it loads, keeping its current src otherwise. */
export function applyArtToImage(img: HTMLImageElement, species: string, npcId?: string): void {
  loadArtCanvas(species, npcId).then((canvas) => {
    if (canvas) img.src = canvas.toDataURL();
  });
}

/**
 * Named-enemy portraits ship as single lowercase-word files under `sprites/enemies/`
 * (see `docs/art/ASSET_SHEET.md`) — e.g. "Skadge the Poacher" -> `skadge.png`. Tries
 * each candidate id in order (caller supplies both the full slug and the first-word
 * fallback), then falls back to species art. Same never-throw contract as
 * `loadArtCanvas` — a 404 on every candidate just means the caller keeps its
 * procedural/species fallback.
 */
export async function loadEnemyArtCanvas(
  species: string,
  candidateIds: string[],
): Promise<HTMLCanvasElement | null> {
  for (const id of candidateIds) {
    if (!id) continue;
    const art = await tryLoadImage(`${ART_BASE}/sprites/enemies/${id}.png`);
    if (art) return art;
  }
  return tryLoadImage(`${ART_BASE}/sprites/species/${species}.png`);
}

/** Swap a 2D `<img>`'s src to real enemy art if/when it loads (see `loadEnemyArtCanvas`). */
export function applyEnemyArtToImage(img: HTMLImageElement, species: string, candidateIds: string[]): void {
  loadEnemyArtCanvas(species, candidateIds).then((canvas) => {
    if (canvas) img.src = canvas.toDataURL();
  });
}

/** Swap a 2D `<canvas>`'s contents to real art if/when it loads, keeping the drawn fallback otherwise. */
export function applyArtToCanvas(target: HTMLCanvasElement, species: string, npcId?: string): void {
  loadArtCanvas(species, npcId).then((art) => {
    if (!art) return;
    const ctx = target.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(art, 0, 0, art.width, art.height, 0, 0, target.width, target.height);
  });
}

interface Pixel {
  x: number;
  y: number;
  c: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function shiftColor(hex: string, hueShift: number): string {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r / 255) h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g / 255) h = ((b / 255 - r / 255) / d + 2) / 6;
    else h = ((r / 255 - g / 255) / d + 4) / 6;
  }
  h = (h + hueShift / 360 + 1) % 1;
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let r2: number;
  let g2: number;
  let b2: number;
  if (s === 0) {
    r2 = g2 = b2 = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r2 = hue2rgb(p, q, h + 1 / 3);
    g2 = hue2rgb(p, q, h);
    b2 = hue2rgb(p, q, h - 1 / 3);
  }
  return rgbToHex(r2 * 255, g2 * 255, b2 * 255);
}

/** Procedural 32×32 markings (legacy pixel drawer). */
function applyMarkingsProcedural(
  ctx: CanvasRenderingContext2D,
  marking: CharacterAppearance['marking'],
  scale = 1,
  intensity = 60,
): void {
  if (marking === 'none') return;
  const alpha = Math.max(0.15, Math.min(0.85, (intensity / 100) * 0.7));
  ctx.imageSmoothingEnabled = false;
  if (marking === 'spots' || marking === 'freckles') {
    ctx.fillStyle = `rgba(10, 16, 8, ${alpha})`;
    const spots: Array<[number, number, number]> =
      marking === 'freckles'
        ? [
            [12, 12, 0.7], [15, 11, 0.6], [18, 13, 0.7], [14, 15, 0.5], [17, 16, 0.6],
            [11, 17, 0.5], [20, 15, 0.6],
          ]
        : [
            [12, 14, 1.2], [18, 16, 1], [14, 20, 1.4], [20, 12, 1], [10, 18, 1.1], [16, 13, 0.9],
            [13, 17, 1.3], [22, 18, 1], [11, 22, 1.2], [17, 21, 0.8],
          ];
    for (const [x, y, r] of spots) {
      ctx.beginPath();
      ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = `rgba(12, 18, 10, ${alpha})`;
    const step = marking === 'bands' ? 5 : 4;
    for (let y = 10; y < 26; y += step) {
      const wobble = marking === 'bands' ? 0 : ((y * 3) % 5) - 2;
      const thick = marking === 'bands' ? 2.2 : 1.5;
      ctx.fillRect((10 + wobble) * scale, y * scale, 12 * scale, thick * scale);
    }
  }
}

/** Markings on loaded PNG portraits — proportional, intensity-aware. */
function applyMarkingsOnArt(
  ctx: CanvasRenderingContext2D,
  marking: CharacterAppearance['marking'],
  w: number,
  h: number,
  intensity = 60,
): void {
  if (marking === 'none') return;
  const alpha = Math.max(0.12, Math.min(0.8, (intensity / 100) * 0.65));
  ctx.imageSmoothingEnabled = false;
  const cx = w * 0.5;
  if (marking === 'spots' || marking === 'freckles') {
    ctx.fillStyle = `rgba(16, 24, 12, ${alpha})`;
    const spots: Array<[number, number, number]> =
      marking === 'freckles'
        ? [
            [0.4, 0.18, 0.018], [0.52, 0.2, 0.016], [0.46, 0.28, 0.015], [0.58, 0.3, 0.014],
            [0.36, 0.32, 0.014], [0.5, 0.36, 0.016],
          ]
        : [
            [0.38, 0.2, 0.032], [0.58, 0.22, 0.028], [0.46, 0.34, 0.03], [0.62, 0.38, 0.026],
            [0.34, 0.42, 0.024], [0.52, 0.48, 0.028], [0.42, 0.55, 0.022],
          ];
    for (const [px, py, pr] of spots) {
      const r = Math.max(2, Math.round(pr * w));
      ctx.beginPath();
      ctx.arc(px * w, py * h, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = `rgba(20, 30, 14, ${alpha})`;
    const bandH = Math.max(2, Math.round(h * (marking === 'bands' ? 0.022 : 0.016)));
    const bandW = Math.round(w * 0.38);
    const x0 = Math.round(cx - bandW / 2);
    const rows = marking === 'bands' ? [0.18, 0.3, 0.42, 0.54] : [0.17, 0.26, 0.35, 0.44, 0.53];
    for (const py of rows) {
      ctx.fillRect(x0, Math.round(py * h), bandW, bandH);
    }
  }
}

function remapSkinTone(data: Uint8ClampedArray, targetHex: string): void {
  const [tr, tg, tb] = hexToRgb(targetHex);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 12) continue;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma < 32 || luma > 230) continue; // outlines / highlights
    // Prefer mid-saturation body greens/browns over near-grey eyes
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 18 && luma > 140) continue;
    const t = luma / 160;
    data[i] = Math.round(tr * t);
    data[i + 1] = Math.round(tg * t);
    data[i + 2] = Math.round(tb * t);
  }
}

function recolorEyes(data: Uint8ClampedArray, w: number, h: number, eyeHex: string): void {
  const [er, eg, eb] = hexToRgb(eyeHex);
  const y0 = Math.floor(h * 0.12);
  const y1 = Math.floor(h * 0.38);
  const xBands = [
    [Math.floor(w * 0.28), Math.floor(w * 0.45)],
    [Math.floor(w * 0.55), Math.floor(w * 0.72)],
  ];
  for (let y = y0; y < y1; y++) {
    for (const [x0, x1] of xBands) {
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4;
        if (data[i + 3]! < 12) continue;
        const luma = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
        if (luma < 90 || luma > 245) continue;
        data[i] = Math.round(er * 0.85 + data[i]! * 0.15);
        data[i + 1] = Math.round(eg * 0.85 + data[i + 1]! * 0.15);
        data[i + 2] = Math.round(eb * 0.85 + data[i + 2]! * 0.15);
      }
    }
  }
}

/** Horizontal/vertical squash for slim (0) vs stout (2) when PNG art is medium-only. */
export function buildScaleFactors(build: number): { sx: number; sy: number } {
  if (build === 0) return { sx: 0.86, sy: 1.1 };
  if (build === 2) return { sx: 1.16, sy: 0.9 };
  return { sx: 1, sy: 1 };
}

/** Scale body art in-place on a same-size canvas (centered) so wardrobe regions stay aligned. */
export function scaleBodyFrameForBuild(bodyFrame: HTMLCanvasElement, build: number): HTMLCanvasElement {
  const { sx, sy } = buildScaleFactors(build);
  if (sx === 1 && sy === 1) return bodyFrame;
  const out = document.createElement('canvas');
  out.width = bodyFrame.width;
  out.height = bodyFrame.height;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const dw = Math.round(bodyFrame.width * sx);
  const dh = Math.round(bodyFrame.height * sy);
  const ox = Math.round((bodyFrame.width - dw) / 2);
  const oy = Math.round((bodyFrame.height - dh) / 2);
  ctx.drawImage(bodyFrame, 0, 0, bodyFrame.width, bodyFrame.height, ox, oy, dw, dh);
  return out;
}

/** 32×32 procedural pixel characters — replace with real art in public/assets/sprites/ */
export function drawCharacterCanvas(
  species: string,
  variant = 0,
  appearance?: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[] = [],
): HTMLCanvasElement {
  const app = appearance ?? defaultAppearance();
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 32, 32);

  applyWardrobeBackLayers(ctx, app, wardrobeItems, species);

  const drawers: Record<string, (v: number) => Pixel[]> = {
    frog: drawFrog,
    toad: drawToad,
    turtle: drawTurtle,
    tortoise: drawTortoise,
    vole: drawVole,
    player_frog: drawFrog,
  };

  let pixels = (drawers[species] ?? drawFrog)(app.variant ?? variant);
  const skin = getSpeciesAppearance(species)?.skinRamps[app.skinTone ?? 0];
  if (skin) {
    const [sr, sg, sb] = hexToRgb(skin);
    pixels = pixels.map((p) => {
      const [r, g, b] = hexToRgb(p.c);
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma < 40 || luma > 220) return p;
      const t = luma / 160;
      return { ...p, c: rgbToHex(sr * t, sg * t, sb * t) };
    });
  } else if (app.hueShift) {
    pixels = pixels.map((p) => ({ ...p, c: shiftColor(p.c, app.hueShift!) }));
  }
  const eye = getSpeciesAppearance(species)?.eyeRamps[app.eyeColor ?? 0];
  if (eye) {
    pixels = pixels.map((p) => {
      // Rough eye band on procedural 32×32
      if (p.y >= 7 && p.y <= 10 && ((p.x >= 9 && p.x <= 13) || (p.x >= 19 && p.x <= 23))) {
        const [r, g, b] = hexToRgb(p.c);
        if (0.299 * r + 0.587 * g + 0.114 * b > 100) return { ...p, c: eye };
      }
      return p;
    });
  }
  for (const p of pixels) {
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x, p.y, 1, 1);
  }
  applyMarkingsProcedural(ctx, app.marking, 1, app.markingIntensity ?? 60);
  applyWardrobeFrontLayers(ctx, app, wardrobeItems, species);
  return canvas;
}

/** Apply skin/eye/markings on top of loaded species/NPC portrait art. */
export function applyAppearanceToArtCanvas(
  target: HTMLCanvasElement,
  species: string,
  appearance: CharacterAppearance,
  _wardrobeItems: WardrobeDefinition[],
): void {
  const ctx = target.getContext('2d');
  if (!ctx) return;
  const w = target.width;
  const h = target.height;
  const def = getSpeciesAppearance(species);
  const img = ctx.getImageData(0, 0, w, h);
  const { data } = img;

  const skin = def?.skinRamps[appearance.skinTone ?? 0];
  if (skin) remapSkinTone(data, skin);
  else if (appearance.hueShift) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]! < 12) continue;
      const shifted = shiftColor(rgbToHex(data[i]!, data[i + 1]!, data[i + 2]!), appearance.hueShift);
      const [r, g, b] = hexToRgb(shifted);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  const eye = def?.eyeRamps[appearance.eyeColor ?? 0];
  if (eye) recolorEyes(data, w, h, eye);

  ctx.putImageData(img, 0, 0);

  if (appearance.marking !== 'none') {
    applyMarkingsOnArt(ctx, appearance.marking, w, h, appearance.markingIntensity ?? 60);
  }
}

function drawFrog(v: number): Pixel[] {
  const bodies = ['#4c7842', '#2e8a68', '#6a8832', '#207858'];
  const bellies = ['#78b258', '#88c282', '#aed058', '#68a87e'];
  const body = bodies[v % 4]!;
  const belly = bellies[v % 4]!;
  const dark = '#1a2c16';

  return [
    // eye sclera (bulging above head)
    ...rect(9, 7, 4, 3, '#c8e8c0'),
    ...rect(20, 7, 4, 3, '#c8e8c0'),
    // pupils
    ...rect(10, 8, 2, 2, '#0a1408'),
    ...rect(21, 8, 2, 2, '#0a1408'),
    // eye shines
    { x: 9, y: 7, c: '#ffffff' }, { x: 22, y: 7, c: '#ffffff' },
    // eye outlines
    ...rect(8, 6, 6, 1, dark), { x: 8, y: 7, c: dark }, { x: 8, y: 8, c: dark }, { x: 8, y: 9, c: dark }, { x: 13, y: 7, c: dark }, { x: 13, y: 8, c: dark }, { x: 13, y: 9, c: dark },
    ...rect(19, 6, 6, 1, dark), { x: 19, y: 7, c: dark }, { x: 19, y: 8, c: dark }, { x: 19, y: 9, c: dark }, { x: 24, y: 7, c: dark }, { x: 24, y: 8, c: dark }, { x: 24, y: 9, c: dark },
    // head fill
    ...rect(9, 9, 14, 7, body),
    { x: 9, y: 9, c: dark }, { x: 22, y: 9, c: dark },
    // lower face + chin outlines
    { x: 9, y: 10, c: dark }, { x: 9, y: 11, c: dark }, { x: 9, y: 12, c: dark }, { x: 9, y: 13, c: dark }, { x: 9, y: 14, c: dark }, { x: 9, y: 15, c: dark },
    { x: 22, y: 10, c: dark }, { x: 22, y: 11, c: dark }, { x: 22, y: 12, c: dark }, { x: 22, y: 13, c: dark }, { x: 22, y: 14, c: dark }, { x: 22, y: 15, c: dark },
    // belly patch on face
    ...rect(12, 11, 8, 4, belly),
    // mouth
    { x: 10, y: 15, c: dark }, ...rect(11, 15, 10, 1, '#38200e'), { x: 21, y: 15, c: dark },
    { x: 10, y: 16, c: dark }, { x: 11, y: 16, c: dark }, { x: 20, y: 16, c: dark }, { x: 21, y: 16, c: dark },
    // body fill + belly
    ...rect(10, 17, 12, 8, body),
    ...rect(12, 17, 8, 8, belly),
    // body side outlines
    { x: 9, y: 17, c: dark }, { x: 9, y: 18, c: dark }, { x: 9, y: 19, c: dark }, { x: 9, y: 20, c: dark }, { x: 9, y: 21, c: dark }, { x: 9, y: 22, c: dark }, { x: 9, y: 23, c: dark }, { x: 9, y: 24, c: dark },
    { x: 22, y: 17, c: dark }, { x: 22, y: 18, c: dark }, { x: 22, y: 19, c: dark }, { x: 22, y: 20, c: dark }, { x: 22, y: 21, c: dark }, { x: 22, y: 22, c: dark }, { x: 22, y: 23, c: dark }, { x: 22, y: 24, c: dark },
    // arms
    ...rect(6, 18, 4, 4, body), { x: 5, y: 18, c: dark }, { x: 5, y: 19, c: dark }, { x: 5, y: 20, c: dark }, { x: 5, y: 21, c: dark }, ...rect(6, 22, 4, 1, dark),
    ...rect(22, 18, 4, 4, body), { x: 26, y: 18, c: dark }, { x: 26, y: 19, c: dark }, { x: 26, y: 20, c: dark }, { x: 26, y: 21, c: dark }, ...rect(22, 22, 4, 1, dark),
    // legs
    ...rect(10, 25, 5, 4, body), { x: 9, y: 25, c: dark }, { x: 9, y: 26, c: dark }, { x: 9, y: 27, c: dark }, { x: 9, y: 28, c: dark },
    ...rect(17, 25, 5, 4, body), { x: 22, y: 25, c: dark }, { x: 22, y: 26, c: dark }, { x: 22, y: 27, c: dark }, { x: 22, y: 28, c: dark },
    // webbed feet
    ...rect(8, 28, 7, 2, body), ...rect(17, 28, 7, 2, body),
    ...rect(7, 30, 9, 1, dark), ...rect(16, 30, 9, 1, dark),
    { x: 6, y: 28, c: dark }, { x: 6, y: 29, c: dark }, { x: 25, y: 28, c: dark }, { x: 25, y: 29, c: dark },
  ];
}

function drawToad(v: number): Pixel[] {
  const bodies = ['#5c4830', '#6a5a38', '#48381e', '#7a5a3a'];
  const bellies = ['#786048', '#887858', '#5c4832', '#8a7050'];
  const body = bodies[v % 4]!;
  const belly = bellies[v % 4]!;
  const dark = '#1e100a';
  const eyeC = '#c89000';

  return [
    // head (wider than frog, squat)
    ...rect(7, 8, 18, 8, body),
    ...rect(9, 11, 14, 4, belly),
    // golden side-set eyes
    ...rect(8, 8, 3, 3, eyeC), { x: 8, y: 8, c: '#ffe060' },
    ...rect(21, 8, 3, 3, eyeC), { x: 23, y: 8, c: '#ffe060' },
    // head outline
    ...rect(7, 8, 18, 1, dark),
    { x: 6, y: 8, c: dark }, { x: 6, y: 9, c: dark }, { x: 6, y: 10, c: dark }, { x: 6, y: 11, c: dark }, { x: 6, y: 12, c: dark }, { x: 6, y: 13, c: dark }, { x: 6, y: 14, c: dark }, { x: 6, y: 15, c: dark },
    { x: 25, y: 8, c: dark }, { x: 25, y: 9, c: dark }, { x: 25, y: 10, c: dark }, { x: 25, y: 11, c: dark }, { x: 25, y: 12, c: dark }, { x: 25, y: 13, c: dark }, { x: 25, y: 14, c: dark }, { x: 25, y: 15, c: dark },
    ...rect(7, 16, 18, 1, dark),
    // mouth (straight stoic line)
    ...rect(10, 15, 12, 1, '#38200e'),
    { x: 10, y: 16, c: dark }, { x: 21, y: 16, c: dark },
    // body (wider for pear shape)
    ...rect(8, 17, 16, 9, body),
    ...rect(10, 17, 12, 9, belly),
    // body outline
    { x: 7, y: 17, c: dark }, { x: 7, y: 18, c: dark }, { x: 7, y: 19, c: dark }, { x: 7, y: 20, c: dark }, { x: 7, y: 21, c: dark }, { x: 7, y: 22, c: dark }, { x: 7, y: 23, c: dark }, { x: 7, y: 24, c: dark }, { x: 7, y: 25, c: dark },
    { x: 24, y: 17, c: dark }, { x: 24, y: 18, c: dark }, { x: 24, y: 19, c: dark }, { x: 24, y: 20, c: dark }, { x: 24, y: 21, c: dark }, { x: 24, y: 22, c: dark }, { x: 24, y: 23, c: dark }, { x: 24, y: 24, c: dark }, { x: 24, y: 25, c: dark },
    ...rect(8, 26, 16, 1, dark),
    // warts
    ...rect(11, 18, 2, 2, dark), ...rect(17, 20, 2, 2, dark), ...rect(13, 23, 2, 2, dark), { x: 20, y: 17, c: dark }, { x: 21, y: 17, c: dark },
    // arms (short, wide)
    ...rect(5, 18, 3, 5, body), { x: 4, y: 18, c: dark }, { x: 4, y: 19, c: dark }, { x: 4, y: 20, c: dark }, { x: 4, y: 21, c: dark }, { x: 4, y: 22, c: dark }, ...rect(5, 23, 3, 1, dark),
    ...rect(24, 18, 3, 5, body), { x: 27, y: 18, c: dark }, { x: 27, y: 19, c: dark }, { x: 27, y: 20, c: dark }, { x: 27, y: 21, c: dark }, { x: 27, y: 22, c: dark }, ...rect(24, 23, 3, 1, dark),
    // legs
    ...rect(9, 26, 5, 4, body), { x: 8, y: 26, c: dark }, { x: 8, y: 27, c: dark }, { x: 8, y: 28, c: dark }, { x: 8, y: 29, c: dark },
    ...rect(18, 26, 5, 4, body), { x: 23, y: 26, c: dark }, { x: 23, y: 27, c: dark }, { x: 23, y: 28, c: dark }, { x: 23, y: 29, c: dark },
    ...rect(8, 30, 7, 1, dark), ...rect(17, 30, 7, 1, dark),
  ];
}

function drawTurtle(v: number): Pixel[] {
  const shells = ['#1a3c34', '#1c3c28'];
  const pats = ['#2a5448', '#2a5038'];
  const shell = shells[v % 2]!;
  const pat = pats[v % 2]!;
  const skin = '#50786a';
  const dark = '#0c1a16';

  return [
    // head (small, peeking above shell)
    ...rect(12, 6, 8, 8, skin),
    // eyes
    { x: 13, y: 7, c: '#b0d8d0' }, { x: 19, y: 7, c: '#b0d8d0' },
    { x: 13, y: 8, c: '#0a1008' }, { x: 14, y: 8, c: '#0a1008' }, { x: 18, y: 8, c: '#0a1008' }, { x: 19, y: 8, c: '#0a1008' },
    // head outline
    ...rect(12, 6, 8, 1, dark),
    { x: 11, y: 6, c: dark }, { x: 11, y: 7, c: dark }, { x: 11, y: 8, c: dark }, { x: 11, y: 9, c: dark }, { x: 11, y: 10, c: dark }, { x: 11, y: 11, c: dark }, { x: 11, y: 12, c: dark }, { x: 11, y: 13, c: dark },
    { x: 20, y: 6, c: dark }, { x: 20, y: 7, c: dark }, { x: 20, y: 8, c: dark }, { x: 20, y: 9, c: dark }, { x: 20, y: 10, c: dark }, { x: 20, y: 11, c: dark }, { x: 20, y: 12, c: dark }, { x: 20, y: 13, c: dark },
    // neck join
    ...rect(13, 13, 6, 2, skin),
    // shell dome
    ...rect(6, 12, 20, 14, shell),
    // shell outline
    ...rect(6, 12, 20, 1, dark),
    { x: 5, y: 12, c: dark }, { x: 5, y: 13, c: dark }, { x: 5, y: 14, c: dark }, { x: 5, y: 15, c: dark }, { x: 5, y: 16, c: dark }, { x: 5, y: 17, c: dark }, { x: 5, y: 18, c: dark }, { x: 5, y: 19, c: dark }, { x: 5, y: 20, c: dark }, { x: 5, y: 21, c: dark }, { x: 5, y: 22, c: dark }, { x: 5, y: 23, c: dark }, { x: 5, y: 24, c: dark }, { x: 5, y: 25, c: dark },
    { x: 26, y: 12, c: dark }, { x: 26, y: 13, c: dark }, { x: 26, y: 14, c: dark }, { x: 26, y: 15, c: dark }, { x: 26, y: 16, c: dark }, { x: 26, y: 17, c: dark }, { x: 26, y: 18, c: dark }, { x: 26, y: 19, c: dark }, { x: 26, y: 20, c: dark }, { x: 26, y: 21, c: dark }, { x: 26, y: 22, c: dark }, { x: 26, y: 23, c: dark }, { x: 26, y: 24, c: dark }, { x: 26, y: 25, c: dark },
    ...rect(6, 26, 20, 1, dark),
    // shell pattern (hex-like grid)
    ...rect(9, 14, 14, 1, pat), ...rect(8, 18, 16, 1, pat), ...rect(9, 22, 14, 1, pat),
    { x: 12, y: 14, c: pat }, { x: 12, y: 15, c: pat }, { x: 12, y: 16, c: pat }, { x: 12, y: 17, c: pat },
    { x: 16, y: 13, c: pat }, { x: 16, y: 14, c: pat }, { x: 16, y: 15, c: pat }, { x: 16, y: 16, c: pat }, { x: 16, y: 17, c: pat }, { x: 16, y: 18, c: pat },
    { x: 20, y: 14, c: pat }, { x: 20, y: 15, c: pat }, { x: 20, y: 16, c: pat }, { x: 20, y: 17, c: pat },
    // arm nubs
    ...rect(3, 16, 4, 5, skin), { x: 2, y: 16, c: dark }, { x: 2, y: 17, c: dark }, { x: 2, y: 18, c: dark }, { x: 2, y: 19, c: dark }, { x: 2, y: 20, c: dark }, ...rect(3, 21, 4, 1, dark),
    ...rect(25, 16, 4, 5, skin), { x: 29, y: 16, c: dark }, { x: 29, y: 17, c: dark }, { x: 29, y: 18, c: dark }, { x: 29, y: 19, c: dark }, { x: 29, y: 20, c: dark }, ...rect(25, 21, 4, 1, dark),
    // feet below shell
    ...rect(8, 26, 5, 3, skin), { x: 7, y: 26, c: dark }, { x: 7, y: 27, c: dark }, { x: 7, y: 28, c: dark }, ...rect(8, 29, 5, 1, dark),
    ...rect(19, 26, 5, 3, skin), { x: 24, y: 26, c: dark }, { x: 24, y: 27, c: dark }, { x: 24, y: 28, c: dark }, ...rect(19, 29, 5, 1, dark),
  ];
}

function drawTortoise(v: number): Pixel[] {
  const shell = v <= 1 ? '#2a3c2a' : '#323828';
  const pat = v <= 1 ? '#3a5038' : '#445042';
  const skin = '#7a6848';
  const dark = '#0e1a0e';

  return [
    // head
    ...rect(12, 7, 8, 8, skin),
    // ancient eyes (half-lidded look)
    { x: 13, y: 9, c: '#0a1008' }, { x: 14, y: 9, c: '#0a1008' }, { x: 18, y: 9, c: '#0a1008' }, { x: 19, y: 9, c: '#0a1008' },
    { x: 13, y: 8, c: '#9ab890' }, { x: 19, y: 8, c: '#9ab890' },
    // head outline
    ...rect(12, 7, 8, 1, dark),
    { x: 11, y: 7, c: dark }, { x: 11, y: 8, c: dark }, { x: 11, y: 9, c: dark }, { x: 11, y: 10, c: dark }, { x: 11, y: 11, c: dark }, { x: 11, y: 12, c: dark }, { x: 11, y: 13, c: dark }, { x: 11, y: 14, c: dark },
    { x: 20, y: 7, c: dark }, { x: 20, y: 8, c: dark }, { x: 20, y: 9, c: dark }, { x: 20, y: 10, c: dark }, { x: 20, y: 11, c: dark }, { x: 20, y: 12, c: dark }, { x: 20, y: 13, c: dark }, { x: 20, y: 14, c: dark },
    // scaly neck (alternating)
    { x: 13, y: 14, c: skin }, { x: 14, y: 14, c: '#5a5038' }, { x: 15, y: 14, c: skin }, { x: 16, y: 14, c: '#5a5038' }, { x: 17, y: 14, c: skin }, { x: 18, y: 14, c: '#5a5038' }, { x: 19, y: 14, c: skin },
    { x: 13, y: 15, c: '#5a5038' }, { x: 14, y: 15, c: skin }, { x: 15, y: 15, c: '#5a5038' }, { x: 16, y: 15, c: skin }, { x: 17, y: 15, c: '#5a5038' }, { x: 18, y: 15, c: skin }, { x: 19, y: 15, c: '#5a5038' },
    // wider shell dome
    ...rect(5, 13, 22, 13, shell),
    // shell outline
    ...rect(5, 13, 22, 1, dark),
    { x: 4, y: 13, c: dark }, { x: 4, y: 14, c: dark }, { x: 4, y: 15, c: dark }, { x: 4, y: 16, c: dark }, { x: 4, y: 17, c: dark }, { x: 4, y: 18, c: dark }, { x: 4, y: 19, c: dark }, { x: 4, y: 20, c: dark }, { x: 4, y: 21, c: dark }, { x: 4, y: 22, c: dark }, { x: 4, y: 23, c: dark }, { x: 4, y: 24, c: dark }, { x: 4, y: 25, c: dark },
    { x: 27, y: 13, c: dark }, { x: 27, y: 14, c: dark }, { x: 27, y: 15, c: dark }, { x: 27, y: 16, c: dark }, { x: 27, y: 17, c: dark }, { x: 27, y: 18, c: dark }, { x: 27, y: 19, c: dark }, { x: 27, y: 20, c: dark }, { x: 27, y: 21, c: dark }, { x: 27, y: 22, c: dark }, { x: 27, y: 23, c: dark }, { x: 27, y: 24, c: dark }, { x: 27, y: 25, c: dark },
    ...rect(5, 26, 22, 1, dark),
    // concentric ring pattern
    ...rect(8, 15, 16, 1, pat), ...rect(7, 19, 18, 1, pat), ...rect(8, 23, 16, 1, pat),
    { x: 11, y: 15, c: pat }, { x: 11, y: 16, c: pat }, { x: 11, y: 17, c: pat }, { x: 11, y: 18, c: pat },
    { x: 16, y: 14, c: pat }, { x: 16, y: 15, c: pat }, { x: 16, y: 16, c: pat }, { x: 16, y: 17, c: pat }, { x: 16, y: 18, c: pat }, { x: 16, y: 19, c: pat },
    { x: 21, y: 15, c: pat }, { x: 21, y: 16, c: pat }, { x: 21, y: 17, c: pat }, { x: 21, y: 18, c: pat },
    // arm nubs
    ...rect(2, 17, 4, 5, skin), { x: 1, y: 17, c: dark }, { x: 1, y: 18, c: dark }, { x: 1, y: 19, c: dark }, { x: 1, y: 20, c: dark }, { x: 1, y: 21, c: dark }, ...rect(2, 22, 4, 1, dark),
    ...rect(26, 17, 4, 5, skin), { x: 30, y: 17, c: dark }, { x: 30, y: 18, c: dark }, { x: 30, y: 19, c: dark }, { x: 30, y: 20, c: dark }, { x: 30, y: 21, c: dark }, ...rect(26, 22, 4, 1, dark),
    // feet
    ...rect(7, 26, 5, 3, skin), { x: 6, y: 26, c: dark }, { x: 6, y: 27, c: dark }, { x: 6, y: 28, c: dark }, ...rect(7, 29, 5, 1, dark),
    ...rect(20, 26, 5, 3, skin), { x: 25, y: 26, c: dark }, { x: 25, y: 27, c: dark }, { x: 25, y: 28, c: dark }, ...rect(20, 29, 5, 1, dark),
  ];
}

function drawVole(_v: number): Pixel[] {
  const fur = '#8a7258';
  const belly = '#c0b098';
  const earOut = '#6a5440';
  const earIn = '#e090a0';
  const nose = '#e07070';
  const dark = '#2e1e10';
  const whisker = '#b0a090';

  return [
    // ears
    ...rect(8, 4, 5, 6, earOut), ...rect(9, 5, 3, 4, earIn),
    { x: 7, y: 4, c: dark }, { x: 7, y: 5, c: dark }, { x: 7, y: 6, c: dark }, { x: 7, y: 7, c: dark }, { x: 7, y: 8, c: dark }, { x: 7, y: 9, c: dark },
    ...rect(8, 4, 5, 1, dark), { x: 13, y: 4, c: dark }, { x: 13, y: 5, c: dark }, { x: 13, y: 6, c: dark }, { x: 13, y: 7, c: dark }, { x: 13, y: 8, c: dark }, { x: 13, y: 9, c: dark },
    ...rect(8, 10, 5, 1, dark),
    ...rect(19, 4, 5, 6, earOut), ...rect(20, 5, 3, 4, earIn),
    { x: 24, y: 4, c: dark }, { x: 24, y: 5, c: dark }, { x: 24, y: 6, c: dark }, { x: 24, y: 7, c: dark }, { x: 24, y: 8, c: dark }, { x: 24, y: 9, c: dark },
    ...rect(19, 4, 5, 1, dark), { x: 18, y: 4, c: dark }, { x: 18, y: 5, c: dark }, { x: 18, y: 6, c: dark }, { x: 18, y: 7, c: dark }, { x: 18, y: 8, c: dark }, { x: 18, y: 9, c: dark },
    ...rect(19, 10, 5, 1, dark),
    // head (round)
    ...rect(10, 9, 12, 9, fur),
    ...rect(12, 12, 8, 5, belly),
    // eyes
    { x: 12, y: 11, c: '#0a0808' }, { x: 13, y: 11, c: '#0a0808' }, { x: 19, y: 11, c: '#0a0808' }, { x: 20, y: 11, c: '#0a0808' },
    { x: 12, y: 10, c: '#ffffff' }, { x: 20, y: 10, c: '#ffffff' },
    // head outline
    ...rect(10, 9, 12, 1, dark),
    { x: 9, y: 9, c: dark }, { x: 9, y: 10, c: dark }, { x: 9, y: 11, c: dark }, { x: 9, y: 12, c: dark }, { x: 9, y: 13, c: dark }, { x: 9, y: 14, c: dark }, { x: 9, y: 15, c: dark }, { x: 9, y: 16, c: dark }, { x: 9, y: 17, c: dark },
    { x: 22, y: 9, c: dark }, { x: 22, y: 10, c: dark }, { x: 22, y: 11, c: dark }, { x: 22, y: 12, c: dark }, { x: 22, y: 13, c: dark }, { x: 22, y: 14, c: dark }, { x: 22, y: 15, c: dark }, { x: 22, y: 16, c: dark }, { x: 22, y: 17, c: dark },
    ...rect(10, 18, 12, 1, dark),
    // nose + whiskers
    ...rect(14, 14, 4, 2, nose), { x: 13, y: 14, c: dark }, { x: 18, y: 14, c: dark }, ...rect(14, 16, 4, 1, dark),
    { x: 6, y: 14, c: whisker }, { x: 7, y: 14, c: whisker }, { x: 8, y: 14, c: whisker }, { x: 8, y: 15, c: whisker },
    { x: 23, y: 14, c: whisker }, { x: 24, y: 14, c: whisker }, { x: 25, y: 14, c: whisker }, { x: 23, y: 15, c: whisker },
    // body (round)
    ...rect(10, 18, 12, 9, fur),
    ...rect(12, 18, 8, 9, belly),
    { x: 9, y: 18, c: dark }, { x: 9, y: 19, c: dark }, { x: 9, y: 20, c: dark }, { x: 9, y: 21, c: dark }, { x: 9, y: 22, c: dark }, { x: 9, y: 23, c: dark }, { x: 9, y: 24, c: dark }, { x: 9, y: 25, c: dark }, { x: 9, y: 26, c: dark },
    { x: 22, y: 18, c: dark }, { x: 22, y: 19, c: dark }, { x: 22, y: 20, c: dark }, { x: 22, y: 21, c: dark }, { x: 22, y: 22, c: dark }, { x: 22, y: 23, c: dark }, { x: 22, y: 24, c: dark }, { x: 22, y: 25, c: dark }, { x: 22, y: 26, c: dark },
    ...rect(10, 27, 12, 1, dark),
    // arms
    ...rect(7, 19, 3, 4, fur), { x: 6, y: 19, c: dark }, { x: 6, y: 20, c: dark }, { x: 6, y: 21, c: dark }, { x: 6, y: 22, c: dark }, ...rect(7, 23, 3, 1, dark),
    ...rect(22, 19, 3, 4, fur), { x: 25, y: 19, c: dark }, { x: 25, y: 20, c: dark }, { x: 25, y: 21, c: dark }, { x: 25, y: 22, c: dark }, ...rect(22, 23, 3, 1, dark),
    // legs
    ...rect(11, 27, 4, 3, fur), { x: 10, y: 27, c: dark }, { x: 10, y: 28, c: dark }, { x: 10, y: 29, c: dark }, ...rect(10, 30, 6, 1, dark),
    ...rect(17, 27, 4, 3, fur), { x: 21, y: 27, c: dark }, { x: 21, y: 28, c: dark }, { x: 21, y: 29, c: dark }, ...rect(16, 30, 6, 1, dark),
  ];
}

function rect(x: number, y: number, w: number, h: number, c: string): Pixel[] {
  const out: Pixel[] = [];
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) out.push({ x: x + i, y: y + j, c });
  }
  return out;
}

export function createGroundShadow(size = CHARACTER_MESH_SIZE): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x0a1814,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(size * 0.2, 20), mat);
  shadow.rotation.x = -Math.PI / 2;
  // Flatten along view depth so it reads as a ground contact patch, not a disc.
  shadow.scale.z = 0.6;
  shadow.position.y = 0.035;
  shadow.renderOrder = -10;
  return shadow;
}

export function createCharacterMesh(
  species: string,
  variant = 0,
  size = CHARACTER_MESH_SIZE,
  npcId?: string,
  appearance?: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[] = [],
  eventBus?: EventBus,
): THREE.Mesh {
  const canvas = drawCharacterCanvas(species, variant, appearance, wardrobeItems);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.quaternion.copy(BILLBOARD_ROTATION);
  // Plane is centered on its own origin; lift it by half its height so the
  // character stands on the ground plane instead of being buried through it.
  mesh.position.y = size / 2;

  // Procedural mesh above renders immediately; swap to composed PNG art when available.
  const app = appearance ?? defaultAppearance();
  if (!npcId) {
    void (async () => {
      const composed = await composeCharacterArtCanvas(species, app, wardrobeItems, 0, npcId, 0);
      if (!composed) return;
      const tex = new THREE.CanvasTexture(composed);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      mat.map = tex;
      mat.needsUpdate = true;
      SpriteAnimator.attach(mesh, species, app, wardrobeItems, npcId, eventBus);
    })();
  } else {
    void loadArtCanvas(species, npcId).then((art) => {
      if (!art) return;
      const artTexture = new THREE.CanvasTexture(art);
      artTexture.magFilter = THREE.NearestFilter;
      artTexture.minFilter = THREE.NearestFilter;
      mat.map = artTexture;
      mat.needsUpdate = true;
    });
  }

  return mesh;
}

/**
 * Live appearance respec — swap composed art + reattach animator without rebuilding the group.
 */
export function refreshCharacterMesh(
  mesh: THREE.Mesh,
  species: string,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
  eventBus?: EventBus,
  npcId?: string,
): void {
  const mat = mesh.material as THREE.MeshBasicMaterial;
  const procedural = drawCharacterCanvas(species, appearance.variant ?? 0, appearance, wardrobeItems);
  const procTex = new THREE.CanvasTexture(procedural);
  procTex.magFilter = THREE.NearestFilter;
  procTex.minFilter = THREE.NearestFilter;
  const prev = mat.map;
  mat.map = procTex;
  mat.needsUpdate = true;
  if (prev) prev.dispose();

  void composeCharacterArtCanvas(species, appearance, wardrobeItems, 0, npcId, 0).then((composed) => {
    if (!composed) return;
    const tex = new THREE.CanvasTexture(composed);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    const old = mat.map;
    mat.map = tex;
    mat.needsUpdate = true;
    if (old && old !== tex) old.dispose();
    SpriteAnimator.attach(mesh, species, appearance, wardrobeItems, npcId, eventBus);
  });
}

export function createNameLabel(name: string, meshSize = CHARACTER_MESH_SIZE): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(26, 60, 52, 0.85)';
  ctx.fillRect(0, 0, 128, 32);
  ctx.strokeStyle = '#d4a054';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 126, 30);
  ctx.fillStyle = '#e8e4d9';
  ctx.font = 'bold 14px Source Sans 3, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name.length > 14 ? name.slice(0, 12) + '…' : name, 64, 21);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(NAME_LABEL_SCALE_X, NAME_LABEL_SCALE_Y, 1);
  sprite.position.y = meshSize + 0.35;
  sprite.visible = false;
  return sprite;
}
