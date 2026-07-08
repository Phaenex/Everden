export type EventCallback<T = unknown> = (payload: T) => void;

/**
 * Typed publish/subscribe bus for decoupled game systems.
 */
export class EventBus {
  private listeners = new Map<string, Set<EventCallback>>();

  on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);
    return () => this.off(event, callback);
  }

  off<T>(event: string, callback: EventCallback<T>): void {
    this.listeners.get(event)?.delete(callback as EventCallback);
  }

  emit<T>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of set) {
      cb(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
