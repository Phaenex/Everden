import type { WardrobeDefinition } from '@/data/types';
import type { CharacterAppearance, CharacterWardrobe } from '@/gameplay/CharacterAppearance';
import { defaultAppearance } from '@/gameplay/CharacterAppearance';
import { composeCharacterArtCanvas, drawCharacterCanvas } from '@/presentation/CharacterSprites';

const THUMB = 48;
let _thumbSeq = 0;

function paintThumbnail(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  composed: HTMLCanvasElement | null,
): void {
  ctx.fillStyle = '#1a3c34';
  ctx.fillRect(0, 0, THUMB, THUMB);
  if (composed) {
    ctx.drawImage(composed, 4, 4, 40, 40);
    return;
  }
  ctx.drawImage(src, 0, 0, 32, 32, 4, 4, 40, 40);
}

function upgradeThumbnail(
  out: HTMLCanvasElement,
  seq: number,
  species: string,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): void {
  void composeCharacterArtCanvas(species, appearance, wardrobeItems, 0).then((composed) => {
    if (seq !== _thumbSeq || !composed) return;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    paintThumbnail(ctx, composed, composed);
  });
}

export type WardrobeSlot = keyof CharacterWardrobe;

/** Mini portrait for one wardrobe pick — used on outfit cards in the creator. */
export function drawWardrobeThumbnail(
  species: string,
  slot: WardrobeSlot,
  itemId: string | null,
  baseAppearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
  targetCanvas?: HTMLCanvasElement,
): HTMLCanvasElement {
  const wardrobe: CharacterWardrobe = { ...baseAppearance.wardrobe };
  if (itemId) wardrobe[slot] = itemId;
  else delete wardrobe[slot];

  const appearance: CharacterAppearance = {
    variant: baseAppearance.variant,
    build: baseAppearance.build,
    hueShift: baseAppearance.hueShift,
    marking: baseAppearance.marking,
    wardrobe,
  };

  const seq = ++_thumbSeq;
  const src = drawCharacterCanvas(species, appearance.variant, appearance, wardrobeItems);
  const out = targetCanvas ?? document.createElement('canvas');
  out.width = THUMB;
  out.height = THUMB;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  paintThumbnail(ctx, src, null);
  upgradeThumbnail(out, seq, species, appearance, wardrobeItems);
  return out;
}

/** Body build swatch for the Look tab — slim / medium / stout PNG when available. */
export function drawBuildThumbnail(
  species: string,
  build: 0 | 1 | 2,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): HTMLCanvasElement {
  const app: CharacterAppearance = { ...appearance, build };
  const seq = ++_thumbSeq;
  const src = drawCharacterCanvas(species, app.variant, app, wardrobeItems);
  const out = document.createElement('canvas');
  out.width = THUMB;
  out.height = THUMB;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  paintThumbnail(ctx, src, null);
  upgradeThumbnail(out, seq, species, app, wardrobeItems);
  return out;
}

/** Pattern swatch for the Look tab — body variant only. */
export function drawVariantThumbnail(
  species: string,
  variant: number,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): HTMLCanvasElement {
  const app: CharacterAppearance = { ...appearance, variant };
  const seq = ++_thumbSeq;
  const src = drawCharacterCanvas(species, variant, app, wardrobeItems);
  const out = document.createElement('canvas');
  out.width = THUMB;
  out.height = THUMB;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  paintThumbnail(ctx, src, null);
  upgradeThumbnail(out, seq, species, app, wardrobeItems);
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
    ? appearance
    : { ...defaultAppearance(), build: 1, variant: 0 };
  return drawVariantThumbnail(species, app.variant, app, wardrobeItems);
}

export function mountThumbnail(parent: HTMLElement, canvas: HTMLCanvasElement, className = 'wardrobe-thumb'): void {
  const existing = parent.querySelector(`canvas.${className}`);
  if (existing) existing.replaceWith(canvas);
  else parent.prepend(canvas);
  canvas.className = className;
}
