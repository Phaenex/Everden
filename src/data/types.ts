export type SpeciesRole = 'mobile' | 'control' | 'tank' | 'healer';

export interface SpeciesStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface SpeciesCombat {
  ac: number;
  initiativeMod: number;
  abilities: string[];
}

export interface SpeciesRacialBonuses {
  plus2: keyof SpeciesStats;
  plus1: keyof SpeciesStats;
}

export interface SpeciesDefinition {
  id: string;
  name: string;
  role: SpeciesRole;
  /** Title-screen combat role label, e.g. "Tank · Chronicle-minded". */
  selectRole?: string;
  /** One-line flavor shown while picking this folk on the title screen. */
  selectBlurb?: string;
  color: string;
  stats: SpeciesStats;
  racialBonuses?: SpeciesRacialBonuses;
  combat: SpeciesCombat;
}

export interface ScheduleEntry {
  startHour: number;
  endHour: number;
  activity: string;
  location: string;
}

export interface NPCDefinition {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  species: string;
  variant?: number;
  faction: string;
  home: string;
  workplace: string;
  schedule: ScheduleEntry[];
  dialogueId: string;
  position: { x: number; y: number; z: number };
}

export interface WorldObjectDefinition {
  id: string;
  name: string;
  type: 'examine' | 'pickup' | 'travel' | 'combat' | 'merchant';
  position: { x: number; z: number };
  radius?: number;
  payload?: Record<string, unknown>;
  /** Optional billboard prop drawn at the object's position — see PropSprites.ts. Districts
   * whose backdrop art already paints the object in place (most leaf districts) omit this;
   * it exists for hubs like Causeway where the backdrop is bare and the object needs its
   * own visible geometry or it's just an invisible click zone. */
  visualProp?: string;
}

export interface RollModifier {
  rollType: string;
  bonus?: number;
  extraDice?: string;
}

export interface ItemDefinition {
  id: string;
  name: string;
  type: string;
  rollModifiers?: RollModifier[];
  price: number;
  description?: string;
}

export interface GoodDefinition {
  id: string;
  name: string;
  basePrice: number;
  seasonalMods: Record<string, number>;
}

export interface QuestObjective {
  type: string;
  target: string;
  count?: number;
}

export interface QuestStage {
  id: string;
  description: string;
  objectives: QuestObjective[];
  next?: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  stages: QuestStage[];
  rewards: {
    gold?: number;
    reputation?: Record<string, number>;
    flags?: Record<string, boolean | string | number>;
  };
  outcomes?: Record<
    string,
    {
      label?: string;
      flags?: Record<string, boolean | string | number>;
      reputation?: Record<string, number>;
      gold?: number;
      description?: string;
    }
  >;
}

export interface DialogueChoice {
  text: string;
  next: string;
  failNext?: string;
  condition?: {
    flag?: string;
    value?: unknown;
    questStage?: { quest: string; stage: string };
    notQuestCompleted?: string;
    species?: string;
    motivation?: string;
    minReputation?: { faction: string; min: number };
  };
  skillCheck?: {
    stat: keyof SpeciesStats;
    dc: number;
    label?: string;
    bonus?: number;
    advantage?: boolean;
  };
}

export interface DialogueNodeAlt {
  flag: string;
  value?: unknown;
  text?: string;
  append?: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  altText?: DialogueNodeAlt[];
  choices?: DialogueChoice[];
  action?: { type: string; payload?: unknown };
}

export interface DialogueTree {
  id: string;
  nodes: DialogueNode[];
}

export interface EncounterCombatant {
  species: string;
  name: string;
  team: 'enemy' | 'ally' | 'player';
  hp?: number;
}

export interface EncounterDefinition {
  id: string;
  name: string;
  gridSize: number;
  combatants: EncounterCombatant[];
  diplomacyAllowed?: boolean;
}

export interface LocationDefinition {
  id: string;
  name: string;
  biome: string;
  travelTimes: Record<string, number>;
  weatherTable: Record<string, number>;
}

export interface AbilityDefinition {
  id: string;
  name: string;
  species: string;
  type: 'attack' | 'defense' | 'utility' | 'debuff' | 'heal';
  description: string;
  /** Creator Kit tab — when/how this ability matters in play. */
  gameHint?: string;
  damage?: string;
  saveDc?: number;
  saveStat?: keyof SpeciesStats;
}

export interface WardrobeDefinition {
  id: string;
  slot: 'hat' | 'cloak' | 'accessory';
  label: string;
  hint?: string;
  species: string[];
  layer: 'procedural' | 'sprite';
  sprite?: string;
}

export interface GameData {
  species: SpeciesDefinition[];
  npcs: NPCDefinition[];
  items: ItemDefinition[];
  goods: GoodDefinition[];
  quests: QuestDefinition[];
  dialogue: DialogueTree[];
  encounters: EncounterDefinition[];
  locations: LocationDefinition[];
  abilities: AbilityDefinition[];
  objects: WorldObjectDefinition[];
  journal: JournalDefinition[];
  districts: DistrictDefinition[];
  wardrobe: WardrobeDefinition[];
}

export interface DistrictDefinition {
  id: string;
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface JournalDefinition {
  id: string;
  title: string;
  body: string;
  category: 'discovery' | 'quest' | 'lore';
  image?: string;
  trigger: {
    type: 'examine' | 'quest_complete' | 'quest_stage' | 'flag';
    target: string;
    value?: unknown;
  };
}
