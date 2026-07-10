#!/usr/bin/env node
/**
 * Rebuild frogwiz atlas from source PNGs using sharp flush trim.
 * Default source: ~/Downloads/frogwiz_sprites_1/*@4x.png (falls back to non-@4x).
 */
import { readFile, writeFile, access } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { cleanAndTrimPng } from './sprite_key_trim.mjs';

import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PNG = path.join(ROOT, 'public/assets/sprites/atlas/frogwiz_atlas.png');
const OUT_JSON = path.join(ROOT, 'public/data/atlas/frogwiz_atlas.json');
const DEFAULT_SRC = path.join(process.env.HOME ?? '', 'Downloads/frogwiz_sprites_1');
const PAD = 2;
const COLS = 4;

const FRAME_ORDER = [
  'idle',
  'walk',
  'wave',
  'cast',
  'view_front',
  'view_back',
  'view_left',
  'view_right',
  'item_hat',
  'item_robe',
  'item_wand',
  'item_amulet',
];

const ANIMATIONS = {
  wave: {
    loop: true,
    keys: [
      { frame: 'idle', ms: 140 },
      { frame: 'idle', ms: 100, dy: -2 },
      { frame: 'wave', ms: 180, blend: 0.35 },
      { frame: 'wave', ms: 160, sway: 5, dy: -2 },
      { frame: 'wave', ms: 160, sway: -5, dy: 0 },
      { frame: 'wave', ms: 160, sway: 4, dy: -1 },
      { frame: 'wave', ms: 140, sway: 0, dy: 0 },
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

async function resolveSrcDir() {
  const arg = process.argv[2];
  const dir = arg ? path.resolve(arg) : DEFAULT_SRC;
  await access(dir);
  return dir;
}

async function loadFrame(srcDir, name) {
  const hi = path.join(srcDir, `${name}@4x.png`);
  const lo = path.join(srcDir, `${name}.png`);
  try {
    await access(hi);
    return readFile(hi);
  } catch {
    return readFile(lo);
  }
}

async function main() {
  const srcDir = await resolveSrcDir();
  console.log(`Source: ${srcDir}`);

  const cleaned = [];
  for (const name of FRAME_ORDER) {
    const raw = await loadFrame(srcDir, name);
    const { buffer, width, height } = await cleanAndTrimPng(raw);
    // Downscale @4x to ~1x for atlas (target max height ~120)
    const scaled = await sharp(buffer)
      .resize({
        height: Math.min(120, height),
        fit: 'inside',
        kernel: sharp.kernel.nearest,
      })
      .png()
      .toBuffer({ resolveWithObject: true });

    cleaned.push({ name, buffer: scaled.data, width: scaled.info.width, height: scaled.info.height });
    console.log(`${name.padEnd(12)} -> ${scaled.info.width}x${scaled.info.height}`);
  }

  const maxW = Math.max(...cleaned.map((f) => f.width));
  const maxH = Math.max(...cleaned.map((f) => f.height));
  const cellW = maxW + PAD * 2;
  const cellH = maxH + PAD * 2;
  const rows = Math.ceil(cleaned.length / COLS);
  const outW = COLS * cellW - PAD;
  const outH = rows * cellH - PAD;

  const atlas = sharp({
    create: { width: outW, height: outH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  });

  const composites = [];
  const frames = {};

  for (let i = 0; i < cleaned.length; i++) {
    const { name, buffer, width, height } = cleaned[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const ox = col * cellW + PAD + Math.floor((maxW - width) / 2);
    const oy = row * cellH + PAD + Math.floor((maxH - height) / 2);
    composites.push({ input: buffer, left: ox, top: oy });
    frames[name] = { x: ox, y: oy, w: width, h: height, col, row };
  }

  const outBuffer = await atlas.composite(composites).png().toBuffer();
  await writeFile(OUT_PNG, outBuffer);

  const manifest = {
    meta: {
      image: 'frogwiz_atlas.png',
      size: { w: outW, h: outH },
      cell: { w: cellW, h: cellH },
      padding: PAD,
      columns: COLS,
      rows,
      anchor: 'bottom-center',
      trimmed: true,
      trimTool: 'sharp+sprite_key_trim',
    },
    frames,
    animations: ANIMATIONS,
  };

  await writeFile(OUT_JSON, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nWrote ${OUT_PNG} (${outW}x${outH})`);
  console.log(`Wrote ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
