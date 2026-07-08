import type { WardrobeDefinition } from '@/data/types';
import type { CharacterAppearance, CharacterWardrobe } from '@/gameplay/CharacterAppearance';
import { defaultAppearance } from '@/gameplay/CharacterAppearance';
import { drawCharacterCanvas, loadArtCanvas, applyAppearanceToArtCanvas } from '@/presentation/CharacterSprites';
import { applyWardrobeOverlayAsync } from '@/presentation/WardrobeLayers';

const THUMB = 48;

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
    hueShift: baseAppearance.hueShift,
    marking: baseAppearance.marking,
    wardrobe,
  };

  const src = drawCharacterCanvas(species, appearance.variant, appearance, wardrobeItems);
  const out = targetCanvas ?? document.createElement('canvas');
  out.width = THUMB;
  out.height = THUMB;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1a3c34';
  ctx.fillRect(0, 0, THUMB, THUMB);
  ctx.drawImage(src, 0, 0, 32, 32, 4, 4, 40, 40);

  // Async upgrade to PNG art + PNG wardrobe overlays when assets are available.
  loadArtCanvas(species).then(async (art) => {
    if (!art) return;
    ctx.fillStyle = '#1a3c34';
    ctx.fillRect(0, 0, THUMB, THUMB);
    ctx.drawImage(art, 4, 4, 40, 40);
    applyAppearanceToArtCanvas(out, species, appearance, wardrobeItems);
    await applyWardrobeOverlayAsync(out, appearance, wardrobeItems, species);
  });

  return out;
}

/** Pattern swatch for the Look tab — body variant only. */
export function drawVariantThumbnail(
  species: string,
  variant: number,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): HTMLCanvasElement {
  const app = { ...defaultAppearance(), variant, hueShift: appearance.hueShift, marking: appearance.marking };
  const src = drawCharacterCanvas(species, variant, app, wardrobeItems);
  const out = document.createElement('canvas');
  out.width = THUMB;
  out.height = THUMB;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1a3c34';
  ctx.fillRect(0, 0, THUMB, THUMB);
  ctx.drawImage(src, 0, 0, 32, 32, 4, 4, 40, 40);
  return out;
}

export function mountThumbnail(parent: HTMLElement, canvas: HTMLCanvasElement, className = 'wardrobe-thumb'): void {
  const existing = parent.querySelector(`canvas.${className}`);
  if (existing) existing.replaceWith(canvas);
  else parent.prepend(canvas);
  canvas.className = className;
}
