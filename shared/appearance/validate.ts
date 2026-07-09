import { migrateAppearance } from './migrate.js';
import type { CharacterAppearance, SpeciesAppearanceRegistry } from './AppearanceTypes.js';

const MAX_JSON_BYTES = 8_192;

export function parseAppearanceJson(
  json: string | undefined | null,
  species: string,
  registry?: SpeciesAppearanceRegistry | null,
): CharacterAppearance {
  if (!json || json.length > MAX_JSON_BYTES) {
    return migrateAppearance(null, species, registry);
  }
  try {
    return migrateAppearance(JSON.parse(json) as unknown, species, registry);
  } catch {
    return migrateAppearance(null, species, registry);
  }
}

export function serializeAppearance(appearance: CharacterAppearance): string {
  return JSON.stringify(appearance);
}

/** Server-side soft validation — reject oversized / non-object payloads. */
export function isAppearanceJsonSafe(json: string): boolean {
  if (!json || json.length > MAX_JSON_BYTES) return false;
  try {
    const v = JSON.parse(json) as unknown;
    return typeof v === 'object' && v !== null && !Array.isArray(v);
  } catch {
    return false;
  }
}
