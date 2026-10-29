// Unmark the purple coins of kingdoms that are still locked: no one can have collected them.

import type { CoinLedger, ShopLedger } from "../../ledgers/index.ts";
import type { UnlockRules } from "../../rules/index.ts";
import type { Edit } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import type { Toaster } from "../../toaster/index.ts";
import type { UnlockState } from "../unlock_state/index.ts";

export class ClearLockedCoins {
  private readonly store: SaveStore;
  private readonly coins: CoinLedger;
  private readonly purse: ShopLedger;
  private readonly unlockRules: UnlockRules;
  private readonly unlockState: UnlockState;
  private readonly toaster: Toaster;

  constructor(store: SaveStore, coins: CoinLedger, purse: ShopLedger, unlockRules: UnlockRules, unlockState: UnlockState, toaster: Toaster) {
    this.store = store;
    this.coins = coins;
    this.purse = purse;
    this.unlockRules = unlockRules;
    this.unlockState = unlockState;
    this.toaster = toaster;
  }

  /** The edits that unmark the coins of locked kingdoms, keeping the ones that paid for shop items there. */
  edits(): Edit[] {
    const open = this.unlockRules.unlockedWorlds(this.unlockState.read());
    const edits: Edit[] = [];
    for (const [kingdom, indices] of this.coins.collectedByKingdom()) {
      if (open.has(kingdom)) continue;
      for (const index of indices.slice(this.purse.spent(kingdom))) edits.push([`/GetCoinCollectData/${index}/IsGet`, false]);
    }
    return edits;
  }

  async execute(): Promise<void> {
    const edits = this.edits();
    if (edits.length === 0) return this.toaster.show("No purple coins are marked in a locked kingdom");
    if (await this.store.edit("progress", edits)) {
      this.toaster.show(`Cleared ${edits.length} purple coin${edits.length === 1 ? "" : "s"} in locked kingdoms`);
    }
  }
}
