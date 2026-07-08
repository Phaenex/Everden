import { SaveSystem } from '@/core/SaveSystem';
import { CharacterCreator } from './characterCreation/CharacterCreator';
import type { GameStartRequest } from './characterCreation/types';

export type { GameStartRequest } from './characterCreation/types';

type TitleStep = 'menu' | 'creator';

/**
 * Title screen — Continue/New Game menu or tabbed character creator.
 */
export class TitleScreen {
  private flowEl: HTMLElement;
  private step: TitleStep = 'creator';
  private creator: CharacterCreator;
  private onStart: (request: GameStartRequest) => void;

  constructor(onStart: (request: GameStartRequest) => void) {
    this.onStart = onStart;
    this.flowEl = document.getElementById('title-flow')!;
    this.creator = new CharacterCreator(this.flowEl, onStart);
  }

  async init(): Promise<void> {
    if (SaveSystem.hasExistingSave()) {
      this.step = 'menu';
      this.render();
    } else {
      this.step = 'creator';
      await this.creator.init();
    }
  }

  private render(): void {
    this.flowEl.replaceChildren();
    if (this.step === 'menu') {
      this.renderMenu();
      return;
    }
  }

  private renderMenu(): void {
    const panel = el('div', 'title-step title-menu');
    const continueBtn = button('Continue journey', () => this.onStart({ mode: 'continue' }));
    continueBtn.classList.add('title-primary');
    const newBtn = button('New game', () => {
      if (window.confirm('Start a new journey? Your saved progress will be overwritten.')) {
        SaveSystem.clearSave();
        this.step = 'creator';
        this.creator = new CharacterCreator(this.flowEl, this.onStart);
        void this.creator.init();
      }
    });
    newBtn.classList.add('title-secondary');
    panel.append(continueBtn, newBtn);
    this.flowEl.append(panel);
  }
}

function el(tag: string, className: string, text = ''): HTMLElement {
  const e = document.createElement(tag);
  e.className = className;
  if (text) e.textContent = text;
  return e;
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

/** Exported for unit tests — mirrors title-screen step resolution. */
export function resolveInitialTitleStep(hasSave: boolean): TitleStep {
  return hasSave ? 'menu' : 'creator';
}
