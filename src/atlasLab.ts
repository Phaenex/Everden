import './styles/atlas-lab.css';
import {
  listFrameNames,
  loadAtlas,
  type LoadedAtlas,
} from '@/presentation/AtlasFrameLoader';
import {
  AtlasSpriteAnimator,
  type AtlasAnimState,
  type AtlasDirection,
} from '@/presentation/AtlasSpriteAnimator';
import { el, button } from '@/ui/characterCreation/domUtils';

const MANIFEST_URL = '/data/atlas/frogwiz_atlas.json';
const STATE_FRAMES: AtlasAnimState[] = ['idle', 'walk', 'wave', 'cast'];
const DIR_FRAMES: AtlasDirection[] = ['front', 'back', 'left', 'right'];

function mountLab(atlas: LoadedAtlas): void {
  const root = document.getElementById('atlas-lab-root');
  if (!root) return;

  const frameCache = AtlasSpriteAnimator.buildFrameCache(atlas);
  const animator = new AtlasSpriteAnimator(atlas, frameCache);
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 288;
  previewCanvas.height = 288;

  const shell = el('div', 'atlas-lab-shell');
  const header = el('header', 'lab-header');
  const h1 = document.createElement('h1');
  h1.textContent = 'Atlas Lab';
  const sub = el('p', 'lab-sub');
  sub.textContent = 'Frogwiz — sharp trim + full wave/cast timelines (rAF)';
  header.append(h1, sub);
  shell.append(header);

  const body = el('div', 'atlas-lab-body');
  const previewCol = el('div', 'atlas-lab-preview-col');
  const previewBox = el('div', 'character-lab-preview-box');
  previewBox.append(previewCanvas);
  const metaPanel = el('p', 'character-lab-status', '');
  const controlRow = el('div', 'atlas-lab-btn-row');
  const playBtn = button('Pause', () => {
    const on = animator.togglePlay();
    playBtn.textContent = on ? 'Pause' : 'Play';
  });
  controlRow.append(playBtn);

  const stateRow = el('div', 'atlas-lab-btn-row');
  const dirRow = el('div', 'atlas-lab-btn-row');
  const dirLabel = el('p', 'select-label', 'Facing (idle)');
  previewCol.append(previewBox, metaPanel, controlRow, stateRow, dirLabel, dirRow);

  const gridCol = el('div', 'atlas-lab-grid-col');
  gridCol.append(el('p', 'select-label', 'All frames (trimmed)'));
  const grid = el('div', 'atlas-lab-grid');
  gridCol.append(grid);
  body.append(previewCol, gridCol);
  shell.append(body);
  root.append(shell);

  const syncSelection = (): void => {
    stateRow.querySelectorAll('.creator-btn').forEach((node) => {
      node.classList.toggle('selected', node.getAttribute('data-state') === animator.animState);
    });
    dirRow.querySelectorAll('.creator-btn').forEach((node) => {
      node.classList.toggle('selected', node.getAttribute('data-dir') === (animator.direction ?? ''));
    });
  };

  const paint = (): void => {
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;
    const frameName = animator.draw(ctx, previewCanvas.width, previewCanvas.height, performance.now());
    const frame = frameCache.get(frameName);
    metaPanel.textContent = [
      `frame: ${frameName}`,
      frame ? `trimmed: ${frame.width}×${frame.height}` : '',
      `state: ${animator.animState}`,
      animator.direction ? `dir: ${animator.direction}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    syncSelection();
  };

  const clearGridSelection = (): void => {
    grid.querySelectorAll('.atlas-lab-thumb').forEach((n) => n.classList.remove('selected'));
  };

  const pickState = (state: AtlasAnimState): void => {
    animator.setState(state);
    if (state !== 'idle') animator.setDirection(null);
    clearGridSelection();
    syncSelection();
    paint();
  };

  for (const state of STATE_FRAMES) {
    const btn = button(state, () => pickState(state));
    btn.dataset.state = state;
    if (state === 'idle') btn.classList.add('selected');
    stateRow.append(btn);
  }

  const pickDir = (dir: AtlasDirection | null): void => {
    animator.setDirection(dir);
    animator.setState('idle');
    clearGridSelection();
    syncSelection();
    paint();
  };

  const sideBtn = button('side', () => pickDir(null));
  sideBtn.dataset.dir = '';
  dirRow.append(sideBtn);
  for (const dir of DIR_FRAMES) {
    const btn = button(dir, () => pickDir(dir));
    btn.dataset.dir = dir;
    dirRow.append(btn);
  }

  for (const name of listFrameNames(atlas.manifest)) {
    const frame = frameCache.get(name);
    if (!frame) continue;
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'atlas-lab-thumb';
    thumb.dataset.frame = name;
    const tc = document.createElement('canvas');
    tc.width = frame.width;
    tc.height = frame.height;
    const tctx = tc.getContext('2d')!;
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(frame, 0, 0);
    thumb.append(tc, el('span', 'atlas-lab-thumb-label', name));
    thumb.addEventListener('click', () => {
      if (name.startsWith('view_')) {
        pickDir(name.replace('view_', '') as AtlasDirection);
      } else if (name === 'walk') {
        pickState('walk');
      } else if (['idle', 'wave', 'cast'].includes(name)) {
        pickState(name as AtlasAnimState);
      }
      grid.querySelectorAll('.atlas-lab-thumb').forEach((n) => {
        n.classList.toggle('selected', n.getAttribute('data-frame') === name);
      });
    });
    grid.append(thumb);
  }

  animator.start(paint);
  paint();
}

async function main(): Promise<void> {
  const root = document.getElementById('atlas-lab-root');
  if (!root) return;
  root.textContent = 'Loading frogwiz atlas…';
  const atlas = await loadAtlas(MANIFEST_URL);
  if (!atlas) {
    root.textContent = 'Failed to load frogwiz atlas.';
    return;
  }
  root.textContent = '';
  mountLab(atlas);
}

void main();
