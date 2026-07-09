import type { AbilityDefinition, SpeciesDefinition, WardrobeDefinition } from '@/data/types';
import type { ArrivalMotivation } from '@/gameplay/PlayerProfile';
import { defaultCreatorSettings } from '@/gameplay/CreatorSettings';
import {
  defaultAppearance,
  randomAppearance,
  migrateAppearance,
  BODY_BUILD_LABELS,
  type BodyBuild,
  type CharacterMarking,
  type WardrobeSlot,
} from '@/gameplay/CharacterAppearance';
import {
  getSpeciesAppearance,
  getSpeciesAppearanceRegistry,
  playableSpeciesIds,
  setSpeciesAppearanceRegistry,
  patternLabel,
} from '@/data/SpeciesAppearanceRegistry';
import type { SpeciesAppearanceRegistry } from '@/gameplay/CharacterAppearance';
import {
  adjustBaseStat,
  applyRacial,
  defaultBaseStats,
  recommendedBaseStats,
  totalPointCost,
  validatePointBuy,
  POINT_BUY_POOL,
} from '@/gameplay/PointBuy';
import { abilityModifier } from '@/gameplay/OpeningNarration';
import { filterWardrobeForSpecies } from '@/presentation/WardrobeLayers';
import { drawSpeciesCardThumbnail, drawVariantThumbnail, drawWardrobeThumbnail, drawBuildThumbnail } from './WardrobePreview';
import { button, el } from './domUtils';
import { renderCreatorPreview, renderCreatorSummary } from './CreatorPreview';
import { loadCreatorGuide, type CreatorGuide } from './CreatorGuide';
import { appendInfoBox } from './CreatorInfo';
import { renderKitPanel, renderSettingsPanel, renderSkillsPanel } from './CreatorPanels';
import type { CreatorState, CreatorTab, GameStartRequest } from './types';
import { CREATOR_TABS } from './types';

const MOTIVATION_OPTIONS: { id: ArrivalMotivation; label: string; hint: string }[] = [
  { id: 'investigator', label: 'Sent to find the truth', hint: 'Hired or asked to look into the flood.' },
  { id: 'messenger', label: "Carrying someone else's worry", hint: 'A letter, rumor, or debt delivered to Lilymarket.' },
  { id: 'neighbor', label: 'This is your basin too', hint: 'Personal stake — not an abstract problem.' },
];

export class CharacterCreator {
  private state: CreatorState = {
    tab: 'species',
    species: 'frog',
    baseStats: defaultBaseStats(),
    name: '',
    motivation: 'investigator',
    appearance: defaultAppearance(),
    settings: defaultCreatorSettings(),
  };

  private species: SpeciesDefinition[] = [];
  private abilities: AbilityDefinition[] = [];
  private wardrobe: WardrobeDefinition[] = [];
  private guide: CreatorGuide | null = null;
  private previewCanvas: HTMLCanvasElement | null = null;
  private summaryEl: HTMLElement | null = null;
  private panelEl: HTMLElement | null = null;

  constructor(
    private mountEl: HTMLElement,
    private onStart: (request: GameStartRequest) => void,
  ) {}

  async init(): Promise<void> {
    const [speciesRes, abilitiesRes, wardrobeRes, lookRes, guide] = await Promise.all([
      fetch('/data/species.json'),
      fetch('/data/abilities.json'),
      fetch('/data/wardrobe.json'),
      fetch('/data/speciesAppearance.json'),
      loadCreatorGuide(),
    ]);
    this.guide = guide;
    this.species = (await speciesRes.json()) as SpeciesDefinition[];
    this.abilities = (await abilitiesRes.json()) as AbilityDefinition[];
    this.wardrobe = (await wardrobeRes.json()) as WardrobeDefinition[];
    const lookReg = (await lookRes.json()) as SpeciesAppearanceRegistry;
    setSpeciesAppearanceRegistry(lookReg);
    const playable = new Set(playableSpeciesIds());
    this.species = this.species.filter((s) => playable.has(s.id));
    const frog = this.getSpecies('frog');
    if (frog) {
      this.state.baseStats = recommendedBaseStats(frog);
      this.state.appearance = migrateAppearance(defaultAppearance(), 'frog', lookReg);
    }
    this.render();
  }

