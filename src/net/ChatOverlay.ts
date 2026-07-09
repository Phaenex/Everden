import type { EventBus } from '@/core/EventBus';
import type { IGameModule } from '@/core/IGameModule';
import type { SceneManager } from '@/presentation/SceneManager';
import type { NavigationController } from '@/engine/NavigationController';
import { NET_EVENTS } from '../../shared/protocol';

const PROXIMITY_RADIUS = 8;
const BUBBLE_MS = 5000;

interface ChatMessage {
  playerId?: string;
  name: string;
  text: string;
}

/**
 * Room chat log + proximity speech bubbles above nearby remote players.
 */
export class ChatOverlay implements IGameModule {
  private logEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private inputOpen = false;
  private bubbles = new Map<string, { el: HTMLElement; timer: ReturnType<typeof setTimeout> }>();
  private remotePositions = new Map<string, { x: number; z: number; name: string }>();

  constructor(
    private eventBus: EventBus,
    private sceneManager: SceneManager,
    private navigation: NavigationController,
    private localPlayerId: string,
  ) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-overlay';
    this.logEl = document.createElement('div');
    this.logEl.className = 'chat-log';
    wrap.append(this.logEl);
    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.className = 'chat-input hidden';
    this.inputEl.placeholder = 'Say something… (Enter to send, Esc to close)';
    this.inputEl.maxLength = 200;
    wrap.append(this.inputEl);
    document.getElementById('ui-root')?.append(wrap);

    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = this.inputEl.value.trim();
        if (text) this.eventBus.emit('chat:send', { text });
        this.inputEl.value = '';
        this.closeInput();
      } else if (e.key === 'Escape') {
        this.closeInput();
      }
    });
  }

  init(): void {
    window.addEventListener('keydown', this.onKeyDown);
    this.eventBus.on<ChatMessage>('chat:receive', (msg) => this.onChat(msg));
    this.eventBus.on<{ players: Array<{ id: string; name: string; x: number; z: number }> }>(
      'net:room_players',
      ({ players }) => {
        this.remotePositions.clear();
        for (const p of players) {
          if (p.id === this.localPlayerId) continue;
          this.remotePositions.set(p.id, { x: p.x, z: p.z, name: p.name });
        }
      },
    );
    this.eventBus.on<{ id: string; name: string; x: number; z: number }>('net:player_moved', (p) => {
      if (p.id === this.localPlayerId) return;
      this.remotePositions.set(p.id, { x: p.x, z: p.z, name: p.name });
    });
  }

  update(): void {
    for (const [id, bubble] of this.bubbles) {
      const pos = this.remotePositions.get(id);
      if (!pos) continue;
      const screen = this.sceneManager.projectToScreen(pos.x, pos.z, 2.2);
      bubble.el.style.left = `${screen.x}px`;
      bubble.el.style.top = `${screen.y - 28}px`;
    }
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    for (const b of this.bubbles.values()) clearTimeout(b.timer);
    this.bubbles.clear();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key.toLowerCase() === 't' && !this.isTypingInForm()) {
      e.preventDefault();
      this.openInput();
    }
  };

  private isTypingInForm(): boolean {
    if (this.inputOpen) return true;
    const tag = (document.activeElement?.tagName ?? '').toLowerCase();
    return tag === 'input' || tag === 'textarea';
  }

  private openInput(): void {
    this.inputOpen = true;
    this.inputEl.classList.remove('hidden');
    this.inputEl.focus();
  }

  private closeInput(): void {
    this.inputOpen = false;
    this.inputEl.classList.add('hidden');
    this.inputEl.blur();
  }

  private onChat(msg: ChatMessage): void {
    const line = document.createElement('div');
    line.className = 'chat-line';
    line.textContent = `${msg.name}: ${msg.text}`;
    this.logEl.append(line);
    this.logEl.scrollTop = this.logEl.scrollHeight;
    while (this.logEl.childElementCount > 40) {
      this.logEl.firstChild?.remove();
    }

    const playerId = msg.playerId;
    if (!playerId || playerId === this.localPlayerId) return;
    const pos = this.remotePositions.get(playerId);
    const local = this.navigation.position;
    if (pos && Math.hypot(pos.x - local.x, pos.z - local.z) > PROXIMITY_RADIUS) return;
    this.showBubble(playerId, msg.text);
  }

  private showBubble(playerId: string, text: string): void {
    const prev = this.bubbles.get(playerId);
    if (prev) {
      clearTimeout(prev.timer);
      prev.el.remove();
    }
    const el = document.createElement('div');
    el.className = 'chat-bubble';
    el.textContent = text.slice(0, 80);
    document.body.append(el);
    const timer = setTimeout(() => {
      el.remove();
      this.bubbles.delete(playerId);
    }, BUBBLE_MS);
    this.bubbles.set(playerId, { el, timer });
  }
}

export { NET_EVENTS };