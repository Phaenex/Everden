import { Room, Client } from '@colyseus/core';
import { PlayerState, NpcState, RoomState } from '../schema/RoomState.js';
import { loadSceneNav } from '../loadSceneNav.js';
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
import { validateWalkTarget } from '../services/AntiCheat.js';
import { partyService } from '../services/PartyService.js';
import { npcAuthority } from '../services/NpcAuthority.js';
import { combatAuthority } from '../services/CombatAuthority.js';
import { roomRegistry } from '../services/RoomRegistry.js';
import { characterStore } from '../services/CharacterStore.js';

const TICK_MS = 1000 / 20;
const MAX_PLAYERS = 50;

interface JoinOptions {
  sceneId?: string;
  playerId?: string;
  name?: string;
  species?: string;
  appearanceJson?: string;
  partyId?: string;
}

export class SceneRoom extends Room<RoomState> {
  private navMesh = loadSceneNav('causeway').nav;
  private movers = new Map<string, MovementState>();
  private sessionToPlayer = new Map<string, string>();

  private weatherTimer = 0;

  onCreate(options: JoinOptions): void {
    const sceneId = options.sceneId ?? 'causeway';
    const { spec, nav } = loadSceneNav(sceneId);
    this.navMesh = nav;
    this.setState(new RoomState());
    this.state.sceneId = sceneId;
    this.state.instanceId = `${sceneId}-${this.roomId.slice(0, 8)}`;
    this.state.worldMinutes = 480;
    this.state.weather = 'clear';

    for (const slot of spec.npcs) {
      npcAuthority.spawn(slot.id, slot.x, slot.z);
      const ns = new NpcState();
      ns.id = slot.id;
      ns.x = slot.x;
      ns.z = slot.z;
      this.state.npcs.set(slot.id, ns);
    }

    roomRegistry.register(this.roomId, sceneId);

    this.onMessage(NET_EVENTS.WALK, (client, payload: { x: number; z: number }) => {
      const playerId = this.sessionToPlayer.get(client.sessionId);
      if (!playerId) return;
      const p = this.state.players.get(playerId);
      const mover = this.movers.get(playerId);
      if (!p || !mover) return;
      if (
        !validateWalkTarget(p.x, p.z, payload.x, payload.z, (x, z) => this.navMesh.isWalkable(x, z))
      ) {
        return;
      }
      beginWalk(mover, this.navMesh, payload.x, payload.z);
      p.animState = 'walk';
    });

    this.onMessage(NET_EVENTS.CHAT, (client, payload: { text?: string }) => {
      const playerId = this.sessionToPlayer.get(client.sessionId);
      const p = playerId ? this.state.players.get(playerId) : undefined;
      const text = (payload?.text ?? '').slice(0, 200);
      if (!text) return;
      this.broadcast('chat', { playerId, name: p?.name ?? 'Traveler', text });
    });

    this.onMessage(NET_EVENTS.EMOTE, (client, payload: { emote?: string }) => {
      const playerId = this.sessionToPlayer.get(client.sessionId);
      if (!playerId) return;
      const p = this.state.players.get(playerId);
      if (!p) return;
      p.animState = payload?.emote === 'sit' ? 'emote_sit' : 'emote_wave';
    });

    this.onMessage(NET_EVENTS.PARTY_JOIN, (client, payload: { partyId?: string }) => {
      const playerId = this.sessionToPlayer.get(client.sessionId);
      if (!playerId || !payload.partyId) return;
      if (partyService.join(payload.partyId, playerId)) {
        const p = this.state.players.get(playerId);
        if (p) p.partyId = payload.partyId;
      }
    });

    this.onMessage(NET_EVENTS.SCENE_TRANSITION, (client, payload: { targetScene?: string }) => {
      const playerId = this.sessionToPlayer.get(client.sessionId);
      if (!playerId || !payload.targetScene) return;
      const partyId = partyService.getPartyId(playerId);
      const members = partyId ? partyService.members(partyId) : [playerId];
      for (const memberId of members) {
        const session = [...this.sessionToPlayer.entries()].find(([, id]) => id === memberId)?.[0];
        if (!session) continue;
        const targetClient = this.clients.find((c) => c.sessionId === session);
        targetClient?.send('scene_transition', { targetScene: payload.targetScene });
      }
    });

    this.onMessage(NET_EVENTS.COMBAT_ACTION, (client, payload) => {
      const playerId = this.sessionToPlayer.get(client.sessionId);
      if (!playerId) return;
      if (!combatAuthority.validateAction(this.state.sceneId, playerId, payload)) return;
      this.broadcast(NET_EVENTS.COMBAT_ACTION, { playerId, ...payload });
      combatAuthority.advanceTurn(this.state.sceneId);
    });

    this.setSimulationInterval(() => this.simTick(), TICK_MS);
  }

