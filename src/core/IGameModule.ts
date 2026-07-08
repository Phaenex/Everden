/** Module contract for bootstrap registration. */
export interface IGameModule {
  init(ctx: import('./GameContext').GameContext): void | Promise<void>;
  update(dt: number): void;
  dispose(): void;
}

/** Modules that persist to save file. */
export interface ISaveable {
  saveKey: string;
  serialize(): unknown;
  deserialize(data: unknown): void;
}
