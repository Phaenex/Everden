const MAX_SPEED = 8.5;
const MAX_STEP_PER_TICK = 0.35;

export function validateWalkTarget(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  isWalkable: (x: number, z: number) => boolean,
): boolean {
  if (!isWalkable(toX, toZ)) return false;
  const dist = Math.hypot(toX - fromX, toZ - fromZ);
  if (dist > 24) return false;
  return true;
}

export function clampMovementDelta(dx: number, dz: number): { dx: number; dz: number } {
  const dist = Math.hypot(dx, dz);
  if (dist <= MAX_STEP_PER_TICK) return { dx, dz };
  const s = MAX_STEP_PER_TICK / dist;
  return { dx: dx * s, dz: dz * s };
}

export function isSpeedValid(dx: number, dz: number, dt: number): boolean {
  const speed = Math.hypot(dx, dz) / Math.max(dt, 0.001);
  return speed <= MAX_SPEED;
}
