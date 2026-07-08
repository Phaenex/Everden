import type { EventBus } from '@/core/EventBus';

/**
 * Routes clock events to simulation subsystems.
 */
export class TickScheduler {
  constructor(private eventBus: EventBus) {}

  init(): void {
    this.eventBus.on('time:hour', () => {
      this.eventBus.emit('tick:hour');
    });
    this.eventBus.on('time:day', (payload) => {
      this.eventBus.emit('tick:day', payload);
    });
    this.eventBus.on('time:season', (payload) => {
      this.eventBus.emit('tick:season', payload);
    });
  }
}
