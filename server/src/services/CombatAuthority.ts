import type { CombatActionPayload } from '../../../shared/protocol.js';

export interface Combatant {
  id: string;
  team: 'player' | 'enemy' | 'ally';
  hp: number;
  speciesId: string;
}

/** Minimal authoritative combat session — turn order + action validation. */
export class CombatAuthority {
  private encounters = new Map<string, { order: string[]; turn: number; combatants: Map<string, Combatant> }>();

  start(encounterId: string, combatants: Combatant[]): void {
    const map = new Map(combatants.map((c) => [c.id, c]));
    this.encounters.set(encounterId, {
      order: combatants.map((c) => c.id),
      turn: 0,
      combatants: map,
    });
  }

  validateAction(encounterId: string, actorId: string, payload: CombatActionPayload): boolean {
    const enc = this.encounters.get(encounterId);
    if (!enc) return false;
    if (enc.order[enc.turn % enc.order.length] !== actorId) return false;
    const actor = enc.combatants.get(actorId);
    if (!actor || actor.hp <= 0) return false;
    if (payload.action === 'useAbility' && !payload.abilityId) return false;
    return true;
  }

  advanceTurn(encounterId: string): string | null {
    const enc = this.encounters.get(encounterId);
    if (!enc) return null;
    enc.turn = (enc.turn + 1) % enc.order.length;
    return enc.order[enc.turn] ?? null;
  }

  end(encounterId: string): void {
    this.encounters.delete(encounterId);
  }
}

export const combatAuthority = new CombatAuthority();
