import { describe, expect, it } from 'vitest';
import { NavMesh, navPolygonBounds, pointInPolygon } from '@/engine/NavMesh';

const rect: { x: number; z: number }[] = [
  { x: -2, z: -2 },
  { x: 2, z: -2 },
  { x: 2, z: 2 },
  { x: -2, z: 2 },
];

describe('NavMesh', () => {
  it('pointInPolygon detects inside vs outside', () => {
    expect(pointInPolygon(0, 0, rect)).toBe(true);
    expect(pointInPolygon(3, 0, rect)).toBe(false);
  });

  it('navPolygonBounds computes play area from polygon', () => {
    const b = navPolygonBounds(rect);
    expect(b.width).toBe(4);
    expect(b.depth).toBe(4);
    expect(b.cx).toBe(0);
    expect(b.cz).toBe(0);
  });

  it('isWalkable respects polygon bounds', () => {
    const nav = new NavMesh(rect);
    expect(nav.isWalkable(0, 0)).toBe(true);
    expect(nav.isWalkable(5, 5)).toBe(false);
  });

  it('findPath returns waypoints inside walkable area', () => {
    const nav = new NavMesh(rect);
    const path = nav.findPath({ x: -1.5, z: -1.5 }, { x: 1.5, z: 1.5 });
    expect(path.length).toBeGreaterThan(0);
    for (const p of path) {
      expect(nav.isWalkable(p.x, p.z)).toBe(true);
    }
  });

  it('findPath uses a direct line inside convex polygons (no grid stepping)', () => {
    const nav = new NavMesh(rect);
    const from = { x: -1.5, z: -1.5 };
    const to = { x: 1.5, z: 1.5 };
    const path = nav.findPath(from, to);
    expect(path).toHaveLength(2);
    expect(path[0]).toEqual(from);
    expect(path[1]).toEqual(to);
    expect(nav.canWalkDirectly(from, to)).toBe(true);
  });

  it('findPath routes around concave corners when a direct line would leave bounds', () => {
    const lShape = [
      { x: -2, z: -2 },
      { x: 2, z: -2 },
      { x: 2, z: 0 },
      { x: 0, z: 0 },
      { x: 0, z: 2 },
      { x: -2, z: 2 },
    ];
    const nav = new NavMesh(lShape);
    const from = { x: 1.5, z: -1.5 };
    const to = { x: -1.5, z: 1.5 };
    expect(nav.canWalkDirectly(from, to)).toBe(false);
    const path = nav.findPath(from, to);
    expect(path.length).toBeGreaterThan(2);
    for (const p of path) {
      expect(nav.isWalkable(p.x, p.z)).toBe(true);
    }
  });

  it('findPath returns empty for unreachable destination', () => {
    const nav = new NavMesh(rect);
    const path = nav.findPath({ x: 0, z: 0 }, { x: 10, z: 10 });
    expect(path).toEqual([]);
  });
});
