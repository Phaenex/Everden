import type { EventBus } from '@/core/EventBus';
import type { IGameModule } from '@/core/IGameModule';
import type { DataRegistry } from '@/data/DataRegistry';
import type { EncounterDefinition, SpeciesDefinition, SpeciesStats } from '@/data/types';
import { DiceRoller, type Advantage } from './DiceRoller';
import type { Inventory } from './Inventory';
import { SpeciesAbilityRegistry } from './SpeciesAbilityRegistry';
import type { DiceDuelEvent, DiceDuelParticipant } from './DiceDuelTypes';

export type { DiceDuelEvent, DiceDuelParticipant } from './DiceDuelTypes';

export interface Combatant {
  id: string;
  name: string;
  speciesId: string;
  team: 'player' | 'enemy' | 'ally';
  hp: number;
  maxHp: number;
  ac: number;
  stats: SpeciesStats;
  initiativeMod: number;
  conditions: string[];
}

export interface CombatLogEntry {
  text: string;
  type: 'roll' | 'damage' | 'info' | 'ability';
}

/**
 * Turn-based dice combat with species biology abilities.
 */
export class CombatManager implements IGameModule {
  private roller = new DiceRoller();
  private abilityRegistry: SpeciesAbilityRegistry;
  private combatants: Combatant[] = [];
  private turnOrder: string[] = [];
  private turnIndex = 0;
  private active = false;
  private log: CombatLogEntry[] = [];
  private diplomacyAllowed = false;
  /**
   * Replaces a raw `setTimeout` for the enemy-turn delay. A wall-clock timer keeps
   * firing even while `GameLoop.stop()` has paused everything else (dev menu open) —
   * driving this off `update(dt)` instead means enemy turns freeze along with the
   * rest of the sim, closing the one documented gap from AR-014/CHECKIN-030.
   */
  private pendingEnemyTurn: { actorId: string; remaining: number } | null = null;

  constructor(
    private eventBus: EventBus,
    private data: DataRegistry,
    private inventory: Inventory,
    private getWeather: () => string = () => 'clear',
  ) {
    this.abilityRegistry = new SpeciesAbilityRegistry(data);
    this.abilityRegistry.init();
  }

  /** IGameModule — registered with GameLoop so enemy-turn pacing pauses with everything else. */
  init(): void {}

  dispose(): void {
    this.pendingEnemyTurn = null;
  }

  update(dt: number): void {
    if (!this.pendingEnemyTurn) return;
    this.pendingEnemyTurn.remaining -= dt;
    if (this.pendingEnemyTurn.remaining > 0) return;
    const actorId = this.pendingEnemyTurn.actorId;
    this.pendingEnemyTurn = null;
    this.runEnemyTurn(actorId);
  }

  startEncounter(encounterId: string, playerSpecies = 'frog'): void {
    const enc = this.data.getById<EncounterDefinition>('encounters', encounterId);
    if (!enc) return;

    this.diplomacyAllowed = enc.diplomacyAllowed ?? false;
    this.combatants = [];
    this.log = [];
    this.turnIndex = 0;
    this.pendingEnemyTurn = null;

    let idx = 0;
    for (const c of enc.combatants) {
      const species = this.data.getById<SpeciesDefinition>('species', c.species);
      if (!species) continue;
      const team = c.team === 'player' ? 'player' : c.team;
      this.combatants.push({
        id: `${c.name}_${idx++}`,
        name: c.name,
        speciesId: c.species,
        team: team as Combatant['team'],
        hp: c.hp ?? 20,
        maxHp: c.hp ?? 20,
        ac: species.combat.ac,
        stats: { ...species.stats },
        initiativeMod: species.combat.initiativeMod,
        conditions: [],
      });
    }

    // ensure player combatant
    if (!this.combatants.some((c) => c.team === 'player')) {
      const species = this.data.getById<SpeciesDefinition>('species', playerSpecies)!;
      this.combatants.unshift({
        id: 'player',
        name: 'You',
        speciesId: playerSpecies,
        team: 'player',
        hp: 24,
        maxHp: 24,
        ac: species.combat.ac,
        stats: { ...species.stats },
        initiativeMod: species.combat.initiativeMod,
        conditions: [],
      });
    }

    this.rollInitiative();
    this.active = true;
    this.pushLog('Combat begins.', 'info');
    this.applyWeatherBuffs();
    this.eventBus.emit('combat:started', { encounterId });
    this.eventBus.emit('combat:log', { entries: [...this.log] });
    this.beginTurn();
  }

