import * as THREE from 'three';
import { BILLBOARD_ROTATION } from './CharacterSprites';

const ART_BASE = '/assets/locations';

export interface DistrictBackdropSpec {
  id: string;
  asset: string;
  x: number;
  z: number;
  width: number;
  height: number;
}

/** District art planes — async load with silent fallback to transparent (greybox shows through). */
export function tryLoadLocationTexture(assetFile: string): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      `${ART_BASE}/${assetFile}`,
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

export function createDistrictBackdropPlane(spec: DistrictBackdropSpec): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(spec.width, spec.height), mat);
  mesh.position.set(spec.x, spec.height * 0.45, spec.z);
  mesh.quaternion.copy(BILLBOARD_ROTATION);
  mesh.renderOrder = -1;
  mesh.userData.districtBackdrop = true;
  mesh.userData.backdropAnchor = { x: spec.x, z: spec.z };

  void tryLoadLocationTexture(spec.asset).then((tex) => {
    if (!tex) return;
    mat.map = tex;
    mat.needsUpdate = true;
  });

  return mesh;
}

export const LILYPOND_BACKDROPS: DistrictBackdropSpec[] = [
  { id: 'lilymarket', asset: 'lilymarket.webp', x: 3.5, z: 0.8, width: 3.8, height: 2.4 },
  { id: 'mudwall', asset: 'mudwall.webp', x: 5.2, z: 3.2, width: 3.5, height: 2.6 },
  { id: 'croakend', asset: 'croakend.webp', x: -2.8, z: -3.4, width: 3.5, height: 2.4 },
  { id: 'sunken_chapel', asset: 'sunken_chapel.webp', x: 7.8, z: 5.8, width: 3.2, height: 2.5 },
  { id: 'ferrymans_rest', asset: 'ferrymans_rest.webp', x: -5.8, z: -4.8, width: 3.2, height: 2.3 },
  { id: 'blackfen_outlet', asset: 'blackfen_outlet.webp', x: 9.2, z: -5.2, width: 3, height: 2.2 },
];

export function addDistrictBackdrops(parent: THREE.Group): void {
  for (const spec of LILYPOND_BACKDROPS) {
    parent.add(createDistrictBackdropPlane(spec));
  }
}