  private getSpecies(id: string): SpeciesDefinition | undefined {
    return this.species.find((s) => s.id === id);
  }

  private setTab(tab: CreatorTab): void {
    this.state.tab = tab;
    this.render();
  }

  private onSpeciesChange(id: string): void {
    const def = this.getSpecies(id);
    if (!def) return;
    this.state.species = id;
    this.state.baseStats = recommendedBaseStats(def);
    const prevLook = this.state.appearance;
    const lookDef = getSpeciesAppearance(id);
    this.state.appearance = migrateAppearance(
      {
        ...defaultAppearance(lookDef?.patterns[0]?.id ?? 'moss'),
        build: prevLook.build ?? 1,
        skinTone: prevLook.skinTone ?? 0,
        eyeColor: prevLook.eyeColor ?? 0,
        marking: prevLook.marking,
        markingIntensity: prevLook.markingIntensity,
        wardrobe: { ...prevLook.wardrobe },
        dyes: { ...prevLook.dyes },
      },
      id,
      getSpeciesAppearanceRegistry(),
    );
    const allowed = new Set(filterWardrobeForSpecies(this.wardrobe, id).map((w) => w.id));
    for (const slot of ['hat', 'cloak', 'accessory', 'held'] as const) {
      const equipped = this.state.appearance.wardrobe[slot];
      if (equipped && !allowed.has(equipped)) delete this.state.appearance.wardrobe[slot];
    }
    this.render();
  }

  private playableIds(): string[] {
    const fromReg = playableSpeciesIds();
    return fromReg.length ? fromReg : this.species.map((s) => s.id);
  }

  private refreshPreview(): void {
    if (!this.previewCanvas) return;
    renderCreatorPreview(
      this.previewCanvas,
      this.state,
      this.getSpecies(this.state.species),
      this.wardrobe,
    );
  }

  private render(): void {
    this.mountEl.replaceChildren();
    const shell = el('div', 'creator-shell');

    const tabs = el('nav', 'creator-tabs');
    tabs.setAttribute('role', 'tablist');
    for (const t of CREATOR_TABS) {
      const tabBtn = button(t.label, () => this.setTab(t.id));
      tabBtn.classList.add('creator-tab');
      tabBtn.dataset.tab = t.id;
      if (this.state.tab === t.id) tabBtn.classList.add('active');
      tabs.append(tabBtn);
    }

    const center = el('div', 'creator-preview-col');
    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.className = 'creator-preview-canvas';
    // Internal 256 so wardrobe / tint / markings read clearly when scaled up.
    this.previewCanvas.width = 288;
    this.previewCanvas.height = 288;
    const def = this.getSpecies(this.state.species);
    center.append(this.previewCanvas);
    center.append(el('p', 'creator-preview-title', def?.name.replace(' Folk', '') ?? ''));
    center.append(el('p', 'creator-preview-role', def?.selectRole ?? def?.role ?? ''));

    this.panelEl = el('div', 'creator-panel-col');
    this.renderPanel();

    this.summaryEl = el('aside', 'creator-summary');
    this.renderSummary();

    shell.append(tabs, center, this.panelEl, this.summaryEl);
    this.mountEl.append(shell);
    this.refreshPreview();
  }

  private renderSummary(): void {
    if (!this.summaryEl) return;
    renderCreatorSummary(
      this.summaryEl,
      this.state,
      this.getSpecies(this.state.species),
      this.abilities,
      this.wardrobe,
    );
  }

  private renderPanel(): void {
    if (!this.panelEl) return;
    this.panelEl.replaceChildren();
    switch (this.state.tab) {
      case 'species':
        this.renderSpeciesPanel();
        break;
      case 'appearance':
        this.renderAppearancePanel();
        break;
      case 'wardrobe':
        this.renderWardrobePanel();
        break;
      case 'stats':
        this.renderStatsPanel();
        break;
      case 'kit':
        this.renderKitPanel();
        break;
      case 'skills':
        this.renderSkillsPanel();
        break;
      case 'story':
        this.renderStoryPanel();
        break;
      case 'settings':
        this.renderSettingsPanel();
        break;
      case 'review':
        this.renderReviewPanel();
        break;
    }
  }

