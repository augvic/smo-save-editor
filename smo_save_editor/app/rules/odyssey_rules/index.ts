// The Odyssey's level and story state, and the first step of the Cascade story, for a given
// number of unlocked kingdoms. From GameProgressData in the game's own code.

import type { Worlds } from "../../game_data/index.ts";
import { HOME_STATUS } from "./home_status.ts";

export { HOME_STATUS };

/**
 * Odyssey level limit by number of unlocked kingdoms (GameProgressData::upHomeLevel). The level goes up by
 * one each time moons are paid to the Odyssey, never past this limit, and the payment that leaves a
 * kingdom happens before the next one is counted as unlocked: so a player who has just arrived in the
 * newest kingdom has the limit of the number before it (Sand: level 1, Wooded: level 2).
 */
const HOME_LEVEL_LIMIT = [0, 0, 1, 2, 3, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9, 9, 9, 9];

export class OdysseyRules {
  private readonly worlds: Worlds;

  constructor(worlds: Worlds) {
    this.worlds = worlds;
  }

  /**
   * Odyssey level of a player who has just arrived in the newest of `num` unlocked kingdoms: the limit
   * for one kingdom fewer. 9 is reserved for after the Moon Kingdom (the game sets it when that kingdom unlocks).
   */
  homeLevel(num: number): number {
    return num > this.worlds.ids.moon ? 9 : Math.min(HOME_LEVEL_LIMIT[Math.max(0, num - 1)] ?? 9, 8);
  }

  /**
   * Story state of the Odyssey for a number of unlocked kingdoms. Some states only last while you
   * are inside a kingdom (the game resets them on leaving), so the resting state is used.
   */
  homeStatus(num: number, current: number): number {
    const { cloud, lost, moon } = this.worlds.ids;
    if (num <= 1) return Math.min(current, 1);
    if (num <= cloud + 1) return 2; // launched; "found Bowser" ends when leaving the Cloud Kingdom
    if (num === lost + 1) return 4; // crashed: you arrive in the Lost Kingdom with a broken ship
    if (num <= moon) return 5; // repaired, from the Metro Kingdom until the Moon Kingdom
    return 7;
  }

  /** WaterfallWorldProgress: 0 none, 1 got the first moon, 2 talked to the cap near the Odyssey. */
  waterfallProgress(num: number, current: number, cascadeHasMoon: boolean): number {
    const { cascade } = this.worlds.ids;
    if (num <= cascade) return 0;
    if (num > cascade + 1) return 2; // set as soon as you move on from the Cascade Kingdom
    return Math.max(current, cascadeHasMoon ? 1 : 0);
  }
}
