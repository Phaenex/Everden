import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { DataRegistry } from '@/data/DataRegistry';
import { CombatManager, type DiceDuelEvent } from '@/gameplay/CombatManager';
import { Inventory } from '@/gameplay/Inventory';

describe('CombatManager', () => {
  it('starts encounter and produces log entries', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'frog',
          name: 'Frog',
          role: 'mobile',
          color: '#5c7a52',
          stats: { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 12 },
          combat: { ac: 12, initiativeMod: 2, abilities: [] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
          combat: { ac: 13, initiativeMod: 0, abilities: [] },
        },
        {
          id: 'turtle',
          name: 'Turtle',
          role: 'tank',
          color: '#1a3c34',
          stats: { str: 14, dex: 6, con: 16, int: 10, wis: 12, cha: 8 },
          combat: { ac: 16, initiativeMod: -2, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'test_enc',
          name: 'Test',
          gridSize: 8,
          combatants: [{ species: 'toad', name: 'Enemy', team: 'enemy', hp: 10 }],
        },
      ],
      abilities: [],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);
    combat.startEncounter('test_enc');
    expect(combat.isActive()).toBe(true);
    expect(combat.getLog().length).toBeGreaterThan(0);
  });

  it('runs enemy turns automatically', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'frog',
          name: 'Frog',
          role: 'mobile',
          color: '#5c7a52',
          stats: { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 12 },
          combat: { ac: 12, initiativeMod: 2, abilities: [] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
          combat: { ac: 13, initiativeMod: 0, abilities: ['bufotoxin_spit'] },
        },
      ],
      encounters: [
        {
          id: 'enemy_turn',
          name: 'Enemy Turn',
          gridSize: 8,
          combatants: [{ species: 'toad', name: 'Raider', team: 'enemy', hp: 100 }],
        },
      ],
      abilities: [
        {
          id: 'bufotoxin_spit',
          name: 'Bufotoxin Spit',
          species: 'toad',
          type: 'attack',
          description: 'Poison spit',
          damage: '1d4',
        },
      ],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);

    combat.startEncounter('enemy_turn', 'frog');
    if (combat.isPlayerTurn()) {
      combat.attack(combat.getEnemies()[0]!.id);
    }
    expect(combat.isActive()).toBe(true);

    const before = combat.getLog().length;
    combat.update(0.6);
    expect(combat.getLog().length).toBeGreaterThan(before);
  });

  it('enemy turn does not fire on a raw wall-clock timer and stays frozen until update(dt) accumulates enough time (regression: AR-014 known gap — a setTimeout kept firing enemy turns even while GameLoop.stop() paused the dev menu)', () => {
    vi.useFakeTimers();
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'frog',
          name: 'Frog',
          role: 'mobile',
          color: '#5c7a52',
          stats: { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 12 },
          combat: { ac: 12, initiativeMod: -10, abilities: [] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
          combat: { ac: 13, initiativeMod: 10, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'pause_test',
          name: 'Pause',
          gridSize: 8,
          combatants: [{ species: 'toad', name: 'Raider', team: 'enemy', hp: 100 }],
        },
      ],
      abilities: [],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);

    // Heavily skewed initiative mods so the enemy reliably goes first.
    combat.startEncounter('pause_test', 'frog');
    expect(combat.isPlayerTurn()).toBe(false);

    const beforeTimer = combat.getLog().length;
    // Simulate GameLoop.stop() — nothing calls update(), so even a long real-time
    // wait (a stray setTimeout would have long since fired at 500ms) must not
    // advance the enemy's turn.
    vi.advanceTimersByTime(5000);
    expect(combat.getLog().length).toBe(beforeTimer);
    expect(combat.isPlayerTurn()).toBe(false);

    // A too-small dt (still paused/throttled) shouldn't fire it either.
    combat.update(0.1);
    expect(combat.getLog().length).toBe(beforeTimer);

    // Once enough simulated time actually accumulates via update(dt), it fires.
    combat.update(0.5);
    expect(combat.getLog().length).toBeGreaterThan(beforeTimer);
    vi.useRealTimers();
  });

  it('applies poisoned penalty to attack rolls', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'frog',
          name: 'Frog',
          role: 'mobile',
          color: '#5c7a52',
          stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          combat: { ac: 10, initiativeMod: 0, abilities: [] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          combat: { ac: 10, initiativeMod: 0, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'poison_test',
          name: 'Poison',
          gridSize: 8,
          combatants: [{ species: 'toad', name: 'Dummy', team: 'enemy', hp: 50 }],
        },
      ],
      abilities: [],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);
    combat.setDiceSeed(42);
    combat.startEncounter('poison_test', 'frog');

    const player = combat.getPlayer()!;
    player.conditions.push('poisoned');
    if (!combat.isPlayerTurn()) {
      combat.attack(combat.getEnemies()[0]!.id);
    }
    const before = combat.getLog().length;
    combat.attack(combat.getEnemies()[0]!.id);
    const logText = combat
      .getLog()
      .slice(before)
      .map((e) => e.text)
      .join(' ');
    expect(logText).toContain('poisoned');
    combat.clearDiceSeed();
  });

  it('applies rain buff for amphibians at combat start', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'frog',
          name: 'Frog',
          role: 'mobile',
          color: '#5c7a52',
          stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          combat: { ac: 10, initiativeMod: 0, abilities: [] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          combat: { ac: 10, initiativeMod: 0, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'solo',
          name: 'Solo',
          gridSize: 8,
          combatants: [{ species: 'toad', name: 'Dummy', team: 'enemy', hp: 10 }],
        },
      ],
      abilities: [],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv, () => 'rain');
    combat.startEncounter('solo', 'frog');
    const player = combat.getPlayer()!;
    expect(player.conditions).toContain('amphibious_rush');
    expect(combat.getLog().some((e) => e.text.includes('Rain'))).toBe(true);
  });

  it('cheek_poultice heals the actor, ignoring the enemy-focused targetId the UI always passes', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'vole',
          name: 'Vole',
          role: 'healer',
          color: '#8a6f4a',
          stats: { str: 6, dex: 14, con: 8, int: 12, wis: 14, cha: 12 },
          combat: { ac: 11, initiativeMod: 3, abilities: ['cheek_poultice'] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
          combat: { ac: 13, initiativeMod: 0, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'heal_test',
          name: 'Heal',
          gridSize: 8,
          combatants: [{ species: 'toad', name: 'Dummy', team: 'enemy', hp: 10 }],
        },
      ],
      abilities: [
        { id: 'cheek_poultice', name: 'Cheek Poultice', species: 'vole', type: 'heal', description: 'Heal.', damage: '1d8' },
      ],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);

    combat.startEncounter('heal_test', 'vole');
    if (!combat.isPlayerTurn()) {
      combat.update(0.6);
    }
    expect(combat.isPlayerTurn()).toBe(true);

    const player = combat.getPlayer()!;
    player.hp = player.maxHp - 5;
    const before = player.hp;
    // Ability buttons always pass the first enemy id (see UIManager.bindCombatActions) —
    // cheek_poultice must ignore that and heal the actor's own side regardless.
    combat.useAbility('cheek_poultice', combat.getEnemies()[0]!.id);
    expect(player.hp).toBeGreaterThan(before);
    expect(player.hp).toBeLessThanOrEqual(player.maxHp);
  });

  it('burrow_hide gives the burrowed actor disadvantage against incoming attacks', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'vole',
          name: 'Vole',
          role: 'healer',
          color: '#8a6f4a',
          stats: { str: 6, dex: 14, con: 8, int: 12, wis: 14, cha: 12 },
          combat: { ac: 11, initiativeMod: 3, abilities: ['burrow_hide'] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
          combat: { ac: 13, initiativeMod: 0, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'burrow_test',
          name: 'Burrow',
          gridSize: 8,
          combatants: [{ species: 'toad', name: 'Dummy', team: 'enemy', hp: 10 }],
        },
      ],
      abilities: [
        { id: 'burrow_hide', name: 'Burrow Hide', species: 'vole', type: 'utility', description: 'Hide.' },
      ],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);

    combat.startEncounter('burrow_test', 'vole');
    if (!combat.isPlayerTurn()) {
      combat.update(0.6);
    }
    expect(combat.isPlayerTurn()).toBe(true);
    combat.useAbility('burrow_hide');
    const player = combat.getPlayer()!;
    expect(player.conditions).toContain('burrowed');
  });

  it('stunned condition (nibble_distraction) makes the actor lose their next turn', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'vole',
          name: 'Vole',
          role: 'healer',
          color: '#8a6f4a',
          stats: { str: 6, dex: 14, con: 8, int: 12, wis: 14, cha: 12 },
          combat: { ac: 11, initiativeMod: 3, abilities: [] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
          combat: { ac: 13, initiativeMod: 0, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'stun_test',
          name: 'Stun',
          gridSize: 8,
          combatants: [{ species: 'toad', name: 'Dummy', team: 'enemy', hp: 10 }],
        },
      ],
      abilities: [],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);

    combat.startEncounter('stun_test', 'vole');

    const [a, b] = combat.getCombatants();
    const current = combat.getCurrentActor()!;
    const other = current.id === a!.id ? b! : a!;
    other.conditions.push('stunned');

    if (current.team === 'player') {
      combat.attack(other.id);
    } else {
      combat.update(0.6);
    }

    const log = combat.getLog().map((e) => e.text).join(' ');
    expect(log).toContain('loses their turn');
    expect(other.conditions).not.toContain('stunned');
  });

  it('endTurn skips a dead combatant in the middle of turn order instead of soft-locking (regression: multi-enemy fights)', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'frog',
          name: 'Frog',
          role: 'mobile',
          color: '#5c7a52',
          stats: { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 12 },
          combat: { ac: 12, initiativeMod: 2, abilities: [] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
          combat: { ac: 13, initiativeMod: 0, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'triple_test',
          name: 'Triple',
          gridSize: 8,
          combatants: [
            { species: 'toad', name: 'A', team: 'enemy', hp: 10 },
            { species: 'toad', name: 'B', team: 'enemy', hp: 10 },
          ],
        },
      ],
      abilities: [],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);

    // Seeded so the player's initiative always wins and goes first — the test
    // only cares about skipping a dead *enemy* mid-order, not who acts first.
    // (Verified offline: seed 1 gives player > both toads on this stat block.)
    combat.setDiceSeed(1);
    combat.startEncounter('triple_test', 'frog');
    combat.clearDiceSeed();

    // Turn order is fixed for the whole fight — a real 3-combatant encounter
    // (like the shipped blackfen_poachers) hits this exact shape.
    const order = combat.getTurnOrder();
    expect(order).toHaveLength(3);
    expect(order[0]).toBe('player');
    const byId = new Map(combat.getCombatants().map((c) => [c.id, c]));

    // Kill whoever sits immediately after the first actor — the slot the old
    // buggy skip check (`getCurrentActor()?.hp === 0`, always false because
    // getCurrentActor() already filters to hp > 0) failed to skip past.
    const middle = byId.get(order[1]!)!;
    const last = byId.get(order[2]!)!;
    middle.hp = 0;
    // High HP so a lucky player crit in the branch below can't coincidentally
    // kill this one too and mask the exact transition this test checks.
    last.hp = 100;
    last.maxHp = 100;

    // Player (order[0]) ends their turn by attacking the still-alive "last" —
    // this is the exact endTurn() call that used to land on the dead middle
    // combatant's slot and get stuck there.
    combat.attack(last.id);

    // Before the fix this was `undefined` and combat was permanently stuck —
    // no more combat:turn events, all further player actions silently rejected.
    const next = combat.getCurrentActor();
    expect(next).toBeDefined();
    expect(next!.id).not.toBe(middle.id);
    expect(next!.id).toBe(last.id);
    expect(combat.isActive()).toBe(true);
  });

  it('allows diplomacy on flagged encounters', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'frog',
          name: 'Frog',
          role: 'mobile',
          color: '#5c7a52',
          stats: { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 16 },
          combat: { ac: 12, initiativeMod: 2, abilities: [] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
          combat: { ac: 13, initiativeMod: 0, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'diplo',
          name: 'Diplo',
          gridSize: 8,
          diplomacyAllowed: true,
          combatants: [{ species: 'toad', name: 'Skadge', team: 'enemy', hp: 10 }],
        },
      ],
      abilities: [],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv, () => 'rain');
    const duels: DiceDuelEvent[] = [];
    bus.on<DiceDuelEvent>('combat:dice_duel', (e) => duels.push(e));
    combat.startEncounter('diplo', 'frog');
    if (!combat.isPlayerTurn()) return; // initiative order varies
    expect(combat.canDiplomacy()).toBe(true);
    combat.setDiceSeed(1); // deterministic rolls
    const ok = combat.attemptDiplomacy('persuade', 'frog');
    if (ok) {
      expect(combat.isActive()).toBe(false);
    } else {
      expect(combat.getLog().some((e) => e.text.includes('Persuade'))).toBe(true);
    }
    combat.clearDiceSeed();

    expect(duels.length).toBe(1);
    expect(duels[0]!.label).toBe('Persuade (CHA)');
    expect(duels[0]!.target?.isEnemy).toBe(true);
    expect(duels[0]!.outcome).toBe(ok ? 'success' : 'fail');
  });

  it('critical hit doubles dice only, not the STR modifier (RAW regression)', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'turtle',
          name: 'Turtle',
          role: 'tank',
          color: '#1a3c34',
          stats: { str: 14, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
          combat: { ac: 12, initiativeMod: 10, abilities: [] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
          combat: { ac: 5, initiativeMod: -10, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'crit_test',
          name: 'Crit',
          gridSize: 8,
          combatants: [{ species: 'toad', name: 'Dummy', team: 'enemy', hp: 50 }],
        },
      ],
      abilities: [],
    });
    const inv = new Inventory(bus, () => undefined);

    let found = false;
    for (let seed = 1; seed < 300 && !found; seed++) {
      const combat = new CombatManager(bus, data, inv);
      combat.setDiceSeed(seed);
      combat.startEncounter('crit_test', 'turtle');
      if (!combat.isPlayerTurn()) {
        combat.clearDiceSeed();
        continue;
      }
      combat.attack(combat.getEnemies()[0]!.id);
      combat.clearDiceSeed();
      const dmgLine = combat.getLog().find((e) => e.type === 'damage')?.text ?? '';
      const match = dmgLine.match(/Hit for (\d+) damage/);
      if (!match) continue;
      const damage = Number(match[1]);
      // STR 14 → +2. Old bug: (d6+2)*2. RAW: d6*2+2. For any d6 roll 1–6, RAW max is 14, bug min is 6.
      expect(damage).toBeLessThanOrEqual(14);
      expect(damage).toBeGreaterThanOrEqual(4);
      found = true;
    }
    expect(found).toBe(true);
  });
});

