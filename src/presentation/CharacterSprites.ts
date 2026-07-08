import * as THREE from 'three';
import { ISO_CAMERA_OFFSET } from './IsometricCamera';
import type { CharacterAppearance } from '@/gameplay/CharacterAppearance';
import { defaultAppearance, appearanceNeedsProceduralRender } from '@/gameplay/CharacterAppearance';
import type { WardrobeDefinition } from '@/data/types';
import { applyWardrobeBackLayers, applyWardrobeFrontLayers } from './WardrobeLayers';

/**
 * The isometric camera's view direction never changes (it translates but never
 * rotates — see `IsometricCamera`), so a single Y-axis-only rotation, computed once,
 * keeps every character card standing upright while facing the camera's horizontal
 * quadrant (per docs/art/VISUAL_DIRECTION.md "Billboard: Y-axis fixed; face camera
 * quadrant"). Previously this was an arbitrary `rotation.x` tilt that didn't account
 * for the camera's 45° yaw, leaving characters almost edge-on and barely visible.
 */
export const CHARACTER_MESH_SIZE = 3.0;
export const NAME_LABEL_SCALE_X = 1.5;
export const NAME_LABEL_SCALE_Y = 0.38;

/** Re-export for district backdrops that face the same camera quadrant. */
export const BILLBOARD_ROTATION = new THREE.Quaternion().setFromUnitVectors(
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(ISO_CAMERA_OFFSET.x, 0, ISO_CAMERA_OFFSET.z).normalize(),
);

const ART_BASE = '/assets';

/**
 * AI-generated placeholder art (see docs/art/ASSET_SHEET.md) ships as plain-background
 * renders, not true alpha-cut sprites. Sample the corner pixel and key out anything close
 * to it so the art drops onto the same transparent billboard the procedural sprites use.
 */
function sampleCornerColor(
  data: Uint8ClampedArray,
  w: number,
  px: number,
  py: number,
): [number, number, number] {
  const i = (py * w + px) * 4;
  return [data[i]!, data[i + 1]!, data[i + 2]!];
}

function avgCornerBg(data: Uint8ClampedArray, w: number, h: number): [number, number, number] {
  const samples = [
    sampleCornerColor(data, w, 1, 1),
    sampleCornerColor(data, w, w - 2, 1),
    sampleCornerColor(data, w, 1, h - 2),
    sampleCornerColor(data, w, w - 2, h - 2),
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const s of samples) {
    r += s[0];
    g += s[1];
    b += s[2];
  }
  return [r / 4, g / 4, b / 4];
}

function chromaKeyCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const [r0, g0, b0] = avgCornerBg(frame.data, canvas.width, canvas.height);
  const hardThreshold = 30;
  const softThreshold = 46;
  for (let i = 0; i < frame.data.length; i += 4) {
    const dr = Math.abs(frame.data[i]! - r0);
    const dg = Math.abs(frame.data[i + 1]! - g0);
    const db = Math.abs(frame.data[i + 2]! - b0);
    const dist = Math.max(dr, dg, db);
    if (dist < hardThreshold) {
      frame.data[i + 3] = 0;
    } else if (dist < softThreshold) {
      const t = (dist - hardThreshold) / (softThreshold - hardThreshold);
      frame.data[i + 3] = Math.round(frame.data[i + 3]! * t);
    }
  }
  ctx.putImageData(frame, 0, 0);
  return canvas;
}

function tryLoadImage(path: string): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(chromaKeyCanvas(img));
    img.onerror = () => resolve(null);
    img.src = path;
  });
}

/**
 * Named-NPC art first, then species art, then null so callers keep their procedural
 * fallback. Never throws — a missing/failed asset must never break the game.
 */
export async function loadArtCanvas(species: string, npcId?: string): Promise<HTMLCanvasElement | null> {
  if (npcId) {
    const npcArt = await tryLoadImage(`${ART_BASE}/sprites/npcs/${npcId}.png`);
    if (npcArt) return npcArt;
  }
  return tryLoadImage(`${ART_BASE}/sprites/species/${species}.png`);
}

