/** Pixel-art cursor data URLs for the game canvas (16×16, hot spot 8,8). */

function canvasToUrl(draw: (ctx: CanvasRenderingContext2D, s: number) => void, size = 16): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  draw(ctx, size);
  return `url('${canvas.toDataURL('image/png')}') ${size / 2} ${size / 2}, crosshair`;
}

/** Amber reed-cross — default walk / click-to-move */
export const CURSOR_WALK = canvasToUrl((ctx, s) => {
  const c = s / 2;
  ctx.strokeStyle = '#d4a054';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#1a3c34';
  ctx.fillRect(c - 1, 0, 2, s);
  ctx.fillRect(0, c - 1, s, 2);
  ctx.beginPath();
  ctx.arc(c, c, 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#d4a054';
  ctx.fillRect(c - 1, c - 1, 2, 2);
});

/** Open lily pad — interact / talk */
export const CURSOR_INTERACT = canvasToUrl((ctx, _s) => {
  ctx.fillStyle = '#5c7a52';
  ctx.beginPath();
  ctx.arc(8, 10, 6, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fill();
  ctx.strokeStyle = '#d4a054';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#e8e4d9';
  ctx.fillRect(10, 4, 2, 5);
  ctx.fillRect(11, 3, 2, 2);
});

/** Marsh X — combat / locked */
export const CURSOR_COMBAT = canvasToUrl((ctx, _s) => {
  ctx.strokeStyle = '#c45c4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, 4);
  ctx.lineTo(12, 12);
  ctx.moveTo(12, 4);
  ctx.lineTo(4, 12);
  ctx.stroke();
});

/** Title / dialogue — default arrow hidden on canvas */
export const CURSOR_DEFAULT = 'default';

export const GAME_CURSORS = {
  walk: CURSOR_WALK,
  interact: CURSOR_INTERACT,
  combat: CURSOR_COMBAT,
  default: CURSOR_DEFAULT,
} as const;
