// The kingdoms, by the game's own world index.

import { WORLD, WORLD_NAMES } from "./world_names.ts";

export class Worlds {
  readonly names: readonly string[] = WORLD_NAMES;
  /** The indices the unlock logic treats specially, e.g. `ids.cascade`. */
  readonly ids = WORLD;

  get count(): number {
    return this.names.length;
  }

  name(index: number): string {
    return this.names[index] ?? `World ${index}`;
  }
}