/** Swap a 2D `<img>`'s src to real art if/when it loads, keeping its current src otherwise. */
export function applyArtToImage(img: HTMLImageElement, species: string, npcId?: string): void {
  loadArtCanvas(species, npcId).then((canvas) => {
    if (canvas) img.src = canvas.toDataURL();
  });
}

/**
 * Named-enemy portraits ship as single lowercase-word files under `sprites/enemies/`
 * (see `docs/art/ASSET_SHEET.md`) — e.g. "Skadge the Poacher" -> `skadge.png`. Tries
 * each candidate id in order (caller supplies both the full slug and the first-word
 * fallback), then falls back to species art. Same never-throw contract as
 * `loadArtCanvas` — a 404 on every candidate just means the caller keeps its
 * procedural/species fallback.
 */
export async function loadEnemyArtCanvas(
  species: string,
  candidateIds: string[],
): Promise<HTMLCanvasElement | null> {
  for (const id of candidateIds) {
    if (!id) continue;
    const art = await tryLoadImage(`${ART_BASE}/sprites/enemies/${id}.png`);
    if (art) return art;
  }
  return tryLoadImage(`${ART_BASE}/sprites/species/${species}.png`);
}

/** Swap a 2D `<img>`'s src to real enemy art if/when it loads (see `loadEnemyArtCanvas`). */
export function applyEnemyArtToImage(img: HTMLImageElement, species: string, candidateIds: string[]): void {
  loadEnemyArtCanvas(species, candidateIds).then((canvas) => {
    if (canvas) img.src = canvas.toDataURL();
  });
}

/** Swap a 2D `<canvas>`'s contents to real art if/when it loads, keeping the drawn fallback otherwise. */
export function applyArtToCanvas(target: HTMLCanvasElement, species: string, npcId?: string): void {
  loadArtCanvas(species, npcId).then((art) => {
    if (!art) return;
    const ctx = target.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(art, 0, 0, art.width, art.height, 0, 0, target.width, target.height);
  });
}

interface Pixel {
  x: number;
  y: number;
  c: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function shiftColor(hex: string, hueShift: number): string {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r / 255) h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g / 255) h = ((b / 255 - r / 255) / d + 2) / 6;
    else h = ((r / 255 - g / 255) / d + 4) / 6;
  }
  h = (h + hueShift / 360 + 1) % 1;
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let r2: number;
  let g2: number;
  let b2: number;
  if (s === 0) {
    r2 = g2 = b2 = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r2 = hue2rgb(p, q, h + 1 / 3);
    g2 = hue2rgb(p, q, h);
    b2 = hue2rgb(p, q, h - 1 / 3);
  }
  return rgbToHex(r2 * 255, g2 * 255, b2 * 255);
}

function applyMarkings(ctx: CanvasRenderingContext2D, marking: CharacterAppearance['marking']): void {
  if (marking === 'none') return;
  if (marking === 'spots') {
    ctx.fillStyle = 'rgba(10, 16, 8, 0.75)';
    const spots = [
      [12, 14], [18, 16], [14, 20], [20, 12], [10, 18], [16, 13], [13, 17],
    ];
    for (const [x, y] of spots) {
      ctx.fillRect(x, y, 2, 2);
    }
  } else {
    ctx.fillStyle = 'rgba(12, 18, 10, 0.7)';
    for (let y = 10; y < 26; y += 3) {
      ctx.fillRect(10, y, 12, 2);
    }
  }
}

