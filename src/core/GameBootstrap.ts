import { EventBus } from '@/core/EventBus';
import { SaveSystem } from '@/core/SaveSystem';
import { GameLoop } from '@/core/GameLoop';
import { DataRegistry } from '@/data/DataRegistry';
import { WorldState } from '@/simulation/WorldState';
import { WorldClock } from '@/simulation/WorldClock';
import { TickScheduler } from '@/simulation/TickScheduler';
import { NPCSimulator } from '@/simulation/NPCSimulator';
import { EconomySimulator } from '@/simulation/EconomySimulator';
import { WeatherSimulator } from '@/simulation/WeatherSimulator';
import { PlayerController, type InteractableTarget } from '@/gameplay/PlayerController';
import { NavigationController } from '@/engine/NavigationController';
import { QuestManager } from '@/gameplay/QuestManager';
import { Inventory } from '@/gameplay/Inventory';
import { CombatManager } from '@/gameplay/CombatManager';
import { JournalManager } from '@/gameplay/JournalManager';
import { IsometricCamera } from '@/presentation/IsometricCamera';
import { SceneManager } from '@/presentation/SceneManager';
import { RainVFX } from '@/presentation/RainVFX';
import { AudioManager } from '@/presentation/AudioManager';
import { createCharacterActor } from '@/presentation/SpriteActor';
import { buildSceneGraphics, fetchSceneDefinition, SceneState } from '@/presentation/SceneLoader';
import { UIManager } from '@/ui/UIManager';
import type { DialogueTree, NPCDefinition, WorldObjectDefinition, ItemDefinition } from '@/data/types';
import type { SceneDefinition } from '@/data/sceneTypes';
import { PlayerProfile, applyMotivationFlags } from '@/gameplay/PlayerProfile';
import { getOpeningNarrationLines } from '@/gameplay/OpeningNarration';
import type { GameStartRequest } from '@/ui/TitleScreen';
import { filterDialogueChoices, resolveDialogueText } from '@/gameplay/DialogueConditions';
import { SkillCheckResolver } from '@/gameplay/SkillCheckResolver';
import { npcPresentInScene } from '@/gameplay/NpcPresence';
import { DevMenu } from '@/ui/DevMenu';
import { installQaHarness, type EverdenQaState } from '@/core/QaHarness';
import * as THREE from 'three';

/** Central bootstrap — wires all modules and starts the game loop. */
export class GameBootstrap {
  private eventBus = new EventBus();
  private data = new DataRegistry();
  private save = new SaveSystem();
  private worldState = new WorldState(this.eventBus);
  private loop = new GameLoop();
  private worldClock!: WorldClock;
  private navigation!: NavigationController;
  private player!: PlayerController;
  private sceneManager!: SceneManager;
  private questManager!: QuestManager;
  private combatManager!: CombatManager;
  private inventory!: Inventory;
  private ui!: UIManager;
  private weather!: WeatherSimulator;
  private journal!: JournalManager;
  private rainVfx!: RainVFX;
  private playerProfile = new PlayerProfile();
  private skillChecks = new SkillCheckResolver();
  private audio = new AudioManager();
  private sceneState = new SceneState();
  private playerSpecies = 'frog';
  private started = false;
  private npcMap = new Map<string, NPCDefinition>();
  private currentSpec: SceneDefinition | null = null;

