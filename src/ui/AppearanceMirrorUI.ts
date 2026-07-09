import type { CharacterAppearance } from '@/gameplay/CharacterAppearance';
import {
  defaultAppearance,
  migrateAppearance,
  randomAppearance,
  BODY_BUILD_LABELS,
  type BodyBuild,
  type CharacterMarking,
} from '@/gameplay/CharacterAppearance';
import {
  getSpeciesAppearance,
  getSpeciesAppearanceRegistry,
  patternLabel,
} from '@/data/SpeciesAppearanceRegistry';
import type { WardrobeDefinition } from '@/data/types';
import { composeCharacterArtCanvas, drawPortraitFit } from '@/presentation/CharacterSprites';
import { button, el } from '@/ui/characterCreation/domUtils';

/**
 * In-world Mudwall guild mirror — Look + Outfits subset without leaving the district.
 */
export class AppearanceMirrorUI {
  private root: HTMLElement | null = null;
  private preview: HTMLCanvasElement | null = null;
  private draft: CharacterAppearance = defaultAppearance();
  private seq = 0;

  constructor(
    private species: string,
    private wardrobe: WardrobeDefinition[],
    private getAppearance: () => CharacterAppearance,
    private onCommit: (appearance: CharacterAppearance) => void,
  ) {}

  open(): void {
    this.close();
    this.draft = migrateAppearance(
      structuredClone(this.getAppearance()),
      this.species,
      getSpeciesAppearanceRegistry(),
    );
    this.root = el('div', 'mirror-overlay');
    const panel = el('div', 'mirror-panel');
    panel.append(el('h2', 'mirror-title', 'Guild looking-glass'));
    panel.append(
      el('p', 'mirror-hint', 'Respec your look — Mudwall guild mirror. Changes save when you Confirm.'),
    );

    this.preview = document.createElement('canvas');
    this.preview.width = 192;
    this.preview.height = 192;
    this.preview.className = 'mirror-preview';
    panel.append(this.preview);

    const look = getSpeciesAppearance(this.species);

    panel.append(el('p', 'select-label', 'Skin tone'));
    const skinRow = el('div', 'swatch-row');
    (look?.skinRamps ?? []).forEach((hex, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-btn' + (this.draft.skinTone === i ? ' selected' : '');
      btn.style.background = hex;
      btn.addEventListener('click', () => {
        this.draft.skinTone = i;
        this.refresh();
      });
      skinRow.append(btn);
    });
    panel.append(skinRow);

    panel.append(el('p', 'select-label', 'Eye color'));
    const eyeRow = el('div', 'swatch-row');
    (look?.eyeRamps ?? []).forEach((hex, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-btn' + (this.draft.eyeColor === i ? ' selected' : '');
      btn.style.background = hex;
      btn.addEventListener('click', () => {
        this.draft.eyeColor = i;
        this.refresh();
      });
      eyeRow.append(btn);
    });
    panel.append(eyeRow);

    panel.append(el('p', 'select-label', 'Body build'));
    const buildRow = el('div', 'marking-row');
    for (let b = 0; b < 3; b++) {
      const btn = button(BODY_BUILD_LABELS[b]!, () => {
        this.draft.build = b as BodyBuild;
        this.refresh();
      });
      if (this.draft.build === b) btn.classList.add('selected');
      buildRow.append(btn);
    }
    panel.append(buildRow);

    panel.append(el('p', 'select-label', 'Palette'));
    const patRow = el('div', 'marking-row');
    for (const pat of look?.patterns ?? []) {
      const btn = button(pat.label, () => {
        this.draft.patternId = pat.id;
        this.refresh();
      });
      if (this.draft.patternId === pat.id) btn.classList.add('selected');
      patRow.append(btn);
    }
    panel.append(patRow);

    panel.append(el('p', 'select-label', 'Markings'));
    const markRow = el('div', 'marking-row');
    for (const m of (look?.markings ?? ['none', 'spots', 'stripes']) as CharacterMarking[]) {
      const btn = button(m.charAt(0).toUpperCase() + m.slice(1), () => {
        this.draft.marking = m;
        this.refresh();
      });
      if (this.draft.marking === m) btn.classList.add('selected');
      markRow.append(btn);
    }
    panel.append(markRow);

    const actions = el('div', 'creator-tab-actions');
    actions.append(
      button('Randomize', () => {
        const next = randomAppearance(this.species, getSpeciesAppearanceRegistry());
        next.wardrobe = { ...this.draft.wardrobe };
        next.dyes = { ...this.draft.dyes };
        this.draft = next;
        this.refresh();
      }),
      button('Confirm', () => {
        this.onCommit(this.draft);
        this.close();
      }),
      button('Cancel', () => this.close()),
    );
    panel.append(actions);
    panel.append(
      el(
        'p',
        'mirror-summary',
        `${patternLabel(this.species, this.draft.patternId)} · ${BODY_BUILD_LABELS[this.draft.build]}`,
      ),
    );

    this.root.append(panel);
    document.body.append(this.root);
    this.refresh();
  }

  private refresh(): void {
    if (!this.preview) return;
    const seq = ++this.seq;
    const ctx = this.preview.getContext('2d')!;
    void composeCharacterArtCanvas(this.species, this.draft, this.wardrobe, 0).then((composed) => {
      if (seq !== this.seq || !composed) return;
      drawPortraitFit(ctx, composed, this.preview!.width, this.preview!.height);
    });
    const summary = this.root?.querySelector('.mirror-summary');
    if (summary) {
      summary.textContent = `${patternLabel(this.species, this.draft.patternId)} · ${BODY_BUILD_LABELS[this.draft.build]}`;
    }
  }

  close(): void {
    this.root?.remove();
    this.root = null;
    this.preview = null;
  }
}
