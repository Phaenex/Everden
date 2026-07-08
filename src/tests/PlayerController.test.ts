import { describe, it, expect, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { EventBus } from '@/core/EventBus';
import { PlayerController, type InteractableTarget } from '@/gameplay/PlayerController';

// GameCursors builds its cursor data URLs from a real 2D canvas context at module load —
// jsdom doesn't implement CanvasRenderingContext2D, so stub it out; this test only cares
// about interaction/[E] logic, not cursor rendering.
vi.mock('@/presentation/GameCursors', () => ({
  GAME_CURSORS: { walk: 'walk', interact: 'interact', combat: 'combat', default: 'default' },
}));

function makeTarget(overrides: Partial<InteractableTarget> = {}): InteractableTarget {
  return {
    id: 'npc1',
    label: 'Talk to NPC',
    type: 'npc',
    position: new THREE.Vector3(0, 0, 0),
    radius: 1,
    ...overrides,
  };
}

describe('PlayerController — [E] interaction', () => {
  let controller: PlayerController;

  afterEach(() => {
    controller?.dispose();
  });

  function setup() {
    const bus = new EventBus();
    controller = new PlayerController(bus);
    const deps = {
      navigation: { position: new THREE.Vector3(0, 0, 0) } as never,
      sceneManager: {} as never,
      canvas: document.createElement('canvas'),
      onPickFailed: () => {},
    };
    controller.bind(deps);
    controller.init();
    return { bus, controller };
  }

  it('emits interaction:use on [E] when a target is in range', () => {
    const { bus } = setup();
    controller.registerInteractable(makeTarget());
    controller.update(0);

    const uses: unknown[] = [];
    bus.on('interaction:use', (t) => uses.push(t));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    expect(uses).toHaveLength(1);
  });

  it('does not emit [E] when no interactable is registered nearby (regression: prompt/E firing with nothing around)', () => {
    const { bus } = setup();
    controller.update(0);

    const uses: unknown[] = [];
    bus.on('interaction:use', (t) => uses.push(t));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    expect(uses).toHaveLength(0);
  });

  it('ignores [E] while a dialogue/confirm/combat panel is open (regression: mashing E could queue a second trigger, e.g. re-starting combat mid-confirm)', () => {
    const { bus } = setup();
    controller.registerInteractable(makeTarget());
    controller.update(0);

    bus.emit('dialogue:opened', {});

    const uses: unknown[] = [];
    bus.on('interaction:use', (t) => uses.push(t));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    expect(uses).toHaveLength(0);

    bus.emit('dialogue:closed', {});
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    expect(uses).toHaveLength(1);
  });

  it('does not register a target as nearest once the player is outside its radius (regression: oversized radii kept the prompt live across most of a district)', () => {
    const { bus } = setup();
    controller.registerInteractable(makeTarget({ position: new THREE.Vector3(5, 0, 5), radius: 1 }));
    controller.update(0);

    const uses: unknown[] = [];
    bus.on('interaction:use', (t) => uses.push(t));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    expect(uses).toHaveLength(0);
  });
});
