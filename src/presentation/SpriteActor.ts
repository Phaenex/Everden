import * as THREE from 'three';
import { createCharacterMesh, createGroundShadow, createNameLabel, CHARACTER_MESH_SIZE } from './CharacterSprites';
import type { CharacterAppearance } from '@/gameplay/CharacterAppearance';
import type { WardrobeDefinition } from '@/data/types';

export { createCharacterMesh, createNameLabel, drawCharacterCanvas, CHARACTER_MESH_SIZE } from './CharacterSprites';

/** @deprecated use createCharacterMesh */
export function createSpriteMesh(_color: string | number, size = 0.8): THREE.Mesh {
  return createCharacterMesh('frog', 0, size);
}

export function depthSortKey(x: number, z: number): number {
  return z * 1000 + x;
}

export interface CharacterActor {
  mesh: THREE.Mesh;
  label: THREE.Sprite;
  group: THREE.Group;
}

export function createCharacterActor(
  species: string,
  name: string,
  variant = 0,
  npcId?: string,
  appearance?: CharacterAppearance,
  wardrobeItems: WardrobeDefinition[] = [],
): CharacterActor {
  const group = new THREE.Group();
  group.add(createGroundShadow(CHARACTER_MESH_SIZE));
  const mesh = createCharacterMesh(species, variant, CHARACTER_MESH_SIZE, npcId, appearance, wardrobeItems);
  const label = createNameLabel(name, CHARACTER_MESH_SIZE);
  group.add(mesh);
  group.add(label);
  return { mesh, label, group };
}
