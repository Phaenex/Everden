/** Interpolate remote player positions with a short jitter buffer. */
export interface RemoteSnapshot {
  x: number;
  z: number;
  heading: number;
  t: number;
}

export class InterpolationBuffer {
  private snapshots: RemoteSnapshot[] = [];
  private readonly delayMs: number;

  constructor(delayMs = 120) {
    this.delayMs = delayMs;
  }

  push(x: number, z: number, heading: number, t = performance.now()): void {
    this.snapshots.push({ x, z, heading, t });
    if (this.snapshots.length > 24) this.snapshots.shift();
  }

  sample(now = performance.now()): RemoteSnapshot | null {
    if (this.snapshots.length === 0) return null;
    const target = now - this.delayMs;
    let prev: RemoteSnapshot | null = null;
    let next: RemoteSnapshot | null = null;
    for (const s of this.snapshots) {
      if (s.t <= target) prev = s;
      if (s.t >= target) {
        next = s;
        break;
      }
    }
    if (!prev) return this.snapshots[0]!;
    if (!next) return prev;
    const span = next.t - prev.t || 1;
    const a = Math.min(1, Math.max(0, (target - prev.t) / span));
    return {
      x: prev.x + (next.x - prev.x) * a,
      z: prev.z + (next.z - prev.z) * a,
      heading: prev.heading + (next.heading - prev.heading) * a,
      t: target,
    };
  }

  clear(): void {
    this.snapshots = [];
  }
}
