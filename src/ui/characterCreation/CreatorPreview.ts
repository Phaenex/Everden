import type { AbilityDefinition, SpeciesDefinition, WardrobeDefinition } from '@/data/types';
import { drawCharacterCanvas } from '@/presentation/CharacterSprites';
import type { CreatorState } from './types';
import { applyRacial } from '@/gameplay/PointBuy';
import { abilityModifier } from '@/gameplay/OpeningNarration';
import { el } from './domUtils';

/** Procedural preview only — species PNG would hide outfit layers. */
export function renderCreatorPreview(
  canvas: HTMLCanvasElement,
  state: CreatorState,
  _speciesDef: SpeciesDefinition | undefined,
  wardrobe: WardrobeDefinition[],
): void {
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0c1814';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const src = drawCharacterCanvas(state.species, state.appearance.variant, state.appearance, wardrobe);
  // Zoom into the occupied sprite (procedural art has empty edges in 32×32).
  const bounds = opaqueBounds(src);
  const pad = Math.max(6, Math.floor(canvas.width * 0.03));
  const dest = canvas.width - pad * 2;
  ctx.drawImage(
    src,
    bounds.x,
    bounds.y,
    bounds.w,
    bounds.h,
    pad,
    pad,
    dest,
    dest,
  );
}

/** Tight box around non-empty pixels so previews fill the frame. */
function opaqueBounds(src: HTMLCanvasElement): { x: number; y: number; w: number; h: number } {
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
  // A little padding so hats/cloaks aren't clipped.
  const grow = 1;
  minX = Math.max(0, minX - grow);
  minY = Math.max(0, minY - grow);
  maxX = Math.min(width - 1, maxX + grow);
  maxY = Math.min(height - 1, maxY + grow);
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export function renderCreatorSummary(
  root: HTMLElement,
  state: CreatorState,
  speciesDef: SpeciesDefinition | undefined,
  abilities: AbilityDefinition[],
  wardrobeCatalog: WardrobeDefinition[],
): void {
  root.replaceChildren();
  const name = state.name.trim() || 'Traveler';
  root.append(el('h3', 'summary-name', name));
  if (speciesDef) {
    root.append(el('p', 'summary-species', `${speciesDef.name} · ${speciesDef.selectRole ?? speciesDef.role}`));
  }
  const final = speciesDef
    ? applyRacial(state.baseStats, speciesDef.racialBonuses)
    : state.baseStats;
  const stats = el('div', 'summary-stats');
  for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
    const mod = abilityModifier(final[key]);
    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
    const row = el('div', 'summary-stat-row');
    row.append(el('span', 'stat-key', key.toUpperCase()), el('span', 'stat-val', `${final[key]} (${modStr})`));
    stats.append(row);
  }
  root.append(stats);
  if (speciesDef) {
    const combat = el(
      'p',
      'summary-combat',
      `AC ${speciesDef.combat.ac} · Init ${speciesDef.combat.initiativeMod >= 0 ? '+' : ''}${speciesDef.combat.initiativeMod}`,
    );
    root.append(combat);
    const abList = el('ul', 'summary-abilities');
    for (const abId of speciesDef.combat.abilities) {
      const ab = abilities.find((a) => a.id === abId);
      const li = document.createElement('li');
      li.textContent = ab?.name ?? abId;
      abList.append(li);
    }
    root.append(abList);
  }
  const worn: string[] = [];
  for (const slot of ['hat', 'cloak', 'accessory'] as const) {
    const id = state.appearance.wardrobe[slot];
    if (!id) continue;
    const def = wardrobeCatalog.find((w) => w.id === id);
    worn.push(def?.label ?? id.replace(/_/g, ' '));
  }
  if (worn.length) {
    root.append(el('p', 'summary-wardrobe', `Outfit: ${worn.join(' · ')}`));
  }
}
