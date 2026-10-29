// The total is a lifetime counter, so it never goes down and never trails the coins in hand: it
// follows the highest number of coins ever entered.

import type { SaveStore } from "../../save_store/index.ts";

export class RaiseTotalCoins {
  private readonly store: SaveStore;

  constructor(store: SaveStore) {
    this.store = store;
  }

  async execute(): Promise<void> {
    const coins = this.store.get<number>("progress", "/CoinNum");
    if (coins > this.store.get<number>("progress", "/TotalCoinNum")) {
      await this.store.edit("progress", [["/TotalCoinNum", coins]]);
    }
  }
}
