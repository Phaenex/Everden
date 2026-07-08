import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { NavMesh } from '@/engine/NavMesh';
import { NpcPathFollower } from '@/engine/NpcPathFollower';

const rect = [
  { x: -4, z: -4 },
  { x: 4, z: -4 },
  { x: 4, z: 4 },
  { x: -4, z: 4 },
];

describe('NpcPathFollower', () => {
  let follower: NpcPathFollower;
  let nav: NavMesh;

  beforeEach(() => {
    follower = new NpcPathFollower();
    nav = new NavMesh(rect);
    follower.setNavMesh(nav);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('moves a group toward the destination over update ticks', () => {
    const group = new THREE.Group();
    group.position.set(-3, 0, -3);
    let arrived = false;

    const ok = follower.walkTo('npc_a', group, 3, 3, () => {
      arrived = true;
    });
    expect(ok).toBe(true);
    expect(follower.isWalking('npc_a')).toBe(true);

    for (let i = 0; i < 200 && follower.isWalking('npc_a'); i++) {
      follower.update(1 / 30);
    }

    expect(arrived).toBe(true);
    expect(Math.hypot(group.position.x - 3, group.position.z - 3)).toBeLessThan(0.35);
  });

  it('calls onArrive immediately when already at the destination', () => {
    const group = new THREE.Group();
    group.position.set(1, 0, 1);
    let arrived = false;
    follower.walkTo('npc_b', group, 1, 1, () => {
      arrived = true;
    });
    expect(arrived).toBe(true);
    expect(follower.isWalking('npc_b')).toBe(false);
  });
});
