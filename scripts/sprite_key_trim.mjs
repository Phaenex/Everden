/**
 * Sprite matte removal + flush alpha trim.
 * Uses sharp (https://github.com/lovell/sharp) trim after keying white/grey halos.
 */
import sharp from 'sharp';
import { readFile, writeFile } from 'fs/promises';

export function isMatte(r, g, b, a) {
  if (a < 12) return true;
  if (r > 235 && g > 235 && b > 235) return true;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  return luma > 198 && sat < 32;
}

export function keyNearBlack(data, w, h, channels = 4, threshold = 48) {
  for (let i = 0; i < w * h; i++) {
    const o = i * channels;
    if (data[o] <= threshold && data[o + 1] <= threshold && data[o + 2] <= threshold) {
      data[o + 3] = 0;
    }
  }
}

/** Flood-clear edge-connected matte from raw RGBA buffer. */
export function floodClearMatte(data, w, h, channels = 4) {
  const visited = new Uint8Array(w * h);
  const stack = [];

  const trySeed = (x, y) => {
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * channels;
    if (!isMatte(data[o], data[o + 1], data[o + 2], data[o + 3])) return;
    visited[i] = 1;
    stack.push(i);
  };

  for (let x = 0; x < w; x++) {
    trySeed(x, 0);
    trySeed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    trySeed(0, y);
    trySeed(w - 1, y);
  }

  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i - x) / w;
    data[i * channels + 3] = 0;
    if (x > 0) trySeed(x - 1, y);
    if (x < w - 1) trySeed(x + 1, y);
    if (y > 0) trySeed(x, y - 1);
    if (y < h - 1) trySeed(x, y + 1);
  }
}

export function defringe(data, w, h, channels = 4) {
  const alpha = (x, y) => data[(y * w + x) * channels + 3];
  const clear = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * channels;
      if (data[o + 3] === 0) continue;
      const touches =
        (x > 0 && alpha(x - 1, y) === 0) ||
        (x < w - 1 && alpha(x + 1, y) === 0) ||
        (y > 0 && alpha(x, y - 1) === 0) ||
        (y < h - 1 && alpha(x, y + 1) === 0);
      if (!touches) continue;
      const luma = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
      if (luma > 190) clear.push(o + 3);
    }
  }
  for (const a of clear) data[a] = 0;
}

/**
 * Key matte, defringe, then sharp.trim() for flush transparent bounds.
 * @param {Buffer} inputPng
 * @returns {Promise<{ buffer: Buffer, width: number, height: number }>}
 */
export async function cleanAndTrimPng(inputPng) {
  const img = sharp(inputPng).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  keyNearBlack(data, width, height, channels);
  floodClearMatte(data, width, height, channels);
  defringe(data, width, height, channels);
  defringe(data, width, height, channels);

  const trimmed = await sharp(data, { raw: { width, height, channels } })
    .trim({ threshold: 8 })
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: trimmed.data,
    width: trimmed.info.width,
    height: trimmed.info.height,
  };
}

export async function cleanAndTrimFile(inputPath, outputPath) {
  const input = await readFile(inputPath);
  const { buffer } = await cleanAndTrimPng(input);
  await writeFile(outputPath, buffer);
}
