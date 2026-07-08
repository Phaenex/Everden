import * as THREE from 'three';
import type { EventBus } from '@/core/EventBus';
import type { IGameModule } from '@/core/IGameModule';
import type { Weather } from '@/simulation/WeatherSimulator';

/**
 * Lightweight rain particle overlay synced to weather state.
 */
export class RainVFX implements IGameModule {
  private points: THREE.Points | null = null;
  private velocities: Float32Array | null = null;
  private active = false;
  private count = 400;

  constructor(
    private eventBus: EventBus,
    private scene: THREE.Scene,
  ) {}

  init(): void {
    this.buildParticles();
    this.eventBus.on<{ weather: Weather }>('weather:changed', ({ weather }) => {
      this.active = weather === 'rain';
      if (this.points) this.points.visible = this.active;
    });
  }

  update(dt: number): void {
    if (!this.active || !this.points || !this.velocities) return;
    const pos = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < this.count; i++) {
      let y = pos.getY(i) - this.velocities[i]! * dt * 12;
      let x = pos.getX(i) - dt * 2;
      if (y < -1) y = 14 + Math.random() * 4;
      if (x < -14) x = 14;
      pos.setXYZ(i, x, y, pos.getZ(i));
    }
    pos.needsUpdate = true;
  }

  dispose(): void {
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
    }
  }

  private buildParticles(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = Math.random() * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 28;
      this.velocities[i] = 0.8 + Math.random() * 0.6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xa8c4d4,
      size: 0.08,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.visible = false;
    this.scene.add(this.points);
  }
}
