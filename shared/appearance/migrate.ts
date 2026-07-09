import {
  type CharacterAppearance,
  type CharacterMarking,
  type BodyBuild,
  type SpeciesAppearanceRegistry,
  defaultAppearance,
  clampIntensity,
  clampToneIndex,
} from './AppearanceTypes.js';

/** Legacy v3 appearance blob (pre-deep-customization). */
export interface LegacyAppearanceV3 {
  variant?: number;
  build?: number;
  hueShift?: number;
  marking?: string;
  wardrobe?: {
    hat?: string;
    cloak?: string;
    accessory?: string;
    held?: string;
  };
  // Partial v4 fields if mixed
  skinTone?: number;
  eyeColor?: number;
  crestId?: string | null;
  crestColor?: number;
  patternId?: string;
  patternIntensity?: number;
  markingIntensity?: number;
  dyes?: CharacterAppearance['dyes'];
}

const MARKINGS: CharacterMarking[] = ['none', 'spots', 'stripes', 'bands', 'freckles'];

function asMarking(raw: string | undefined): CharacterMarking {
  if (raw && (MARKINGS as string[]).includes(raw)) return raw as CharacterMarking;
  return 'none';
}

function asBuild(raw: number | undefined): BodyBuild {
  if (raw === 0 || raw === 1 || raw === 2) return raw;
  return 1;
}

/** Map hueShift (−60…+60) onto a skin ramp index. */
export function hueShiftToSkinTone(hueShift: number, rampLen: number): number {
  if (rampLen <= 1) return 0;
  const t = (hueShift + 60) / 120;
  return clampToneIndex(Math.round(t * (rampLen - 1)), rampLen);
}

export function patternIdFromVariant(
  species: string,
  variant: number,
  registry?: SpeciesAppearanceRegistry | null,
): string {
  const def = registry?.[species];
  const patterns = def?.patterns;
  if (patterns?.length) {
    const idx = Math.max(0, Math.min(patterns.length - 1, Math.floor(variant)));
    return patterns[idx]!.id;
  }
  const fallback = ['moss', 'reed', 'marsh', 'bog'];
  return fallback[Math.max(0, Math.min(3, Math.floor(variant)))]!;
}

export function variantFromPatternId(
  species: string,
  patternId: string,
  registry?: SpeciesAppearanceRegistry | null,
): number {
  const patterns = registry?.[species]?.patterns;
  if (patterns?.length) {
    const idx = patterns.findIndex((p: { id: string }) => p.id === patternId);
    return idx >= 0 ? idx : 0;
  }
  const fallback = ['moss', 'reed', 'marsh', 'bog'];
  const idx = fallback.indexOf(patternId);
  return idx >= 0 ? idx : 0;
}

/**
 * Normalize any saved/join appearance blob to v4 CharacterAppearance.
 * Safe with missing registry (uses frog-like pattern fallbacks).
 */
export function migrateAppearance(
  raw: unknown,
  species = 'frog',
  registry?: SpeciesAppearanceRegistry | null,
): CharacterAppearance {
  const base = defaultAppearance(registry?.[species]?.patterns[0]?.id ?? 'moss');
  if (!raw || typeof raw !== 'object') return base;
  const legacy = raw as LegacyAppearanceV3;
  const def = registry?.[species];
  const skinLen = def?.skinRamps.length ?? 6;
  const eyeLen = def?.eyeRamps.length ?? 4;
  const crestLen = def?.crestColorRamps.length ?? 4;

  const patternId =
    legacy.patternId ??
    patternIdFromVariant(species, legacy.variant ?? 0, registry);

  const hue = legacy.hueShift ?? 0;
  const skinTone =
    legacy.skinTone !== undefined
      ? clampToneIndex(legacy.skinTone, skinLen)
      : hueShiftToSkinTone(hue, skinLen);

  const crestRaw = legacy.crestId;
  const crestId =
    crestRaw === undefined || crestRaw === null || crestRaw === ''
      ? 'none'
      : crestRaw;

  return {
    build: asBuild(legacy.build),
    skinTone,
    eyeColor: clampToneIndex(legacy.eyeColor ?? 0, eyeLen),
    crestId,
    crestColor: clampToneIndex(legacy.crestColor ?? 0, crestLen),
    patternId,
    patternIntensity: clampIntensity(legacy.patternIntensity ?? 100),
    marking: asMarking(legacy.marking),
    markingIntensity: clampIntensity(legacy.markingIntensity ?? 60),
    wardrobe: {
      hat: legacy.wardrobe?.hat,
      cloak: legacy.wardrobe?.cloak,
      accessory: legacy.wardrobe?.accessory,
      held: legacy.wardrobe?.held,
    },
    dyes: { ...(legacy.dyes ?? {}) },
    hueShift: hue,
    variant: variantFromPatternId(species, patternId, registry),
  };
}

export function randomAppearance(
  species = 'frog',
  registry?: SpeciesAppearanceRegistry | null,
): CharacterAppearance {
  const def = registry?.[species];
  const patterns = def?.patterns ?? [
    { id: 'moss', label: 'Moss', sheetSuffix: 'p1' },
    { id: 'reed', label: 'Reed', sheetSuffix: 'p2' },
    { id: 'marsh', label: 'Marsh', sheetSuffix: 'p3' },
    { id: 'bog', label: 'Bog', sheetSuffix: 'p4' },
  ];
  const markings = (def?.markings?.length ? def.markings : ['none', 'spots', 'stripes']) as CharacterMarking[];
  const crests = def?.crests ?? [{ id: 'none', label: 'Bare' }];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)]!;
  const marking = markings[Math.floor(Math.random() * markings.length)]!;
  const crest = crests[Math.floor(Math.random() * crests.length)]!;
  const skinLen = def?.skinRamps.length ?? 6;
  const eyeLen = def?.eyeRamps.length ?? 4;
  const crestColorLen = def?.crestColorRamps.length ?? 4;
  return {
    build: Math.floor(Math.random() * 3) as BodyBuild,
    skinTone: Math.floor(Math.random() * skinLen),
    eyeColor: Math.floor(Math.random() * eyeLen),
    crestId: crest.id === 'none' ? 'none' : crest.id,
    crestColor: Math.floor(Math.random() * crestColorLen),
    patternId: pattern.id,
    patternIntensity: 40 + Math.floor(Math.random() * 61),
    marking,
    markingIntensity: marking === 'none' ? 0 : 40 + Math.floor(Math.random() * 61),
    wardrobe: {},
    dyes: {},
    hueShift: 0,
    variant: patterns.findIndex((p: { id: string }) => p.id === pattern.id),
  };
}
