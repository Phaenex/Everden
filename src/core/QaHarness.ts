import type { GameBootstrap } from '@/core/GameBootstrap';

export interface EverdenQaState {
  sceneId: string;
  hour: number;
  day: number;
  species: string;
  gold: number;
  flags: string[];
  questStages: Record<string, string>;
  completedQuests: string[];
  npcIds: string[];
  player: { x: number; z: number };
  dialogueOpen: boolean;
  combatActive: boolean;
}

/** Browser-only QA API — installed when `?qa=1` is in the URL. */
export interface EverdenQa {
  ready: Promise<void>;
  loadScene(sceneId: string): Promise<void>;
  getState(): EverdenQaState;
  talkTo(npcId: string): void;
  completeExamine(target: string): void;
  startCombat(encounterId?: string): void;
  advanceHours(hours: number): void;
  setQuestStage(questId: string, stage: string): void;
  setFlag(key: string, value?: boolean): void;
  getNpcIds(): string[];
  getPlayerPosition(): { x: number; z: number };
  /** Screen-space (CSS px) position of the player and every spawned NPC in the
   *  current scene — for verifying no two actors visually overlap on screen,
   *  which the isometric camera can hide even when world-space distance looks fine. */
  getScreenLayout(): Record<string, { x: number; y: number }>;
  /** Ad-hoc probe — projects any world (x,z) to screen px without needing a spawned actor.
   *  Used to find non-overlapping NPC layout coordinates against the real camera math. */
  projectToScreen(x: number, z: number): { x: number; y: number };
  walkTo(x: number, z: number): boolean;
  save(): void;
  load(): boolean;
  clearSave(): void;
  closeDialogue(): void;
  clickDialogueChoice(textIncludes: string): boolean;
  combatAttack(targetId?: string): void;
  combatUseAbility(abilityId: string, targetId?: string): void;
  combatFlee(): void;
  combatDiplomacy(mode: 'persuade' | 'intimidate'): void;
  isDialogueOpen(): boolean;
  isCombatActive(): boolean;
  getDialogueText(): string;
  completeQuestOutcome(questId: string, outcomeId: string): boolean;
  npcWalkersIdle(): boolean;
}

declare global {
  interface Window {
    __everden?: EverdenQa;
  }
}

export function installQaHarness(bootstrap: GameBootstrap, ready: Promise<void>): EverdenQa {
  const api: EverdenQa = {
    ready,
    loadScene: (id) => bootstrap.qaLoadScene(id),
    getState: () => bootstrap.qaGetState(),
    talkTo: (id) => bootstrap.qaTalkTo(id),
    completeExamine: (t) => bootstrap.qaCompleteExamine(t),
    startCombat: (id) => bootstrap.qaStartCombat(id),
    advanceHours: (h) => bootstrap.qaAdvanceHours(h),
    setQuestStage: (q, s) => bootstrap.qaSetQuestStage(q, s),
    setFlag: (k, v) => bootstrap.qaSetFlag(k, v),
    getNpcIds: () => bootstrap.qaGetNpcIds(),
    getPlayerPosition: () => bootstrap.qaGetPlayerPosition(),
    getScreenLayout: () => bootstrap.qaGetScreenLayout(),
    projectToScreen: (x, z) => bootstrap.qaProjectToScreen(x, z),
    walkTo: (x, z) => bootstrap.qaWalkTo(x, z),
    save: () => bootstrap.qaSave(),
    load: () => bootstrap.qaLoad(),
    clearSave: () => bootstrap.qaClearSave(),
    closeDialogue: () => bootstrap.qaCloseDialogue(),
    clickDialogueChoice: (t) => bootstrap.qaClickDialogueChoice(t),
    combatAttack: (id) => bootstrap.qaCombatAttack(id),
    combatUseAbility: (a, id) => bootstrap.qaCombatUseAbility(a, id),
    combatFlee: () => bootstrap.qaCombatFlee(),
    combatDiplomacy: (m) => bootstrap.qaCombatDiplomacy(m),
    isDialogueOpen: () => bootstrap.qaIsDialogueOpen(),
    isCombatActive: () => bootstrap.qaIsCombatActive(),
    getDialogueText: () => bootstrap.qaGetDialogueText(),
    completeQuestOutcome: (q, o) => bootstrap.qaCompleteQuestOutcome(q, o),
    npcWalkersIdle: () => bootstrap.qaNpcWalkersIdle(),
  };
  window.__everden = api;
  return api;
}
