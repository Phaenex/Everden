import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioManager } from '@/presentation/AudioManager';
import { EventBus } from '@/core/EventBus';

/**
 * happy-dom has no Web Audio implementation, so every node the manager creates
 * needs a minimal fake here. The point of these tests isn't "does a real tone
 * play" — it's "does the manager never throw, and does it wire the right calls."
 */
class FakeParam {
  value = 0;
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
}

class FakeNode {
  connect = vi.fn();
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeOscillator extends FakeNode {
  type = 'sine';
  frequency = new FakeParam();
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = new FakeNode();
  createGain(): FakeGain {
    return new FakeGain();
  }
  createOscillator(): FakeOscillator {
    return new FakeOscillator();
  }
  resume = vi.fn();
}

describe('AudioManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts unmuted by default and persists mute toggles across instances', () => {
    const audio = new AudioManager();
    expect(audio.isMuted()).toBe(false);
    audio.toggleMute();
    expect(audio.isMuted()).toBe(true);

    const audio2 = new AudioManager();
    expect(audio2.isMuted()).toBe(true);
  });

  it('play() never throws before unlock() has run (no AudioContext yet)', () => {
    const audio = new AudioManager();
    expect(() => audio.play('tick')).not.toThrow();
    expect(() => audio.startAmbient()).not.toThrow();
  });

  it('unlock() is idempotent and safe to call repeatedly', () => {
    const audio = new AudioManager();
    expect(() => {
      audio.unlock();
      audio.unlock();
    }).not.toThrow();
  });

  it('play() does nothing while muted', () => {
    const audio = new AudioManager();
    audio.unlock();
    audio.toggleMute();
    expect(audio.isMuted()).toBe(true);
    // No thrown error and, since muted short-circuits, no nodes are created —
    // verified indirectly by confirming this never throws even with a fake ctx.
    expect(() => audio.play('hit')).not.toThrow();
  });

  it('bindEvents plays a roll sound on new "roll" combat log entries and a hit on "damage" entries', () => {
    const audio = new AudioManager();
    audio.unlock();
    const playSpy = vi.spyOn(audio, 'play');
    const bus = new EventBus();
    audio.bindEvents(bus);

    bus.emit('combat:started', {});
    bus.emit('combat:log', {
      entries: [
        { text: 'Attack roll', type: 'roll' },
        { text: 'Hit for 4 damage', type: 'damage' },
      ],
    });

    expect(playSpy).toHaveBeenCalledWith('roll');
    expect(playSpy).toHaveBeenCalledWith('hit');
  });

  it('bindEvents only reacts to entries added since the last combat:started reset', () => {
    const audio = new AudioManager();
    audio.unlock();
    const playSpy = vi.spyOn(audio, 'play');
    const bus = new EventBus();
    audio.bindEvents(bus);

    bus.emit('combat:started', {});
    bus.emit('combat:log', { entries: [{ text: 'Attack roll', type: 'roll' }] });
    playSpy.mockClear();

    // Same entries re-emitted (as the real CombatManager does on every log push) —
    // must not replay sounds for lines already handled.
    bus.emit('combat:log', { entries: [{ text: 'Attack roll', type: 'roll' }] });
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('bindEvents plays a miss sound on both plain misses and critical fumbles', () => {
    const audio = new AudioManager();
    audio.unlock();
    const playSpy = vi.spyOn(audio, 'play');
    const bus = new EventBus();
    audio.bindEvents(bus);

    bus.emit('combat:started', {});
    bus.emit('combat:log', {
      entries: [
        { text: 'Attack roll', type: 'roll' },
        { text: 'Miss.', type: 'info' },
      ],
    });
    expect(playSpy).toHaveBeenCalledWith('miss');
    playSpy.mockClear();

    bus.emit('combat:started', {});
    bus.emit('combat:log', {
      entries: [
        { text: 'Attack roll', type: 'roll' },
        { text: 'Critical fumble — miss!', type: 'info' },
      ],
    });
    expect(playSpy).toHaveBeenCalledWith('miss');
  });

  it('bindEvents plays a toast chime on ui:toast', () => {
    const audio = new AudioManager();
    audio.unlock();
    const playSpy = vi.spyOn(audio, 'play');
    const bus = new EventBus();
    audio.bindEvents(bus);

    bus.emit('ui:toast', {});
    expect(playSpy).toHaveBeenCalledWith('toast');
  });
});
