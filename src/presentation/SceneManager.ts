import * as THREE from 'three';
import type { EventBus } from '@/core/EventBus';
import type { IGameModule } from '@/core/IGameModule';
import type { IsometricCamera } from '@/presentation/IsometricCamera';
import { SceneKernel } from '@/engine/SceneKernel';
import { PointerSystem, type PickResult } from '@/engine/PointerSystem';
import { CHARACTER_MESH_SIZE } from './CharacterSprites';
import { depthSortKey } from './SpriteActor';

/**
 * Three.js scene: kernel layers, pointer picking, character sprites.
 */
export class SceneManager implements IGameModule {
  readonly scene = new THREE.Scene();
  readonly renderer: THREE.WebGLRenderer;
  readonly kernel = new SceneKernel();
  readonly pointer = new PointerSystem();

  private camera: IsometricCamera;
  private actorGroups = new Map<string, THREE.Group>();
  private remoteGroups = new Map<string, THREE.Group>();
  private npcLabels = new Map<string, THREE.Sprite>();
  private playerGroup: THREE.Group | null = null;
  private sortables: THREE.Object3D[] = [];
  private debugMarker: THREE.Mesh | null = null;
  private disposed = false;

  private ambient!: THREE.AmbientLight;
  private sun!: THREE.DirectionalLight;
  private cameraLocked = false;

  constructor(
    private eventBus: EventBus,
    canvas: HTMLCanvasElement,
    camera: IsometricCamera,
  ) {
    this.camera = camera;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene.background = new THREE.Color(0x2a4a44);
    this.scene.fog = new THREE.Fog(0x2a4a44, 32, 62);
    this.scene.add(this.kernel.root);
  }

  init(): void {
    this.setupLighting();
    this.eventBus.on<{ x: number; y: number; z: number; heading?: number; moving?: boolean }>(
      'player:moved',
      (p) => {
        if (this.playerGroup) {
          this.playerGroup.position.set(p.x, 0, p.z);
          if (p.heading !== undefined) {
            // Mirror sprite when walking toward screen-left (negative X in iso space).
            const mesh = this.playerGroup.children.find((c) => c instanceof THREE.Mesh) as THREE.Mesh | undefined;
            if (mesh) mesh.scale.x = Math.cos(p.heading) < 0 ? -1 : 1;
          }
          if (!this.cameraLocked) this.camera.setTarget(p.x, p.z);
        }
      },
    );

    this.eventBus.on<{ weather: string }>('weather:changed', ({ weather }) => {
      this.applyWeatherLighting(weather);
    });
    window.addEventListener('resize', this.onResize);
  }

  update(_dt: number): void {
    if (this.disposed) return;
    this.camera.update();
    this.sortSprites();
    this.renderer.render(this.scene, this.camera.camera);
  }

  dispose(): void {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }

  pick(clientX: number, clientY: number, canvas: HTMLCanvasElement): PickResult {
    return this.pointer.pick(
      clientX,
      clientY,
      canvas,
      this.camera.camera,
      this.kernel.getWalkMeshes(),
      this.kernel.getPickTargets(),
    );
  }

  pickHover(clientX: number, clientY: number, canvas: HTMLCanvasElement): string | null {
    return this.pointer.pickHover(
      clientX,
      clientY,
      canvas,
      this.camera.camera,
      this.kernel.getPickTargets(),
    );
  }

