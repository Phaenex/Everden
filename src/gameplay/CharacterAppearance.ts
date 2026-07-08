export type CharacterMarking = 'none' | 'spots' | 'stripes';

export type WardrobeSlot = 'hat' | 'cloak' | 'accessory';

/** 0 = slim, 1 = medium (default), 2 = stout — separate PNG per build when art exists. */
export type BodyBuild = 0 | 1 | 2;

export const BODY_BUILD_SLUGS = ['slim', 'medium', 'heavy'] as const;
export const BODY_BUILD_LABELS = ['Slim', 'Medium', 'Stout'] as const;

export interface CharacterWardrobe {
  hat?: string;
  cloak?: string;
  accessory?: string;
}

export interface CharacterAppearance {
  variant: number;
  build: BodyBuild;
  hueShift: number;
  marking: CharacterMarking;
  wardrobe: CharacterWardrobe;
}

export function defaultAppearance(): CharacterAppearance {
  return {
    variant: 0,
    build: 1,
    hueShift: 0,
    marking: 'none',
    wardrobe: {},
  };
}

export function randomAppearance(): CharacterAppearance {
  const markings: CharacterMarking[] = ['none', 'spots', 'stripes'];
  return {
    variant: Math.floor(Math.random() * 4),
    build: Math.floor(Math.random() * 3) as BodyBuild,
    hueShift: Math.floor(Math.random() * 121) - 60,
    marking: markings[Math.floor(Math.random() * markings.length)]!,
    wardrobe: {},
  };
}

/** True when no PNG exists for this look — procedural palette variants still used as fallback. */
export function appearanceNeedsProceduralRender(appearance?: CharacterAppearance): boolean {
  if (!appearance) return false;
  // PNG art is attempted for all variants; procedural only shows until assets load or on 404.
  return false;
}
