import type { AbilityDefinition, SpeciesDefinition } from '@/data/types';
import type { CreatorSettings } from '@/gameplay/CreatorSettings';
import { defaultCreatorSettings } from '@/gameplay/CreatorSettings';
import { applyRacial } from '@/gameplay/PointBuy';
import { abilityModifier } from '@/gameplay/OpeningNarration';
import type { CreatorGuide } from './CreatorGuide';
import type { CreatorState } from './types';
import { abilityTypeLabel, appendInfoBox, appendSectionTitle } from './CreatorInfo';
import { button, el } from './domUtils';

export interface KitPanelDeps {
  state: CreatorState;
  speciesDef: SpeciesDefinition | undefined;
  abilities: AbilityDefinition[];
  guide: CreatorGuide;
}

export function renderKitPanel(panel: HTMLElement, deps: KitPanelDeps): void {
  const { speciesDef, abilities, guide } = deps;
  appendInfoBox(panel, guide.tabs.kit ?? '');
  if (!speciesDef) return;

  const header = el('div', 'kit-header');
  header.append(
    el(
      'p',
      'kit-role',
      `${speciesDef.selectRole ?? speciesDef.role} · AC ${speciesDef.combat.ac} · Init ${speciesDef.combat.initiativeMod >= 0 ? '+' : ''}${speciesDef.combat.initiativeMod}`,
    ),
  );
  panel.append(header);

  const list = el('div', 'kit-ability-list');
  for (const abId of speciesDef.combat.abilities) {
    const def = abilities.find((a) => a.id === abId);
    const card = el('div', 'kit-ability-card');
    const titleRow = el('div', 'kit-ability-title');
    titleRow.append(el('span', 'kit-ability-name', def?.name ?? abId));
    titleRow.append(el('span', 'kit-ability-type', abilityTypeLabel(def?.type ?? 'utility')));
    card.append(titleRow);
    card.append(el('p', 'kit-ability-desc', def?.description ?? ''));
    const meta: string[] = [];
    if (def?.damage) meta.push(`Damage/heal: ${def.damage}`);
    if (def?.saveDc) meta.push(`Save DC ${def.saveDc} ${def.saveStat?.toUpperCase() ?? ''}`);
    if (def?.gameHint) meta.push(def.gameHint);
    if (meta.length) card.append(el('p', 'kit-ability-hint', meta.join(' · ')));
    list.append(card);
  }
  panel.append(list);
  appendInfoBox(
    panel,
    'In combat: ability buttons appear on your turn. Basic Attack uses your STR or DEX modifier.',
    'note',
  );
}

export interface SkillsPanelDeps {
  state: CreatorState;
  speciesDef: SpeciesDefinition | undefined;
  guide: CreatorGuide;
}

export function renderSkillsPanel(panel: HTMLElement, deps: SkillsPanelDeps): void {
  const { state, speciesDef, guide } = deps;
  appendInfoBox(panel, guide.tabs.skills ?? '');

  if (speciesDef) {
    const final = applyRacial(state.baseStats, speciesDef.racialBonuses);
    const modRow = el('div', 'skills-mod-row');
    modRow.append(el('span', 'skills-mod-line', 'Modifiers:'));
    const modGrid = el('div', 'skills-mod-grid');
    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
      const mod = abilityModifier(final[key]);
      modGrid.append(el('span', 'skills-mod-cell', `${key.toUpperCase()} ${mod >= 0 ? '+' : ''}${mod}`));
    }
    modRow.append(modGrid);
    panel.append(modRow);
  }

  const body = el('div', 'skills-body');
  const listCol = el('div', 'skills-col');
  appendSectionTitle(listCol, 'Skills in this slice');
  const list = el('ul', 'skills-reference-list');
  for (const skill of guide.skills) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = `${skill.name} (${skill.stat.toUpperCase()})`;
    li.append(strong, document.createTextNode(` — ${skill.inGame}`));
    list.append(li);
  }
  listCol.append(list);

  const statCol = el('div', 'skills-col');
  appendSectionTitle(statCol, 'What each stat affects');
  const statGrid = el('div', 'skills-stat-grid');
  for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
    const stat = guide.stats[key];
    const row = el('div', 'skills-stat-blurb');
    row.append(el('span', 'stat-key', stat.label));
    row.append(el('span', 'skills-stat-text', stat.inGame));
    statGrid.append(row);
  }
  statCol.append(statGrid);
  body.append(listCol, statCol);
  panel.append(body);
}

export interface SettingsPanelDeps {
  settings: CreatorSettings;
  guide: CreatorGuide;
  onChange: (settings: CreatorSettings) => void;
  onReset?: () => void;
}

export function renderSettingsPanel(panel: HTMLElement, deps: SettingsPanelDeps): void {
  const { guide, onChange } = deps;
  let settings = { ...deps.settings };
  appendInfoBox(panel, guide.tabs.settings ?? '');

  const toggles = el('div', 'settings-list');
  for (const key of ['skipOpeningNarration', 'showControlHints'] as const) {
    const meta = guide.settings[key];
    if (!meta) continue;
    const row = el('label', 'settings-row');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = settings[key];
    input.addEventListener('change', () => {
      settings = { ...settings, [key]: input.checked };
      onChange(settings);
    });
    const text = el('div', 'settings-text');
    text.append(el('span', 'settings-label', meta.label));
    text.append(el('span', 'settings-desc', meta.description));
    row.append(input, text);
    toggles.append(row);
  }
  panel.append(toggles);

  const reset = button('Reset to defaults', () => {
    if (deps.onReset) {
      deps.onReset();
      return;
    }
    onChange(defaultCreatorSettings());
  });
  reset.classList.add('title-secondary');
  panel.append(reset);
}
