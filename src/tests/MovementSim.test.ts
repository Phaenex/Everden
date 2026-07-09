import { describe, it, expect } from 'vitest';
import { NavMesh } from '@/engine/NavMesh';
import {
  beginWalk,
  createMovementState,
  DEFAULT_MOVEMENT_CONFIG,
  stepMovement,
} from '../../shared/movement/MovementSim';

const SQUARE = [
  { x: -5, z: -5 },
  { x: 5, z: -5 },
  { x: 5, z: 5 },
  { x: -5, z: 5 },
];

describe('MovementSim', () => {
  it('steps toward a walk target deterministically', () => {
    const nav = new NavMesh(SQUARE);
    const st = createMovementState(0, 0);
    expect(beginWalk(st, nav, 3, 0)).toBe(true);
    for (let i = 0; i < 120; i++) stepMovement(st, nav, 1 / 60, DEFAULT_MOVEMENT_CONFIG);
    expect(st.x).toBeGreaterThan(2.5);
    expect(Math.abs(st.z)).toBeLessThan(0.5);
  });
});
