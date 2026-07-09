import {
  beginWalk,
  cancelWalk,
  createMovementState,
  DEFAULT_MOVEMENT_CONFIG,
  stepMovement,
  type MovementState,
} from '../../../shared/movement/MovementSim.js';
import { applySeparation } from '../../../shared/movement/Separation.js';
import { NET_EVENTS } from '../../../shared/protocol.js';
import { loadSceneNav } from '../loadSceneNav.js';
import { validateWalkTarget } from '../services/AntiCheat.js';
import { partyService } from '../services/PartyService.js';

export interface NpcSnapshot {
  id: string;
  x: number;
  z: number;
}

/** Server-side NPC positions (authoritative broadcast via room state extensions later). */
export class NpcAuthority {
  private npcs = new Map<string, MovementState>();

  spawn(id: string, x: number, z: number): void {
    this.npcs.set(id, createMovementState(x, z));
  }

  remove(id: string): void {
    this.npcs.delete(id);
  }

  walk(id: string, nav: ReturnType<typeof loadSceneNav>['nav'], x: number, z: number): void {
    const st = this.npcs.get(id);
    if (!st) return;
    beginWalk(st, nav, x, z);
  }

  tick(nav: ReturnType<typeof loadSceneNav>['nav'], dt: number): NpcSnapshot[] {
    const out: NpcSnapshot[] = [];
    const agents = [...this.npcs.entries()].map(([id, st]) => ({ id, x: st.x, z: st.z }));
    const offsets = applySeparation(agents);
    for (const [id, st] of this.npcs) {
      stepMovement(st, nav, dt, { ...DEFAULT_MOVEMENT_CONFIG, maxSpeed: 3.1 });
      const off = offsets.get(id);
      if (off) {
        st.x += off.x * dt;
        st.z += off.z * dt;
      }
      out.push({ id, x: st.x, z: st.z });
    }
    return out;
  }
}

export const npcAuthority = new NpcAuthority();
