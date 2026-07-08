import type { DialogueChoice, DialogueNode } from '@/data/types';

export interface DialogueConditionContext {
  hasFlag: (key: string, value?: unknown) => boolean;
  getQuestStage: (questId: string) => string | undefined;
  isQuestCompleted: (questId: string) => boolean;
  species?: string;
  motivation?: string;
  getReputation?: (faction: string) => number;
}

/** Returns true when a choice has no condition or all conditions pass. */
export function meetsDialogueCondition(
  condition: DialogueChoice['condition'],
  ctx: DialogueConditionContext,
): boolean {
  if (!condition) return true;

  if (condition.flag !== undefined) {
    const expected = condition.value ?? true;
    if (!ctx.hasFlag(condition.flag, expected)) return false;
  }

  if (condition.questStage) {
    const stage = ctx.getQuestStage(condition.questStage.quest);
    if (stage !== condition.questStage.stage) return false;
  }

  if (condition.notQuestCompleted) {
    if (ctx.isQuestCompleted(condition.notQuestCompleted)) return false;
  }

  if (condition.species && ctx.species !== condition.species) {
    return false;
  }

  if (condition.motivation && ctx.motivation !== condition.motivation) {
    return false;
  }

  if (condition.minReputation) {
    const rep = ctx.getReputation?.(condition.minReputation.faction) ?? 0;
    if (rep < condition.minReputation.min) return false;
  }

  return true;
}

export function filterDialogueChoices(
  choices: DialogueChoice[] | undefined,
  ctx: DialogueConditionContext,
): DialogueChoice[] | undefined {
  if (!choices) return undefined;
  const filtered = choices.filter((c) => meetsDialogueCondition(c.condition, ctx));
  return filtered.length > 0 ? filtered : undefined;
}

/** Apply flag-based alt text / append lines for NPC memory callbacks. */
export function resolveDialogueText(
  node: DialogueNode,
  hasFlag: (key: string, value?: unknown) => boolean,
): string {
  let text = node.text;
  for (const alt of node.altText ?? []) {
    if (!hasFlag(alt.flag, alt.value ?? true)) continue;
    if (alt.text) text = alt.text;
    if (alt.append) text = `${text} ${alt.append}`;
  }
  return text;
}
