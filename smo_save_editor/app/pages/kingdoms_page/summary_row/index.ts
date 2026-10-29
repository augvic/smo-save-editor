// Moons, purple coins and shop items collected so far, across all kingdoms.

import type { ClearLockedCoins, ClearLockedShops, FixMoonFlags } from "../../../actions/index.ts";
import { Dom } from "../../../dom/index.ts";
import { Icon } from "../../../icon/index.ts";
import type { CoinLedger, MoonLedger, WardrobeLedger } from "../../../ledgers/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { SummaryCard } from "../../../widgets/index.ts";

const h = Dom.h;

export class SummaryRow {
  private readonly store: SaveStore;
  private readonly moons: MoonLedger;
  private readonly coins: CoinLedger;
  private readonly wardrobe: WardrobeLedger;
  private readonly fixFlags: FixMoonFlags;
  private readonly clearLocked: ClearLockedCoins;
  private readonly clearShops: ClearLockedShops;

  constructor(store: SaveStore, moons: MoonLedger, coins: CoinLedger, wardrobe: WardrobeLedger, fixFlags: FixMoonFlags, clearLocked: ClearLockedCoins, clearShops: ClearLockedShops) {
    this.clearShops = clearShops;
    this.clearLocked = clearLocked;
    this.store = store;
    this.moons = moons;
    this.coins = coins;
    this.wardrobe = wardrobe;
    this.fixFlags = fixFlags;
  }

  build(): HTMLElement {
    const fixButton = h("button", {
      class: "ghost",
      title: "Make every moon's Status agree with whether it is collected (the game writes 2 on a collected moon)",
      onclick: () => this.fixFlags.execute(),
    }, Icon.of("wrench", 14), "Fix moon flags");

    const clearButton = h("button", {
      class: "ghost",
      title: "Unmark the purple coins of kingdoms that are still locked (no one can have collected them)",
      onclick: () => this.clearLocked.execute(),
    }, Icon.of("lock", 14), "Clear locked coins");

    const clearShopButton = h("button", {
      class: "ghost",
      title: "Remove the shop items of kingdoms that are still locked (no one can have bought them) and zero their purple coins spent",
      onclick: () => this.clearShops.execute(),
    }, Icon.of("lock", 14), "Clear locked items");

    return h("div", { class: "summary-grid" },
      new SummaryCard(this.store, "Power Moons", "collected", () => {
        const t = this.moons.totals();
        return { have: t.collected, total: t.slots };
      }, fixButton).element,
      new SummaryCard(this.store, "Purple Coins", "collected", () => this.coins.totals(), clearButton).element,
      new SummaryCard(this.store, "Shop items", "owned", () => this.wardrobe.totals(), clearShopButton).element,
    );
  }
}
