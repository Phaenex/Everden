import type { EventBus } from '@/core/EventBus';
import type { IGameModule } from '@/core/IGameModule';
import type { SceneManager } from '@/presentation/SceneManager';

/** Applies authoritative NPC positions from the server room state. */
export class NpcSyncManager implements IGameModule {
  constructor(
    private eventBus: EventBus,
    private sceneManager: SceneManager,
  ) {}

  init(): void {
    this.eventBus.on<{ npcs: Array<{ id: string; x: number; z: number }> }>('net:npc_positions', ({ npcs }) => {
      for (const n of npcs) {
        const g = this.sceneManager.getNPCGroup(n.id);
        if (g) g.position.set(n.x, 0, n.z);
      }
    });
  }

  update(): void {}
  dispose(): void {}
}