  async start(canvas: HTMLCanvasElement, request: GameStartRequest = { mode: 'new', species: 'frog', name: 'Traveler', motivation: 'investigator' }): Promise<void> {
    if (this.started) return;
    this.started = true;

    let playerSpecies = request.mode === 'new' ? request.species : 'frog';

    this.audio.unlock();
    this.audio.bindEvents(this.eventBus);

    await this.data.loadAll();

    this.worldClock = new WorldClock(this.eventBus);
    const tickScheduler = new TickScheduler(this.eventBus);
    tickScheduler.init();
    const npcSim = new NPCSimulator(this.eventBus, this.data);
    const economy = new EconomySimulator(this.eventBus, this.data);
    this.weather = new WeatherSimulator(this.eventBus, this.data);
    this.journal = new JournalManager(this.eventBus, this.data);
    this.inventory = new Inventory(this.eventBus, (id) => this.data.getById('items', id));
    this.questManager = new QuestManager(this.eventBus, this.data, this.worldState);
    this.combatManager = new CombatManager(
      this.eventBus,
      this.data,
      this.inventory,
      () => this.weather.weather,
    );

    this.save.register(this.worldState);
    this.save.register(this.worldClock);
    this.save.register(npcSim);
    this.save.register(economy);
    this.save.register(this.questManager);
    this.save.register(this.inventory);
    this.save.register(this.playerProfile);
    this.save.register(this.weather);
    this.save.register(this.journal);
    this.save.register(this.sceneState);

    this.worldClock.init();
    npcSim.init();
    economy.init();
    this.questManager.init();
    this.weather.init();
    this.journal.init();

    const camera = new IsometricCamera(window.innerWidth, window.innerHeight);
    this.sceneManager = new SceneManager(this.eventBus, canvas, camera);
    this.sceneManager.init();

    this.navigation = new NavigationController(this.eventBus);
    this.navigation.init();

    this.player = new PlayerController(this.eventBus);

    this.rainVfx = new RainVFX(this.eventBus, this.sceneManager.scene);
    this.rainVfx.init();

    const isNewGame = request.mode === 'new';
    if (isNewGame) {
      this.playerProfile.species = request.species;
      this.playerProfile.name = request.name.trim() || 'Traveler';
      this.playerProfile.motivation = request.motivation;
      playerSpecies = request.species;
      this.playerSpecies = playerSpecies;
    } else {
      this.save.load();
      playerSpecies = this.playerProfile.species;
      this.playerSpecies = playerSpecies;
    }

    const playerActor = createCharacterActor(playerSpecies, this.playerProfile.name, 0);
    this.sceneManager.setPlayerActor(playerActor.group);

    this.ui = new UIManager(this.eventBus);
    this.ui.init();
    this.ui.bindJournal(() => this.journal.getEntries());
    this.ui.bindAudioToggle(
      () => this.audio.isMuted(),
      () => this.audio.toggleMute(),
    );
    this.ui.bindCombatActions(
      () => {
        const p = this.combatManager.getPlayer();
        if (!p) return [];
        return this.combatManager
          .getAbilityIds(p.speciesId)
          .map((id) => {
            const def = this.data.get('abilities').find((a) => a.id === id);
            return { id, name: def?.name ?? id.replace(/_/g, ' ') };
          });
      },
      () => this.combatManager.getEnemies().map((e) => ({ id: e.id, name: e.name })),
      (targetId) => this.combatManager.attack(targetId),
      (abilityId, targetId) => this.combatManager.useAbility(abilityId, targetId),
      () => this.combatManager.flee(),
      () => this.combatManager.canDiplomacy(),
      (mode) => this.combatManager.attemptDiplomacy(mode, this.playerSpecies),
    );

    this.player.bind({
      navigation: this.navigation,
      sceneManager: this.sceneManager,
      canvas,
      onPickFailed: () => this.ui.showToast("Can't walk there."),
    });
    this.player.init();
    this.setupNpcLabelPolicy();
    this.setupInteractionHandlers();

    this.eventBus.on('game:save', () => this.save.save());
    this.eventBus.on<{ paused: boolean }>('game:pause', ({ paused }) => {
      if (paused) this.loop.stop();
      else this.loop.start();
    });
    this.eventBus.on<{ gold?: number }>('quest:completed', ({ gold }) => {
      if (gold) this.inventory.gold += gold;
    });
    this.eventBus.on<{ weather: string }>('weather:changed', () => {
      this.player.setMoveModifier(this.weather.getMovementModifier(this.playerSpecies));
    });

    if (isNewGame) {
      applyMotivationFlags(this.playerProfile.motivation, (key, value) =>
        this.worldState.setFlag(key, value),
      );
      this.questManager.startQuest('what_water_remembers');
      this.inventory.addItem('reed_hop_charm');
      this.inventory.equip('reed_hop_charm');
    } else if (
      !this.questManager.getActiveStage('what_water_remembers') &&
      !this.questManager.isCompleted('what_water_remembers')
    ) {
      this.questManager.startQuest('what_water_remembers');
    }

    this.loop.addModule(this.worldClock);
    this.loop.addModule(this.navigation);
    this.loop.addModule(this.player);
    this.loop.addModule(this.sceneManager);
    this.loop.addModule(this.rainVfx);
    this.loop.addModule(this.combatManager);
    this.loop.start();

    this.player.setMoveModifier(this.weather.getMovementModifier(playerSpecies));

    const sceneId = isNewGame ? 'causeway' : this.sceneState.currentSceneId;
    await this.loadScene(sceneId);

    this.audio.startAmbient();
    this.eventBus.emit('game:ready', { species: playerSpecies });

    // New-game opening beat — establishes premise + a nudge toward Lilymarket before the
    // player is set loose on an otherwise-silent Causeway. Skipped in QA mode (`?qa=1`) so
    // e2e mechanical gates stay deterministic and don't need to dismiss a narrative panel
    // they have no reason to know about.
    if (isNewGame && !new URLSearchParams(window.location.search).has('qa')) {
      this.ui.showNarration(
        getOpeningNarrationLines(this.playerProfile.species, this.playerProfile.motivation),
        () => {
          this.ui.showToast('Equipped: Reed Hop Charm — +1 attack', 3500);
          setTimeout(
            () => this.ui.showToast('Click to move · [E] to interact · [J] for journal', 6000),
            3600,
          );
        },
      );
    }

    this.setupDevMenu();
    this.eventBus.on<{ hour: number }>('time:hour', () => {
      void this.refreshNpcPresence();
    });

    if (new URLSearchParams(window.location.search).has('qa')) {
      installQaHarness(this, Promise.resolve());
    }
  }

