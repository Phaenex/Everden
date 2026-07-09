import type { WardrobeDefinition } from '@/data/types';
import type { CharacterAppearance, CharacterWardrobe } from '@/gameplay/CharacterAppearance';
import { defaultAppearance } from '@/gameplay/CharacterAppearance';
import {
  composeCharacterArtCanvas,
  drawCroppedSprite,
} from '@/presentation/CharacterSprites';
import { drawItemByIdProcedural, loadWardrobeItemCanvas } from '@/presentation/WardrobeLayers';

const THUMB = 56;
const THUMB_INSET = 3;
const THUMB_DRAW = THUMB - THUMB_INSET * 2;
let _thumbSeq = 0;

type ThumbCanvas = HTMLCanvasElement & { __thumbSeq?: number };

/** Per-canvas seq — the old global guard dropped every thumb except the last async upgrade. */
function stampThumb(canvas: HTMLCanvasElement): number {
  const seq = ++_thumbSeq;
  (canvas as ThumbCanvas).__thumbSeq = seq;
  return seq;
}

function thumbStillCurrent(canvas: HTMLCanvasElement, seq: number): boolean {
  return (canvas as ThumbCanvas).__thumbSeq === seq;
}

function clearThumb(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, THUMB, THUMB);
}

function drawThumbPlaceholder(ctx: CanvasRenderingContext2D): void {
  clearThumb(ctx);
  ctx.fillStyle = '#142820';
  ctx.fillRect(THUMB_INSET, THUMB_INSET, THUMB_DRAW, THUMB_DRAW);
  ctx.strokeStyle = 'rgba(240, 193, 75, 0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(THUMB_INSET + 6, THUMB_INSET + 6, THUMB_DRAW - 12, THUMB_DRAW - 12);
}

function bodyOnly(appearance: CharacterAppearance): CharacterAppearance {
  return { ...appearance, wardrobe: {} };
}

function paintThumbCanvas(canvas: HTMLCanvasElement, src: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  clearThumb(ctx);
  drawCroppedSprite(ctx, src, THUMB_INSET, THUMB_INSET, THUMB_DRAW);
}

function upgradeBodyThumbnail(
  out: HTMLCanvasElement,
  seq: number,
  species: string,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): void {
  void composeCharacterArtCanvas(species, bodyOnly(appearance), wardrobeItems, 0).then((composed) => {
    if (!thumbStillCurrent(out, seq) || !composed) return;
    paintThumbCanvas(out, composed);
  });
}

function createThumbCanvas(): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = THUMB;
  out.height = THUMB;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  drawThumbPlaceholder(ctx);
  return out;
}

/** Human palette names per species (variant index 0–3). */
export const PATTERN_LABELS: Record<string, readonly [string, string, string, string]> = {
  frog: ['Moss', 'Reed', 'Marsh', 'Bog'],
  toad: ['Umber', 'Clay', 'Rust', 'Peat'],
  turtle: ['River', 'Slate', 'Kelp', 'Mist'],
  tortoise: ['Loam', 'Fern', 'Oak', 'Stone'],
  vole: ['Dust', 'Clay', 'Hazel', 'Soot'],
};

export function patternLabel(species: string, variant: number): string {
  const row = PATTERN_LABELS[species];
  if (!row) return `Palette ${variant + 1}`;
  return row[Math.min(3, Math.max(0, variant))] ?? `Palette ${variant + 1}`;
}

export type WardrobeSlot = keyof CharacterWardrobe;

/**
 * Outfit card icon — shows the ITEM ONLY (hat/cloak/accessory), not a dressed character.
 */
export function drawWardrobeThumbnail(
  _species: string,
  _slot: WardrobeSlot,
  itemId: string | null,
  baseAppearance: CharacterAppearance,
  _wardrobeItems: WardrobeDefinition[],
  targetCanvas?: HTMLCanvasElement,
): HTMLCanvasElement {
  const out = targetCanvas ?? createThumbCanvas();
  const seq = stampThumb(out);
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  if (!itemId) {
    clearThumb(ctx);
    ctx.strokeStyle = 'rgba(240, 193, 75, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(THUMB_INSET + 4, THUMB_INSET + 4, THUMB_DRAW - 8, THUMB_DRAW - 8);
    return out;
  }

  const proc = document.createElement('canvas');
  proc.width = 32;
  proc.height = 32;
  const pctx = proc.getContext('2d')!;
  drawItemByIdProcedural(pctx, itemId);
  paintThumbCanvas(out, proc);

  void loadWardrobeItemCanvas(itemId, baseAppearance.build ?? 1, 0).then((png) => {
    if (!thumbStillCurrent(out, seq) || !png) return;
    paintThumbCanvas(out, png);
  });

  return out;
}

/** Body build swatch — only build differs; neutral tint/markings so the silhouette reads. */
export function drawBuildThumbnail(
  species: string,
  build: 0 | 1 | 2,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): HTMLCanvasElement {
  const app = bodyOnly({
    ...appearance,
    build,
    marking: 'none',
    hueShift: 0,
    variant: appearance.variant,
  });
  const out = createThumbCanvas();
  const seq = stampThumb(out);
  upgradeBodyThumbnail(out, seq, species, app, wardrobeItems);
  return out;
}

/** Pattern swatch — only palette differs. */
export function drawVariantThumbnail(
  species: string,
  variant: number,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): HTMLCanvasElement {
  const app = bodyOnly({
    ...appearance,
    variant,
    marking: 'none',
    hueShift: 0,
  });
  const out = createThumbCanvas();
  const seq = stampThumb(out);
  upgradeBodyThumbnail(out, seq, species, app, wardrobeItems);
  return out;
}

/** Folk tab species card — always that species' default palette, no outfit. */
export function drawSpeciesCardThumbnail(
  species: string,
  selected: boolean,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): HTMLCanvasElement {
  const app = bodyOnly(
    selected
      ? { ...appearance, wardrobe: {} }
      : { ...defaultAppearance(), build: 1, variant: 0, marking: 'none', hueShift: 0 },
  );
  return drawVariantThumbnail(species, app.variant ?? 0, app, wardrobeItems);
}

export function mountThumbnail(parent: HTMLElement, canvas: HTMLCanvasElement, className = 'wardrobe-thumb'): void {
  const existing = parent.querySelector(`canvas.${className}`);
  if (existing) existing.replaceWith(canvas);
  else parent.prepend(canvas);
  canvas.className = className;
}
