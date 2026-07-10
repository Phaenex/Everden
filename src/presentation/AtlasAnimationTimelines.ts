export type AtlasKeyframe = {
  frame: string;
  ms: number;
  dy?: number;
  sway?: number;
  blend?: number;
  glow?: number;
};

export type AtlasAnimationDef = {
  loop: boolean;
  keys: AtlasKeyframe[];
};

export type AtlasAnimations = Record<string, AtlasAnimationDef>;

export type AtlasAnimSample = {
  frameName: string;
  blendFrame?: string;
  blendT: number;
  dy: number;
  swayX: number;
  glow: number;
  keyIndex: number;
};

export function totalDuration(keys: AtlasKeyframe[]): number {
  return keys.reduce((sum, k) => sum + k.ms, 0);
}

/** Sample a looping or one-shot timeline at elapsed ms. */
export function sampleAtlasTimeline(
  keys: AtlasKeyframe[],
  elapsedMs: number,
  loop: boolean,
): AtlasAnimSample {
  if (!keys.length) {
    return { frameName: 'idle', blendT: 0, dy: 0, swayX: 0, glow: 0, keyIndex: 0 };
  }

  const total = totalDuration(keys);
  let t = elapsedMs;
  if (loop && total > 0) t = elapsedMs % total;
  else if (!loop && t >= total) {
    const last = keys[keys.length - 1]!;
    return {
      frameName: last.frame,
      blendT: 0,
      dy: last.dy ?? 0,
      swayX: last.sway ?? 0,
      glow: last.glow ?? 0,
      keyIndex: keys.length - 1,
    };
  }

  let acc = 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!;
    const next = acc + key.ms;
    if (t < next) {
      const prev = keys[Math.max(0, i - 1)];
      const blendT = key.blend ?? 0;
      return {
        frameName: key.frame,
        blendFrame: blendT > 0 ? prev?.frame ?? key.frame : undefined,
        blendT,
        dy: key.dy ?? 0,
        swayX: key.sway ?? 0,
        glow: key.glow ?? 0,
        keyIndex: i,
      };
    }
    acc = next;
  }

  const last = keys[keys.length - 1]!;
  return {
    frameName: last.frame,
    blendT: 0,
    dy: last.dy ?? 0,
    swayX: last.sway ?? 0,
    glow: last.glow ?? 0,
    keyIndex: keys.length - 1,
  };
}

/** Built-in wave/cast when manifest has no animations block. */
export const DEFAULT_FROGWIZ_ANIMATIONS: AtlasAnimations = {
  wave: {
    loop: true,
    keys: [
      { frame: 'idle', ms: 140 },
      { frame: 'idle', ms: 100, dy: -2 },
      { frame: 'wave', ms: 180, blend: 0.35 },
      { frame: 'wave', ms: 160, sway: 5, dy: -2 },
      { frame: 'wave', ms: 160, sway: -5 },
      { frame: 'wave', ms: 160, sway: 4, dy: -1 },
      { frame: 'wave', ms: 140 },
      { frame: 'idle', ms: 180, blend: 0.4 },
    ],
  },
  cast: {
    loop: true,
    keys: [
      { frame: 'idle', ms: 180 },
      { frame: 'idle', ms: 120, dy: 2 },
      { frame: 'cast', ms: 220, blend: 0.4 },
      { frame: 'cast', ms: 280, glow: 0.35 },
      { frame: 'cast', ms: 280, glow: 0.75 },
      { frame: 'cast', ms: 280, glow: 1 },
      { frame: 'cast', ms: 240, glow: 0.55 },
      { frame: 'idle', ms: 200, blend: 0.35 },
    ],
  },
};
