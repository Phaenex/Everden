export const DEFAULT_MOVEMENT_CONFIG = {
    maxSpeed: 5.8,
    acceleration: 28,
    deceleration: 36,
    arrivalRadius: 0.22,
};
export function createMovementState(x, z) {
    return {
        x,
        z,
        vx: 0,
        vz: 0,
        heading: 0,
        path: [],
        pathIndex: 0,
        destX: x,
        destZ: z,
        stopRadius: 0.25,
        moving: false,
    };
}
export function beginWalk(state, nav, destX, destZ, stopRadius = 0.25) {
    let x = destX;
    let z = destZ;
    if (!nav.isWalkable(x, z)) {
        const snap = nav.nearestWalkable({ x, z });
        if (!snap)
            return false;
        x = snap.x;
        z = snap.z;
    }
    const dx = x - state.x;
    const dz = z - state.z;
    if (Math.hypot(dx, dz) <= stopRadius)
        return true;
    const path = nav.findPath({ x: state.x, z: state.z }, { x, z });
    if (path.length === 0)
        return false;
    state.path = path;
    state.pathIndex = path.length > 1 ? 1 : 0;
    state.destX = x;
    state.destZ = z;
    state.stopRadius = stopRadius;
    state.moving = true;
    return true;
}
export function cancelWalk(state) {
    state.path = [];
    state.pathIndex = 0;
    state.moving = false;
    state.vx = 0;
    state.vz = 0;
}
function shortcutPath(state, nav) {
    if (state.pathIndex >= state.path.length)
        return;
    const here = { x: state.x, z: state.z };
    if (nav.canWalkDirectly(here, { x: state.destX, z: state.destZ })) {
        state.path = [here, { x: state.destX, z: state.destZ }];
        state.pathIndex = 1;
        return;
    }
    while (state.pathIndex < state.path.length - 1) {
        const next = state.path[state.pathIndex + 1];
        if (!nav.canWalkDirectly(here, next))
            break;
        state.pathIndex++;
    }
}
/** Advance one simulation tick — pure, no DOM/THREE. Used by client prediction and server authority. */
export function stepMovement(state, nav, dt, config, moveModifier = 1) {
    if (!state.moving || state.pathIndex >= state.path.length) {
        state.moving = false;
        state.vx = 0;
        state.vz = 0;
        return false;
    }
    shortcutPath(state, nav);
    const target = state.path[state.pathIndex];
    const dx = target.x - state.x;
    const dz = target.z - state.z;
    const dist = Math.hypot(dx, dz);
    const maxSpeed = config.maxSpeed * moveModifier;
    if (dist <= config.arrivalRadius) {
        state.x = target.x;
        state.z = target.z;
        state.pathIndex++;
        if (state.pathIndex >= state.path.length) {
            state.moving = false;
            state.vx = 0;
            state.vz = 0;
            return false;
        }
        return true;
    }
    const desiredVx = (dx / dist) * maxSpeed;
    const desiredVz = (dz / dist) * maxSpeed;
    const accel = config.acceleration * dt;
    state.vx += Math.sign(desiredVx - state.vx) * Math.min(accel, Math.abs(desiredVx - state.vx));
    state.vz += Math.sign(desiredVz - state.vz) * Math.min(accel, Math.abs(desiredVz - state.vz));
    const speed = Math.hypot(state.vx, state.vz);
    if (speed > maxSpeed) {
        state.vx = (state.vx / speed) * maxSpeed;
        state.vz = (state.vz / speed) * maxSpeed;
    }
    state.x += state.vx * dt;
    state.z += state.vz * dt;
    if (Math.abs(state.vx) + Math.abs(state.vz) > 0.01) {
        state.heading = Math.atan2(state.vz, state.vx);
    }
    return true;
}
