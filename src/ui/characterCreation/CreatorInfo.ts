import { el } from './domUtils';

export function appendInfoBox(parent: HTMLElement, text: string, variant: 'info' | 'note' = 'info'): void {
  const box = el('p', variant === 'note' ? 'creator-note' : 'creator-info-box', text);
  parent.append(box);
}

export function appendSectionTitle(parent: HTMLElement, text: string): void {
  parent.append(el('p', 'select-label', text));
}

export function abilityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    attack: 'Attack',
    defense: 'Defense',
    utility: 'Utility',
    debuff: 'Debuff',
    heal: 'Heal',
  };
  return labels[type] ?? type;
}
