/** Lightweight crowd separation — pushes overlapping agents apart (RVO-lite). */
export function applySeparation(agents, radius = 0.55, strength = 2.4) {
    const offsets = new Map();
    for (const a of agents)
        offsets.set(a.id, { x: 0, z: 0 });
    for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
            const a = agents[i];
            const b = agents[j];
            const dx = b.x - a.x;
            const dz = b.z - a.z;
            const dist = Math.hypot(dx, dz);
            if (dist >= radius || dist < 0.001)
                continue;
            const push = ((radius - dist) / radius) * strength;
            const nx = dx / dist;
            const nz = dz / dist;
            const oa = offsets.get(a.id);
            const ob = offsets.get(b.id);
            oa.x -= nx * push * 0.5;
            oa.z -= nz * push * 0.5;
            ob.x += nx * push * 0.5;
            ob.z += nz * push * 0.5;
        }
    }
    return offsets;
}
