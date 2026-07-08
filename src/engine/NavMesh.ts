export type NavPoint = { x: number; z: number };

export type NavBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  cx: number;
  cz: number;
  width: number;
  depth: number;
};

export function navPolygonBounds(polygon: NavPoint[]): NavBounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let cx = 0;
  let cz = 0;
  for (const p of polygon) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
    cx += p.x;
    cz += p.z;
  }
  const n = polygon.length || 1;
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    cx: cx / n,
    cz: cz / n,
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}

/** Walkable polygon nav — direct lines when clear, grid A* fallback for concave corners. */
export class NavMesh {
  private readonly cellSize: number;
  private readonly polygon: NavPoint[];
  private minX = 0;
  private maxX = 0;
  private minZ = 0;
  private maxZ = 0;

  constructor(polygon: NavPoint[], cellSize = 0.18) {
    if (polygon.length < 3) throw new Error('NavMesh requires at least 3 polygon points');
    this.polygon = polygon;
    this.cellSize = cellSize;
    for (const p of polygon) {
      this.minX = Math.min(this.minX, p.x);
      this.maxX = Math.max(this.maxX, p.x);
      this.minZ = Math.min(this.minZ, p.z);
      this.maxZ = Math.max(this.maxZ, p.z);
    }
  }

  isWalkable(x: number, z: number): boolean {
    return pointInPolygon(x, z, this.polygon);
  }

  /** True when a straight segment stays inside the walkable polygon. */
  canWalkDirectly(from: NavPoint, to: NavPoint): boolean {
    return lineWalkable(from, to, (x, z) => this.isWalkable(x, z));
  }

  findPath(from: NavPoint, to: NavPoint): NavPoint[] {
    if (!this.isWalkable(to.x, to.z)) return [];
    if (!this.isWalkable(from.x, from.z)) {
      from = this.nearestWalkable(from) ?? from;
    }

    if (this.canWalkDirectly(from, to)) {
      return [from, to];
    }

    const start = this.toCell(from);
    const goal = this.toCell(to);
    const path = aStar(start, goal, (c) => this.cellWalkable(c.col, c.row));
    if (path.length === 0) {
      return this.canWalkDirectly(from, to) ? [from, to] : [];
    }
    const world = path.map((c) => this.cellCenter(c.col, c.row));
    world[0] = from;
    world[world.length - 1] = to;
    return stringPullPath(world, (a, b) => this.canWalkDirectly(a, b));
  }

  nearestWalkable(p: NavPoint): NavPoint | null {
    if (this.isWalkable(p.x, p.z)) return p;
    for (let r = this.cellSize; r < 8; r += this.cellSize) {
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        const x = p.x + Math.cos(ang) * r;
        const z = p.z + Math.sin(ang) * r;
        if (this.isWalkable(x, z)) return { x, z };
      }
    }
    return null;
  }

  private cellWalkable(col: number, row: number): boolean {
    const c = this.cellCenter(col, row);
    return this.isWalkable(c.x, c.z);
  }

  private toCell(p: NavPoint): Cell {
    return {
      col: Math.round((p.x - this.minX) / this.cellSize),
      row: Math.round((p.z - this.minZ) / this.cellSize),
    };
  }

  private cellCenter(col: number, row: number): NavPoint {
    return {
      x: this.minX + col * this.cellSize,
      z: this.minZ + row * this.cellSize,
    };
  }
}

type Cell = { col: number; row: number };

function pointInPolygon(x: number, z: number, poly: NavPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]!.x;
    const zi = poly[i]!.z;
    const xj = poly[j]!.x;
    const zj = poly[j]!.z;
    const intersect = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function cellKey(c: Cell): string {
  return `${c.col},${c.row}`;
}

function aStar(start: Cell, goal: Cell, walkable: (c: Cell) => boolean): Cell[] {
  const open = new Map<string, { cell: Cell; f: number }>();
  const cameFrom = new Map<string, Cell>();
  const gScore = new Map<string, number>();
  const sk = cellKey(start);
  gScore.set(sk, 0);
  open.set(sk, { cell: start, f: heuristic(start, goal) });

  const neighbors = (c: Cell): Cell[] => [
    { col: c.col + 1, row: c.row },
    { col: c.col - 1, row: c.row },
    { col: c.col, row: c.row + 1 },
    { col: c.col, row: c.row - 1 },
    { col: c.col + 1, row: c.row + 1 },
    { col: c.col - 1, row: c.row - 1 },
    { col: c.col + 1, row: c.row - 1 },
    { col: c.col - 1, row: c.row + 1 },
  ];

  let iterations = 0;
  while (open.size > 0 && iterations++ < 8000) {
    let current: Cell | null = null;
    let bestF = Infinity;
    for (const { cell, f } of open.values()) {
      if (f < bestF) {
        bestF = f;
        current = cell;
      }
    }
    if (!current) break;
    const ck = cellKey(current);
    if (current.col === goal.col && current.row === goal.row) {
      return reconstruct(cameFrom, current);
    }
    open.delete(ck);

    for (const nb of neighbors(current)) {
      if (!walkable(nb)) continue;
      const nk = cellKey(nb);
      const tentative = (gScore.get(ck) ?? Infinity) + 1;
      if (tentative < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, current);
        gScore.set(nk, tentative);
        open.set(nk, { cell: nb, f: tentative + heuristic(nb, goal) });
      }
    }
  }
  return [];
}

function heuristic(a: Cell, b: Cell): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function reconstruct(cameFrom: Map<string, Cell>, current: Cell): Cell[] {
  const path = [current];
  let ck = cellKey(current);
  while (cameFrom.has(ck)) {
    current = cameFrom.get(ck)!;
    ck = cellKey(current);
    path.unshift(current);
  }
  return path;
}

function lineWalkable(
  from: NavPoint,
  to: NavPoint,
  isWalkable: (x: number, z: number) => boolean,
): boolean {
  const dist = Math.hypot(to.x - from.x, to.z - from.z);
  if (dist < 0.001) return isWalkable(from.x, from.z);
  const steps = Math.max(2, Math.ceil(dist / 0.2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t;
    const z = from.z + (to.z - from.z) * t;
    if (!isWalkable(x, z)) return false;
  }
  return true;
}

/** Drop grid waypoints when a longer straight segment is still walkable. */
function stringPullPath(
  path: NavPoint[],
  canWalkDirectly: (a: NavPoint, b: NavPoint) => boolean,
): NavPoint[] {
  if (path.length <= 2) return path;
  const out: NavPoint[] = [path[0]!];
  let anchor = 0;
  for (let i = 2; i < path.length; i++) {
    if (!canWalkDirectly(path[anchor]!, path[i]!)) {
      out.push(path[i - 1]!);
      anchor = i - 1;
    }
  }
  out.push(path[path.length - 1]!);
  return out;
}

export { lineWalkable, pointInPolygon };
