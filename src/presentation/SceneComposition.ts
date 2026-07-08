import * as THREE from 'three';
import { ISO_CAMERA_OFFSET, CAMERA_FRUSTUM_HALF_HEIGHT } from './IsometricCamera';

/** Must match IsometricCamera.frustumSize. */
export { CAMERA_FRUSTUM_HALF_HEIGHT };

/**
 * Fallback aspect used only until a backdrop's real texture loads (avoids a 0-size flash).
 * All current location art happens to render at 1536x1024 (3:2) regardless of what aspect
 * ratio was requested from the generator — never trust a requested/assumed aspect for the
 * real sizing math, always re-measure from `tex.image` once it loads (see SceneLoader).
 */
const FALLBACK_IMAGE_ASPECT = 1536 / 1024;

/** Small margin so the fixed camera never reveals a hard edge. */
const BACKDROP_MARGIN = 1.06;

/** Slight upward bias so a touch more painted floor shows below the player. */
const BACKDROP_CENTER_Y = 1.5;

/**
 * Visible world width/height for backdrop sizing (default 16:9).
 *
 * NOTE: despite its name, `CAMERA_FRUSTUM_HALF_HEIGHT` is the camera's *full* on-screen
 * height in world units — `IsometricCamera` sets `top = +frustumSize/2` and
 * `bottom = -frustumSize/2`, so the visible span is `frustumSize` (11), not `frustumSize*2`.
 * This previously multiplied by 2 (regression: doubled both view dimensions, quadrupling
 * the backdrop plane's area — every district's painted art was zoomed to ~4x, so only the
 * plain center of each backdrop was ever visible on screen and all edge detail — buildings,
 * lanterns, market clutter — was scaled off-frame. This is *the* reason districts read as
 * empty even with content-rich art. Keep this 1:1 with the camera or the crop breaks again.
 */
export function getViewExtents(aspect = 16 / 9): { width: number; height: number } {
  const height = CAMERA_FRUSTUM_HALF_HEIGHT;
  return { width: height * aspect, height };
}

/**
 * Cover-fit the art over the frustum without distorting it: scale so both frustum
 * dimensions are covered, keeping the image's *real* aspect (pass it in once known —
 * see SceneLoader.addBackdrop). With a fixed per-district camera there is no pan, so
 * only a small safety margin is needed.
 */
export function getBackdropSize(
  aspect = 16 / 9,
  imageAspect = FALLBACK_IMAGE_ASPECT,
): { width: number; height: number } {
  const view = getViewExtents(aspect);
  let height = view.height;
  let width = height * imageAspect;
  if (width < view.width) {
    width = view.width;
    height = width / imageAspect;
  }
  return { width: width * BACKDROP_MARGIN, height: height * BACKDROP_MARGIN };
}

/**
 * Fixed orientation that lays the backdrop flat against the camera's image plane
 * (a full-screen painted card). The iso camera never rotates, so this is constant.
 * Vertical character standees keep their own Y-only billboard rotation.
 */
export function getBackdropQuaternion(): THREE.Quaternion {
  const m = new THREE.Matrix4().lookAt(
    ISO_CAMERA_OFFSET,
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 1, 0),
  );
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

/** Anchor the card on the play area, nudged up so the painted floor fills the lower frame. */
export function backdropPosition(cx: number, cz: number): THREE.Vector3 {
  return new THREE.Vector3(cx, BACKDROP_CENTER_Y, cz);
}

/** Soft contact haze under the walkable center so standees read as touching the floor. */
export function createGroundHaze(bounds: {
  cx: number;
  cz: number;
  width: number;
  depth: number;
}): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, 'rgba(20, 40, 34, 0.18)');
  g.addColorStop(0.6, 'rgba(20, 40, 34, 0.06)');
  g.addColorStop(1, 'rgba(20, 40, 34, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    opacity: 0.7,
  });
  const w = Math.max(bounds.width + 2, 12);
  const d = Math.max(bounds.depth + 2, 8);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(bounds.cx, 0.04, bounds.cz);
  mesh.renderOrder = -50;
  return mesh;
}
