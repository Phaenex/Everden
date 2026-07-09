/**
 * Client re-exports of shared appearance schema + helpers.
 * Prefer importing from here in game code; shared/ is the source of truth.
 */
export type {
  CharacterAppearance,
  CharacterMarking,
  CharacterWardrobe,
  WardrobeDyes,
  WardrobeSlot,
  BodyBuild,
  SpeciesAppearanceDef,
  SpeciesAppearanceRegistry,
  SpeciesPatternDef,
  SpeciesCrestDef,
} from '../../shared/appearance/AppearanceTypes';

// Re-export type alias used by CharacterCreator init
export type { SpeciesAppearanceRegistry as SpeciesLookRegistry } from '../../shared/appearance/AppearanceTypes';

export {
  BODY_BUILD_SLUGS,
  BODY_BUILD_LABELS,
  defaultAppearance,
  clampIntensity,
  clampToneIndex,
} from '../../shared/appearance/AppearanceTypes';

export {
  migrateAppearance,
  randomAppearance,
  patternIdFromVariant,
  variantFromPatternId,
  hueShiftToSkinTone,
} from '../../shared/appearance/migrate';

export {
  parseAppearanceJson,
  serializeAppearance,
  isAppearanceJsonSafe,
} from '../../shared/appearance/validate';

/** True when no PNG exists for this look — procedural palette variants still used as fallback. */
export function appearanceNeedsProceduralRender(): boolean {
  return false;
}