  /** QA harness — scene jump without walking through exits. */
  qaLoadScene(sceneId: string): Promise<void> {
    return this.loadScene(sceneId);
  }

  qaGetState(): EverdenQaState {
    const flags: string[] = [];
    for (const key of [
      'evidence_gathered',
      'examined_flooded_cellar',
      'examined_levy_plans',
      'examined_chapel_mural',
      'examined_ferry_depth',
      'kess_stopped',
      'levy_supported',
      'council_vote_done',
    ]) {
      if (this.worldState.hasFlag(key)) flags.push(key);
    }
    const questStages: Record<string, string> = {};
    for (const q of ['what_water_remembers', 'ferry_toll_dispute', 'pondwort_wrong_tonic']) {
      const stage = this.questManager.getActiveStage(q);
      if (stage) questStages[q] = stage;
    }
    const completedQuests = ['what_water_remembers', 'ferry_toll_dispute', 'pondwort_wrong_tonic'].filter((q) =>
      this.questManager.isCompleted(q),
    );
    return {
      sceneId: this.sceneState.currentSceneId,
      hour: this.worldClock.hour,
      day: this.worldClock.day,
      species: this.playerSpecies,
      gold: this.inventory.gold,
      flags,
      questStages,
      completedQuests,
      npcIds: [...this.npcMap.keys()],
      player: { x: this.navigation.position.x, z: this.navigation.position.z },
      dialogueOpen: this.qaIsDialogueOpen(),
      combatActive: this.combatManager.isActive(),
    };
  }

  qaTalkTo(npcId: string): void {
    const npc = this.npcMap.get(npcId) ?? this.data.getById<NPCDefinition>('npcs', npcId);
    if (!npc) return;
    this.onNpcTalk(npcId, npc.dialogueId, npc.species, npc.title);
  }

  qaCompleteExamine(target: string): void {
    this.onExamine({ target });
  }

  qaStartCombat(encounterId = 'blackfen_poachers'): void {
    this.combatManager.startEncounter(encounterId, this.playerSpecies);
  }

  qaAdvanceHours(hours: number): void {
    this.worldClock.advanceHours(hours);
    void this.refreshNpcPresence();
  }

  qaSetQuestStage(questId: string, stage: string): void {
    this.questManager.forceStage(questId, stage);
  }

  qaSetFlag(key: string, value = true): void {
    this.worldState.setFlag(key, value);
  }

  qaGetNpcIds(): string[] {
    return [...this.npcMap.keys()];
  }

