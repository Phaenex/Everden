import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { NetworkModule } from '@/core/NetworkModule';

class MockWebSocket {
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: string[] = [];
  url = '';

  constructor(url: string) {
    this.url = url;
    MockWebSocket.last = this;
  }

  static last: MockWebSocket | null = null;

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.onclose?.();
  }

  simulateOpen(): void {
    this.onopen?.();
  }

  simulateMessage(payload: unknown): void {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent);
  }
}

describe('NetworkModule (Phase 12 stub)', () => {
  beforeEach(() => {
    MockWebSocket.last = null;
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('emits net:connected on socket open and relays typed messages on the EventBus', () => {
    const bus = new EventBus();
    const net = new NetworkModule(bus);
    const connected: unknown[] = [];
    const chat: unknown[] = [];
    bus.on('net:connected', () => connected.push(true));
    bus.on('net:chat', (p) => chat.push(p));

    net.connect('wss://example.test/everden');
    expect(MockWebSocket.last?.url).toBe('wss://example.test/everden');

    MockWebSocket.last!.simulateOpen();
    expect(connected).toHaveLength(1);

    MockWebSocket.last!.simulateMessage({ type: 'chat', payload: { text: 'croak' } });
    expect(chat).toEqual([{ text: 'croak' }]);
  });

  it('send() JSON-encodes messages only when the socket is open', () => {
    const net = new NetworkModule(new EventBus());
    net.connect('wss://example.test/everden');
    MockWebSocket.last!.simulateOpen();

    net.send('move', { x: 1, z: 2 });
    expect(MockWebSocket.last!.sent).toEqual([JSON.stringify({ type: 'move', payload: { x: 1, z: 2 } })]);

    net.disconnect();
    net.send('move', { x: 3, z: 4 });
    expect(MockWebSocket.last!.sent).toHaveLength(1);
  });
});
