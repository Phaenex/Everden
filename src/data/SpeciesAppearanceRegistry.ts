import type { SpeciesAppearanceDef, SpeciesAppearanceRegistry } from '../../shared/appearance/AppearanceTypes';

let _registry: SpeciesAppearanceRegistry = {};

export function setSpeciesAppearanceRegistry(reg: SpeciesAppearanceRegistry): void {
  _registry = reg;
}

export function getSpeciesAppearanceRegistry(): SpeciesAppearanceRegistry {
  return _registry;
}

export function getSpeciesAppearance(species: string): SpeciesAppearanceDef | undefined {
  return _registry[species];
}

export function playableSpeciesIds(): string[] {
  return Object.entries(_registry)
    .filter(([, def]) => def.playable)
    .map(([id]) => id);
}

export function patternLabel(species: string, patternIdOrVariant: string | number): string {
  const def = _registry[species];
  if (!def?.patterns.length) {
    if (typeof patternIdOrVariant === 'number') return `Palette ${patternIdOrVariant + 1}`;
    return patternIdOrVariant;
  }
  if (typeof patternIdOrVariant === 'number') {
    return def.patterns[Math.max(0, Math.min(def.patterns.length - 1, patternIdOrVariant))]?.label
      ?? `Palette ${patternIdOrVariant + 1}`;
  }
  return def.patterns.find((p) => p.id === patternIdOrVariant)?.label ?? patternIdOrVariant;
}

export function patternSheetSuffix(species: string, patternId: string): string {
  const def = _registry[species];
  const hit = def?.patterns.find((p) => p.id === patternId);
  if (hit) return hit.sheetSuffix;
  return 'p1';
}