  getCombatants(): Combatant[] {
    return [...this.combatants];
  }

  getEnemies(): Combatant[] {
    return this.combatants.filter((c) => c.team === 'enemy' && c.hp > 0);
  }

  getPlayer(): Combatant | undefined {
    return this.combatants.find((c) => c.team === 'player');
  }

  getAbilityIds(speciesId: string): string[] {
    return this.data.getById<SpeciesDefinition>('species', speciesId)?.combat.abilities ?? [];
  }

  isPlayerTurn(): boolean {
    return this.getCurrentActor()?.team === 'player';
  }

  isActive(): boolean {
    return this.active;
  }

  canDiplomacy(): boolean {
    return this.active && this.diplomacyAllowed && this.isPlayerTurn();
  }

  attemptDiplomacy(mode: 'persuade' | 'intimidate', playerSpecies: string): boolean {
    if (!this.canDiplomacy()) return false;
    const player = this.getPlayer();
    if (!player) return false;

    const stat = mode === 'persuade' ? 'cha' : 'str';
    const dc = mode === 'persuade' ? 13 : 14;
    let bonus = 0;
    let advantage: import('./DiceRoller').Advantage = 'normal';
    if (mode === 'persuade' && this.getWeather() === 'rain' && (playerSpecies === 'frog' || playerSpecies === 'toad')) {
      advantage = 'advantage';
    }
    if (mode === 'intimidate' && playerSpecies === 'toad') bonus += 2;

    const mod = this.statMod(player.stats[stat]) + bonus;
    const roll = this.roller.d20(advantage);
    const total = roll.total + mod;
    const success = total >= dc;

    this.pushLog(
      `${mode === 'persuade' ? 'Persuade' : 'Intimidate'}: d20(${roll.natural})+${mod}=${total} vs DC ${dc}`,
      'roll',
    );
    const opponent = this.combatants.find((c) => c.team === 'enemy' && c.hp > 0);
    this.emitDuel({
      label: mode === 'persuade' ? 'Persuade (CHA)' : 'Intimidate (STR)',
      actor: this.toDuelParticipant(player),
      target: opponent ? this.toDuelParticipant(opponent) : undefined,
      natural: roll.natural,
      rolls: roll.rolls,
      modifier: mod,
      total,
      dc,
      outcome: success ? 'success' : 'fail',
    });

    if (success) {
      this.pushLog('They stand down. No blood today.', 'info');
      this.active = false;
      this.eventBus.emit('combat:ended', { victory: true, diplomacy: true });
    } else {
      this.pushLog('They laugh at you. Fight on.', 'info');
      this.endTurn();
    }
    this.eventBus.emit('combat:log', { entries: [...this.log] });
    return success;
  }

  /** Test hook — deterministic dice. */
  setDiceSeed(seed: number): void {
    this.roller.setSeed(seed);
  }

  clearDiceSeed(): void {
    this.roller.clearSeed();
  }


  getLog(): CombatLogEntry[] {
    return [...this.log];
  }

  getCurrentActor(): Combatant | undefined {
    const id = this.turnOrder[this.turnIndex];
    return this.combatants.find((c) => c.id === id && c.hp > 0);
  }

