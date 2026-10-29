// Counting purple coins: in total, and per kingdom.

import type { CoinCatalog } from "../../game_data/index.ts";
import type { CoinEntry } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

export class CoinLedger {
  private readonly store: SaveStore;
  private readonly coins: CoinCatalog;

  constructor(store: SaveStore, coins: CoinCatalog) {
    this.store = store;
    this.coins = coins;
  }

  private entries(): CoinEntry[] {
    return this.store.get<CoinEntry[]>("progress", "/GetCoinCollectData");
  }

  /** For each kingdom that has purple coins, the UniqueIds of its coins in the save. */
  byKingdom(): Map<number, Set<number>> {
    const result = new Map<number, Set<number>>();
    for (const { UniqueId } of this.entries()) {
      const kingdom = this.coins.kingdomOf(UniqueId);
      if (kingdom === undefined) continue;
      let ids = result.get(kingdom);
      if (!ids) {
        ids = new Set();
        result.set(kingdom, ids);
      }
      ids.add(UniqueId);
    }
    return result;
  }

  /** Purple coins collected and in total, over every kingdom. */
  totals(): { have: number; total: number } {
    const entries = this.entries();
    return { have: entries.filter((e) => e.IsGet).length, total: entries.length };
  }

  /** Collected and total coins of a kingdom, or null if the kingdom has no purple coins. */
  stats(kingdom: number): { have: number; total: number } | null {
    const ids = this.byKingdom().get(kingdom);
    if (!ids) return null;
    return { have: this.entries().filter((e) => ids.has(e.UniqueId) && e.IsGet).length, total: ids.size };
  }

  /** For each kingdom, the positions in /GetCoinCollectData of its collected coins. */
  collectedByKingdom(): Map<number, number[]> {
    const result = new Map<number, number[]>();
    this.entries().forEach((entry, index) => {
      const kingdom = this.coins.kingdomOf(entry.UniqueId);
      if (kingdom === undefined || !entry.IsGet) return;
      result.set(kingdom, [...(result.get(kingdom) ?? []), index]);
    });
    return result;
  }
}
