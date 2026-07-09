export interface SceneNpcSlot {
  id: string;
  x: number;
  z: number;
}

export interface SceneObjectSlot {
  id: string;
  x?: number;
  z?: number;
}

export interface SceneExit {
  id: string;
  targetScene: string;
  x: number;
  z: number;
  radius: number;
  label: string;
}

export interface SceneGroundSpec {
  width: number;
  depth: number;
  x: number;
  z: number;
}

export interface SceneDefinition {
  id: string;
  name: string;
  backdrop: string;
  spawn: { x: number; z: number };
  navPolygon: Array<[number, number]>;
  ground: SceneGroundSpec;
  npcs: SceneNpcSlot[];
  objects: SceneObjectSlot[];
  exits: SceneExit[];
}
