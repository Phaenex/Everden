import type { EventBus } from '@/core/EventBus';
import type { IGameModule } from '@/core/IGameModule';
import type { SceneManager } from '@/presentation/SceneManager';
import { createCharacterActor } from '@/presentation/SpriteActor';
import type { WardrobeDefinition } from '@/data/types';
import { InterpolationBuffer } from './InterpolationBuffer';

export interface RemotePlayerState {
  id: string;
  name: string;
  species: string;
  x: number;
  z: number;
  heading: number;
  animState: string;
  appearanceJson?: string;
}

/**
 * Spawns and updates remote player billboards from network state patches.
 */
export class RemotePlayerManager implements IGameModule {
  private buffers = new Map<string, InterpolationBuffer>();
  private known = new Map<string, RemotePlayerState>();

  constructor(
    private eventBus: EventBus,
    private sceneManager: SceneManager,
    private wardrobe: WardrobeDefinition[],
    private localPlayerId: string,
  ) {}

  init(): void {
    this.eventBus.on<{ players: RemotePlayerState[] }>('net:room_players', ({ players }) => {
      void this.syncPlayers(players);
    });
    this.eventBus.on<RemotePlayerState>('net:player_joined', (p) => {
      void this.ensureActor(p);
    });
    this.eventBus.on<{ id: string }>('net:player_left', ({ id }) => {
      this.remove(id);
    });
    this.eventBus.on<RemotePlayerState>('net:player_moved', (p) => {
      if (p.id === this.localPlayerId) return;
      this.known.set(p.id, p);
      const buf = this.buffers.get(p.id) ?? new InterpolationBuffer();
      if (!this.buffers.has(p.id)) this.buffers.set(p.id, buf);
      buf.push(p.x, p.z, p.heading);
    });
    this.eventBus.on('net:disconnected', () => this.clearAll());
  }

  update(_dt: number): void {
    const agents: Array<{ id: string; x: number; z: number }> = [];
    for (const [id, buf] of this.buffers) {
      const sample = buf.sample();
      if (!sample) continue;
      this.sceneManager.setRemotePlayerPosition(id, sample.x, sample.z, sample.heading);
      agents.push({ id, x: sample.x, z: sample.z });
    }
    this.eventBus.emit('crowd:agents', { agents });
  }

  dispose(): void {
    this.clearAll();
  }

  private async syncPlayers(players: RemotePlayerState[]): Promise<void> {
    const ids = new Set(players.map((p) => p.id));
    for (const p of players) {
      if (p.id === this.localPlayerId) continue;
      await this.ensureActor(p);
      const buf = this.buffers.get(p.id) ?? new InterpolationBuffer();
      buf.push(p.x, p.z, p.heading);
      this.buffers.set(p.id, buf);
    }
    for (const id of [...this.known.keys()]) {
      if (!ids.has(id)) this.remove(id);
    }
  }

  private async ensureActor(p: RemotePlayerState): Promise<void> {
    if (p.id === this.localPlayerId) return;
    if (this.sceneManager.getRemoteGroup(p.id)) {
      this.known.set(p.id, p);
      return;
    }
    let appearance;
    try {
      appearance = p.appearanceJson ? JSON.parse(p.appearanceJson) : undefined;
    } catch {
      appearance = undefined;
    }
    const { group, label } = createCharacterActor(
      p.species,
      p.name,
      appearance?.variant ?? 0,
      undefined,
      appearance,
      this.wardrobe,
      this.eventBus,
    );
    group.position.set(p.x, 0, p.z);
    group.userData.remotePlayer = true;
    group.name = `remote:${p.id}`;
    this.sceneManager.addRemotePlayerActor(p.id, group, label);
    this.known.set(p.id, p);
    if (!this.buffers.has(p.id)) this.buffers.set(p.id, new InterpolationBuffer());
  }

  private remove(id: string): void {
    this.sceneManager.removeRemotePlayerActor(id);
    this.buffers.delete(id);
    this.known.delete(id);
  }

  private clearAll(): void {
    for (const id of [...this.known.keys()]) this.remove(id);
  }
}