  private renderSpeciesPanel(): void {
    const panel = el('div', 'creator-tab-panel');
    if (this.guide) appendInfoBox(panel, this.guide.tabs.species ?? '');
    panel.append(el('p', 'select-label', 'Choose your folk'));
    const grid = el('div', 'species-cards');
    for (const id of this.playableIds()) {
      const def = this.getSpecies(id);
      if (!def) continue;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'style-card species-card';
      card.dataset.species = id;
      if (id === this.state.species) card.classList.add('selected');
      const thumb = drawSpeciesCardThumbnail(
        id,
        id === this.state.species,
        this.state.appearance,
        this.wardrobe,
      );
      card.append(thumb);
      card.append(el('span', 'style-card-label', def.name.replace(' Folk', '')));
      card.append(el('span', 'species-card-role', def.selectRole ?? def.role));
      card.append(el('span', 'style-card-hint species-blurb', def.selectBlurb ?? ''));
      card.addEventListener('click', () => this.onSpeciesChange(id));
      grid.append(card);
    }
    panel.append(grid);
    this.panelEl!.append(panel);
  }

  private renderAppearancePanel(): void {
    const panel = el('div', 'creator-tab-panel');
    const look = getSpeciesAppearance(this.state.species);
    if (this.guide) {
      appendInfoBox(panel, this.guide.tabs.appearance ?? '');
      appendInfoBox(panel, this.guide.appearance.variant, 'note');
    }

    panel.append(el('p', 'select-label', 'Body build'));
    const buildGrid = el('div', 'variant-grid build-grid');
    for (let b = 0; b < 3; b++) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'style-card build-card';
      if (this.state.appearance.build === b) card.classList.add('selected');
      const thumb = drawBuildThumbnail(this.state.species, b as BodyBuild, this.state.appearance, this.wardrobe);
      card.append(thumb);
      card.append(el('span', 'style-card-label', BODY_BUILD_LABELS[b]!));
      card.addEventListener('click', () => {
        this.state.appearance.build = b as BodyBuild;
        this.renderPanel();
        this.refreshPreview();
        this.renderSummary();
      });
      buildGrid.append(card);
    }
    panel.append(buildGrid);

    // Skin tone swatches
    panel.append(el('p', 'select-label', 'Skin tone'));
    const skinRow = el('div', 'swatch-row');
    (look?.skinRamps ?? ['#4c7842']).forEach((hex, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-btn' + (this.state.appearance.skinTone === i ? ' selected' : '');
      btn.style.background = hex;
      btn.title = `Tone ${i + 1}`;
      btn.addEventListener('click', () => {
        this.state.appearance.skinTone = i;
        this.state.appearance.hueShift = 0;
        this.renderPanel();
        this.refreshPreview();
        this.renderSummary();
      });
      skinRow.append(btn);
    });
    panel.append(skinRow);

    // Eye color
    panel.append(el('p', 'select-label', 'Eye color'));
    const eyeRow = el('div', 'swatch-row');
    (look?.eyeRamps ?? ['#c8e8c0']).forEach((hex, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-btn' + (this.state.appearance.eyeColor === i ? ' selected' : '');
      btn.style.background = hex;
      btn.title = `Eyes ${i + 1}`;
      btn.addEventListener('click', () => {
        this.state.appearance.eyeColor = i;
        this.renderPanel();
        this.refreshPreview();
        this.renderSummary();
      });
      eyeRow.append(btn);
    });
    panel.append(eyeRow);

