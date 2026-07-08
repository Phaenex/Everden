import type { AbilityDefinition, SpeciesDefinition } from '@/data/types';
import { applyArtToCanvas, drawCharacterCanvas } from '@/presentation/CharacterSprites';
import { SaveSystem } from '@/core/SaveSystem';
import { abilityModifier, isPlayableSpecies } from '@/gameplay/OpeningNarration';
import type { ArrivalMotivation } from '@/gameplay/PlayerProfile';

export type GameStartRequest =
  | { mode: 'continue' }
  | { mode: 'new'; species: string; name: string; motivation: ArrivalMotivation };

type WizardStep = 'menu' | 'species' | 'name' | 'motivation' | 'confirm';

const MOTIVATION_OPTIONS: { id: ArrivalMotivation; label: string; hint: string }[] = [
  { id: 'investigator', label: 'Sent to find the truth', hint: 'Hired or asked to look into the flood.' },
  { id: 'messenger', label: "Carrying someone else's worry", hint: 'A letter, rumor, or debt delivered to Lilymarket.' },
  { id: 'neighbor', label: 'This is your basin too', hint: 'Personal stake — not an abstract problem.' },
];

const PLAYABLE_IDS = ['frog', 'toad', 'turtle', 'tortoise', 'vole'] as const;

/**
 * Title-screen wizard: Continue/New Game, species pick, name, motivation, confirm sheet.
 */
export class TitleScreen {
  private flowEl: HTMLElement;
  private species: SpeciesDefinition[] = [];
  private abilities: AbilityDefinition[] = [];
  private step: WizardStep = 'species';
  private selectedSpecies = 'frog';
  private playerName = '';
  private motivation: ArrivalMotivation = 'investigator';
  private onStart: (request: GameStartRequest) => void;

  constructor(onStart: (request: GameStartRequest) => void) {
    this.onStart = onStart;
    this.flowEl = document.getElementById('title-flow')!;
  }

  async init(): Promise<void> {
    const [speciesRes, abilitiesRes] = await Promise.all([
      fetch('/data/species.json'),
      fetch('/data/abilities.json'),
    ]);
    this.species = (await speciesRes.json()) as SpeciesDefinition[];
    this.abilities = (await abilitiesRes.json()) as AbilityDefinition[];
    this.species = this.species.filter(isPlayableSpecies);

    if (SaveSystem.hasExistingSave()) {
      this.step = 'menu';
    } else {
      this.step = 'species';
    }
    this.render();
  }

  private getSpecies(id: string): SpeciesDefinition | undefined {
    return this.species.find((s) => s.id === id);
  }

