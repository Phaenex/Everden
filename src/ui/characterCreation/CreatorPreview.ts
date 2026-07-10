import type { AbilityDefinition, SpeciesDefinition, WardrobeDefinition } from '@/data/types';
import { composeCharacterArtCanvas, drawCharacterCanvas, drawPortraitFit } from '@/presentation/CharacterSprites';
import type { CreatorState } from './types';
import { BODY_BUILD_LABELS } from '@/gameplay/CharacterAppearance';
import { patternLabel } from '@/data/SpeciesAppearanceRegistry';
import { applyRacial } from '@/gameplay/PointBuy';
import { abilityModifier } from '@/gameplay/OpeningNarration';
import { el } from './domUtils';

/**
 * Monotonically increasing sequence number so async PNG renders that arrive
 * after a newer sync render has already started are silently discarded.
 */
let _seq = 0;

/**
 * Renders the character preview canvas. Procedural body is the baseline; composed PNG
 * art replaces it only when a named NPC sheet is available.
 */
export function renderCreatorPreview(
  canvas: HTMLCanvasElement,
  state: CreatorState,
  _speciesDef: SpeciesDefinition | undefined,
  wardrobe: WardrobeDefinition[],
): void {
  const seq = ++_seq;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const procedural = drawCharacterCanvas(
    state.species,
    state.appearance.variant ?? 0,
    state.appearance,
    wardrobe,
  );
  drawPortraitFit(ctx, procedural, canvas.width, canvas.height);

  void composeCharacterArtCanvas(state.species, state.appearance, wardrobe, 0).then((composed) => {
    if (seq !== _seq || !composed) return;
    drawPortraitFit(ctx, composed, canvas.width, canvas.height);
  });
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
  root.append(
    el(
      'p',
      'summary-look',
      `Look: ${BODY_BUILD_LABELS[state.appearance.build]!} · ${patternLabel(state.species, state.appearance.patternId)} · skin ${state.appearance.skinTone + 1}`,
    ),
  );
}
