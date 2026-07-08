import { describe, it, expect } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { DataRegistry } from '@/data/DataRegistry';
import { WorldState } from '@/simulation/WorldState';
import { QuestManager } from '@/gameplay/QuestManager';

const questData = {
  quests: [
    {
      id: 'main',
      title: 'Main',
      description: 'Test',
      stages: [
        { id: 'a', description: 'A', objectives: [{ type: 'examine', target: 'site' }], next: 'council' },
        {
          id: 'council',
          description: 'Vote',
          objectives: [{ type: 'council_choice', target: 'vote' }],
        },
      ],
      rewards: { gold: 0 },
      outcomes: {
        expose: {
          description: 'Exposed',
          flags: { done: true },
          gold: 25,
        },
      },
    },
    {
      id: 'side',
      title: 'Side',
      description: 'Side',
      stages: [
        { id: 'talk_a', description: 'Talk', objectives: [{ type: 'talk', target: 'npc_a' }] },
      ],
      rewards: { gold: 10, flags: { side_done: true } },
    },
  ],
};

describe('QuestManager', () => {
  it('does not reset an already-active quest on startQuest', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject(questData);
    const world = new WorldState(bus);
    const qm = new QuestManager(bus, data, world);
    qm.init();

    qm.startQuest('main');
    qm.completeObjective('examine', 'site');
    expect(qm.getActiveStage('main')).toBe('council');

    qm.startQuest('main');
    expect(qm.getActiveStage('main')).toBe('council');
  });

  it('completes council outcomes with gold and flags', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject(questData);
    const world = new WorldState(bus);
    const qm = new QuestManager(bus, data, world);
    qm.init();

    qm.startQuest('main');
    qm.completeObjective('examine', 'site');

    let completedGold = 0;
    bus.on<{ gold?: number }>('quest:completed', (p) => {
      completedGold = p.gold ?? 0;
    });

    expect(qm.completeWithOutcome('main', 'expose')).toBe(true);
    expect(qm.isCompleted('main')).toBe(true);
    expect(qm.getChosenOutcome('main')).toBe('expose');
    expect(world.hasFlag('done', true)).toBe(true);
    expect(completedGold).toBe(25);
  });

  it('restores active stages after deserialize', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject(questData);
    const world = new WorldState(bus);
    const qm = new QuestManager(bus, data, world);
    qm.init();

    qm.startQuest('side');
    const snapshot = qm.serialize();

    const qm2 = new QuestManager(bus, data, world);
    qm2.init();
    qm2.deserialize(snapshot);

    expect(qm2.getActiveStage('side')).toBe('talk_a');
  });

  it('advances through full examine chain to council', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      quests: [
        {
          id: 'what_water_remembers',
          title: 'Main',
          description: 'Test',
          stages: [
            { id: 'cellar', description: 'A', objectives: [{ type: 'examine', target: 'flooded_cellar' }], next: 'mason_measure' },
            { id: 'mason_measure', description: 'B', objectives: [{ type: 'examine', target: 'levy_plans' }], next: 'chapel' },
            { id: 'chapel', description: 'C', objectives: [{ type: 'examine', target: 'chapel_mural' }], next: 'ferry' },
            { id: 'ferry', description: 'D', objectives: [{ type: 'examine', target: 'ferry_depth' }], next: 'council' },
            { id: 'council', description: 'Vote', objectives: [{ type: 'council_choice', target: 'vote' }] },
          ],
          rewards: { gold: 0 },
          outcomes: { expose: { description: 'Done', gold: 10 } },
        },
      ],
    });
    const world = new WorldState(bus);
    const qm = new QuestManager(bus, data, world);
    qm.init();
    qm.startQuest('what_water_remembers');

    for (const target of ['flooded_cellar', 'levy_plans', 'chapel_mural', 'ferry_depth']) {
      qm.completeObjective('examine', target);
    }
    expect(qm.getActiveStage('what_water_remembers')).toBe('council');
    expect(qm.completeWithOutcome('what_water_remembers', 'expose')).toBe(true);
    expect(qm.isCompleted('what_water_remembers')).toBe(true);
  });

  it('quest:stage events carry the human-readable title + stage description, not just raw ids (regression: HUD showed "Quest: what_water_remembers — cellar" instead of "What the Water Remembers: Examine the flooded cellar...")', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject(questData);
    const world = new WorldState(bus);
    const qm = new QuestManager(bus, data, world);
    qm.init();

    const stages: { questId: string; stage: string; title?: string; stageDescription?: string }[] = [];
    bus.on<{ questId: string; stage: string; title?: string; stageDescription?: string }>('quest:stage', (p) =>
      stages.push(p),
    );

    qm.startQuest('main');
    expect(stages).toHaveLength(1);
    expect(stages[0]).toMatchObject({ questId: 'main', stage: 'a', title: 'Main', stageDescription: 'A' });

    qm.completeObjective('examine', 'site');
    expect(stages).toHaveLength(2);
    expect(stages[1]).toMatchObject({ questId: 'main', stage: 'council', title: 'Main', stageDescription: 'Vote' });
  });

  it('completes pondwort wrong tonic chain', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      quests: [
        {
          id: 'pondwort_wrong_tonic',
          title: 'Wrong Label',
          description: 'Fix tonic labels',
          stages: [
            { id: 'labels', description: 'Labels', objectives: [{ type: 'examine', target: 'marta_label_shelf' }], next: 'marta' },
            { id: 'marta', description: 'Marta', objectives: [{ type: 'talk', target: 'marta_clayhollow' }], next: 'pondwort' },
            { id: 'pondwort', description: 'Pondwort', objectives: [{ type: 'talk', target: 'pondwort' }] },
          ],
          rewards: { gold: 20, flags: { tonic_mix_fixed: true } },
        },
      ],
    });
    const world = new WorldState(bus);
    const qm = new QuestManager(bus, data, world);
    qm.init();
    qm.startQuest('pondwort_wrong_tonic');

    qm.completeObjective('examine', 'marta_label_shelf');
    expect(qm.getActiveStage('pondwort_wrong_tonic')).toBe('marta');

    qm.completeObjective('talk', 'marta_clayhollow');
    expect(qm.getActiveStage('pondwort_wrong_tonic')).toBe('pondwort');

    qm.completeObjective('talk', 'pondwort');
    expect(qm.isCompleted('pondwort_wrong_tonic')).toBe(true);
  });
});
