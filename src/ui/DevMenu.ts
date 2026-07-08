export interface DevMenuActions {
  getSceneId: () => string;
  getHour: () => number;
  getDay: () => number;
  jumpScene: (sceneId: string) => void;
  advanceHours: (hours: number) => void;
  startCombat: (encounterId?: string) => void;
  setQuestStage: (questId: string, stage: string) => void;
  setFlag: (key: string) => void;
  completeExamine: (target: string) => void;
  addGold: (amount: number) => void;
  /** Called whenever the panel opens/closes — bootstrap pauses the world while it's open
   *  so nothing (time, NPCs, combat) keeps changing invisibly behind the panel. */
  onToggle?: (open: boolean) => void;
}

const SCENES = [
  { id: 'causeway', label: 'Causeway' },
  { id: 'lilymarket', label: 'Lilymarket' },
  { id: 'croakend', label: 'Croakend' },
  { id: 'mudwall', label: 'Mudwall' },
  { id: 'ferry_rest', label: "Ferryman's Rest" },
];

/**
 * In-game dev panel — ` (backtick) or F1 to toggle. Not shown in production builds
 * unless `?dev=1` is in the URL (still useful on Vercel for Nick's playtesting).
 */
export class DevMenu {
  private panel: HTMLElement;
  private statusEl: HTMLElement;
  private open = false;
  private enabled: boolean;

  constructor(
    private root: HTMLElement,
    private actions: DevMenuActions,
  ) {
    // Alpha playtesting — always available; add ?nodev=1 to hide on shared links.
    this.enabled = !new URLSearchParams(window.location.search).has('nodev');
    this.panel = document.createElement('div');
    this.panel.className = 'dev-menu hidden';
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'dev-status';
    this.panel.append(this.statusEl);
    this.buildButtons();
    this.root.append(this.panel);

    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      if (e.key === 'F1' || e.key === '`') {
        e.preventDefault();
        this.toggle();
      }
    });

    if (new URLSearchParams(window.location.search).has('dev')) {
      this.toggle();
    }
  }

  private buildButtons(): void {
    const grid = document.createElement('div');
    grid.className = 'dev-grid';

    const h = document.createElement('h3');
    h.textContent = 'Dev Menu';
    this.panel.prepend(h);

    const sceneSec = this.section('Jump to district');
    for (const s of SCENES) {
      sceneSec.append(this.btn(s.label, () => this.actions.jumpScene(s.id)));
    }
    grid.append(sceneSec);

    const timeSec = this.section('Time');
    timeSec.append(this.btn('+1 hour', () => this.actions.advanceHours(1)));
    timeSec.append(this.btn('+6 hours', () => this.actions.advanceHours(6)));
    grid.append(timeSec);

    const questSec = this.section('Quest shortcuts');
    questSec.append(this.btn('Quest → cellar', () => this.actions.setQuestStage('what_water_remembers', 'cellar')));
    questSec.append(this.btn('Quest → council', () => this.actions.setQuestStage('what_water_remembers', 'council')));
    questSec.append(this.btn('Flag: evidence_gathered', () => this.actions.setFlag('evidence_gathered')));
    questSec.append(this.btn('Examine all 4 sites', () => {
      for (const t of ['flooded_cellar', 'levy_plans', 'chapel_mural', 'ferry_depth']) {
        this.actions.completeExamine(t);
      }
    }));
    grid.append(questSec);

    const fightSec = this.section('Combat');
    fightSec.append(this.btn('Blackfen Poachers', () => this.actions.startCombat('blackfen_poachers')));
    grid.append(fightSec);

    const miscSec = this.section('Misc');
    miscSec.append(this.btn('+50 gold', () => this.actions.addGold(50)));
    grid.append(miscSec);

    this.panel.append(grid);
    const hint = document.createElement('p');
    hint.className = 'dev-hint';
    hint.textContent = 'F1 or ` to close';
    this.panel.append(hint);
  }

  private section(title: string): HTMLElement {
    const sec = document.createElement('div');
    sec.className = 'dev-section';
    const label = document.createElement('h4');
    label.textContent = title;
    sec.append(label);
    return sec;
  }

  private btn(text: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.onclick = () => {
      onClick();
      this.refreshStatus();
    };
    return b;
  }

  toggle(): void {
    if (!this.enabled) return;
    this.open = !this.open;
    this.panel.classList.toggle('hidden', !this.open);
    if (this.open) this.refreshStatus();
    this.actions.onToggle?.(this.open);
  }

  private refreshStatus(): void {
    this.statusEl.textContent = `Scene: ${this.actions.getSceneId()} · Day ${this.actions.getDay()} · ${String(this.actions.getHour()).padStart(2, '0')}:00`;
  }
}