  /** Fixed for the whole encounter (set once by `rollInitiative`). Test hook. */
  getTurnOrder(): string[] {
    return [...this.turnOrder];
  }

  attack(targetId: string, attackerId?: string): void {
    if (!this.resolveAttack(targetId, attackerId)) return;
    this.endTurn();
  }

  private resolveAttack(targetId: string, attackerId?: string, damageDice = '1d6'): boolean {
    const attacker = attackerId
      ? this.combatants.find((c) => c.id === attackerId)
      : this.getCurrentActor();
    const target = this.combatants.find((c) => c.id === targetId);
    if (!attacker || !target || !this.active) return false;
    if (!attackerId && attacker.team === 'player' && !this.isPlayerTurn()) return false;

    const dexMod = this.statMod(attacker.stats.dex);
    const mods = attacker.team === 'player' ? this.inventory.getRollModifiers('attack') : [];
    let bonus = dexMod + attacker.initiativeMod;
    let extraDamage = 0;
    for (const m of mods) {
      bonus += m.bonus ?? 0;
      if (m.extraDice) extraDamage += this.roller.parseAndRoll(m.extraDice);
    }

    // Simplified poisoned (not full 5e: no disadvantage on checks, clears after one attack).
    if (attacker.conditions.includes('poisoned')) {
      bonus -= 2;
      attacker.conditions = attacker.conditions.filter((c) => c !== 'poisoned');
      this.pushLog(`${attacker.name} is poisoned (-2 attack).`, 'info');
    }
    if (attacker.conditions.includes('amphibious_rush')) {
      extraDamage += 2;
      attacker.conditions = attacker.conditions.filter((c) => c !== 'amphibious_rush');
      this.pushLog('Amphibious Rush adds +2 damage.', 'info');
    }

    let advantage: Advantage = 'normal';
    if (attacker.conditions.includes('advantage')) {
      advantage = 'advantage';
      attacker.conditions = attacker.conditions.filter((c) => c !== 'advantage');
    }
    if (target.conditions.includes('burrowed') || target.conditions.includes('withdraw')) {
      advantage = advantage === 'advantage' ? 'normal' : 'disadvantage';
      if (target.conditions.includes('burrowed')) {
        target.conditions = target.conditions.filter((c) => c !== 'burrowed');
      }
      if (target.conditions.includes('withdraw')) {
        target.conditions = target.conditions.filter((c) => c !== 'withdraw');
      }
      this.pushLog(`Hard to hit ${target.name} — disadvantage.`, 'info');
    }

    const roll = this.roller.d20(advantage);
    const total = roll.total + bonus;
    this.pushLog(
      `${attacker.name} attacks ${target.name}: d20(${roll.natural})+${bonus}=${total} vs AC ${target.ac}`,
      'roll',
    );

    const fumble = roll.natural === 1;
    const crit = roll.natural === 20;
    const hit = !fumble && (crit || total >= target.ac);
    this.emitDuel({
      label: 'Attack',
      actor: this.toDuelParticipant(attacker),
      target: this.toDuelParticipant(target),
      natural: roll.natural,
      rolls: roll.rolls,
      modifier: bonus,
      total,
      dc: target.ac,
      outcome: fumble ? 'fumble' : crit ? 'crit' : hit ? 'hit' : 'miss',
    });

    if (fumble) {
      this.pushLog('Critical fumble — miss!', 'info');
      this.eventBus.emit('combat:log', { entries: [...this.log] });
      return true;
    }

    if (!hit) {
      this.pushLog('Miss.', 'info');
      this.eventBus.emit('combat:log', { entries: [...this.log] });
      return true;
    }

    let diceDamage = this.roller.parseAndRoll(damageDice);
    if (crit) diceDamage *= 2;
    let damage = diceDamage + Math.max(0, this.statMod(attacker.stats.str)) + extraDamage;
    if (target.conditions.includes('shell_block')) {
      const absorbed = this.roller.parseAndRoll('1d6');
      damage = Math.max(0, damage - absorbed);
      target.conditions = target.conditions.filter((c) => c !== 'shell_block');
      this.pushLog(`Shell Block absorbs ${absorbed} damage.`, 'info');
    }
    target.hp = Math.max(0, target.hp - damage);
    this.pushLog(`Hit for ${damage} damage. ${target.name} HP: ${target.hp}/${target.maxHp}`, 'damage');
    this.eventBus.emit('combat:log', { entries: [...this.log] });

    if (target.hp <= 0) {
      this.pushLog(`${target.name} is defeated.`, 'info');
      this.checkVictory();
    }
    return true;
  }

