import * as THREE from 'three';

export interface GroundPick {
  type: 'ground';
  point: THREE.Vector3;
}

export interface EntityPick {
  type: 'entity';
  point: THREE.Vector3;
  interactableId: string;
}

export type PickResult = GroundPick | EntityPick | null;

/**
 * Canvas mouse → raycast against walk meshes and pickable actors (BG3-style pointer).
 */
export class PointerSystem {
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();

  pick(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    camera: THREE.Camera,
    walkMeshes: THREE.Object3D[],
    pickTargets: THREE.Object3D[],
  ): PickResult {
    const rect = canvas.getBoundingClientRect();
    this.ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.ndc, camera);

    const entityHits = this.raycaster.intersectObjects(pickTargets, true);
    if (entityHits.length > 0) {
      const candidates: { hit: THREE.Intersection; id: string }[] = [];
      for (const hit of entityHits) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj && !obj.userData.interactableId) obj = obj.parent;
        const id = obj?.userData.interactableId as string | undefined;
        if (id) candidates.push({ hit, id });
      }
      candidates.sort((a, b) => {
        const rank = (id: string) => (id.startsWith('object:') ? 2 : id.startsWith('exit:') ? 1 : 0);
        const dr = rank(a.id) - rank(b.id);
        if (dr !== 0) return dr;
        return a.hit.distance - b.hit.distance;
      });
      const best = candidates[0];
      if (best) {
        return { type: 'entity', point: best.hit.point.clone(), interactableId: best.id };
      }
    }

    const groundHits = this.raycaster.intersectObjects(walkMeshes, false);
    if (groundHits.length > 0) {
      const pt = groundHits[0]!.point;
      return { type: 'ground', point: new THREE.Vector3(pt.x, 0, pt.z) };
    }

    // Click anywhere on screen → project to y=0 (BG3-style); NavMesh validates walkable area.
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(groundPlane, pt)) {
      return { type: 'ground', point: new THREE.Vector3(pt.x, 0, pt.z) };
    }

    return null;
  }

  /** Hover pick — entity only, for cursor feedback. */
  pickHover(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    camera: THREE.Camera,
    pickTargets: THREE.Object3D[],
  ): string | null {
    const rect = canvas.getBoundingClientRect();
    this.ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, camera);
    const hits = this.raycaster.intersectObjects(pickTargets, true);
    if (hits.length === 0) return null;
    let obj: THREE.Object3D | null = hits[0]!.object;
    while (obj && !obj.userData.interactableId) obj = obj.parent;
    return (obj?.userData.interactableId as string) ?? null;
  }
}
