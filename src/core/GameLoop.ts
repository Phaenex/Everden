import type { IGameModule } from './IGameModule';

/**
 * Fixed-timestep game loop with render interpolation.
 */
export class GameLoop {
  private modules: IGameModule[] = [];
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;
  readonly fixedDt = 1 / 60;

  addModule(module: IGameModule): void {
    this.modules.push(module);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.tick();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (): void => {
    if (!this.running) return;
    const now = performance.now();
    const frameDt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.accumulator += frameDt;

    while (this.accumulator >= this.fixedDt) {
      for (const mod of this.modules) {
        mod.update(this.fixedDt);
      }
      this.accumulator -= this.fixedDt;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}