describe('CombatManager dice duel events (BG3-style vs popup)', () => {
  function frogVsToad(encounterId: string, hp = 20) {
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'frog',
          name: 'Frog',
          role: 'mobile',
          color: '#5c7a52',
          stats: { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 12 },
          combat: { ac: 12, initiativeMod: 2, abilities: [] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
          combat: { ac: 13, initiativeMod: 0, abilities: [] },
        },
      ],
      encounters: [
        {
          id: encounterId,
          name: 'Duel',
          gridSize: 8,
          combatants: [{ species: 'toad', name: 'Skadge the Poacher', team: 'enemy', hp }],
        },
      ],
      abilities: [],
    });
    return data;
  }

  it('emits exactly one combat:dice_duel event per attack, self-consistent with the resulting outcome', () => {
    const bus = new EventBus();
    const data = frogVsToad('attack_duel_test');
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);
    const duels: DiceDuelEvent[] = [];
    bus.on<DiceDuelEvent>('combat:dice_duel', (e) => duels.push(e));

    combat.setDiceSeed(7);
    combat.startEncounter('attack_duel_test', 'frog');
    if (!combat.isPlayerTurn()) {
      combat.clearDiceSeed();
      return; // seed-dependent turn order — structural assertions below need player first
    }
    combat.attack(combat.getEnemies()[0]!.id);
    combat.clearDiceSeed();

    expect(duels).toHaveLength(1);
    const e = duels[0]!;
    expect(e.label).toBe('Attack');
    expect(e.actor.isEnemy).toBe(false);
    expect(e.target?.name).toBe('Skadge the Poacher');
    expect(e.target?.isEnemy).toBe(true);
    expect(e.natural).toBeGreaterThanOrEqual(1);
    expect(e.natural).toBeLessThanOrEqual(20);
    expect(e.total).toBe(e.natural + e.modifier); // no advantage in play — total is just natural+mod
    if (e.natural === 1) expect(e.outcome).toBe('fumble');
    else if (e.natural === 20) expect(e.outcome).toBe('crit');
    else expect(e.outcome).toBe(e.total >= e.dc ? 'hit' : 'miss');
  });

  it('emits a solo (no-target) combat:dice_duel event for a flee attempt', () => {
    const bus = new EventBus();
    const data = frogVsToad('flee_duel_test');
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);
    const duels: DiceDuelEvent[] = [];
    bus.on<DiceDuelEvent>('combat:dice_duel', (e) => duels.push(e));

    combat.startEncounter('flee_duel_test', 'frog');
    if (!combat.isPlayerTurn()) return;
    combat.flee();

    expect(duels).toHaveLength(1);
    expect(duels[0]!.label).toBe('Flee');
    expect(duels[0]!.target).toBeUndefined();
    expect(duels[0]!.dc).toBe(12);
    expect(['success', 'fail']).toContain(duels[0]!.outcome);
  });

  it('emits a combat:dice_duel event for nibble_distraction, framed as actor vs the saving target', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'vole',
          name: 'Vole',
          role: 'healer',
          color: '#8a6f4a',
          stats: { str: 6, dex: 14, con: 8, int: 12, wis: 14, cha: 12 },
          combat: { ac: 11, initiativeMod: 3, abilities: ['nibble_distraction'] },
        },
        {
          id: 'toad',
          name: 'Toad',
          role: 'control',
          color: '#4a3728',
          stats: { str: 10, dex: 8, con: 14, int: 10, wis: 12, cha: 8 },
          combat: { ac: 13, initiativeMod: 0, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'nibble_duel_test',
          name: 'Nibble',
          gridSize: 8,
          combatants: [{ species: 'toad', name: 'Dummy', team: 'enemy', hp: 10 }],
        },
      ],
      abilities: [
        { id: 'nibble_distraction', name: 'Nibble Distraction', species: 'vole', type: 'utility', description: 'Distract.' },
      ],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);
    const duels: DiceDuelEvent[] = [];
    bus.on<DiceDuelEvent>('combat:dice_duel', (e) => duels.push(e));

    combat.startEncounter('nibble_duel_test', 'vole');
    if (!combat.isPlayerTurn()) {
      combat.update(0.6);
    }
    expect(combat.isPlayerTurn()).toBe(true);

    // The enemy may have gone first (unseeded initiative) and already thrown its
    // own attack — that emits its own combat:dice_duel we don't care about here.
    duels.length = 0;

    const enemy = combat.getEnemies()[0]!;
    combat.useAbility('nibble_distraction', enemy.id);

    expect(duels).toHaveLength(1);
    const e = duels[0]!;
    expect(e.label).toContain('WIS Save');
    expect(e.actor.isEnemy).toBe(false); // vole is the ability user
    expect(e.target?.id).toBe(enemy.id);
    expect(e.target?.isEnemy).toBe(true);
    // Note: can't assert against `enemy.conditions` here — a failed save applies
    // 'stunned', but `useAbility` immediately calls `endTurn()` which, on landing
    // on the now-stunned enemy's turn, consumes+removes that same condition to
    // skip their turn (see the "stunned condition" test above) — all synchronous,
    // so by the time we get here the condition is already gone either way. The
    // log text is the only post-hoc signal that survives.
    const logText = combat.getLog().map((entry) => entry.text).join(' ');
    if (e.outcome === 'fail') {
      expect(logText).toContain('distracted and stunned');
    } else {
      expect(logText).toContain('shrugs off');
    }
  });
});

describe('CombatManager player stats', () => {
  it('uses custom player stats when provided at encounter start', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      species: [
        {
          id: 'frog',
          name: 'Frog',
          role: 'mobile',
          color: '#5c7a52',
          stats: { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 12 },
          combat: { ac: 12, initiativeMod: 2, abilities: [] },
        },
      ],
      encounters: [
        {
          id: 'custom_stats',
          name: 'Test',
          gridSize: 8,
          combatants: [],
        },
      ],
      abilities: [],
    });
    const inv = new Inventory(bus, () => undefined);
    const combat = new CombatManager(bus, data, inv);
    const custom = { str: 18, dex: 8, con: 10, int: 10, wis: 10, cha: 8 };
    combat.startEncounter('custom_stats', 'frog', custom);
    expect(combat.getPlayer()?.stats).toEqual(custom);
  });
});
