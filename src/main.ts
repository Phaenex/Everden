import { GameBootstrap } from '@/core/GameBootstrap';
import { SaveSystem } from '@/core/SaveSystem';
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

if (qaMode) {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('keep')) {
    SaveSystem.clearSave();
  }
  if (params.has('keep') && SaveSystem.hasExistingSave()) {
    enterGame({ mode: 'continue' });
  } else {
    enterGame({ mode: 'new', species: 'frog', name: 'Traveler', motivation: 'investigator' });
  }
} else {
  const titleScreen = new TitleScreen(enterGame);
  void titleScreen.init();
}
