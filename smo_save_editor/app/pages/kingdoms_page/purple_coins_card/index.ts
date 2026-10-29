// The purple coins of one kingdom.

import type { CoinLedger, ShopLedger } from "../../../ledgers/index.ts";
import type { CoinEntry } from "../../../save_schema/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { FlagList, Layout } from "../../../widgets/index.ts";

export class PurpleCoinsCard {
  private readonly store: SaveStore;
  private readonly coins: CoinLedger;
  private readonly purse: ShopLedger;

  constructor(store: SaveStore, coins: CoinLedger, purse: ShopLedger) {
    this.store = store;
    this.coins = coins;
    this.purse = purse;
  }

  /** The card, or null if the kingdom has no purple coins. */
  build(kingdom: number): HTMLElement | null {
    const ids = this.coins.byKingdom().get(kingdom);
    if (!ids) return null;

    return Layout.card("Purple Coins",
      "Which coins belong to this kingdom comes from the game's own data. The save only identifies a coin by its ID. " +
        "Coins that paid for shop items stay collected: remove those items from the shop first to clear them.",
      new FlagList<CoinEntry>(this.store, {
        kind: "progress",
        path: "/GetCoinCollectData",
        noun: "coins",
        sortById: true,
        include: (item) => ids.has(item.UniqueId),
        idOf: (item) => String(item.UniqueId),
        keepOn: () => this.purse.spent(kingdom),
        keepReason: "These coins paid for shop items. Remove the items from the shop below to clear them.",
      }).element);
  }
}