    // Crest / hair
    panel.append(el('p', 'select-label', 'Crest / hair'));
    const crestGrid = el('div', 'variant-grid');
    for (const crest of look?.crests ?? [{ id: 'none', label: 'Bare' }]) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'style-card crest-card';
      if ((this.state.appearance.crestId ?? 'none') === crest.id) card.classList.add('selected');
      card.append(el('span', 'style-card-label', crest.label));
      card.addEventListener('click', () => {
        this.state.appearance.crestId = crest.id;
        this.renderPanel();
        this.refreshPreview();
        this.renderSummary();
      });
      crestGrid.append(card);
    }
    panel.append(crestGrid);
    if ((this.state.appearance.crestId ?? 'none') !== 'none') {
      panel.append(el('p', 'select-label', 'Crest color'));
      const crestColorRow = el('div', 'swatch-row');
      (look?.crestColorRamps ?? []).forEach((hex, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'swatch-btn' + (this.state.appearance.crestColor === i ? ' selected' : '');
        btn.style.background = hex;
        btn.addEventListener('click', () => {
          this.state.appearance.crestColor = i;
          this.renderPanel();
          this.refreshPreview();
          this.renderSummary();
        });
        crestColorRow.append(btn);
      });
      panel.append(crestColorRow);
    }

    // Body pattern
    panel.append(el('p', 'select-label', 'Body palette — pick your folk\'s colors'));
    const variantGrid = el('div', 'variant-grid');
    for (const pat of look?.patterns ?? []) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'style-card variant-card';
      if (this.state.appearance.patternId === pat.id) card.classList.add('selected');
      const thumb = drawVariantThumbnail(this.state.species, pat.id, this.state.appearance, this.wardrobe);
      card.append(thumb);
      card.append(el('span', 'style-card-label', pat.label));
      card.addEventListener('click', () => {
        this.state.appearance.patternId = pat.id;
        this.state.appearance.variant = look!.patterns.findIndex((p) => p.id === pat.id);
        this.renderPanel();
        this.refreshPreview();
        this.renderSummary();
      });
      variantGrid.append(card);
    }
    panel.append(variantGrid);

    const patIntLabel = el(
      'label',
      'hue-label',
      `Pattern intensity (${this.state.appearance.patternIntensity})`,
    );
    const patInt = document.createElement('input');
    patInt.type = 'range';
    patInt.min = '0';
    patInt.max = '100';
    patInt.value = String(this.state.appearance.patternIntensity ?? 100);
    patInt.className = 'hue-slider';
    patInt.addEventListener('input', () => {
      this.state.appearance.patternIntensity = Number(patInt.value);
      patIntLabel.textContent = `Pattern intensity (${this.state.appearance.patternIntensity})`;
      this.refreshPreview();
      this.renderSummary();
    });
    panel.append(patIntLabel, patInt);

    // Markings
    panel.append(el('p', 'select-label', 'Markings'));
    const markRow = el('div', 'marking-row');
    const marks = (look?.markings ?? ['none', 'spots', 'stripes']) as CharacterMarking[];
    for (const m of marks) {
      const btn = button(m.charAt(0).toUpperCase() + m.slice(1), () => {
        this.state.appearance.marking = m;
        if (m === 'none') this.state.appearance.markingIntensity = 0;
        else if (this.state.appearance.markingIntensity < 20) this.state.appearance.markingIntensity = 60;
        this.renderPanel();
        this.refreshPreview();
        this.renderSummary();
      });
      btn.classList.add('marking-btn');
      if (this.state.appearance.marking === m) btn.classList.add('selected');
      markRow.append(btn);
    }
    panel.append(markRow);

    if (this.state.appearance.marking !== 'none') {
      const markIntLabel = el(
        'label',
        'hue-label',
        `Marking intensity (${this.state.appearance.markingIntensity})`,
      );
      const markInt = document.createElement('input');
      markInt.type = 'range';
      markInt.min = '0';
      markInt.max = '100';
      markInt.value = String(this.state.appearance.markingIntensity ?? 60);
      markInt.className = 'hue-slider';
      markInt.addEventListener('input', () => {
        this.state.appearance.markingIntensity = Number(markInt.value);
        markIntLabel.textContent = `Marking intensity (${this.state.appearance.markingIntensity})`;
        this.refreshPreview();
        this.renderSummary();
      });
      panel.append(markIntLabel, markInt);
    }

    const actions = el('div', 'creator-tab-actions');
    actions.append(
      button('Randomize look', () => {
        const next = randomAppearance(this.state.species, getSpeciesAppearanceRegistry());
        next.wardrobe = { ...this.state.appearance.wardrobe };
        next.dyes = { ...this.state.appearance.dyes };
        this.state.appearance = next;
        this.renderPanel();
        this.refreshPreview();
        this.renderSummary();
      }),
      button('Reset tab', () => {
        const base = migrateAppearance(
          defaultAppearance(look?.patterns[0]?.id ?? 'moss'),
          this.state.species,
          getSpeciesAppearanceRegistry(),
        );
        base.wardrobe = { ...this.state.appearance.wardrobe };
        base.dyes = { ...this.state.appearance.dyes };
        this.state.appearance = base;
        this.renderPanel();
        this.refreshPreview();
        this.renderSummary();
      }),
    );
    panel.append(actions);
    this.panelEl!.append(panel);
  }

  private buildWardrobeCard(
    slot: WardrobeSlot,
    itemId: string | null,
    label: string,
    hint: string,
    selected: boolean,
    onPick: () => void,
  ): HTMLButtonElement {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'style-card wardrobe-card';
    if (selected) card.classList.add('selected');
    const thumb = drawWardrobeThumbnail(
      this.state.species,
      slot,
      itemId,
      this.state.appearance,
      this.wardrobe,
    );
    card.append(thumb);
    card.append(el('span', 'style-card-label', label));
    if (hint) card.append(el('span', 'style-card-hint', hint));
    card.addEventListener('click', onPick);
    return card;
  }

  private renderWardrobePanel(): void {
    const panel = el('div', 'creator-tab-panel wardrobe-panel');
    if (this.guide) {
      appendInfoBox(panel, this.guide.tabs.wardrobe ?? '');
      appendInfoBox(panel, this.guide.wardrobeNote, 'note');
    }
    panel.append(el('p', 'select-label', 'Tap a style to equip — preview updates live'));
    const items = filterWardrobeForSpecies(this.wardrobe, this.state.species);
    for (const slot of ['hat', 'cloak', 'accessory', 'held'] as const) {
      const section = el('div', 'wardrobe-section');
      section.append(el('p', 'wardrobe-slot-label', slot.charAt(0).toUpperCase() + slot.slice(1)));
      const grid = el('div', 'wardrobe-grid');
      grid.append(
        this.buildWardrobeCard(
          slot,
          null,
          'None',
          'Bare — no piece in this slot.',
          !this.state.appearance.wardrobe[slot],
          () => {
            delete this.state.appearance.wardrobe[slot];
            delete this.state.appearance.dyes[slot];
            this.renderPanel();
            this.refreshPreview();
            this.renderSummary();
          },
        ),
      );
      for (const item of items.filter((w) => w.slot === slot)) {
        grid.append(
          this.buildWardrobeCard(
            slot,
            item.id,
            item.label,
            item.hint ?? '',
            this.state.appearance.wardrobe[slot] === item.id,
            () => {
              this.state.appearance.wardrobe[slot] = item.id;
              this.renderPanel();
              this.refreshPreview();
              this.renderSummary();
            },
          ),
        );
      }
      section.append(grid);
      if (this.state.appearance.wardrobe[slot]) {
        const dyeLabel = el(
          'label',
          'hue-label',
          `Dye (${this.state.appearance.dyes[slot] ?? 0})`,
        );
        const dye = document.createElement('input');
        dye.type = 'range';
        dye.min = '-60';
        dye.max = '60';
        dye.value = String(this.state.appearance.dyes[slot] ?? 0);
        dye.className = 'hue-slider';
        dye.addEventListener('input', () => {
          this.state.appearance.dyes[slot] = Number(dye.value);
          dyeLabel.textContent = `Dye (${this.state.appearance.dyes[slot]})`;
          this.refreshPreview();
          this.renderSummary();
        });
        section.append(dyeLabel, dye);
      }
      panel.append(section);
    }
    this.panelEl!.append(panel);
  }

  private renderStatsPanel(): void {
    const def = this.getSpecies(this.state.species)!;
    const panel = el('div', 'creator-tab-panel stats-panel');
    if (this.guide) appendInfoBox(panel, this.guide.tabs.stats ?? '');
    const spent = totalPointCost(this.state.baseStats);
    const validation = validatePointBuy(this.state.baseStats);
    const pool = el('div', 'point-pool-meter');
    pool.append(el('span', 'pool-label', `Points ${spent} / ${POINT_BUY_POOL}`));
    const bar = el('div', 'pool-bar');
    const fill = el('div', 'pool-fill');
    fill.style.width = `${Math.min(100, (spent / POINT_BUY_POOL) * 100)}%`;
    if (!validation.ok) fill.classList.add('over-budget');
    bar.append(fill);
    pool.append(bar);
    panel.append(pool);

    if (def.racialBonuses) {
      panel.append(
        el(
          'p',
          'racial-callout',
          `Racial: +2 ${def.racialBonuses.plus2.toUpperCase()}, +1 ${def.racialBonuses.plus1.toUpperCase()} (applied after point-buy)`,
        ),
      );
    }

    const grid = el('div', 'stat-controls');
    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
      const row = el('div', 'stat-control-row');
      const final = applyRacial(this.state.baseStats, def.racialBonuses)[key];
      const mod = abilityModifier(final);
      row.append(el('span', 'stat-key', key.toUpperCase()));
      const minus = button('−', () => {
        this.state.baseStats = adjustBaseStat(this.state.baseStats, key, -1);
        this.renderPanel();
        this.renderSummary();
      });
      minus.classList.add('stat-btn');
      const score = el('span', 'stat-score', String(this.state.baseStats[key]));
      const plus = button('+', () => {
        this.state.baseStats = adjustBaseStat(this.state.baseStats, key, 1);
        this.renderPanel();
        this.renderSummary();
      });
      plus.classList.add('stat-btn');
      row.append(minus, score, plus, el('span', 'stat-final', `→ ${final} (${mod >= 0 ? '+' : ''}${mod})`));
      if (this.guide) {
        const hint = el('p', 'stat-row-hint', this.guide.stats[key].inGame);
        row.append(hint);
      }
      grid.append(row);
    }
    panel.append(grid);

    const actions = el('div', 'creator-tab-actions');
    actions.append(
      button('Use folk default', () => {
        this.state.baseStats = recommendedBaseStats(def);
        this.renderPanel();
        this.renderSummary();
      }),
      button('Reset tab', () => {
        this.state.baseStats = recommendedBaseStats(def);
        this.renderPanel();
        this.renderSummary();
      }),
    );
    panel.append(actions);
    this.panelEl!.append(panel);
  }

  private renderKitPanel(): void {
    const panel = el('div', 'creator-tab-panel kit-panel');
    if (!this.guide) return;
    renderKitPanel(panel, {
      state: this.state,
      speciesDef: this.getSpecies(this.state.species),
      abilities: this.abilities,
      guide: this.guide,
    });
    this.panelEl!.append(panel);
  }

  private renderSkillsPanel(): void {
    const panel = el('div', 'creator-tab-panel skills-panel');
    if (!this.guide) return;
    renderSkillsPanel(panel, {
      state: this.state,
      speciesDef: this.getSpecies(this.state.species),
      guide: this.guide,
    });
    this.panelEl!.append(panel);
  }

  private renderSettingsPanel(): void {
    const panel = el('div', 'creator-tab-panel settings-panel');
    if (!this.guide) return;
    renderSettingsPanel(panel, {
      settings: this.state.settings,
      guide: this.guide,
      onChange: (settings) => {
        this.state.settings = settings;
      },
      onReset: () => {
        this.state.settings = defaultCreatorSettings();
        this.renderPanel();
      },
    });
    this.panelEl!.append(panel);
  }

  private renderStoryPanel(): void {
    const panel = el('div', 'creator-tab-panel');
    if (this.guide) appendInfoBox(panel, this.guide.tabs.story ?? '');
    panel.append(el('p', 'select-label', 'What do folk call you?'));
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'title-name-input';
    input.maxLength = 24;
    input.placeholder = 'Traveler';
    input.value = this.state.name;
    input.addEventListener('input', () => {
      this.state.name = input.value;
      this.renderSummary();
    });
    panel.append(input, el('p', 'title-hint', 'Leave blank to travel as "Traveler".'));

    panel.append(el('p', 'select-label', 'Why are you on the causeway?'));
    const list = el('div', 'motivation-list');
    for (const opt of MOTIVATION_OPTIONS) {
      const btn = button(opt.label, () => {
        this.state.motivation = opt.id;
        this.renderPanel();
        this.renderSummary();
      });
      btn.classList.add('motivation-btn');
      if (opt.id === this.state.motivation) btn.classList.add('selected');
      list.append(btn);
    }
    panel.append(list);
    const hint = el(
      'p',
      'motivation-hint',
      MOTIVATION_OPTIONS.find((o) => o.id === this.state.motivation)?.hint ?? '',
    );
    panel.append(hint);
    if (this.guide?.motivations[this.state.motivation]) {
      appendInfoBox(panel, this.guide.motivations[this.state.motivation], 'note');
    }
    this.panelEl!.append(panel);
  }

  private renderReviewPanel(): void {
    const def = this.getSpecies(this.state.species)!;
    const panel = el('div', 'creator-tab-panel review-panel');
    if (this.guide) appendInfoBox(panel, this.guide.tabs.review ?? '');
    const finalStats = applyRacial(this.state.baseStats, def.racialBonuses);
    const displayName = this.state.name.trim() || 'Traveler';
    panel.append(el('h2', 'review-heading', `${displayName} · ${def.name}`));

    const statsOk = validatePointBuy(this.state.baseStats).ok;
    if (!statsOk) {
      panel.append(el('p', 'review-warning', 'Stats exceed the 27-point pool — adjust before entering.'));
    }

    const checklist = el('ul', 'review-checklist');
    const motivationLabel =
      MOTIVATION_OPTIONS.find((o) => o.id === this.state.motivation)?.label ?? this.state.motivation;
    checklist.append(el('li', '', `Motivation: ${motivationLabel}`));
    const markingLabel =
      this.state.appearance.marking === 'none'
        ? 'none'
        : this.state.appearance.marking.charAt(0).toUpperCase() + this.state.appearance.marking.slice(1);
    checklist.append(
      el(
        'li',
        '',
        `Look: ${BODY_BUILD_LABELS[this.state.appearance.build]!} · ${patternLabel(this.state.species, this.state.appearance.patternId)} · skin ${this.state.appearance.skinTone + 1} · ${markingLabel}`,
      ),
    );
    const wornLabels: string[] = [];
    for (const slot of ['hat', 'cloak', 'accessory'] as const) {
      const id = this.state.appearance.wardrobe[slot];
      if (!id) continue;
      const def = this.wardrobe.find((w) => w.id === id);
      wornLabels.push(def?.label ?? id.replace(/_/g, ' '));
    }
    checklist.append(el('li', '', `Outfit: ${wornLabels.length ? wornLabels.join(' · ') : 'none'}`));
    checklist.append(el('li', '', `Opening narration: ${this.state.settings.skipOpeningNarration ? 'skipped' : 'on'}`));
    checklist.append(el('li', '', `Control hints: ${this.state.settings.showControlHints ? 'on' : 'off'}`));
    panel.append(checklist);

    const enter = button('Enter Reedwater Basin', () => {
      if (!validatePointBuy(this.state.baseStats).ok) return;
      this.onStart({
        mode: 'new',
        species: this.state.species,
        name: displayName,
        motivation: this.state.motivation,
        stats: finalStats,
        appearance: migrateAppearance(
          this.state.appearance,
          this.state.species,
          getSpeciesAppearanceRegistry(),
        ),
        settings: { ...this.state.settings },
      });
    });
    enter.classList.add('title-primary');
    enter.disabled = !statsOk;
    panel.append(enter);
    this.panelEl!.append(panel);
  }
}
