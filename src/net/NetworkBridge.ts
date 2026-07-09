import type { EventBus } from '@/core/EventBus';
import type { IGameModule } from '@/core/IGameModule';
import type { NavigationController } from '@/engine/NavigationController';
import type { PlayerProfile } from '@/gameplay/PlayerProfile';
import { NET_EVENTS, type ChatPayload, type WalkIntentPayload } from '../../shared/protocol';
import { getOrCreatePlayerId } from './PlayerIdentity';

type ColyseusRoom = {
  send: (type: string, payload?: unknown) => void;
  leave: (consented?: boolean) => void;
  onMessage: (type: string, cb: (payload: unknown) => void) => void;
  onStateChange: (cb: (state: RoomStateView) => void) => void;
  state: RoomStateView;
};

type RoomStateView = {
  sceneId: string;
  worldMinutes: number;
  weather: string;
  players: Map<string, PlayerSchemaView> | Record<string, PlayerSchemaView>;
  npcs: Map<string, NpcSchemaView> | Record<string, NpcSchemaView>;
};

type PlayerSchemaView = {
  id: string;
  name: string;
  species: string;
  x: number;
  z: number;
  heading: number;
  animState: string;
  appearanceJson: string;
};

type NpcSchemaView = { id: string; x: number; z: number };

/**
 * Colyseus client bridge — joins scene rooms, relays walk intents, publishes remote state.
 * Offline when VITE_COLYSEUS_URL is unset.
 */
export class NetworkBridge implements IGameModule {
  private client: { joinOrCreate: (name: string, opts: Record<string, unknown>) => Promise<ColyseusRoom> } | null =
    null;
  private room: ColyseusRoom | null = null;
  private enabled = false;
  private pendingScene: string | null = null;
  readonly playerId: string;

  constructor(
    private eventBus: EventBus,
    private navigation: NavigationController,
    private profile: PlayerProfile,
  ) {
    this.playerId = getOrCreatePlayerId();
  }

  async init(): Promise<void> {
    const url = import.meta.env.VITE_COLYSEUS_URL as string | undefined;
    if (!url) return;

    try {
      const { Client } = await import('colyseus.js');
      this.client = new Client(url);
      this.enabled = true;
      this.eventBus.on('game:ready', () => void this.joinCurrentScene('causeway'));
      this.eventBus.on<{ sceneId: string }>('scene:loaded', ({ sceneId }) => void this.joinCurrentScene(sceneId));
      this.eventBus.on<{ x: number; z: number }>('player:walk_intent', (p) => {
        this.sendWalk(p.x, p.z);
      });
      this.eventBus.on<{ emote: string }>('player:emote', ({ emote }) => {
        this.sendEmote(emote);
      });
      this.eventBus.on<ChatPayload>('chat:send', (payload) => {
        this.room?.send(NET_EVENTS.CHAT, payload);
      });
      this.eventBus.on<{ targetScene: string; exitId?: string }>('scene:transition_request', (p) => {
        this.room?.send(NET_EVENTS.SCENE_TRANSITION, {
          targetScene: p.targetScene,
          exitId: p.exitId ?? '',
        });
      });
    } catch (err) {
      console.warn('[NetworkBridge] multiplayer unavailable', err);
    }
  }

  dispose(): void {
    void this.room?.leave(true);
    this.room = null;
  }

  update(): void {}

  isOnline(): boolean {
    return this.enabled && this.room !== null;
  }

  sendWalk(x: number, z: number): void {
    if (!this.room) return;
    const payload: WalkIntentPayload = { x, z };
    this.room.send(NET_EVENTS.WALK, payload);
  }

  sendEmote(emote: string): void {
    this.room?.send(NET_EVENTS.EMOTE, { emote });
  }

  private async joinCurrentScene(sceneId: string): Promise<void> {
    if (!this.client || !this.enabled) return;
    try {
      if (this.room) await this.room.leave(true);
      const room = await this.client.joinOrCreate('scene', {
        sceneId,
        playerId: this.playerId,
        name: this.profile.name,
        species: this.profile.species,
        appearanceJson: JSON.stringify(this.profile.appearance),
      });
      this.room = room;
      this.eventBus.emit('net:connected', { sceneId });
      room.onMessage('chat', (payload) => {
        this.eventBus.emit('chat:receive', payload);
      });
      room.onMessage('scene_transition', (payload: unknown) => {
        const p = payload as { targetScene?: string };
        if (p?.targetScene) {
          this.pendingScene = p.targetScene;
          this.eventBus.emit('scene:server_transition', { sceneId: p.targetScene });
        }
      });
      room.onStateChange((state) => this.publishState(state));
      this.publishState(room.state);
      if (this.pendingScene) {
        const target = this.pendingScene;
        this.pendingScene = null;
        this.eventBus.emit('scene:server_transition', { sceneId: target });
      }
    } catch (err) {
      console.warn('[NetworkBridge] room join failed', err);
      this.eventBus.emit('net:disconnected');
    }
  }

  private publishState(state: RoomStateView): void {
    const raw = state.players;
    const entries: PlayerSchemaView[] =
      raw instanceof Map ? [...raw.values()] : Object.values(raw ?? {});
    const players = entries.map((p) => ({
      id: p.id,
      name: p.name,
      species: p.species,
      x: p.x,
      z: p.z,
      heading: p.heading,
      animState: p.animState,
      appearanceJson: p.appearanceJson,
    }));
    this.eventBus.emit('net:room_players', { players });

    const npcRaw = state.npcs;
    const npcEntries: NpcSchemaView[] =
      npcRaw instanceof Map ? [...npcRaw.values()] : Object.values(npcRaw ?? {});
    this.eventBus.emit('net:npc_positions', { npcs: npcEntries });

    if (state.weather) {
      this.eventBus.emit('net:weather', { weather: state.weather, worldMinutes: state.worldMinutes });
    }

    for (const p of players) {
      if (p.id === this.playerId) {
        this.navigation.reconcilePosition(p.x, p.z, p.heading);
        continue;
      }
      this.eventBus.emit('net:player_moved', p);
    }
  }
}
