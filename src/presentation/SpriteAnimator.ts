import * as THREE from 'three';
import type { EventBus } from '@/core/EventBus';
import type { CharacterAppearance } from '@/gameplay/CharacterAppearance';
import type { WardrobeDefinition } from '@/data/types';
import { composeCharacterArtCanvas } from './CharacterSprites';

const BOB_MS = 900;
const FLUTTER_MIN_MS = 8000;
const FLUTTER_MAX_MS = 15000;
const FLUTTER_RAIN_MIN_MS = 4000;
const FLUTTER_RAIN_MAX_MS = 7000;
const FLUTTER_STEP_MS = 200;

type MeshWithAnimator = THREE.Mesh & { __spriteAnimator?: SpriteAnimator };

/**
 * Drives body idle bob and occasional cloak flutter on a character billboard mesh.
 * Re-composes PNG layers each tick so cloak animation frames stay in sync with body.
 */
export class SpriteAnimator {
  private bodyFrame = 0;
  private cloakFrame = 0;
  private bobTimer: ReturnType<typeof setInterval> | null = null;
  private flutterTimer: ReturnType<typeof setTimeout> | null = null;
  private flutterSteps: ReturnType<typeof setTimeout>[] = [];
  private weatherUnsub: (() => void) | null = null;
  private rainBoost = false;
  private disposed = false;

  constructor(
    private mesh: THREE.Mesh,
    private species: string,
    private appearance: CharacterAppearance,
    private wardrobeItems: WardrobeDefinition[],
    private npcId?: string,
    eventBus?: EventBus,
  ) {
    if (eventBus) {
      this.weatherUnsub = eventBus.on<{ weather: string }>('weather:changed', ({ weather }) => {
        this.rainBoost = weather === 'rain' || weather === 'storm';
        this.scheduleFlutter();
      });
    }
  }

  static attach(
    mesh: THREE.Mesh,
    species: string,
    appearance: CharacterAppearance,
    wardrobeItems: WardrobeDefinition[],
    npcId?: string,
    eventBus?: EventBus,
  ): SpriteAnimator {
    const existing = (mesh as MeshWithAnimator).__spriteAnimator;
    existing?.detach();
    const anim = new SpriteAnimator(mesh, species, appearance, wardrobeItems, npcId, eventBus);
    (mesh as MeshWithAnimator).__spriteAnimator = anim;
    anim.start();
    return anim;
  }

  start(): void {
    void this.applyFrame();
    this.bobTimer = window.setInterval(() => {
      this.bodyFrame = this.bodyFrame === 0 ? 1 : 0;
      void this.applyFrame();
    }, BOB_MS);
    this.scheduleFlutter();
  }

  detach(): void {
    this.disposed = true;
    if (this.bobTimer !== null) window.clearInterval(this.bobTimer);
    if (this.flutterTimer !== null) window.clearTimeout(this.flutterTimer);
    for (const t of this.flutterSteps) window.clearTimeout(t);
    this.flutterSteps = [];
    this.weatherUnsub?.();
    delete (this.mesh as MeshWithAnimator).__spriteAnimator;
  }

  private hasCloak(): boolean {
    return Boolean(this.appearance.wardrobe.cloak);
  }

  private scheduleFlutter(): void {
    if (this.flutterTimer !== null) window.clearTimeout(this.flutterTimer);
    if (!this.hasCloak() || this.disposed) return;
    const min = this.rainBoost ? FLUTTER_RAIN_MIN_MS : FLUTTER_MIN_MS;
    const max = this.rainBoost ? FLUTTER_RAIN_MAX_MS : FLUTTER_MAX_MS;
    const delay = min + Math.random() * (max - min);
    this.flutterTimer = window.setTimeout(() => this.playFlutter(), delay);
  }

  private playFlutter(): void {
    if (this.disposed || !this.hasCloak()) return;
    const sequence = [1, 2, 0];
    sequence.forEach((frame, i) => {
      const t = window.setTimeout(() => {
        this.cloakFrame = frame;
        void this.applyFrame();
        if (i === sequence.length - 1) this.scheduleFlutter();
      }, i * FLUTTER_STEP_MS);
      this.flutterSteps.push(t);
    });
  }

  private async applyFrame(): Promise<void> {
    if (this.disposed) return;
    const composed = await composeCharacterArtCanvas(
      this.species,
      this.appearance,
      this.wardrobeItems,
      this.bodyFrame,
      this.npcId,
      this.cloakFrame,
    );
    if (!composed || this.disposed) return;
    const mat = this.mesh.material as THREE.MeshBasicMaterial;
    const prev = mat.map;
    const tex = new THREE.CanvasTexture(composed);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    mat.map = tex;
    mat.needsUpdate = true;
    if (prev && prev !== mat.map) prev.dispose();
  }
}
