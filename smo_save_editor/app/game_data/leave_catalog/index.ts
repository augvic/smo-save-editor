// How many Power Moons it takes to leave each kingdom, from the game's own StageLockList.

import { LEAVE_MOONS } from "./leave_moons.ts";

export interface LeaveRequirement {
  moons: number;
  /** true: counted over the whole game (the Dark and Darker Side); false: the moons of that kingdom. */
  overall: boolean;
}

export class LeaveCatalog {
  /** What the Odyssey asks for to leave a kingdom; undefined for a kingdom the game lists nothing for. */
  requirement(world: number): LeaveRequirement | undefined {
    const row = LEAVE_MOONS[world];
    return row ? { moons: row[0], overall: row[1] === 1 } : undefined;
  }
}