  useAbility(abilityId: string, targetId?: string): void {
    const actor = this.getCurrentActor();
    if (!actor || !this.active) return;
    if (actor.team === 'player' && !this.isPlayerTurn()) return;
    const ability = this.abilityRegistry.get(abilityId);
    if (!ability || ability.species !== actor.speciesId) return;

    this.pushLog(`${actor.name} uses ${ability.name}.`, 'ability');

    if (ability.id === 'leap') {
      this.pushLog('Leaps to a new position — next attack has advantage.', 'info');
      actor.conditions.push('advantage');
    } else if (ability.id === 'shell_block') {
      actor.conditions.push('shell_block');
      this.pushLog('Shell raised — damage reduced this round.', 'info');
    } else if (ability.id === 'fear_croak' && targetId) {
      const target = this.combatants.find((c) => c.id === targetId);
      if (target) {
        const wisMod = this.statMod(target.stats.wis);
        const saveRoll = this.roller.d20();
        const save = saveRoll.total + wisMod;
        const dc = 12;
        const resisted = save >= dc;
        this.emitDuel({
          label: 'Fear Croak — WIS Save',
          actor: this.toDuelParticipant(actor),
          target: this.toDuelParticipant(target),
          natural: saveRoll.natural,
          rolls: saveRoll.rolls,
          modifier: wisMod,
          total: save,
          dc,
          outcome: resisted ? 'success' : 'fail',
        });
        if (!resisted) {
          target.conditions.push('fleeing');
          this.pushLog(`${target.name} fails WIS save — fleeing!`, 'roll');
        } else {
          this.pushLog(`${target.name} resists the croak.`, 'roll');
        }
      }
    } else if (ability.id === 'bufotoxin_spit' && targetId) {
      this.resolveAttack(targetId, actor.id);
      const target = this.combatants.find((c) => c.id === targetId);
      if (target && target.hp > 0) {
        target.conditions.push('poisoned');
        this.pushLog(`${target.name} is poisoned (-2 next roll).`, 'info');
      }
      this.eventBus.emit('combat:log', { entries: [...this.log] });
      this.endTurn();
      return;
    } else if (ability.id === 'tongue_lash' && targetId) {
      this.resolveAttack(targetId, actor.id);
      this.endTurn();
      return;
    } else if (ability.id === 'ram' && targetId) {
      this.resolveAttack(targetId, actor.id, '1d8');
      this.endTurn();
      return;
    } else if (ability.id === 'withdraw') {
      actor.conditions.push('withdraw');
      this.pushLog(`${actor.name} withdraws — harder to hit this round.`, 'info');
    } else if (ability.id === 'burrow' || ability.id === 'burrow_hide') {
      actor.conditions.push('burrowed');
      this.pushLog(`${actor.name} burrows — attacks against them have disadvantage.`, 'info');
    } else if (ability.id === 'amphibious_rush') {
      actor.conditions.push('amphibious_rush');
      this.pushLog('Amphibious Rush primed — next hit deals +2 damage.', 'info');
    } else if (ability.id === 'cheek_poultice') {
      // Ignores targetId: the UI always passes the first enemy, but this ability
      // only ever heals the actor's own side. "Own side" is anyone not on 'enemy'
      // (matches the player/ally grouping `checkVictory` already uses) — not an
      // exact team-string match, so this still works if a vole ever fights as an
      // 'ally' alongside the 'player' team instead of only alongside its own team.
      const healTarget = this.combatants
        .filter((c) => c.hp > 0 && c.team !== 'enemy')
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (healTarget) {
        const healed = Math.min(healTarget.maxHp - healTarget.hp, this.roller.parseAndRoll('1d8') + 1);
        healTarget.hp += healed;
        const whose = healTarget.id === actor.id ? 'their own' : `${healTarget.name}'s`;
        this.pushLog(`${actor.name} tends ${whose} wounds — +${healed} HP (${healTarget.hp}/${healTarget.maxHp}).`, 'info');
      } else {
        this.pushLog('No one needs healing.', 'info');
      }
    } else if (ability.id === 'nibble_distraction' && targetId) {
      const target = this.combatants.find((c) => c.id === targetId);
      if (target) {
        const wisMod = this.statMod(target.stats.wis);
        const saveRoll = this.roller.d20();
        const save = saveRoll.total + wisMod;
        const dc = 12;
        const resisted = save >= dc;
        this.emitDuel({
          label: 'Nibble Distraction — WIS Save',
          actor: this.toDuelParticipant(actor),
          target: this.toDuelParticipant(target),
          natural: saveRoll.natural,
          rolls: saveRoll.rolls,
          modifier: wisMod,
          total: save,
          dc,
          outcome: resisted ? 'success' : 'fail',
        });
        if (!resisted) {
          target.conditions.push('stunned');
          this.pushLog(`${target.name} fails the WIS save (${save} vs ${dc}) — distracted and stunned!`, 'roll');
        } else {
          this.pushLog(`${target.name} shrugs off the distraction (${save} vs ${dc}).`, 'roll');
        }
      }
    } else {
      this.pushLog(`${ability.name} — no combat effect yet.`, 'info');
    }

    this.eventBus.emit('combat:log', { entries: [...this.log] });
    this.endTurn();
  }

