import { describe, it, expect } from 'vitest';
import { meetsDialogueCondition, filterDialogueChoices, resolveDialogueText } from '@/gameplay/DialogueConditions';

describe('DialogueConditions', () => {
  const ctx = {
    hasFlag: (key: string, value?: unknown) => key === 'evidence_gathered' && value === true,
    getQuestStage: (quest: string) => (quest === 'ferry_toll_dispute' ? 'report' : undefined),
    isQuestCompleted: (quest: string) => quest === 'done_quest',
    species: 'frog',
    getReputation: (faction: string) => (faction === 'lilymarket' ? 5 : 0),
  };

  it('filters choices by quest stage', () => {
    const choices = [
      { text: 'Report', next: 'report', condition: { questStage: { quest: 'ferry_toll_dispute', stage: 'report' } } },
      { text: 'Other', next: 'other' },
    ];
    const filtered = filterDialogueChoices(choices, ctx);
    expect(filtered?.map((c) => c.next)).toEqual(['report', 'other']);
  });

  it('hides choices when quest already completed', () => {
    expect(
      meetsDialogueCondition({ notQuestCompleted: 'ferry_toll_dispute' }, ctx),
    ).toBe(true);
    expect(
      meetsDialogueCondition(
        { notQuestCompleted: 'done_quest' },
        { ...ctx, isQuestCompleted: () => true },
      ),
    ).toBe(false);
  });

  it('filters by species', () => {
    expect(meetsDialogueCondition({ species: 'frog' }, ctx)).toBe(true);
    expect(meetsDialogueCondition({ species: 'toad' }, ctx)).toBe(false);
  });

  it('filters by motivation', () => {
    expect(meetsDialogueCondition({ motivation: 'investigator' }, { ...ctx, motivation: 'investigator' })).toBe(
      true,
    );
    expect(meetsDialogueCondition({ motivation: 'messenger' }, { ...ctx, motivation: 'investigator' })).toBe(
      false,
    );
  });

  it('filters by min reputation', () => {
    expect(meetsDialogueCondition({ minReputation: { faction: 'lilymarket', min: 3 } }, ctx)).toBe(true);
    expect(meetsDialogueCondition({ minReputation: { faction: 'lilymarket', min: 10 } }, ctx)).toBe(false);
  });

  it('appends alt text when flag is set', () => {
    const node = {
      id: 'start',
      speaker: 'Pip',
      text: 'Hello.',
      altText: [{ flag: 'evidence_gathered', append: 'You proved it.' }],
    };
    const text = resolveDialogueText(node, ctx.hasFlag);
    expect(text).toContain('You proved it.');
  });
});
