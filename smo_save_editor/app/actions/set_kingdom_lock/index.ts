// Unlock or lock a kingdom, with everything the game ties to that.

import type { Worlds } from "../../game_data/index.ts";
import type { UnlockRules } from "../../rules/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import type { Toaster } from "../../toaster/index.ts";
import type { GoToKingdom } from "../go_to_kingdom/index.ts";
import type { UnlockState } from "../unlock_state/index.ts";

export class SetKingdomLock {
  private readonly state: UnlockState;
  private readonly unlockRules: UnlockRules;
  private readonly worlds: Worlds;
  private readonly toaster: Toaster;
  private readonly store: SaveStore;
  private readonly goTo: GoToKingdom;

  constructor(state: UnlockState, unlockRules: UnlockRules, worlds: Worlds, toaster: Toaster, store: SaveStore, goTo: GoToKingdom) {
    this.store = store;
    this.goTo = goTo;
    this.state = state;
    this.unlockRules = unlockRules;
    this.worlds = worlds;
    this.toaster = toaster;
  }

  /** Returns true if something changed. */
  async execute(world: number, wantUnlocked: boolean): Promise<boolean> {
    const before = this.state.read();
    const after = wantUnlocked ? this.unlockRules.unlock(world, before) : this.unlockRules.lock(world, before);
    if (after.num === before.num && after.first === before.first && after.second === before.second) return false;
    if (!(await this.state.apply(after))) return false;

    const was = this.unlockRules.unlockedWorlds(before);
    const now = this.unlockRules.unlockedWorlds(after);
    const changed = [...(wantUnlocked ? now : was)]
      .filter((w) => !(wantUnlocked ? was : now).has(w))
      .sort((a, b) => a - b);
    this.toaster.show(`${wantUnlocked ? "Unlocked" : "Locked"} ${changed.map((w) => this.worlds.name(w)).join(", ")}`);
    // Mario cannot stay in a kingdom that is locked again: take him back to the last one still open.
    if (!wantUnlocked && !now.has(this.store.get<number>("progress", "/WorldId"))) {
      await this.goTo.execute(this.unlockRules.unlockOrder(after)[after.num - 1]);
    }
    return true;
  }
}