  endTurn(): void {
    if (!this.active) return;
    let steps = 0;
    do {
      this.turnIndex = (this.turnIndex + 1) % this.turnOrder.length;
      steps++;
      // NOTE: must check the raw combatant here, not `getCurrentActor()` — that
      // getter already filters to `hp > 0`, so `getCurrentActor()?.hp === 0` can
      // never be true and this loop would always stop after one step, landing on
      // a dead combatant's turn slot and permanently soft-locking any 3+ combatant
      // fight where a "middle" turn-order actor dies (see CHECKIN-013).
    } while (steps <= this.turnOrder.length && this.isDeadOrMissing(this.turnOrder[this.turnIndex]));

    if (!this.active) return;
    this.checkVictory();
    if (!this.active) return;
    this.beginTurn();
  }

  private isDeadOrMissing(id: string | undefined): boolean {
    const combatant = id ? this.combatants.find((c) => c.id === id) : undefined;
    return !combatant || combatant.hp <= 0;
  }

  flee(): boolean {
    if (!this.isPlayerTurn()) return false;
    const player = this.combatants.find((c) => c.team === 'player');
    if (!player) return false;
    const dexMod = this.statMod(player.stats.dex);
    const rollRes = this.roller.d20();
    const roll = rollRes.total + dexMod;
    const success = roll >= 12;
    this.pushLog(`Flee attempt: ${roll} — ${success ? 'escaped!' : 'failed.'}`, 'roll');
    this.emitDuel({
      label: 'Flee',
      actor: this.toDuelParticipant(player),
      natural: rollRes.natural,
      rolls: rollRes.rolls,
      modifier: dexMod,
      total: roll,
      dc: 12,
      outcome: success ? 'success' : 'fail',
    });
    if (success) {
      this.active = false;
      this.eventBus.emit('combat:ended', { victory: false, fled: true });
    } else {
      this.endTurn();
    }
    this.eventBus.emit('combat:log', { entries: [...this.log] });
    return success;
  }