/** 32×32 procedural pixel characters — replace with real art in public/assets/sprites/ */
export function drawCharacterCanvas(
  species: string,
  variant = 0,
  appearance?: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[] = [],
): HTMLCanvasElement {
  const app = appearance ?? defaultAppearance();
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 32, 32);

  applyWardrobeBackLayers(ctx, app, wardrobeItems, species);

  const drawers: Record<string, (v: number) => Pixel[]> = {
    frog: drawFrog,
    toad: drawToad,
    turtle: drawTurtle,
    tortoise: drawTortoise,
    vole: drawVole,
    player_frog: drawFrog,
  };

  let pixels = (drawers[species] ?? drawFrog)(app.variant ?? variant);
  if (app.hueShift !== 0) {
    pixels = pixels.map((p) => ({ ...p, c: shiftColor(p.c, app.hueShift) }));
  }
  for (const p of pixels) {
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x, p.y, 1, 1);
  }
  applyMarkings(ctx, app.marking);
  applyWardrobeFrontLayers(ctx, app, wardrobeItems, species);
  return canvas;
}

/** Apply tint, markings, and wardrobe on top of loaded species/NPC portrait art. */
export function applyAppearanceToArtCanvas(
  target: HTMLCanvasElement,
  species: string,
  appearance: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[],
): void {
  const ctx = target.getContext('2d');
  if (!ctx) return;
  const w = target.width;
  const h = target.height;

  if (appearance.hueShift !== 0) {
    const img = ctx.getImageData(0, 0, w, h);
    const { data } = img;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]! < 12) continue;
      const shifted = shiftColor(rgbToHex(data[i]!, data[i + 1]!, data[i + 2]!), appearance.hueShift);
      const [r, g, b] = hexToRgb(shifted);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    ctx.putImageData(img, 0, 0);
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(w / 32, h / 32);
  applyMarkings(ctx, appearance.marking);
  applyWardrobeBackLayers(ctx, appearance, wardrobeItems, species);
  applyWardrobeFrontLayers(ctx, appearance, wardrobeItems, species);
  ctx.restore();
}

function drawFrog(v: number): Pixel[] {
  const bodies = ['#5c7a52', '#3a8a70', '#7a9a40', '#2a6a50'];
  const bellies = ['#8ab070', '#a0d090', '#c0e070', '#70b098'];
  const body = bodies[v % 4]!;
  const belly = bellies[v % 4]!;
  const eye = '#1a1a1a';
  const highlight = '#e8ffe0';
  return [
    ...rect(10, 8, 12, 10, body),
    ...rect(12, 14, 8, 8, belly),
    ...rect(8, 20, 5, 6, body),
    ...rect(19, 20, 5, 6, body),
    ...rect(11, 9, 3, 3, highlight),
    ...rect(18, 9, 3, 3, highlight),
    ...rect(12, 10, 2, 2, eye),
    ...rect(18, 10, 2, 2, eye),
    ...rect(14, 12, 4, 1, '#3d3228'),
  ];
}

function drawToad(v: number): Pixel[] {
  const bodies = ['#6a5540', '#4a3728', '#8a6040', '#3a2820'];
  const body = bodies[v % 4]!;
  const wart = '#3d2e20';
  const eye = '#c4a000';
  return [
    ...rect(9, 10, 14, 12, body),
    ...rect(8, 22, 6, 5, body),
    ...rect(18, 22, 6, 5, body),
    ...rect(10, 8, 5, 4, body),
    ...rect(17, 8, 5, 4, body),
    ...rect(11, 9, 2, 2, eye),
    ...rect(18, 9, 2, 2, eye),
    ...rect(12, 14, 2, 2, wart),
    ...rect(17, 16, 2, 2, wart),
    ...rect(14, 18, 4, 2, '#2a2018'),
  ];
}

