import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NavMesh } from '../../shared/nav/NavMesh.js';
import type { SceneDefinition } from '../../shared/data/sceneTypes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENES_DIR = path.resolve(__dirname, '../../../public/data/scenes');

const cache = new Map<string, { spec: SceneDefinition; nav: NavMesh }>();

export function loadSceneNav(sceneId: string): { spec: SceneDefinition; nav: NavMesh } {
  const hit = cache.get(sceneId);
  if (hit) return hit;
  const file = path.join(SCENES_DIR, `${sceneId}.json`);
  const raw = fs.readFileSync(file, 'utf8');
  const spec = JSON.parse(raw) as SceneDefinition;
  const poly = spec.navPolygon.map(([x, z]) => ({ x, z }));
  const nav = new NavMesh(poly);
  const entry = { spec, nav };
  cache.set(sceneId, entry);
  return entry;
}
