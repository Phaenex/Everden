import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { PointerSystem } from '@/engine/PointerSystem';

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    value: () => ({ left: 0, top: 0, width: 200, height: 200 }),
  });
  return canvas;
}

function topDownCamera(): THREE.OrthographicCamera {
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
  camera.position.set(0, 10, 0);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  return camera;
}

describe('PointerSystem', () => {
  it('raycasts ground mesh to a world point', () => {
    const pointer = new PointerSystem();
    const camera = topDownCamera();

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial(),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.updateMatrixWorld(true);

    const pick = pointer.pick(100, 100, makeCanvas(), camera, [ground], []);
    expect(pick?.type).toBe('ground');
    if (pick?.type === 'ground') {
      expect(Math.abs(pick.point.x)).toBeLessThan(0.5);
      expect(Math.abs(pick.point.z)).toBeLessThan(0.5);
    }
  });

  it('projects screen click to y=0 when no walk mesh is hit', () => {
    const pointer = new PointerSystem();
    const camera = topDownCamera();
    const pick = pointer.pick(100, 100, makeCanvas(), camera, [], []);
    expect(pick?.type).toBe('ground');
    if (pick?.type === 'ground') {
      expect(Math.abs(pick.point.x)).toBeLessThan(0.5);
      expect(Math.abs(pick.point.z)).toBeLessThan(0.5);
    }
  });

  it('prefers entity pick over ground', () => {
    const pointer = new PointerSystem();
    const camera = topDownCamera();

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial(),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.updateMatrixWorld(true);

    const npc = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    npc.position.set(0, 0.5, 0);
    npc.userData.interactableId = 'pip_marshwick';
    npc.updateMatrixWorld(true);

    const pick = pointer.pick(100, 100, makeCanvas(), camera, [ground], [npc]);
    expect(pick?.type).toBe('entity');
    if (pick?.type === 'entity') {
      expect(pick.interactableId).toBe('pip_marshwick');
    }
  });
});
