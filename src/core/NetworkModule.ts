import type { EventBus } from '@/core/EventBus';

export interface NetworkMessage {
  type: string;
  payload?: unknown;
}

/**
 * Phase 12 stub — WebSocket client for multiplayer.
 */
export class NetworkModule {
  private socket: WebSocket | null = null;

  constructor(private eventBus: EventBus) {}

  connect(url: string): void {
    this.socket = new WebSocket(url);
    this.socket.onmessage = (ev) => {
      const msg = JSON.parse(ev.data as string) as NetworkMessage;
      this.eventBus.emit(`net:${msg.type}`, msg.payload);
    };
    this.socket.onopen = () => this.eventBus.emit('net:connected');
    this.socket.onclose = () => this.eventBus.emit('net:disconnected');
  }

  send(type: string, payload?: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }
}
