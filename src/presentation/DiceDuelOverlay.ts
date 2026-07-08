import type { EventBus } from '@/core/EventBus';
import type { DiceDuelEvent, DiceDuelParticipant } from '@/gameplay/DiceDuelTypes';
import { applyArtToImage, applyEnemyArtToImage, drawCharacterCanvas } from '@/presentation/CharacterSprites';

const SPIN_TICKS = 10;
const SPIN_MS = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').has('qa')
  ? 50
  : 700;
const HOLD_MS = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').has('qa')
  ? 50
  : 950;
const FADE_MS = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').has('qa')
  ? 50
  : 250;

const OUTCOME_TEXT: Record<DiceDuelEvent['outcome'], string> = {
  crit: 'CRITICAL HIT!',
  hit: 'HIT',
  miss: 'MISS',
  fumble: 'FUMBLE',
  success: 'SUCCESS',
  fail: 'FAILURE',
};

export function enemySlugs(name: string): string[] {
  const words = name
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const full = words.join('_');
  const first = words[0] ?? '';
  if (!full) return [];
  return first && first !== full ? [full, first] : [full];
}

/**
 * BG3-style duel popup for combat and dialogue skill checks.
 */
export class DiceDuelOverlay {
  private root: HTMLElement;
  private queue: Array<{ event: DiceDuelEvent; resolve: () => void }> = [];
  private playing = false;

  constructor(private eventBus: EventBus) {
    this.root = document.createElement('div');
    this.root.className = 'dice-duel hidden';
    document.getElementById('ui-root')?.append(this.root);
    this.eventBus.on<DiceDuelEvent>('combat:dice_duel', (event) => {
      void this.show(event);
    });
  }

  /** Queue a duel animation; resolves when the card finishes fading out. */
  show(event: DiceDuelEvent): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push({ event, resolve });
      this.playNext();
    });
  }

  private playNext(): void {
    if (this.playing) return;
    const item = this.queue.shift();
    if (!item) return;
    this.playing = true;
    this.play(item.event, item.resolve);
  }

  private play(event: DiceDuelEvent, resolve: () => void): void {
    this.root.replaceChildren();
    this.root.classList.remove('hidden', 'leaving');
    this.root.classList.add('entering');

    const card = document.createElement('div');
    card.className = 'duel-card';
    card.append(this.buildSide(event.actor, 'left'));

    const middle = document.createElement('div');
    middle.className = 'duel-middle';
    const label = document.createElement('div');
    label.className = 'duel-label';
    label.textContent = event.label;
    const vs = document.createElement('div');
    vs.className = 'duel-vs';
    vs.textContent = event.target ? 'VS' : `DC ${event.dc}`;
    const die = document.createElement('div');
    die.className = 'duel-die';
    const dieFace = document.createElement('div');
    dieFace.className = 'duel-die-face';
    dieFace.textContent = '?';
    die.append(dieFace);
    middle.append(label, vs, die);
    card.append(middle);

    if (event.target) {
      card.append(this.buildSide(event.target, 'right'));
    } else {
      const shield = document.createElement('div');
      shield.className = 'duel-side duel-side-right duel-shield';
      shield.textContent = '🛡';
      card.append(shield);
    }

    this.root.append(card);
    this.spin(dieFace, die, middle, event, resolve);
  }

  private spin(
    dieFace: HTMLElement,
    die: HTMLElement,
    middle: HTMLElement,
    event: DiceDuelEvent,
    resolve: () => void,
  ): void {
    let ticks = 0;
    const interval = window.setInterval(() => {
      ticks++;
      dieFace.textContent = String(1 + Math.floor(Math.random() * 20));
      if (ticks >= SPIN_TICKS) {
        window.clearInterval(interval);
        dieFace.textContent = String(event.natural);
        die.classList.add('settled');
        if (event.natural === 20) die.classList.add('nat20');
        if (event.natural === 1) die.classList.add('nat1');
        this.revealResult(middle, event);
      }
    }, SPIN_MS / SPIN_TICKS);

    window.setTimeout(() => this.dismiss(resolve), SPIN_MS + HOLD_MS);
  }

  private revealResult(middle: HTMLElement, event: DiceDuelEvent): void {
    const breakdown = document.createElement('div');
    breakdown.className = 'duel-breakdown';
    const sign = event.modifier >= 0 ? '+' : '';
    breakdown.textContent = `${event.natural}${sign}${event.modifier} = ${event.total} vs ${event.dc}`;

    const banner = document.createElement('div');
    banner.className = `duel-banner duel-${event.outcome}`;
    banner.textContent = OUTCOME_TEXT[event.outcome];

    middle.append(breakdown, banner);
  }

  private dismiss(resolve: () => void): void {
    this.root.classList.remove('entering');
    this.root.classList.add('leaving');
    window.setTimeout(() => {
      this.root.classList.add('hidden');
      this.root.classList.remove('leaving');
      this.playing = false;
      resolve();
      this.playNext();
    }, FADE_MS);
  }

  private buildSide(p: DiceDuelParticipant, side: 'left' | 'right'): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = `duel-side duel-side-${side}`;
    const img = document.createElement('img');
    img.className = 'duel-portrait';
    img.alt = p.name;
    img.src = drawCharacterCanvas(p.speciesId, 0).toDataURL();
    if (p.isEnemy) {
      applyEnemyArtToImage(img, p.speciesId, enemySlugs(p.name));
    } else {
      applyArtToImage(img, p.speciesId, p.id !== 'player' ? p.id : undefined);
    }
    const name = document.createElement('span');
    name.className = 'duel-name';
    name.textContent = p.name;
    wrap.append(img, name);
    return wrap;
  }
}
