import * as THREE from 'three';

/** Layer groups for BG3-style scene composition. */
export class SceneKernel {
  readonly root = new THREE.Group();
  readonly background = new THREE.Group();
  readonly ground = new THREE.Group();
  readonly actors = new THREE.Group();
  readonly foreground = new THREE.Group();

  private walkMeshes: THREE.Mesh[] = [];
  private pickTargets: THREE.Object3D[] = [];

  constructor() {
    this.root.add(this.background, this.ground, this.actors, this.foreground);
  }

  addWalkMesh(mesh: THREE.Mesh): void {
    mesh.userData.walkable = true;
    this.walkMeshes.push(mesh);
    this.ground.add(mesh);
  }

  registerPickTarget(obj: THREE.Object3D, interactableId: string): void {
    obj.userData.interactableId = interactableId;
    obj.userData.pickable = true;
    this.pickTargets.push(obj);
  }

  getWalkMeshes(): THREE.Mesh[] {
    return this.walkMeshes;
  }

  getPickTargets(): THREE.Object3D[] {
    return this.pickTargets;
  }

  clear(): void {
    this.walkMeshes = [];
    this.pickTargets = [];
    for (const layer of [this.background, this.ground, this.actors, this.foreground]) {
      while (layer.children.length > 0) {
        const child = layer.children[0]!;
        layer.remove(child);
        disposeObject(child);
      }
    }
  }
}

function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.geometry?.dispose();
      const mat = node.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    }
  });
}

export { disposeObject };
