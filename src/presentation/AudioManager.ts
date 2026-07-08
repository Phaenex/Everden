import type { EventBus } from '@/core/EventBus';
import type { CombatLogEntry } from '@/gameplay/CombatManager';

export type SfxId = 'tick' | 'roll' | 'hit' | 'miss' | 'heal' | 'toast';

const MUTE_KEY = 'everden_muted';

/**
 * Every sound here is synthesized with oscillators/gain envelopes — no audio
 * files to fetch, license, or ship. Keeps the audio pass entirely self-contained
 * and consistent with the "never break on a missing asset" philosophy used for art.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientStopFns: Array<() => void> = [];
  private muted: boolean;
  private lastCombatLogLen = 0;

  constructor() {
    this.muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === 'true';
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem(MUTE_KEY, String(this.muted));
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  /**
   * Browsers block audio until a user gesture. Call this directly inside a
   * click handler (e.g. the title screen's Start button) — never on a timer
   * or on load, or the AudioContext will start (and stay) suspended.
   */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
    const Ctx = window.AudioContext ?? w.webkitAudioContext;
    if (!Ctx) return; // no Web Audio support — game must still work silently
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
  }

  /** Soft two-drone marsh pad, gently modulated. Safe to call more than once. */
  startAmbient(): void {
    if (!this.ctx || !this.master || this.ambientStopFns.length > 0) return;
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.16;
    gain.connect(this.master);
    this.ambientGain = gain;

    const droneA = ctx.createOscillator();
    droneA.type = 'sine';
    droneA.frequency.value = 82;
    const droneB = ctx.createOscillator();
    droneB.type = 'sine';
    droneB.frequency.value = 123.5; // slightly detuned fifth — soft beating, not a chord

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    droneA.connect(gain);
    droneB.connect(gain);
    droneA.start();
    droneB.start();
    lfo.start();

    this.ambientStopFns = [() => droneA.stop(), () => droneB.stop(), () => lfo.stop()];
  }

  stopAmbient(): void {
    for (const stop of this.ambientStopFns) stop();
    this.ambientStopFns = [];
    this.ambientGain = null;
  }

  private setWeatherIntensity(weather: string): void {
    if (!this.ambientGain || !this.ctx) return;
    const target = weather === 'rain' ? 0.26 : weather === 'fog' ? 0.12 : 0.16;
    this.ambientGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 1.5);
  }

  play(id: SfxId): void {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(this.master);
    const osc = ctx.createOscillator();
    osc.connect(gain);

    const shapes: Record<SfxId, () => void> = {
      tick: () => {
        osc.type = 'square';
        osc.frequency.setValueAtTime(720, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      },
      roll: () => {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      },
      hit: () => {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      },
      miss: () => {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      },
      heal: () => {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.2);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      },
      toast: () => {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      },
    };
    shapes[id]();
  }

  /** Self-subscribes to the events it cares about — nothing else needs to know audio exists. */
  bindEvents(eventBus: EventBus): void {
    eventBus.on<{ weather: string }>('weather:changed', ({ weather }) => this.setWeatherIntensity(weather));
    eventBus.on('combat:started', () => {
      this.lastCombatLogLen = 0;
    });
    eventBus.on<{ entries: CombatLogEntry[] }>('combat:log', ({ entries }) => {
      for (let i = this.lastCombatLogLen; i < entries.length; i++) {
        const entry = entries[i]!;
        if (entry.type === 'roll') this.play('roll');
        else if (entry.type === 'damage') this.play('hit');
        else if (entry.type === 'info' && /miss|fumble/i.test(entry.text)) this.play('miss');
        else if (entry.type === 'info' && /tends .* wounds/.test(entry.text)) this.play('heal');
      }
      this.lastCombatLogLen = entries.length;
    });
    eventBus.on('ui:toast', () => this.play('toast'));
  }
}
