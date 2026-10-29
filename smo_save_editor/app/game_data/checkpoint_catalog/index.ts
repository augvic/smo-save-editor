// The checkpoint flags of each kingdom, from the game's own texts.

import { CHECKPOINTS } from "./checkpoints.ts";

export interface CheckpointInfo {
  stage: string;
  obj: string;
  name: string;
}

export class CheckpointCatalog {
  /** The checkpoints of one kingdom (game world index), in the order of the game's data. */
  of(kingdom: number): CheckpointInfo[] {
    return CHECKPOINTS.filter(([k]) => k === kingdom).map(([, stage, obj, name]) => ({ stage, obj, name }));
  }
}
