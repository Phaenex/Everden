import * as THREE from 'three';
import { BILLBOARD_ROTATION } from './CharacterSprites';

/**
 * Small procedural billboard props for hub districts whose backdrop art has nothing
 * painted at an object's position (see `WorldObjectDefinition.visualProp`). Same
 * technique as `CharacterSprites.ts` — a 32x32 pixel canvas on a camera-facing plane —
 * so these read as part of the same visual language instead of stray 3D primitives.
 */

interface Pixel {
  x: number;
  y: number;
  c: string;
}

function rect(x: number, y: number, w: number, h: number, c: string): Pixel[] {
  const out: Pixel[] = [];
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) out.push({ x: x + i, y: y + j, c });
  }
  return out;
}

function drawWaystone(): Pixel[] {
  const stone = '#8a8a82';
  const highlight = '#a8a89e';
  const crack = '#5c5c54';
  const mark = '#d4a054';
  const base = '#4a3728';
  return [
    ...rect(9, 27, 14, 3, base),
    ...rect(10, 8, 12, 19, stone),
    ...rect(11, 9, 4, 4, highlight),
    ...rect(15, 10, 1, 15, crack),
    ...rect(12, 13, 3, 1, mark),
    ...rect(17, 17, 3, 1, mark),
    ...rect(12, 21, 3, 1, mark),
  ];
}

function drawLantern(): Pixel[] {
  const wood = '#4a3728';
  const dark = '#2a2018';
  const glow = '#f0c060';
  const glowCore = '#fff0c0';
  return [
    ...rect(12, 28, 8, 3, dark),
    ...rect(15, 16, 2, 13, wood),
    ...rect(12, 6, 8, 10, dark),
    ...rect(13, 7, 6, 8, glow),
    ...rect(15, 9, 2, 4, glowCore),
    ...rect(13, 4, 6, 2, dark),
    ...rect(15, 3, 2, 1, dark),
  ];
}

const DRAWERS: Record<string, () => Pixel[]> = {
  waystone: drawWaystone,
  lantern: drawLantern,
};

function drawPropCanvas(kind: string): HTMLCanvasElement | null {
  const drawer = DRAWERS[kind];
  if (!drawer) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 32, 32);
  for (const p of drawer()) {
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x, p.y, 1, 1);
  }
  return canvas;
}

/** Returns null for an unknown prop kind — caller just skips adding a mesh. Never throws. */
export function createPropMesh(kind: string, size = 1.8): THREE.Mesh | null {
  const canvas = drawPropCanvas(kind);
  if (!canvas) return null;
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.quaternion.copy(BILLBOARD_ROTATION);
  mesh.position.y = size / 2;
  return mesh;
}
