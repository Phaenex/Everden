import type { SpeciesStats } from '@/data/types';

export interface CreatorGuideStat {
  label: string;
  modAffects: string;
  inGame: string;
}

export interface CreatorGuideSkill {
  name: string;
  stat: keyof SpeciesStats;
  inGame: string;
}

export interface CreatorGuideSetting {
  label: string;
  description: string;
}

export interface CreatorGuide {
  tabs: Record<string, string>;
  stats: Record<keyof SpeciesStats, CreatorGuideStat>;
  skills: CreatorGuideSkill[];
  settings: Record<string, CreatorGuideSetting>;
  appearance: {
    variant: string;
    hueShift: string;
    marking: Record<string, string>;
  };
  motivations: Record<string, string>;
  wardrobeNote: string;
}

export async function loadCreatorGuide(): Promise<CreatorGuide> {
  const res = await fetch('/data/creator-guide.json');
  if (!res.ok) throw new Error('Failed to load creator-guide.json');
  return (await res.json()) as CreatorGuide;
}
