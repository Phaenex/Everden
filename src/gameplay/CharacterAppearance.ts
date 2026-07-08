export type CharacterMarking = 'none' | 'spots' | 'stripes';

export type WardrobeSlot = 'hat' | 'cloak' | 'accessory';

export interface CharacterWardrobe {
  hat?: string;
  cloak?: string;
  accessory?: string;
}

export interface CharacterAppearance {
  variant: number;
  hueShift: number;
  marking: CharacterMarking;
  wardrobe: CharacterWardrobe;
}

export function defaultAppearance(): CharacterAppearance {
  return {
    variant: 0,
    hueShift: 0,
    marking: 'none',
    wardrobe: {},
  };
}

export function randomAppearance(): CharacterAppearance {
  const markings: CharacterMarking[] = ['none', 'spots', 'stripes'];
  return {
    variant: Math.floor(Math.random() * 4),
    hueShift: Math.floor(Math.random() * 121) - 60,
    marking: markings[Math.floor(Math.random() * markings.length)]!,
    wardrobe: {},
  };
}

/** Player with any Look/Outfit choice must keep the procedural sprite (matches creator preview). */
export function appearanceNeedsProceduralRender(appearance?: CharacterAppearance): boolean {
  if (!appearance) return false;
  if (appearance.variant !== 0) return true;
  if (appearance.hueShift !== 0) return true;
  if (appearance.marking !== 'none') return true;
  return !!(appearance.wardrobe.hat || appearance.wardrobe.cloak || appearance.wardrobe.accessory);
}