  private beginTurn(): void {
    const actor = this.getCurrentActor();
    if (!actor || !this.active) return;

    if (actor.conditions.includes('fleeing')) {
      actor.conditions = actor.conditions.filter((c) => c !== 'fleeing');
      this.pushLog(`${actor.name} flees the fight!`, 'info');
      this.eventBus.emit('combat:log', { entries: [...this.log] });
      this.endTurn();
      return;
    }
    if (actor.conditions.includes('stunned')) {
      actor.conditions = actor.conditions.filter((c) => c !== 'stunned');
      this.pushLog(`${actor.name} is stunned and loses their turn!`, 'info');
      this.eventBus.emit('combat:log', { entries: [...this.log] });
      this.endTurn();
      return;
    }

    this.eventBus.emit('combat:turn', { actorId: actor.id, team: actor.team });
    if (actor.team === 'enemy') {
      this.pendingEnemyTurn = { actorId: actor.id, remaining: 0.5 };
    }
  }

  private runEnemyTurn(expectedActorId: string): void {
    if (!this.active) return;
    const actor = this.getCurrentActor();
    if (!actor || actor.id !== expectedActorId || actor.team !== 'enemy') return;

    const player = this.combatants.find((c) => c.team === 'player' && c.hp > 0);
    if (!player) return;

    const attackAbilities = ['tongue_lash', 'bufotoxin_spit', 'ram'];
    const abilities = this.getAbilityIds(actor.speciesId).filter((id) => attackAbilities.includes(id));
    const abilityId = abilities.length > 0 && Math.random() < 0.35 ? abilities[0] : null;

    if (abilityId) {
      this.useAbility(abilityId, player.id);
    } else {
      this.attack(player.id, actor.id);
    }
  }

  private applyWeatherBuffs(): void {
    if (this.getWeather() !== 'rain') return;
    const player = this.getPlayer();
    if (!player) return;
    if (player.speciesId === 'frog' || player.speciesId === 'toad') {
      player.conditions.push('amphibious_rush');
      this.pushLog('Rain hammers the marsh — amphibians surge with extra vigor.', 'info');
    }
  }

  private rollInitiative(): void {
    const rolls = this.combatants.map((c) => {
      const r = this.roller.d20().total + this.statMod(c.stats.dex) + c.initiativeMod;
      return { id: c.id, roll: r };
    });
    rolls.sort((a, b) => b.roll - a.roll);
    this.turnOrder = rolls.map((r) => r.id);
    this.pushLog(`Initiative: ${rolls.map((r) => `${r.id}(${r.roll})`).join(', ')}`, 'info');
  }

  private statMod(stat: number): number {
    return Math.floor((stat - 10) / 2);
  }

  private toDuelParticipant(c: Combatant): DiceDuelParticipant {
    return { id: c.id, name: c.name, speciesId: c.speciesId, isEnemy: c.team === 'enemy' };
  }

  private emitDuel(event: DiceDuelEvent): void {
    this.eventBus.emit('combat:dice_duel', event);
  }

  private checkVictory(): void {
    const enemies = this.combatants.filter((c) => c.team === 'enemy' && c.hp > 0);
    const players = this.combatants.filter((c) => (c.team === 'player' || c.team === 'ally') && c.hp > 0);
    if (enemies.length === 0) {
      this.active = false;
      this.eventBus.emit('combat:ended', { victory: true });
      this.pushLog('Victory!', 'info');
    } else if (players.length === 0) {
      this.active = false;
      this.eventBus.emit('combat:ended', { victory: false });
      this.pushLog('Defeated...', 'info');
    }
    this.eventBus.emit('combat:log', { entries: [...this.log] });
  }

  private pushLog(text: string, type: CombatLogEntry['type']): void {
    this.log.push({ text, type });
  }
}