  qaGetPlayerPosition(): { x: number; z: number } {
    return { x: this.navigation.position.x, z: this.navigation.position.z };
  }

  qaProjectToScreen(x: number, z: number): { x: number; y: number } {
    return this.sceneManager.projectToScreen(x, z);
  }

  qaGetScreenLayout(): Record<string, { x: number; y: number }> {
    const out: Record<string, { x: number; y: number }> = {};
    const player = this.sceneManager.getPlayerWorldPosition();
    if (player) out.player = this.sceneManager.projectToScreen(player.x, player.z);
    for (const id of this.npcMap.keys()) {
      const pos = this.sceneManager.getActorWorldPosition(id);
      if (pos) out[id] = this.sceneManager.projectToScreen(pos.x, pos.z);
    }
    return out;
  }

  qaWalkTo(x: number, z: number): boolean {
    return this.navigation.walkTo({ x, z });
  }

  qaSave(): void {
    this.save.save();
  }

  qaLoad(): boolean {
    return this.save.load();
  }

  qaClearSave(): void {
    this.save.clear();
  }

  qaCloseDialogue(): void {
    this.ui.hideDialogue();
  }

  qaClickDialogueChoice(textIncludes: string): boolean {
    const panel = document.querySelector('.dialogue-panel:not(.hidden)');
    if (!panel) return false;
    const buttons = panel.querySelectorAll<HTMLButtonElement>('.dialogue-choices button');
    const needle = textIncludes.toLowerCase();
    for (const btn of buttons) {
      if (btn.textContent?.toLowerCase().includes(needle)) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  qaCombatUseAbility(abilityId: string, targetId?: string): void {
    const enemy = targetId ?? this.combatManager.getEnemies()[0]?.id;
    if (enemy) this.combatManager.useAbility(abilityId, enemy);
  }

  qaCompleteQuestOutcome(questId: string, outcomeId: string): boolean {
    return this.questManager.completeWithOutcome(questId, outcomeId);
  }

  qaCombatAttack(targetId?: string): void {
    const enemy = targetId ?? this.combatManager.getEnemies()[0]?.id;
    if (enemy) this.combatManager.attack(enemy);
  }

  qaCombatFlee(): void {
    this.combatManager.flee();
  }

  qaCombatDiplomacy(mode: 'persuade' | 'intimidate'): void {
    this.combatManager.attemptDiplomacy(mode, this.playerSpecies);
  }

  qaIsDialogueOpen(): boolean {
    const panel = document.querySelector('.dialogue-panel');
    return !!panel && !panel.classList.contains('hidden');
  }

  qaIsCombatActive(): boolean {
    return this.combatManager.isActive();
  }

  qaGetDialogueText(): string {
    const el = document.querySelector('.dialogue-text');
    return el?.textContent?.trim() ?? '';
  }

  private setupDevMenu(): void {
    new DevMenu(document.getElementById('ui-root')!, {
      getSceneId: () => this.sceneState.currentSceneId,
      getHour: () => this.worldClock.hour,
      getDay: () => this.worldClock.day,
      jumpScene: (sceneId) => void this.loadScene(sceneId),
      advanceHours: (hours) => {
        this.worldClock.advanceHours(hours);
        void this.refreshNpcPresence();
      },
      startCombat: (encounterId = 'blackfen_poachers') => {
        this.combatManager.startEncounter(encounterId, this.playerSpecies);
      },
      setQuestStage: (questId, stage) => this.questManager.forceStage(questId, stage),
      setFlag: (key) => this.worldState.setFlag(key, true),
      completeExamine: (target) => this.onExamine({ target }),
      addGold: (amount) => {
        this.inventory.gold += amount;
        this.ui.showToast(`+${amount} gold`);
      },
      onToggle: (open) => {
        if (open) this.loop.stop();
        else this.loop.start();
      },
    });
  }

  private async loadScene(sceneId: string, spawnOverride?: { x: number; z: number }): Promise<void> {
    const spec = await fetchSceneDefinition(sceneId);
    this.currentSpec = spec;
    this.sceneState.currentSceneId = sceneId;

    this.sceneManager.clearSceneContent();
    const nav = buildSceneGraphics(spec, this.sceneManager.kernel, this.data.get('objects') as WorldObjectDefinition[]);
    this.navigation.setNavMesh(nav);
    this.sceneManager.lockCameraTo(spec.ground?.x ?? 0, spec.ground?.z ?? 0);

    this.spawnSceneNpcs(spec);

    this.player.clearInteractables();
    this.registerSceneInteractables(spec);

    const spawn = spawnOverride ?? spec.spawn;
    this.navigation.setPosition(spawn.x, spawn.z);
    this.ui.setDistrictName(spec.name);
  }

  private spawnSceneNpcs(spec: SceneDefinition): void {
    const hour = this.worldClock.hour;
    this.npcMap.clear();
    for (const slot of spec.npcs) {
      const npc = this.data.getById<NPCDefinition>('npcs', slot.id);
      if (!npc || !npcPresentInScene(npc, hour, spec.id)) continue;
      this.npcMap.set(npc.id, npc);
      const actor = createCharacterActor(npc.species, npc.name, npc.variant ?? 0, npc.id);
      actor.group.position.set(slot.x, 0, slot.z);
      this.sceneManager.addNPCActor(npc.id, actor.group, actor.label);
    }
  }

  private async refreshNpcPresence(): Promise<void> {
    if (!this.currentSpec || this.combatManager.isActive()) return;
    const spec = this.currentSpec;
    const hour = this.worldClock.hour;
    const shouldBe = new Set(
      spec.npcs
        .filter((slot) => {
          const npc = this.data.getById<NPCDefinition>('npcs', slot.id);
          return npc && npcPresentInScene(npc, hour, spec.id);
        })
        .map((s) => s.id),
    );

    for (const id of [...this.npcMap.keys()]) {
      if (!shouldBe.has(id)) {
        this.sceneManager.removeNPCActor(id);
        this.npcMap.delete(id);
      }
    }

    for (const slot of spec.npcs) {
      if (!shouldBe.has(slot.id) || this.npcMap.has(slot.id)) continue;
      const npc = this.data.getById<NPCDefinition>('npcs', slot.id);
      if (!npc) continue;
      this.npcMap.set(npc.id, npc);
      const actor = createCharacterActor(npc.species, npc.name, npc.variant ?? 0, npc.id);
      actor.group.position.set(slot.x, 0, slot.z);
      this.sceneManager.addNPCActor(npc.id, actor.group, actor.label);
    }

    this.player.clearInteractables();
    this.registerSceneInteractables(spec);
  }

  private registerSceneInteractables(spec: SceneDefinition): void {
    for (const npc of this.npcMap.values()) {
      const slot = spec.npcs.find((s) => s.id === npc.id);
      if (!slot) continue;
      this.player.registerInteractable({
        id: npc.id,
        label: `Talk to ${npc.name}`,
        type: 'npc',
        position: new THREE.Vector3(slot.x, 0, slot.z),
        radius: 1.1,
        payload: { dialogueId: npc.dialogueId, species: npc.species, title: npc.title, npcId: npc.id },
      });
    }

    const objectDefs = this.data.get('objects') as WorldObjectDefinition[];
    for (const slot of spec.objects) {
      const obj = objectDefs.find((o) => o.id === slot.id);
      if (!obj) continue;
      const x = slot.x ?? obj.position.x;
      const z = slot.z ?? obj.position.z;
      const label =
        obj.type === 'merchant'
          ? `Browse ${obj.name}`
          : obj.type === 'combat'
            ? `Fight ${obj.name}`
            : obj.type === 'examine'
              ? `Examine ${obj.name}`
              : obj.name;
      this.player.registerInteractable({
        id: obj.id,
        label,
        type: obj.type === 'pickup' ? 'object' : (obj.type as InteractableTarget['type']),
        position: new THREE.Vector3(x, 0, z),
        radius: obj.radius ?? 1.8,
        payload: obj.payload,
      });
    }

    for (const exit of spec.exits) {
      this.player.registerInteractable({
        id: `exit:${exit.id}`,
        label: exit.label,
        type: 'exit',
        position: new THREE.Vector3(exit.x, 0, exit.z),
        radius: exit.radius,
        payload: { targetScene: exit.targetScene },
      });
    }
  }

  private setupNpcLabelPolicy(): void {
    this.eventBus.on<InteractableTarget | null>('interaction:nearby', (t) => {
      if (this.combatManager.isActive()) {
        this.sceneManager.setHighlightedNpcLabel(null);
        return;
      }
      const npcId = t?.type === 'npc' ? t.id : null;
      this.sceneManager.setHighlightedNpcLabel(npcId);
    });
    this.eventBus.on('combat:started', () => this.sceneManager.setAllNpcLabelsVisible(false));
    this.eventBus.on('combat:ended', () => this.sceneManager.setHighlightedNpcLabel(null));
    this.eventBus.on('dialogue:opened', () => this.sceneManager.setAllNpcLabelsVisible(false));
    this.eventBus.on('dialogue:closed', () => this.sceneManager.setHighlightedNpcLabel(null));
  }

  private setupInteractionHandlers(): void {
    this.eventBus.on<InteractableTarget>('interaction:use', (t) => {
      if (this.combatManager.isActive()) {
        this.ui.showToast('In combat — use the combat panel.');
        return;
      }
      if (t.type === 'exit') {
        const target = t.payload?.targetScene as string;
        if (target) void this.loadScene(target);
        return;
      }
      if (t.type === 'npc') {
        const npcId = t.payload?.npcId as string;
        this.onNpcTalk(npcId, t.payload?.dialogueId as string, t.payload?.species as string, t.payload?.title as string);
      } else if (t.type === 'examine') {
        this.onExamine(t.payload);
      } else if (t.type === 'combat') {
        const encId = (t.payload?.encounterId as string) ?? 'blackfen_poachers';
        const label = t.label.replace(/^Fight /, '');
        this.ui.showConfirm(
          label,
          `${label} block the path ahead. This will start a fight.`,
          'Fight',
          'Back away',
          () => this.combatManager.startEncounter(encId, this.playerSpecies),
        );
      } else if (t.type === 'merchant') {
        this.onMerchant(t.payload);
      }
    });
  }

  private onNpcTalk(npcId: string, dialogueId: string, species: string, title?: string): void {
    if (
      this.questManager.getActiveStage('what_water_remembers') === 'council' &&
      (npcId === 'elder_domet' || npcId === 'old_myrtle')
    ) {
      this.openDialogue('council_vote', 'turtle', 'Council', npcId);
      return;
    }
    this.openDialogue(dialogueId, species, title, npcId);
  }

  private onExamine(payload?: Record<string, unknown>): void {
    if (payload?.councilVote && this.questManager.getActiveStage('what_water_remembers') === 'council') {
      this.openDialogue('council_vote', 'turtle', 'Council');
      return;
    }
    const target = payload?.target as string;
    if (!target) return;
    this.questManager.completeObjective('examine', target);
    this.worldState.setFlag(`examined_${target}`, true);
    const examined = ['flooded_cellar', 'levy_plans', 'chapel_mural', 'ferry_depth'];
    if (examined.every((e) => this.worldState.hasFlag(`examined_${e}`))) {
      this.worldState.setFlag('evidence_gathered', true);
    }
    this.ui.showDialogue(
      { id: 'examine', speaker: 'Examination', text: this.examineText(target) },
      () => this.ui.hideDialogue(),
    );
  }

  private onMerchant(payload: Record<string, unknown> | undefined): void {
    const items = (payload?.items as string[]) ?? [];
    const merchantId = payload?.merchantId as string;
    const npc = this.npcMap.get(merchantId);
    this.ui.showMerchant(npc?.name ?? 'Merchant', items, (itemId) => {
      const item = this.data.getById<ItemDefinition>('items', itemId);
      if (!item) return;
      if (this.inventory.gold >= item.price) {
        this.inventory.gold -= item.price;
        this.inventory.addItem(itemId);
        this.ui.showToast(`Bought ${item.name}`);
      } else {
        this.ui.showToast('Not enough gold.');
      }
    });
  }

  private openDialogue(dialogueId: string, species?: string, title?: string, npcId?: string): void {
    const tree = this.data.getById<DialogueTree>('dialogue', dialogueId);
    if (!tree) return;

    const processNode = (node: import('@/data/types').DialogueNode) => {
      if (node.action?.type === 'start_quest') {
        this.questManager.startQuest(node.action.payload as string);
      }
      if (node.action?.type === 'set_flag') {
        const p = node.action.payload as { key: string; value: boolean };
        this.worldState.setFlag(p.key, p.value);
      }
      if (node.action?.type === 'quest_outcome') {
        const p = node.action.payload as { quest: string; outcome: string };
        this.questManager.completeWithOutcome(p.quest, p.outcome);
      }
      if (node.action?.type === 'complete_objective') {
        const p = node.action.payload as { type: string; target: string };
        this.questManager.completeObjective(p.type, p.target);
      }
    };

    const dialogueCtx = {
      hasFlag: (key: string, value?: unknown) => this.worldState.hasFlag(key, value as boolean | string | number | undefined),
      getQuestStage: (questId: string) => this.questManager.getActiveStage(questId),
      isQuestCompleted: (questId: string) => this.questManager.isCompleted(questId),
      species: this.playerSpecies,
      motivation: this.playerProfile.motivation,
      getReputation: (faction: string) => this.worldState.getReputation(faction),
    };

    const speciesStats = this.data.getById<import('@/data/types').SpeciesDefinition>('species', this.playerSpecies)?.stats;

    const showNode = (nodeId: string) => {
      const node = tree.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      processNode(node);
      this.audio.play('tick');
      const speakerLine = title && nodeId === 'start' ? `${node.speaker} · ${title}` : node.speaker;
      const text = resolveDialogueText(node, dialogueCtx.hasFlag).replace(
        /\{playerName\}/g,
        this.playerProfile.name,
      );
      const choices = filterDialogueChoices(node.choices, dialogueCtx);
      this.ui.showDialogue(
        { ...node, speaker: speakerLine, text, choices },
        showNode,
        species,
        (check) => {
          const statVal = speciesStats?.[check.stat] ?? 10;
          let bonus = 0;
          let advantage = check.advantage ? 'advantage' as const : 'normal' as const;
          if (check.stat === 'cha' && this.inventory.getRollModifiers('social').length) {
            bonus += this.inventory.getRollModifiers('social').reduce((s, m) => s + (m.bonus ?? 0), 0);
          }
          if (this.weather.isRain() && (this.playerSpecies === 'frog' || this.playerSpecies === 'toad') && check.stat === 'dex') {
            advantage = 'advantage';
          }
          return this.skillChecks.roll(
            check.stat,
            statVal,
            check.dc,
            check.label ?? check.stat.toUpperCase(),
            (check.bonus ?? 0) + bonus,
            advantage,
          );
        },
        npcId,
        this.playerSpecies,
      );
    };

    showNode('start');
  }

  private examineText(target: string): string {
    const texts: Record<string, string> = {
      flooded_cellar:
        'Waterline marks show flooding from the north — higher than last season\'s rain would explain.',
      levy_plans:
        'Engineering diagrams channel thirty percent more flow south than the Charter allows.',
      chapel_mural:
        'Three species kneel at one river. A fourth figure is scratched out.',
      ferry_depth:
        'Grizz\'s depth marks confirm water rising faster upstream since levy work began.',
      market_board:
        'Fish: 5c · Reeds: 3c · Clay: 4c · Stone: 12c. Scribbled note — "prices lie after rain."',
      nursery_pool:
        'Tadpoles dart in circles. A wooden sign: "Please don\'t leap in. — Rivulet"',
      council_rostrum:
        'Carved shells mark each vote since the Charter. The newest notch is still blank. The council awaits your evidence.',
      marta_label_shelf:
        'Clay pots line the shelf. A chart shows red bands for tonic, green for toxin. One batch has the bands reversed.',
      causeway_waystone:
        'A stone waystone, chipped at the edges. Lilymarket north across the reeds, Mudwall east past the stoneworks, Croakend west through the smoke, Ferryman\'s Rest south along the water. A fifth line is scratched deeper than the rest, pointing off the map entirely.',
      causeway_lantern:
        'An old ferry lantern, unlit this hour. Its glass is scratched with a dozen names — travelers who swore they\'d "come back for it." None have.',
    };
    return texts[target] ?? 'Nothing remarkable.';
  }
}
