import * as THREE from 'three';
import {
  backdropPosition,
  createGroundHaze,
  getBackdropQuaternion,
  getBackdropSize,
} from '@/presentation/SceneComposition';
import { SceneKernel } from '@/engine/SceneKernel';
import { NavMesh, navPolygonBounds } from '@/engine/NavMesh';
import { createPropMesh } from '@/presentation/PropSprites';
import type { SceneDefinition } from '@/data/sceneTypes';
import type { WorldObjectDefinition } from '@/data/types';
import type { ISaveable } from '@/core/IGameModule';

const ART_BASE = '/assets/locations';

export class SceneState implements ISaveable {
  readonly saveKey = 'scene';
  currentSceneId = 'causeway';

  serialize(): { currentSceneId: string } {
    return { currentSceneId: this.currentSceneId };
  }

  deserialize(data: unknown): void {
    const s = data as { currentSceneId?: string };
    if (s.currentSceneId) this.currentSceneId = s.currentSceneId;
  }
}

export async function fetchSceneDefinition(id: string): Promise<SceneDefinition> {
  const res = await fetch(`/data/scenes/${id}.json`);
  if (!res.ok) throw new Error(`Failed to load scene ${id}`);
  return res.json() as Promise<SceneDefinition>;
}

/** Builds one district: full-frustum backdrop + invisible walk floor + exit markers. */
export function buildSceneGraphics(
  spec: SceneDefinition,
  kernel: SceneKernel,
  objectDefs: WorldObjectDefinition[] = [],
): NavMesh {
  const poly = spec.navPolygon.map(([x, z]) => ({ x, z }));
  const bounds = navPolygonBounds(poly);

  addBackdrop(spec, kernel, bounds);
  addGroundHaze(kernel, bounds);
  addWalkFloor(kernel, bounds);
  addExitPortals(spec, kernel);
  addObjectPickers(spec, kernel, objectDefs);

  return new NavMesh(poly);
}

function addGroundHaze(
  kernel: SceneKernel,
  bounds: ReturnType<typeof navPolygonBounds>,
): void {
  kernel.background.add(createGroundHaze(bounds));
}

function addWalkFloor(kernel: SceneKernel, bounds: ReturnType<typeof navPolygonBounds>): void {
  const pick = new THREE.Mesh(
    new THREE.PlaneGeometry(bounds.width + 0.5, bounds.depth + 0.5),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  pick.rotation.x = -Math.PI / 2;
  pick.position.set(bounds.cx, 0.02, bounds.cz);
  kernel.addWalkMesh(pick);
}

function addBackdrop(
  spec: SceneDefinition,
  kernel: SceneKernel,
  bounds: ReturnType<typeof navPolygonBounds>,
): void {
  const aspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9;
  const { width, height } = getBackdropSize(aspect);

  const mat = new THREE.MeshBasicMaterial({
    color: 0x24413b,
    transparent: false,
    depthWrite: false,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  plane.position.copy(backdropPosition(bounds.cx, bounds.cz));
  plane.quaternion.copy(getBackdropQuaternion());
  plane.renderOrder = -100;
  kernel.background.add(plane);

  void loadBackdropTexture(spec.backdrop).then((tex) => {
    if (!tex) return;
    mat.map = tex;
    mat.color.setHex(0xffffff);
    mat.needsUpdate = true;

    // Re-fit the plane to the texture's *real* pixel aspect once it's known — never trust
    // an assumed aspect, image generators don't reliably honor a requested ratio.
    const img = tex.image as { width?: number; height?: number } | undefined;
    if (img?.width && img?.height) {
      const { width: fitWidth, height: fitHeight } = getBackdropSize(aspect, img.width / img.height);
      plane.geometry.dispose();
      plane.geometry = new THREE.PlaneGeometry(fitWidth, fitHeight);
    }
  });
}

function loadBackdropTexture(file: string): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      `${ART_BASE}/${file}`,
      (tex) => {
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearFilter;
        resolve(tex);
      },
      undefined,
      () => resolve(null),
    );
  });
}

function createPortalLabel(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 220;
  canvas.height = 36;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(26, 60, 52, 0.88)';
  ctx.fillRect(0, 0, 220, 36);
  ctx.strokeStyle = '#d4a054';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 218, 34);
  ctx.fillStyle = '#e8e4d9';
  ctx.font = 'bold 13px "Source Sans 3", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 110, 23);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.6, 0.58, 1);
  return sprite;
}

function addExitPortals(spec: SceneDefinition, kernel: SceneKernel): void {
  for (const exit of spec.exits) {
    const group = new THREE.Group();
    group.position.set(exit.x, 0, exit.z);

    const fill = new THREE.Mesh(
      new THREE.CircleGeometry(exit.radius * 0.7, 24),
      new THREE.MeshBasicMaterial({
        color: 0xd4a054,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.y = 0.05;
    group.add(fill);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(exit.radius * 0.62, exit.radius * 0.74, 32),
      new THREE.MeshBasicMaterial({
        color: 0xd4a054,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.055;
    group.add(ring);

    const pick = new THREE.Mesh(
      new THREE.CylinderGeometry(exit.radius, exit.radius, 0.5, 12),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    pick.position.y = 0.25;
    group.add(pick);

    const label = createPortalLabel(exit.label);
    label.position.set(0, 0.95, 0);
    group.add(label);

    kernel.ground.add(group);
    kernel.registerPickTarget(pick, `exit:${exit.id}`);
  }
}

function addObjectPickers(
  spec: SceneDefinition,
  kernel: SceneKernel,
  objectDefs: WorldObjectDefinition[],
): void {
  for (const obj of spec.objects) {
    if (obj.x === undefined || obj.z === undefined) continue;
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 1.2),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    marker.position.set(obj.x, 0.5, obj.z);
    kernel.ground.add(marker);
    kernel.registerPickTarget(marker, `object:${obj.id}`);

    const def = objectDefs.find((o) => o.id === obj.id);
    const prop = def?.visualProp ? createPropMesh(def.visualProp) : null;
    if (prop) {
      prop.position.x = obj.x;
      prop.position.z = obj.z;
      kernel.ground.add(prop);
    }
  }
}

export function getExitByPickId(spec: SceneDefinition, pickId: string): SceneDefinition['exits'][0] | undefined {
  if (!pickId.startsWith('exit:')) return undefined;
  const exitId = pickId.slice(5);
  return spec.exits.find((e) => e.id === exitId);
}

export function getObjectIdFromPick(pickId: string): string | undefined {
  if (!pickId.startsWith('object:')) return undefined;
  return pickId.slice(7);
}
