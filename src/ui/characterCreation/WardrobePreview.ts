import type { WardrobeDefinition } from '@/data/types';
import type { CharacterAppearance, CharacterWardrobe } from '@/gameplay/CharacterAppearance';
import { defaultAppearance } from '@/gameplay/CharacterAppearance';
import {
  composeCharacterArtCanvas,
  drawCharacterCanvas,
  drawCroppedSprite,
} from '@/presentation/CharacterSprites';
import { drawItemByIdProcedural, loadWardrobeItemCanvas } from '@/presentation/WardrobeLayers';

const THUMB = 48;
const THUMB_INSET = 4;
const THUMB_DRAW = THUMB - THUMB_INSET * 2;
let _thumbSeq = 0;

function clearThumb(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, THUMB, THUMB);
}

function bodyOnly(appearance: CharacterAppearance): CharacterAppearance {
  return { ...appearance, wardrobe: {} };
}

function upgradeBodyThumbnail(
  out: HTMLCanvasElement,
  seq: number,
  species: string,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): void {
  void composeCharacterArtCanvas(species, bodyOnly(appearance), wardrobeItems, 0).then((composed) => {
    if (seq !== _thumbSeq || !composed) return;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    clearThumb(ctx);
    drawCroppedSprite(ctx, composed, THUMB_INSET, THUMB_INSET, THUMB_DRAW);
  });
}

export type WardrobeSlot = keyof CharacterWardrobe;

/**
 * Outfit card icon — shows the ITEM ONLY (hat/cloak/accessory), not a dressed character.
 * Background is transparent; card CSS supplies the dark tile.
 */
export function drawWardrobeThumbnail(
  _species: string,
  _slot: WardrobeSlot,
  itemId: string | null,
  baseAppearance: CharacterAppearance,
  _wardrobeItems: WardrobeDefinition[],
  targetCanvas?: HTMLCanvasElement,
): HTMLCanvasElement {
  const seq = ++_thumbSeq;
  const out = targetCanvas ?? document.createElement('canvas');
  out.width = THUMB;
  out.height = THUMB;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  clearThumb(ctx);

  if (!itemId) {
    ctx.strokeStyle = 'rgba(240, 193, 75, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(THUMB_INSET + 4, THUMB_INSET + 4, THUMB_DRAW - 8, THUMB_DRAW - 8);
    return out;
  }

  // Procedural item-only fallback (32×32, transparent bg)
  const proc = document.createElement('canvas');
  proc.width = 32;
  proc.height = 32;
  const pctx = proc.getContext('2d')!;
  drawItemByIdProcedural(pctx, itemId);
  drawCroppedSprite(ctx, proc, THUMB_INSET, THUMB_INSET, THUMB_DRAW);

  void loadWardrobeItemCanvas(itemId, baseAppearance.build ?? 1, 0).then((png) => {
    if (seq !== _thumbSeq || !png) return;
    const tctx = out.getContext('2d');
    if (!tctx) return;
    tctx.imageSmoothingEnabled = false;
    clearThumb(tctx);
    drawCroppedSprite(tctx, png, THUMB_INSET, THUMB_INSET, THUMB_DRAW);
  });

  return out;
}

/** Body build swatch — body only, no outfit pieces. */
export function drawBuildThumbnail(
  species: string,
  build: 0 | 1 | 2,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): HTMLCanvasElement {
  const app = bodyOnly({ ...appearance, build });
  const seq = ++_thumbSeq;
  const src = drawCharacterCanvas(species, app.variant, app, wardrobeItems);
  const out = document.createElement('canvas');
  out.width = THUMB;
  out.height = THUMB;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  clearThumb(ctx);
  drawCroppedSprite(ctx, src, THUMB_INSET, THUMB_INSET, THUMB_DRAW);
  upgradeBodyThumbnail(out, seq, species, app, wardrobeItems);
  return out;
}

/** Pattern swatch — body palette only, no outfit. */
export function drawVariantThumbnail(
  species: string,
  variant: number,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): HTMLCanvasElement {
  const app = bodyOnly({ ...appearance, variant });
  const seq = ++_thumbSeq;
  const src = drawCharacterCanvas(species, variant, app, wardrobeItems);
  const out = document.createElement('canvas');
  out.width = THUMB;
  out.height = THUMB;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  clearThumb(ctx);
  drawCroppedSprite(ctx, src, THUMB_INSET, THUMB_INSET, THUMB_DRAW);
  upgradeBodyThumbnail(out, seq, species, app, wardrobeItems);
  return out;
}

/** Folk tab species card — medium build, pattern 1, no outfit. */
export function drawSpeciesCardThumbnail(
  species: string,
  selected: boolean,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): HTMLCanvasElement {
  const app: CharacterAppearance = selected
    ? bodyOnly(appearance)
    : bodyOnly({ ...defaultAppearance(), build: 1, variant: 0 });
  return drawVariantThumbnail(species, app.variant, app, wardrobeItems);
}

export function mountThumbnail(parent: HTMLElement, canvas: HTMLCanvasElement, className = 'wardrobe-thumb'): void {
  const existing = parent.querySelector(`canvas.${className}`);
  if (existing) existing.replaceWith(canvas);
  else parent.prepend(canvas);
  canvas.className = className;
}
