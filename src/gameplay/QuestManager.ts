import type { EventBus } from '@/core/EventBus';
import type { ISaveable } from '@/core/IGameModule';
import type { DataRegistry } from '@/data/DataRegistry';
import type { WorldState } from '@/simulation/WorldState';
import type { QuestDefinition } from '@/data/types';

export interface QuestManagerState {
  activeStage: Record<string, string>;
  completed: string[];
  chosenOutcomes: Record<string, string>;
}

/**
 * Quest progression driven by objectives and world flags.
 */
export class QuestManager implements ISaveable {
  readonly saveKey = 'questManager';
  private activeStage = new Map<string, string>();
  private completed = new Set<string>();
  private chosenOutcomes: Record<string, string> = {};

  constructor(
    private eventBus: EventBus,
    private data: DataRegistry,
    private worldState: WorldState,
  ) {}

  init(): void {
    this.eventBus.on<{ type: string; target: string }>('objective:complete', (obj) => {
      this.checkObjectives(obj.type, obj.target);
    });
    this.eventBus.on<{ key: string }>('world:flag', () => {
      this.checkAllActive();
    });
  }

  startQuest(questId: string): void {
    const quest = this.data.getById<QuestDefinition>('quests', questId);
    if (!quest || this.completed.has(questId) || this.activeStage.has(questId)) return;
    const first = quest.stages[0];
    if (!first) return;
    this.activeStage.set(questId, first.id);
    this.eventBus.emit('quest:started', { questId, stage: first.id });
    this.emitStage(questId, first.id);
  }

  getActiveStage(questId: string): string | undefined {
    return this.activeStage.get(questId);
  }

  /** Dev/test — jump to a stage without objective checks. */
  forceStage(questId: string, stageId: string): void {
    const quest = this.data.getById<QuestDefinition>('quests', questId);
    if (!quest?.stages.some((s) => s.id === stageId)) return;
    if (!this.activeStage.has(questId)) this.startQuest(questId);
    this.activeStage.set(questId, stageId);
    this.emitStage(questId, stageId);
  }

  /** Looks up the human-readable quest title + stage description so the HUD never shows raw ids. */
  private emitStage(questId: string, stageId: string): void {
    const quest = this.data.getById<QuestDefinition>('quests', questId);
    const stage = quest?.stages.find((s) => s.id === stageId);
    this.eventBus.emit('quest:stage', {
      questId,
      stage: stageId,
      title: quest?.title ?? questId,
      stageDescription: stage?.description ?? stageId,
    });
  }

  isCompleted(questId: string): boolean {
    return this.completed.has(questId);
  }

  getChosenOutcome(questId: string): string | undefined {
    return this.chosenOutcomes[questId];
  }

  completeObjective(type: string, target: string): void {
    this.eventBus.emit('objective:complete', { type, target });
  }

  /** Player-facing council vote and other branching endings. */
  completeWithOutcome(questId: string, outcomeId: string): boolean {
    const quest = this.data.getById<QuestDefinition>('quests', questId);
    if (!quest || !this.activeStage.has(questId)) return false;

    const outcome = quest.outcomes?.[outcomeId];
    if (!outcome) return false;

    this.chosenOutcomes[questId] = outcomeId;

    if (outcome.flags) {
      for (const [k, v] of Object.entries(outcome.flags)) {
        this.worldState.setFlag(k, v);
      }
    }
    if (outcome.reputation) {
      for (const [f, n] of Object.entries(outcome.reputation)) {
        this.worldState.addReputation(f, n);
      }
    }

    const gold = outcome.gold ?? 0;
    this.finishQuest(quest, gold);
    this.eventBus.emit('quest:outcome', {
      questId,
      outcomeId,
      description: outcome.description ?? outcomeId,
    });
    return true;
  }

  private checkAllActive(): void {
    for (const [questId, stageId] of this.activeStage) {
      this.evaluateStage(questId, stageId);
    }
  }

  private checkObjectives(type: string, target: string): void {
    for (const [questId, stageId] of this.activeStage) {
      const quest = this.data.getById<QuestDefinition>('quests', questId);
      const stage = quest?.stages.find((s) => s.id === stageId);
      if (!stage) continue;
      const match = stage.objectives.some((o) => o.type === type && o.target === target);
      if (match) this.advance(questId, quest!, stage);
    }
  }

  private evaluateStage(questId: string, stageId: string): void {
    const quest = this.data.getById<QuestDefinition>('quests', questId);
    const stage = quest?.stages.find((s) => s.id === stageId);
    if (!quest || !stage) return;
    // council stages wait for completeWithOutcome — never auto-advance on flags
    if (stageId === 'council' || stage.objectives.some((o) => o.type === 'council_choice')) {
      return;
    }
    const flagsDone = stage.objectives
      .filter((o) => o.type === 'flag')
      .every((o) => this.worldState.hasFlag(o.target, true));
    if (flagsDone && stage.objectives.some((o) => o.type === 'flag')) {
      this.advance(questId, quest, stage);
    }
  }

  private advance(questId: string, quest: QuestDefinition, stage: QuestDefinition['stages'][0]): void {
    if (stage.next) {
      this.activeStage.set(questId, stage.next);
      this.emitStage(questId, stage.next);
      if (stage.next === 'council') {
        this.eventBus.emit('quest:council_ready', { questId });
      }
    } else if (!stage.objectives.some((o) => o.type === 'council_choice')) {
      this.finishQuest(quest, quest.rewards.gold ?? 0);
    }
  }

  private finishQuest(quest: QuestDefinition, bonusGold: number): void {
    const questId = quest.id;
    this.activeStage.delete(questId);
    this.completed.add(questId);

    const useDefaultRewards = !quest.outcomes || this.chosenOutcomes[questId] === undefined;
    if (quest.rewards.flags && useDefaultRewards) {
      for (const [k, v] of Object.entries(quest.rewards.flags)) {
        this.worldState.setFlag(k, v);
      }
    }
    if (quest.rewards.reputation && useDefaultRewards) {
      for (const [f, n] of Object.entries(quest.rewards.reputation)) {
        this.worldState.addReputation(f, n);
      }
    }

    const gold = useDefaultRewards ? (quest.rewards.gold ?? 0) + bonusGold : bonusGold;
    this.eventBus.emit('quest:completed', { questId, gold });
  }

  serialize(): QuestManagerState {
    return {
      activeStage: Object.fromEntries(this.activeStage),
      completed: [...this.completed],
      chosenOutcomes: { ...this.chosenOutcomes },
    };
  }

  deserialize(data: unknown): void {
    const state = data as QuestManagerState;
    this.activeStage = new Map(Object.entries(state.activeStage ?? {}));
    this.completed = new Set(state.completed ?? []);
    this.chosenOutcomes = { ...(state.chosenOutcomes ?? {}) };
    for (const [questId, stage] of this.activeStage) {
      this.emitStage(questId, stage);
    }
  }
}