function drawTurtle(v: number): Pixel[] {
  const shell = v === 0 ? '#1a3c34' : '#2a4c44';
  const rim = '#4a6a5a';
  const skin = '#5c7a52';
  const eye = '#1a1a1a';
  return [
    ...rect(8, 10, 16, 14, shell),
    ...rect(10, 12, 12, 10, rim),
    ...rect(12, 14, 3, 3, '#0f2820'),
    ...rect(17, 14, 3, 3, '#0f2820'),
    ...rect(14, 18, 4, 3, '#0f2820'),
    ...rect(6, 14, 4, 6, skin),
    ...rect(22, 14, 4, 6, skin),
    ...rect(12, 8, 3, 3, skin),
    ...rect(17, 8, 3, 3, skin),
    ...rect(13, 9, 1, 1, eye),
    ...rect(18, 9, 1, 1, eye),
    ...rect(10, 24, 5, 4, skin),
    ...rect(17, 24, 5, 4, skin),
  ];
}

function drawTortoise(v: number): Pixel[] {
  const base = drawTurtle(v);
  return [...base, ...rect(7, 9, 18, 2, '#6a5a48')];
}

function drawVole(_v: number): Pixel[] {
  const fur = '#8a7a6a';
  const belly = '#c4b8a8';
  const eye = '#1a1a1a';
  const nose = '#e8a0a0';
  return [
    ...rect(11, 12, 10, 8, fur),
    ...rect(12, 16, 8, 6, belly),
    ...rect(8, 10, 4, 4, fur),
    ...rect(20, 10, 4, 4, fur),
    ...rect(13, 11, 2, 2, eye),
    ...rect(17, 11, 2, 2, eye),
    ...rect(15, 14, 2, 2, nose),
    ...rect(10, 22, 4, 3, fur),
    ...rect(18, 22, 4, 3, fur),
    ...rect(14, 8, 4, 2, fur),
  ];
}

function rect(x: number, y: number, w: number, h: number, c: string): Pixel[] {
  const out: Pixel[] = [];
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) out.push({ x: x + i, y: y + j, c });
  }
  return out;
}

export function createGroundShadow(size = CHARACTER_MESH_SIZE): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x0a1814,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(size * 0.2, 20), mat);
  shadow.rotation.x = -Math.PI / 2;
  // Flatten along view depth so it reads as a ground contact patch, not a disc.
  shadow.scale.z = 0.6;
  shadow.position.y = 0.035;
  shadow.renderOrder = -10;
  return shadow;
}

export function createCharacterMesh(
  species: string,
  variant = 0,
  size = CHARACTER_MESH_SIZE,
  npcId?: string,
  appearance?: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[] = [],
): THREE.Mesh {
  const canvas = drawCharacterCanvas(species, variant, appearance, wardrobeItems);
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
  // Plane is centered on its own origin; lift it by half its height so the
  // character stands on the ground plane instead of being buried through it.
  mesh.position.y = size / 2;

  // Procedural mesh above renders immediately (zero regression); swap the texture in
  // if/when real art loads. Silently keeps the procedural texture on a 404.
  loadArtCanvas(species, npcId).then((art) => {
    if (!art) return;
    // Customized player avatars stay procedural so Look/Outfit match the creator preview.
    if (!npcId && appearance && appearanceNeedsProceduralRender(appearance)) return;
    if (appearance) {
      applyAppearanceToArtCanvas(art, species, appearance, wardrobeItems);
    }
    const artTexture = new THREE.CanvasTexture(art);
    artTexture.magFilter = THREE.NearestFilter;
    artTexture.minFilter = THREE.NearestFilter;
    mat.map = artTexture;
    mat.needsUpdate = true;
  });

  return mesh;
}

export function createNameLabel(name: string, meshSize = CHARACTER_MESH_SIZE): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(26, 60, 52, 0.85)';
  ctx.fillRect(0, 0, 128, 32);
  ctx.strokeStyle = '#d4a054';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 126, 30);
  ctx.fillStyle = '#e8e4d9';
  ctx.font = 'bold 14px Source Sans 3, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name.length > 14 ? name.slice(0, 12) + '…' : name, 64, 21);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(NAME_LABEL_SCALE_X, NAME_LABEL_SCALE_Y, 1);
  sprite.position.y = meshSize + 0.35;
  sprite.visible = false;
  return sprite;
}
