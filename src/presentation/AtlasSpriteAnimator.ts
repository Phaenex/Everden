import type { LoadedAtlas } from './AtlasFrameLoader';
import { getFrameCanvas } from './AtlasFrameLoader';
import {
  DEFAULT_FROGWIZ_ANIMATIONS,
  sampleAtlasTimeline,
  type AtlasAnimationDef,
  type AtlasAnimations,
} from './AtlasAnimationTimelines';

export type AtlasAnimState = 'idle' | 'walk' | 'wave' | 'cast';
export type AtlasDirection = 'front' | 'back' | 'left' | 'right';

const IDLE_BOB_MS = 900;
const WALK_BOB_MS = 420;
const WALK_LEG_MS = 420;

const TIMELINE_STATES: AtlasAnimState[] = ['wave', 'cast'];

export function resolveAtlasFrameName(
  animState: AtlasAnimState,
  direction: AtlasDirection | null,
  walkLeg: 0 | 1,
): string {
  if (animState === 'walk') return walkLeg === 0 ? 'walk' : 'idle';
  if (animState === 'wave') return 'wave';
  if (animState === 'cast') return 'cast';
  if (direction) return `view_${direction}`;
  return 'idle';
}

export function bobOffsetY(animState: AtlasAnimState, elapsedMs: number): number {
  const period = animState === 'walk' ? WALK_BOB_MS : IDLE_BOB_MS;
  const amp = animState === 'walk' ? 4 : 2;
  return Math.sin((elapsedMs / period) * Math.PI * 2) * amp;
}

export function nextWalkLeg(elapsedMs: number, prevLeg: 0 | 1, prevSwapAt: number): { leg: 0 | 1; swapAt: number } {
  if (elapsedMs - prevSwapAt < WALK_LEG_MS) return { leg: prevLeg, swapAt: prevSwapAt };
  return { leg: prevLeg === 0 ? 1 : 0, swapAt: elapsedMs };
}

export type AtlasDrawOptions = {
  anchor?: string;
  bobY?: number;
  dy?: number;
  swayX?: number;
  blendFrame?: HTMLCanvasElement;
  blendT?: number;
  glow?: number;
};

function layoutFrame(
  frame: HTMLCanvasElement,
  cw: number,
  ch: number,
  anchor: string,
  bobY: number,
  dy: number,
  swayX: number,
): { dx: number; dy: number; dw: number; dh: number } {
  const scale = Math.min((cw - 16) / frame.width, (ch - 16) / frame.height);
  const dw = frame.width * scale;
  const dh = frame.height * scale;
  const dx = (cw - dw) / 2 + swayX;
  let y = (ch - dh) / 2;
  if (anchor === 'bottom-center') y = ch - dh - 8;
  y += bobY + dy;
  return { dx, dy: y, dw, dh };
}