  private renderSpeciesPreview(canvas: HTMLCanvasElement, speciesId: string): void {
    const src = drawCharacterCanvas(speciesId, 0);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 64);
    ctx.drawImage(src, 0, 0, 32, 32, 0, 0, 64, 64);
    applyArtToCanvas(canvas, speciesId);
  }

  private render(): void {
    this.flowEl.replaceChildren();

    if (this.step === 'menu') {
      this.renderMenu();
      return;
    }
    if (this.step === 'species') {
      this.renderSpeciesStep();
      return;
    }
    if (this.step === 'name') {
      this.renderNameStep();
      return;
    }
    if (this.step === 'motivation') {
      this.renderMotivationStep();
      return;
    }
    this.renderConfirmStep();
  }

  private renderMenu(): void {
    const panel = this.el('div', 'title-step title-menu');
    const continueBtn = this.button('Continue journey', () => this.onStart({ mode: 'continue' }));
    continueBtn.classList.add('title-primary');
    const newBtn = this.button('New game', () => {
      if (window.confirm('Start a new journey? Your saved progress will be overwritten.')) {
        SaveSystem.clearSave();
        this.step = 'species';
        this.render();
      }
    });
    newBtn.classList.add('title-secondary');
    panel.append(continueBtn, newBtn);
    this.flowEl.append(panel);
  }

  private renderSpeciesStep(): void {
    const panel = this.el('div', 'title-step');
    panel.append(this.el('p', 'select-label', 'Choose your folk'));

    const preview = document.createElement('canvas');
    preview.id = 'species-preview';
    preview.width = 64;
    preview.height = 64;
    panel.append(preview);

    const btnRow = this.el('div', 'species-buttons');
    for (const id of PLAYABLE_IDS) {
      const def = this.getSpecies(id);
      if (!def) continue;
      const btn = this.button(`${def.name.replace(' Folk', '')} · ${def.selectRole ?? def.role}`, () => {
        this.selectedSpecies = id;
        btnRow.querySelectorAll('.species-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.renderSpeciesPreview(preview, id);
        const blurb = panel.querySelector('.species-blurb');
        if (blurb) blurb.textContent = def.selectBlurb ?? '';
      });
      btn.classList.add('species-btn');
      btn.dataset.species = id;
      if (id === this.selectedSpecies) btn.classList.add('selected');
      btnRow.append(btn);
    }
    panel.append(btnRow);

    const blurb = this.el('p', 'species-blurb', this.getSpecies(this.selectedSpecies)?.selectBlurb ?? '');
    panel.append(blurb);

    const next = this.button('Next — name your character', () => {
      this.step = 'name';
      this.render();
    });
    next.classList.add('title-primary');
    panel.append(next);

    this.flowEl.append(panel);
    this.renderSpeciesPreview(preview, this.selectedSpecies);
  }

  private renderNameStep(): void {
    const panel = this.el('div', 'title-step');
    panel.append(this.el('p', 'select-label', 'What do folk call you?'));

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'title-name-input';
    input.maxLength = 24;
    input.placeholder = 'Traveler';
    input.value = this.playerName;
    input.autocomplete = 'off';
    panel.append(input);

    const hint = this.el('p', 'title-hint', 'Leave blank to travel as "Traveler".');
    panel.append(hint);

    const row = this.el('div', 'title-nav-row');
    row.append(
      this.button('Back', () => {
        this.playerName = input.value;
        this.step = 'species';
        this.render();
      }),
      this.button('Next — why you came', () => {
        this.playerName = input.value.trim();
        this.step = 'motivation';
        this.render();
      }),
    );
    row.lastElementChild?.classList.add('title-primary');
    panel.append(row);
    this.flowEl.append(panel);
    input.focus();
  }

  private renderMotivationStep(): void {
    const panel = this.el('div', 'title-step');
    panel.append(this.el('p', 'select-label', 'Why are you on the causeway?'));

    const list = this.el('div', 'motivation-list');
    for (const opt of MOTIVATION_OPTIONS) {
      const btn = this.button(opt.label, () => {
        this.motivation = opt.id;
        list.querySelectorAll('.motivation-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        const hintEl = panel.querySelector('.motivation-hint');
        if (hintEl) hintEl.textContent = opt.hint;
      });
      btn.classList.add('motivation-btn');
      if (opt.id === this.motivation) btn.classList.add('selected');
      list.append(btn);
    }
    panel.append(list);

    const hint = this.el(
      'p',
      'motivation-hint',
      MOTIVATION_OPTIONS.find((o) => o.id === this.motivation)?.hint ?? '',
    );
    panel.append(hint);

    const row = this.el('div', 'title-nav-row');
    row.append(
      this.button('Back', () => {
        this.step = 'name';
        this.render();
      }),
      this.button('Next — review sheet', () => {
        this.step = 'confirm';
        this.render();
      }),
    );
    row.lastElementChild?.classList.add('title-primary');
    panel.append(row);
    this.flowEl.append(panel);
  }

  private renderConfirmStep(): void {
    const def = this.getSpecies(this.selectedSpecies)!;
    const displayName = this.playerName.trim() || 'Traveler';
    const panel = this.el('div', 'title-step title-confirm');

    const header = this.el('div', 'confirm-header');
    const preview = document.createElement('canvas');
    preview.width = 64;
    preview.height = 64;
    preview.className = 'confirm-portrait';
    this.renderSpeciesPreview(preview, this.selectedSpecies);
    const titles = this.el('div', 'confirm-titles');
    titles.append(
      this.el('h2', 'confirm-name', displayName),
      this.el('p', 'confirm-species', `${def.name} · ${def.selectRole ?? def.role}`),
      this.el('p', 'confirm-blurb', def.selectBlurb ?? ''),
    );
    header.append(preview, titles);
    panel.append(header);

    const statsGrid = this.el('div', 'confirm-stats');
    const statKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
    for (const key of statKeys) {
      const score = def.stats[key];
      const mod = abilityModifier(score);
      const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
      const cell = this.el('div', 'confirm-stat');
      cell.append(this.el('span', 'stat-key', key.toUpperCase()), this.el('span', 'stat-val', `${score} (${modStr})`));
      statsGrid.append(cell);
    }
    panel.append(statsGrid);

    const combatLine = this.el(
      'p',
      'confirm-combat',
      `AC ${def.combat.ac} · Initiative ${def.combat.initiativeMod >= 0 ? '+' : ''}${def.combat.initiativeMod}`,
    );
    panel.append(combatLine);

    const abilityList = this.el('ul', 'confirm-abilities');
    for (const abId of def.combat.abilities) {
      const ab = this.abilities.find((a) => a.id === abId);
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = ab?.name ?? abId;
      li.append(strong, document.createTextNode(` — ${ab?.description ?? ''}`));
      abilityList.append(li);
    }
    panel.append(abilityList);

    const row = this.el('div', 'title-nav-row');
    row.append(
      this.button('Back', () => {
        this.step = 'motivation';
        this.render();
      }),
      this.button('Enter Reedwater Basin', () => {
        this.onStart({
          mode: 'new',
          species: this.selectedSpecies,
          name: displayName,
          motivation: this.motivation,
        });
      }),
    );
    row.lastElementChild?.classList.add('title-primary');
    panel.append(row);
    this.flowEl.append(panel);
  }

  private el(tag: string, className: string, text = ''): HTMLElement {
    const e = document.createElement(tag);
    e.className = className;
    if (text) e.textContent = text;
    return e;
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }
}

/** Exported for unit tests — mirrors title-screen step resolution. */
export function resolveInitialTitleStep(hasSave: boolean): WizardStep {
  return hasSave ? 'menu' : 'species';
}
