/** Shared character appearance schema (v4) — client + Colyseus. */

export type CharacterMarking = 'none' | 'spots' | 'stripes' | 'bands' | 'freckles';

export type WardrobeSlot = 'hat' | 'cloak' | 'accessory' | 'held';

/** 0 = slim, 1 = medium (default), 2 = stout */
export type BodyBuild = 0 | 1 | 2;

export const BODY_BUILD_SLUGS = ['slim', 'medium', 'heavy'] as const;
export const BODY_BUILD_LABELS = ['Slim', 'Medium', 'Stout'] as const;

export interface CharacterWardrobe {
  hat?: string;
  cloak?: string;
  accessory?: string;
  held?: string;
}

export interface WardrobeDyes {
  hat?: number;
  cloak?: number;
  accessory?: number;
  held?: number;
}

export interface CharacterAppearance {
  build: BodyBuild;
  skinTone: number;
  eyeColor: number;
  crestId: string | null;
  crestColor: number;
  patternId: string;
  patternIntensity: number;
  marking: CharacterMarking;
  markingIntensity: number;
  wardrobe: CharacterWardrobe;
  dyes: WardrobeDyes;
  /**
   * Legacy soft global tint (−60…+60). Kept for migrate/compat; prefer skinTone.
   * Compose may still apply a light residual shift.
   */
  hueShift?: number;
  /** @deprecated Prefer patternId — kept during migrate from save v3. */
  variant?: number;
}

export interface SpeciesPatternDef {
  id: string;
  label: string;
  sheetSuffix: string;
}

export interface SpeciesCrestDef {
  id: string;
  label: string;
  layer?: string;
}

export interface SpeciesAppearanceDef {
  playable: boolean;
  skinRamps: string[];
  eyeRamps: string[];
  crestColorRamps: string[];
  patterns: SpeciesPatternDef[];
  crests: SpeciesCrestDef[];
  markings: CharacterMarking[];
  wardrobeSlots: WardrobeSlot[];
}

export type SpeciesAppearanceRegistry = Record<string, SpeciesAppearanceDef>;

export function defaultAppearance(patternId = 'moss'): CharacterAppearance {
  return {
    build: 1,
    skinTone: 0,
    eyeColor: 0,
    crestId: 'none',
    crestColor: 0,
    patternId,
    patternIntensity: 100,
    marking: 'none',
    markingIntensity: 60,
    wardrobe: {},
    dyes: {},
    hueShift: 0,
  };
}

export function clampIntensity(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function clampToneIndex(n: number, rampLen: number): number {
  if (rampLen <= 0) return 0;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(rampLen - 1, Math.round(n)));
}