  onJoin(client: Client, options: JoinOptions): void {
    if (this.state.players.size >= MAX_PLAYERS) {
      client.leave(4000, 'room_full');
      return;
    }
    const playerId = options.playerId ?? client.sessionId;
    this.sessionToPlayer.set(client.sessionId, playerId);

    const stored = characterStore.load(playerId);
    const { spec } = loadSceneNav(this.state.sceneId);
    const p = new PlayerState();
    p.id = playerId;
    p.name = (stored?.name ?? options.name ?? 'Traveler').slice(0, 24);
    p.species = stored?.species ?? options.species ?? 'frog';
    p.appearanceJson = stored?.appearanceJson ?? options.appearanceJson ?? '{}';
    p.x = spec.spawn.x;
    p.z = spec.spawn.z;
    p.partyId = options.partyId ?? '';
    if (p.partyId) partyService.join(p.partyId, playerId);
    else partyService.create(`solo-${playerId}`, playerId);

    characterStore.save({
      playerId,
      name: p.name,
      species: p.species,
      appearanceJson: p.appearanceJson,
      updatedAt: Date.now(),
    });

    this.state.players.set(playerId, p);
    this.movers.set(playerId, createMovementState(p.x, p.z));
    roomRegistry.setPlayerCount(this.roomId, this.state.players.size);
  }

  async onLeave(client: Client, consented?: boolean): Promise<void> {
    if (!consented) {
      try {
        await this.allowReconnection(client, 30);
        return;
      } catch {
        // reconnection window expired — fall through to cleanup
      }
    }
    const playerId = this.sessionToPlayer.get(client.sessionId);
    if (!playerId) return;
    partyService.leave(playerId);
    this.state.players.delete(playerId);
    this.movers.delete(playerId);
    this.sessionToPlayer.delete(client.sessionId);
    roomRegistry.setPlayerCount(this.roomId, this.state.players.size);
  }

  onDispose(): void {
    roomRegistry.unregister(this.roomId);
  }

  private simTick(): void {
    const dt = TICK_MS / 1000;
    const agents = [...this.movers.entries()].map(([id, st]) => ({ id, x: st.x, z: st.z }));
    const offsets = applySeparation(agents);

    for (const [id, mover] of this.movers) {
      const moving = stepMovement(mover, this.navMesh, dt, DEFAULT_MOVEMENT_CONFIG);
      const off = offsets.get(id);
      if (off) {
        mover.x += off.x * dt;
        mover.z += off.z * dt;
      }
      const p = this.state.players.get(id);
      if (!p) continue;
      p.x = mover.x;
      p.z = mover.z;
      p.heading = mover.heading;
      p.animState = moving ? 'walk' : p.animState === 'walk' ? 'idle' : p.animState;
      if (!moving) cancelWalk(mover);
    }

    const npcSnaps = npcAuthority.tick(this.navMesh, dt);
    for (const snap of npcSnaps) {
      let ns = this.state.npcs.get(snap.id);
      if (!ns) {
        ns = new NpcState();
        ns.id = snap.id;
        this.state.npcs.set(snap.id, ns);
      }
      ns.x = snap.x;
      ns.z = snap.z;
    }
    this.state.worldMinutes += dt * 2;
    this.weatherTimer += dt;
    if (this.weatherTimer >= 90) {
      this.weatherTimer = 0;
      this.state.weather = this.state.weather === 'clear' ? 'rain' : 'clear';
    }
    void roomRegistry.publishHeartbeat(this.roomId);
  }
}
