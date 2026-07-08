import { GameBootstrap } from '@/core/GameBootstrap';
import type { SpeciesStats } from '@/data/types';
import { SaveSystem } from '@/core/SaveSystem';
import { defaultAppearance } from '@/gameplay/CharacterAppearance';
import { defaultCreatorSettings } from '@/gameplay/CreatorSettings';
import { TitleScreen, type GameStartRequest } from '@/ui/TitleScreen';
import './styles/main.css';

const bootstrap = new GameBootstrap();
const qaMode = new URLSearchParams(window.location.search).has('qa');

function enterGame(request: GameStartRequest): void {
  const title = document.getElementById('title-screen');
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  title?.classList.add('hidden');
  canvas.classList.add('visible');
  void bootstrap.start(canvas, request);
}

const PLAYABLE_SPECIES = ['frog', 'toad', 'turtle', 'tortoise', 'vole'] as const;
type PlayableSpecies = (typeof PLAYABLE_SPECIES)[number];

const QA_FINAL_STATS: Record<PlayableSpecies, SpeciesStats> = {
  frog: { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 12 },
  toad: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
  turtle: { str: 14, dex: 8, con: 16, int: 10, wis: 12, cha: 8 },
  tortoise: { str: 12, dex: 8, con: 16, int: 12, wis: 14, cha: 10 },
  vole: { str: 8, dex: 14, con: 8, int: 12, wis: 14, cha: 12 },
};

function qaSpeciesFromParams(params: URLSearchParams): PlayableSpecies {
  const raw = params.get('species');
  return PLAYABLE_SPECIES.includes(raw as PlayableSpecies) ? (raw as PlayableSpecies) : 'frog';
}

if (qaMode) {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('keep')) {
    SaveSystem.clearSave();
  }
  if (params.has('keep') && SaveSystem.hasExistingSave()) {
    enterGame({ mode: 'continue' });
  } else {
    const species = qaSpeciesFromParams(params);
    enterGame({
      mode: 'new',
      species,
      name: 'Traveler',
      motivation: 'investigator',
      stats: QA_FINAL_STATS[species],
      appearance: defaultAppearance(),
      settings: defaultCreatorSettings(),
    });
  }
} else {
  const titleScreen = new TitleScreen(enterGame);
  void titleScreen.init();
}
