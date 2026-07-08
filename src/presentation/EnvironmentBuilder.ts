import * as THREE from 'three';
import { addDistrictBackdrops } from './DistrictBackdrop';

function createWaterTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2a5a4a';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(42, 90, 74, 0.4)';
  for (let y = 0; y < size; y += 8) {
    for (let x = 0; x < size; x += 8) {
      if ((x + y) % 16 === 0) ctx.fillRect(x, y, 4, 4);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

/**
 * Reedwater Basin / Lilypond — district backdrop planes + minimal collision greybox.
 */
export function buildLilypondEnvironment(): THREE.Group {
  const group = new THREE.Group();

  addDistrictBackdrops(group);

  const waterTex = createWaterTexture();
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
      color: 0x2a5a4a,
      map: waterTex,
      roughness: 0.3,
      metalness: 0.1,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.01;
  water.userData.waterScroll = true;
  group.add(water);

  const causeway = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0x6a5a48, roughness: 0.9 }),
  );
  causeway.position.set(0, 0.04, 0.5);
  group.add(causeway);

  // Low-opacity collision hints — district art is the main visual.
  addBuildingHint(group, 3.2, 0.8, 0x5c7a52, 2.5, 0.35, 2);
  addBuildingHint(group, 4.8, 3, 0x1a3c34, 2.8, 0.9, 2.2);
  addBuildingHint(group, -2.8, -3.2, 0x4a3728, 2.2, 0.5, 1.8);
  addDomeHint(group, -2, 1.5, 0x8a9a9e, 2);
  addBuildingHint(group, 4.8, -2.5, 0x6a5a48, 1.8, 0.6, 1.8);
  addBuildingHint(group, -5.5, -4.5, 0x4a3728, 1.8, 0.4, 1.4);
  addRuin(group, 7.5, 5.5);

  const edgeReeds: Array<[number, number]> = [
    [-7, -6], [-6, 7], [7, 6], [8, -7], [-8, 2], [9, 0],
  ];
  for (const [x, z] of edgeReeds) {
    for (let i = 0; i < 3; i++) {
      const reed = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 1.2),
        new THREE.MeshBasicMaterial({ color: 0x3d5c34, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
      );
      reed.position.set(x + i * 0.35, 0.6, z + i * 0.2);
      reed.renderOrder = 999;
      group.add(reed);
    }
  }

  return group;
}

function addBuildingHint(
  parent: THREE.Group,
  x: number,
  z: number,
  color: number,
  w: number,
  h: number,
  d: number,
): void {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.12 }),
  );
  mesh.position.set(x, h / 2, z);
  parent.add(mesh);
}

function addDomeHint(parent: THREE.Group, x: number, z: number, color: number, r: number): void {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.15 }),
  );
  mesh.position.set(x, 0, z);
  parent.add(mesh);
}

function addRuin(parent: THREE.Group, x: number, z: number): void {
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.5, 3),
    new THREE.MeshStandardMaterial({ color: 0x5a5a5a, transparent: true, opacity: 0.2 }),
  );
  base.position.set(x, 0.25, z);
  parent.add(base);
}
