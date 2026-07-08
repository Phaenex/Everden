import type { SpeciesStats } from '@/data/types';
import type { CharacterAppearance } from '@/gameplay/CharacterAppearance';
import type { CreatorSettings } from '@/gameplay/CreatorSettings';
import type { ArrivalMotivation } from '@/gameplay/PlayerProfile';

export type GameStartRequest =
  | { mode: 'continue' }
  | {
      mode: 'new';
      species: string;
      name: string;
      motivation: ArrivalMotivation;
      stats: SpeciesStats;
      appearance: CharacterAppearance;
      settings: CreatorSettings;
    };

export type CreatorTab =
  | 'species'
  | 'appearance'
  | 'wardrobe'
  | 'stats'
  | 'kit'
  | 'skills'
  | 'story'
  | 'settings'
  | 'review';

export const CREATOR_TABS: { id: CreatorTab; label: string }[] = [
  { id: 'species', label: 'Folk' },
  { id: 'appearance', label: 'Look' },
  { id: 'wardrobe', label: 'Outfits' },
  { id: 'stats', label: 'Stats' },
  { id: 'kit', label: 'Kit' },
  { id: 'skills', label: 'Skills' },
  { id: 'story', label: 'Story' },
  { id: 'settings', label: 'Settings' },
  { id: 'review', label: 'Review' },
];

export interface CreatorState {
  tab: CreatorTab;
  species: string;
  baseStats: SpeciesStats;
  name: string;
  motivation: ArrivalMotivation;
  appearance: CharacterAppearance;
  settings: CreatorSettings;
}
