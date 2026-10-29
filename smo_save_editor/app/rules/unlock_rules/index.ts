// How the game decides which kingdoms are unlocked (GameProgressData in the game's own code,
// https://github.com/MonsterDruide1/OdysseyDecomp, src/System). Pure rules, no DOM and no save.

import type { Worlds } from "../../game_data/index.ts";
import { FIRST_BRANCH, SECOND_BRANCH } from "./branches.ts";

export { FIRST_BRANCH, SECOND_BRANCH };

/** The three numbers in GameProgressData that say what is unlocked. */
export interface Unlock {
  /** UnlockWorldNum: how many kingdoms, counted along the unlock order, are unlocked. */
  num: number;
  /** UnlockWorldStatusFirstBranch */
  first: number;
  /** UnlockWorldStatusSecondBranch */
  second: number;
}

export class UnlockRules {
  private readonly worlds: Worlds;

  constructor(worlds: Worlds) {
    this.worlds = worlds;
  }

  /**
   * The world at each step of the unlock order. It is simply 0, 1, 2, ... except that the
   * Wooded/Lake pair and the Seaside/Snow pair can come in either order, chosen by the branches.
   */
  unlockOrder({ first, second }: Pick<Unlock, "first" | "second">): number[] {
    const { wooded, lake, seaside, snow } = this.worlds.ids;
    const order = Array.from({ length: this.worlds.count }, (_, i) => i);
    if (first === FIRST_BRANCH.lake) [order[wooded], order[lake]] = [lake, wooded];
    if (second === SECOND_BRANCH.snow) [order[seaside], order[snow]] = [snow, seaside];
    return order;
  }

  /** Position of a world in the unlock order (also what the save calls its UnlockedWorldId). */
  positionOf(world: number, u: Unlock): number {
    return this.unlockOrder(u).indexOf(world);
  }

  unlockedWorlds(u: Unlock): Set<number> {
    return new Set(this.unlockOrder(u).slice(0, u.num));
  }

  /** Keep an Unlock consistent: a branch is only recorded once its pair has been reached. */
  normalize(u: Unlock): Unlock {
    const { wooded, seaside } = this.worlds.ids;
    const num = Math.min(this.worlds.count, Math.max(1, u.num));
    let { first, second } = u;
    if (num <= wooded) first = FIRST_BRANCH.none;
    else if (first === FIRST_BRANCH.none) first = FIRST_BRANCH.wooded;
    if (num <= seaside) second = SECOND_BRANCH.none;
    else if (second === SECOND_BRANCH.none) second = SECOND_BRANCH.seaside;
    return { num, first, second };
  }

  /** Unlock a world. Everything before it in the unlock order unlocks too. */
  unlock(world: number, u: Unlock): Unlock {
    const { wooded, lake, seaside, snow } = this.worlds.ids;
    let { first, second } = u;
    // Reaching one of a pair first decides the order of that pair.
    if (first === FIRST_BRANCH.none && (world === wooded || world === lake)) {
      first = world === lake ? FIRST_BRANCH.lake : FIRST_BRANCH.wooded;
    }
    if (second === SECOND_BRANCH.none && (world === seaside || world === snow)) {
      second = world === snow ? SECOND_BRANCH.snow : SECOND_BRANCH.seaside;
    }
    const needed = this.positionOf(world, { num: u.num, first, second }) + 1;
    return this.normalize({ num: Math.max(u.num, needed), first, second });
  }

  /** Lock a world. Everything after it in the unlock order locks too. The Cap Kingdom stays open. */
  lock(world: number, u: Unlock): Unlock {
    if (world === this.worlds.ids.cap) return u;
    return this.normalize({ ...u, num: Math.min(u.num, this.positionOf(world, u)) });
  }
}