  showClickMarker(x: number, z: number): void {
    if (!this.debugMarker) {
      const geo = new THREE.RingGeometry(0.2, 0.35, 16);
      const mat = new THREE.MeshBasicMaterial({ color: 0xd4a054, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
      this.debugMarker = new THREE.Mesh(geo, mat);
      this.debugMarker.rotation.x = -Math.PI / 2;
      this.debugMarker.renderOrder = 9999;
      this.kernel.foreground.add(this.debugMarker);
    }
    this.debugMarker.position.set(x, 0.12, z);
    this.debugMarker.visible = true;
  }

  hideClickMarker(): void {
    if (this.debugMarker) this.debugMarker.visible = false;
  }

  clearSceneContent(): void {
    for (const id of [...this.actorGroups.keys()]) {
      this.removeNPCActor(id);
    }
    for (const id of [...this.remoteGroups.keys()]) {
      this.removeRemotePlayerActor(id);
    }
    if (this.playerGroup) {
      this.kernel.actors.remove(this.playerGroup);
    }
    this.kernel.clear();
    // debugMarker's geometry/material were just disposed by kernel.clear() (it lived in
    // `foreground`) — null it out so the next click builds a fresh one, and so a stale
    // marker from the old scene's coordinate space never carries into the new district.
    this.debugMarker = null;
    if (this.playerGroup) {
      this.kernel.actors.add(this.playerGroup);
      this.sortables = [this.playerGroup];
    } else {
      this.sortables = [];
    }
  }

  /** Frame a district: pin the camera to the stage center so the full backdrop shows. */
  lockCameraTo(x: number, z: number): void {
    this.cameraLocked = true;
    this.camera.setTarget(x, z);
  }

  setPlayerActor(group: THREE.Group): void {
    this.playerGroup = group;
    this.kernel.actors.add(group);
    this.sortables.push(group);
    this.camera.setTarget(group.position.x, group.position.z);
  }

  addNPCActor(id: string, group: THREE.Group, label?: THREE.Sprite): void {
    this.actorGroups.set(id, group);
    if (label) {
      label.visible = false;
      this.npcLabels.set(id, label);
    }
    this.kernel.actors.add(group);
    this.sortables.push(group);
    const pick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, CHARACTER_MESH_SIZE, 10),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    pick.position.y = CHARACTER_MESH_SIZE * 0.45;
    group.add(pick);
    this.kernel.registerPickTarget(pick, id);
  }

  removeNPCActor(id: string): void {
    const group = this.actorGroups.get(id);
    if (group) {
      this.kernel.actors.remove(group);
      const idx = this.sortables.indexOf(group);
      if (idx >= 0) this.sortables.splice(idx, 1);
    }
    this.actorGroups.delete(id);
    this.npcLabels.delete(id);
  }

  addRemotePlayerActor(id: string, group: THREE.Group, label?: THREE.Sprite): void {
    this.remoteGroups.set(id, group);
    if (label) {
      label.visible = true;
      this.npcLabels.set(`remote:${id}`, label);
    }
    this.kernel.actors.add(group);
    this.sortables.push(group);
  }

  removeRemotePlayerActor(id: string): void {
    const group = this.remoteGroups.get(id);
    if (group) {
      this.kernel.actors.remove(group);
      const idx = this.sortables.indexOf(group);
      if (idx >= 0) this.sortables.splice(idx, 1);
    }
    this.remoteGroups.delete(id);
    this.npcLabels.delete(`remote:${id}`);
  }

  getRemoteGroup(id: string): THREE.Group | null {
    return this.remoteGroups.get(id) ?? null;
  }

  setRemotePlayerPosition(id: string, x: number, z: number, heading?: number): void {
    const g = this.remoteGroups.get(id);
    if (!g) return;
    g.position.set(x, 0, z);
    if (heading !== undefined) {
      const mesh = g.children.find((c) => c instanceof THREE.Mesh) as THREE.Mesh | undefined;
      if (mesh) mesh.scale.x = Math.cos(heading) < 0 ? -1 : 1;
    }
  }

  getNPCGroup(id: string): THREE.Group | null {
    return this.actorGroups.get(id) ?? null;
  }

  /** World (x,z) of a spawned NPC actor, for QA/regression tooling. */
  getActorWorldPosition(id: string): { x: number; z: number } | null {
    const g = this.actorGroups.get(id);
    return g ? { x: g.position.x, z: g.position.z } : null;
  }

  getPlayerWorldPosition(): { x: number; z: number } | null {
    return this.playerGroup ? { x: this.playerGroup.position.x, z: this.playerGroup.position.z } : null;
  }

  /** Projects a world (x,z) ground point to CSS pixel coordinates — used to verify
   *  actors don't visually overlap on screen (isometric depth can hide real-world
   *  separation), without trusting screenshot capture in automated environments. */
  projectToScreen(x: number, z: number, height = CHARACTER_MESH_SIZE * 0.5): { x: number; y: number } {
    const v = new THREE.Vector3(x, height, z);
    v.project(this.camera.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: (v.x * 0.5 + 0.5) * rect.width,
      y: (-v.y * 0.5 + 0.5) * rect.height,
    };
  }

  setHighlightedNpcLabel(npcId: string | null): void {
    for (const [id, label] of this.npcLabels) {
      label.visible = npcId !== null && id === npcId;
    }
  }

  setAllNpcLabelsVisible(visible: boolean): void {
    for (const label of this.npcLabels.values()) {
      label.visible = visible;
    }
  }

  private setupLighting(): void {
    this.ambient = new THREE.AmbientLight(0xe8e4d9, 0.55);
    this.scene.add(this.ambient);
    this.sun = new THREE.DirectionalLight(0xfff5e0, 0.85);
    this.sun.position.set(10, 20, 5);
    this.scene.add(this.sun);
    const fill = new THREE.DirectionalLight(0x8a9a9e, 0.35);
    fill.position.set(-5, 8, -10);
    this.scene.add(fill);
  }

  private applyWeatherLighting(weather: string): void {
    if (weather === 'rain') {
      this.ambient.color.setHex(0x8a9aa8);
      this.ambient.intensity = 0.45;
      this.sun.intensity = 0.5;
      this.scene.fog = new THREE.Fog(0x6a7a82, 18, 40);
      this.scene.background = new THREE.Color(0x2a4a44);
    } else if (weather === 'fog') {
      this.ambient.color.setHex(0xc8ccc8);
      this.ambient.intensity = 0.55;
      this.sun.intensity = 0.6;
      this.scene.fog = new THREE.Fog(0x9aa8a0, 22, 48);
      this.scene.background = new THREE.Color(0x3a5048);
    } else {
      this.ambient.color.setHex(0xe8e4d9);
      this.ambient.intensity = 0.55;
      this.sun.intensity = 0.85;
      this.scene.fog = new THREE.Fog(0x2a4a44, 32, 62);
      this.scene.background = new THREE.Color(0x2a4a44);
    }
  }

  private sortSprites(): void {
    const all = [...this.sortables];
    all.sort((a, b) => depthSortKey(a.position.x, a.position.z) - depthSortKey(b.position.x, b.position.z));
    all.forEach((g, i) => {
      g.traverse((child) => {
        if ('renderOrder' in child) (child as THREE.Mesh).renderOrder = i;
      });
    });
  }

  private onResize = (): void => {
    this.camera.resize(window.innerWidth, window.innerHeight);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
