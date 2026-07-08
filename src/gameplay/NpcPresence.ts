import type { NPCDefinition } from '@/data/types';

/** Maps simulator location ids to playable scene ids (vertical-slice districts). */
const LOCATION_TO_SCENE: Record<string, string> = {
  lilymarket: 'lilymarket',
  lilypond: 'lilymarket',
  council_shell: 'mudwall',
  mudwall: 'mudwall',
  levy_site: 'mudwall',
  sunken_chapel: 'mudwall',
  ferry_rest: 'ferry_rest',
  croakend: 'croakend',
  causeway: 'causeway',
};

export function locationToScene(location: string): string | null {
  return LOCATION_TO_SCENE[location] ?? null;
}

/**
 * Most "sleep" entries cross midnight (e.g. startHour 18, endHour 8) — a plain
 * `hour >= start && hour < end` can never be true for any hour when start > end,
 * so every NPC's overnight entry silently matched nothing and they vanished from
 * every scene overnight instead of showing at their mapped sleep location.
 */
export function getScheduleEntry(npc: NPCDefinition, hour: number) {
  return npc.schedule.find((s) =>
    s.startHour <= s.endHour
      ? hour >= s.startHour && hour < s.endHour
      : hour >= s.startHour || hour < s.endHour,
  );
}

/** True when this NPC's schedule says they should be in `sceneId` at `hour`. */
export function npcPresentInScene(npc: NPCDefinition, hour: number, sceneId: string): boolean {
  const entry = getScheduleEntry(npc, hour);
  if (!entry) return false;
  const targetScene = locationToScene(entry.location);
  if (!targetScene) return false;
  return targetScene === sceneId;
}
