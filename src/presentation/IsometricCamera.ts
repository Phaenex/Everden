import * as THREE from 'three';

export const CAMERA_FRUSTUM_HALF_HEIGHT = 11;

/**
 * Camera sits at target + this offset and always looks back at target, so the
 * view direction is constant no matter where the target moves — a true fixed-angle
 * isometric camera. Character billboards (`CharacterSprites.ts`) rotate to face this
 * exact offset; keep the two in sync if this ever changes.
 */
export const ISO_CAMERA_OFFSET = new THREE.Vector3(10, 12, 10);

/**
 * Orthographic isometric camera with smooth follow.
 */
export class IsometricCamera {
  readonly camera: THREE.OrthographicCamera;
  private target = new THREE.Vector3();
  private current = new THREE.Vector3();
  private frustumSize = CAMERA_FRUSTUM_HALF_HEIGHT;

  constructor(width: number, height: number) {
    const aspect = width / height;
    this.camera = new THREE.OrthographicCamera(
      (-this.frustumSize * aspect) / 2,
      (this.frustumSize * aspect) / 2,
      this.frustumSize / 2,
      -this.frustumSize / 2,
      0.1,
      100,
    );
    this.camera.position.copy(ISO_CAMERA_OFFSET);
    this.camera.lookAt(0, 0, 0);
  }

  setTarget(x: number, z: number): void {
    this.target.set(x, 0, z);
  }

  update(): void {
    this.current.lerp(this.target, 0.08);
    this.camera.position.set(
      this.current.x + ISO_CAMERA_OFFSET.x,
      ISO_CAMERA_OFFSET.y,
      this.current.z + ISO_CAMERA_OFFSET.z,
    );
    this.camera.lookAt(this.current.x, 0, this.current.z);
  }

  resize(width: number, height: number): void {
    const aspect = width / height;
    this.camera.left = (-this.frustumSize * aspect) / 2;
    this.camera.right = (this.frustumSize * aspect) / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;
    this.camera.updateProjectionMatrix();
  }
}