/** Pulsing magic glow for cast frame (staff tip region). */
export function drawCastGlow(
  ctx: CanvasRenderingContext2D,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  intensity: number,
): void {
  if (intensity <= 0) return;
  const cx = dx + dw * 0.78;
  const cy = dy + dh * 0.14;
  const r = Math.max(6, dw * 0.14) * (0.85 + intensity * 0.35);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, `rgba(200, 120, 255, ${0.55 * intensity})`);
  g.addColorStop(0.45, `rgba(140, 60, 220, ${0.28 * intensity})`);
  g.addColorStop(1, 'rgba(80, 20, 160, 0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draw a cropped atlas frame into a viewport with bottom-center anchor + optional bob. */
export function drawAtlasFrame(
  ctx: CanvasRenderingContext2D,
  frame: HTMLCanvasElement,
  cw: number,
  ch: number,
  opts: AtlasDrawOptions = {},
): { dx: number; dy: number; dw: number; dh: number } {
  const anchor = opts.anchor ?? 'bottom-center';
  const bobY = opts.bobY ?? 0;
  const dy = opts.dy ?? 0;
  const swayX = opts.swayX ?? 0;
  const blendT = opts.blendT ?? 0;
  const blendFrame = opts.blendFrame;

  ctx.clearRect(0, 0, cw, ch);
  ctx.imageSmoothingEnabled = false;

  let layout = layoutFrame(frame, cw, ch, anchor, bobY, dy, swayX);

  if (blendFrame && blendT > 0 && blendT < 1) {
    const back = layoutFrame(blendFrame, cw, ch, anchor, bobY, dy, swayX);
    ctx.globalAlpha = 1 - blendT;
    ctx.drawImage(blendFrame, back.dx, back.dy, back.dw, back.dh);
    ctx.globalAlpha = blendT;
    ctx.drawImage(frame, layout.dx, layout.dy, layout.dw, layout.dh);
    ctx.globalAlpha = 1;
  } else {
    ctx.drawImage(frame, layout.dx, layout.dy, layout.dw, layout.dh);
  }

  if (opts.glow && opts.glow > 0) {
    drawCastGlow(ctx, layout.dx, layout.dy, layout.dw, layout.dh, opts.glow);
  }

  return layout;
}

/**
 * Continuous rAF animator for JSON atlas characters (state-swap + smooth bob).
 * Walk alternates walk/idle frames on a timer; vertical motion is sine-interpolated every frame.
 */
export class AtlasSpriteAnimator {
  animState: AtlasAnimState = 'idle';
  direction: AtlasDirection | null = null;
  playing = true;

  private rafId = 0;
  private startTime = 0;
  private stateStartTime = 0;
  private walkLeg: 0 | 1 = 0;
  private walkSwapAt = 0;
  private onFrame: (() => void) | null = null;
  private animations: AtlasAnimations;

  constructor(
    private atlas: LoadedAtlas,
    private frameCache: Map<string, HTMLCanvasElement>,
    animations?: AtlasAnimations,
  ) {
    this.animations = animations ?? atlas.manifest.animations ?? DEFAULT_FROGWIZ_ANIMATIONS;
  }

  static buildFrameCache(atlas: LoadedAtlas): Map<string, HTMLCanvasElement> {
    const cache = new Map<string, HTMLCanvasElement>();
    for (const name of Object.keys(atlas.manifest.frames)) {
      const frame = getFrameCanvas(atlas, name);
      if (frame) cache.set(name, frame);
    }
    return cache;
  }

  setState(state: AtlasAnimState): void {
    this.animState = state;
    this.stateStartTime = performance.now();
    if (state !== 'walk') {
      this.walkLeg = 0;
      this.walkSwapAt = 0;
    }
  }

  setDirection(dir: AtlasDirection | null): void {
    this.direction = dir;
  }

  currentFrameName(): string {
    return resolveAtlasFrameName(this.animState, this.direction, this.walkLeg);
  }

  private timelineFor(state: AtlasAnimState): AtlasAnimationDef | undefined {
    return this.animations[state];
  }

  tick(now: number): {
    frameName: string;
    bobY: number;
    dy: number;
    swayX: number;
    blendFrame?: string;
    blendT: number;
    glow: number;
    keyIndex?: number;
  } {
    const elapsed = now - this.startTime;
    const stateElapsed = now - this.stateStartTime;

    if (TIMELINE_STATES.includes(this.animState)) {
      const def = this.timelineFor(this.animState);
      if (def) {
        const sample = sampleAtlasTimeline(def.keys, stateElapsed, def.loop);
        const bobY = this.playing && this.animState === 'wave'
          ? bobOffsetY('idle', elapsed) * 0.5
          : 0;
        return {
          frameName: sample.frameName,
          bobY,
          dy: sample.dy,
          swayX: sample.swayX,
          blendFrame: sample.blendFrame,
          blendT: sample.blendT,
          glow: sample.glow,
          keyIndex: sample.keyIndex,
        };
      }
    }

    if (this.animState === 'walk' && this.playing) {
      const next = nextWalkLeg(elapsed, this.walkLeg, this.walkSwapAt);
      this.walkLeg = next.leg;
      this.walkSwapAt = next.swapAt;
    }
    const frameName = this.currentFrameName();
    const bobY = this.playing ? bobOffsetY(this.animState, elapsed) : 0;
    return { frameName, bobY, dy: 0, swayX: 0, blendT: 0, glow: 0 };
  }

  draw(ctx: CanvasRenderingContext2D, cw: number, ch: number, now: number): string {
    const sample = this.tick(now);
    const frame = this.frameCache.get(sample.frameName);
    if (!frame) {
      ctx.clearRect(0, 0, cw, ch);
      return sample.frameName;
    }
    const blendCanvas = sample.blendFrame ? this.frameCache.get(sample.blendFrame) : undefined;
    drawAtlasFrame(ctx, frame, cw, ch, {
      anchor: this.atlas.manifest.meta.anchor,
      bobY: sample.bobY,
      dy: sample.dy,
      swayX: sample.swayX,
      blendFrame: blendCanvas,
      blendT: sample.blendT,
      glow: sample.glow,
    });
    return sample.frameName;
  }

  start(onFrame: () => void): void {
    this.onFrame = onFrame;
    const now = performance.now();
    this.startTime = now;
    this.stateStartTime = now;
    this.walkSwapAt = 0;
    this.playing = true;
    this.stopLoop();
    const loop = (): void => {
      if (this.playing) this.onFrame?.();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  pause(): void {
    this.playing = false;
  }

  resume(): void {
    if (!this.playing) {
      this.playing = true;
      const now = performance.now();
      this.startTime = now;
      this.stateStartTime = now;
      this.walkSwapAt = 0;
    }
  }

  togglePlay(): boolean {
    if (this.playing) this.pause();
    else this.resume();
    return this.playing;
  }

  stopLoop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  dispose(): void {
    this.stopLoop();
    this.onFrame = null;
  }
}
