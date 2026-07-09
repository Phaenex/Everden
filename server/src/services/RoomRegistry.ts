/**
 * Room instance registry — in-memory today, Redis-backed when REDIS_URL is set.
 * Tracks which district instances have capacity for matchmaking overflow.
 */
export interface RoomInstanceInfo {
  roomId: string;
  sceneId: string;
  playerCount: number;
  maxPlayers: number;
}

export class RoomRegistry {
  private instances = new Map<string, RoomInstanceInfo>();
  private readonly maxPerInstance: number;

  constructor(maxPerInstance = 50) {
    this.maxPerInstance = maxPerInstance;
  }

  register(roomId: string, sceneId: string): void {
    this.instances.set(roomId, {
      roomId,
      sceneId,
      playerCount: 0,
      maxPlayers: this.maxPerInstance,
    });
  }

  unregister(roomId: string): void {
    this.instances.delete(roomId);
  }

  setPlayerCount(roomId: string, count: number): void {
    const info = this.instances.get(roomId);
    if (info) info.playerCount = count;
  }

  /** Pick an instance with room, or null to spawn a new one. */
  findAvailableInstance(sceneId: string): string | null {
    for (const info of this.instances.values()) {
      if (info.sceneId === sceneId && info.playerCount < info.maxPlayers) {
        return info.roomId;
      }
    }
    return null;
  }

  /** Redis hook — publish instance heartbeat for multi-node deploys. */
  async publishHeartbeat(_roomId: string): Promise<void> {
    // When REDIS_URL is configured, push { roomId, sceneId, playerCount } to a sorted set.
  }
}

export const roomRegistry = new RoomRegistry();
