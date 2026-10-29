// What the purple coins can pay for: the shop items a kingdom's coins have bought, and what is left.
// Buying an item moves "Purple coins spent" (UseCoinCollectNum) of its kingdom, as in the game.

import type { ShopCatalog, ShopPrice, WardrobeListPath, Worlds } from "../../game_data/index.ts";
import type { StoryRules } from "../../rules/index.ts";
import type { Edit, WorldInfoEntry } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import type { CoinLedger } from "../coin_ledger/index.ts";
import type { WardrobeLedger } from "../wardrobe_ledger/index.ts";

export class ShopLedger {
  private readonly store: SaveStore;
  private readonly shop: ShopCatalog;
  private readonly coins: CoinLedger;
  private readonly wardrobe: WardrobeLedger;
  private readonly story: StoryRules;
  private readonly worlds: Worlds;

  constructor(store: SaveStore, shop: ShopCatalog, coins: CoinLedger, wardrobe: WardrobeLedger, story: StoryRules, worlds: Worlds) {
    this.story = story;
    this.worlds = worlds;
    this.store = store;
    this.shop = shop;
    this.coins = coins;
    this.wardrobe = wardrobe;
  }

  /** Purple coins the owned items of a kingdom cost, with `names` replacing what is owned in one list. */
  spent(kingdom: number, replace?: { path: WardrobeListPath; names: readonly string[] }): number {
    let total = 0;
    for (const { path } of this.wardrobe.catalog.lists) {
      const owned = replace?.path === path ? replace.names : this.wardrobe.ownedNames(path);
      for (const name of new Set(owned)) {
        const p = this.shop.price(path, name);
        if (p?.purple && p.shop === kingdom) total += p.price;
      }
    }
    return total;
  }

  /** Purple coins collected in a kingdom and not yet spent (can be negative in a save that overspent). */
  available(kingdom: number, replace?: { path: WardrobeListPath; names: readonly string[] }): number {
    return (this.coins.stats(kingdom)?.have ?? 0) - this.spent(kingdom, replace);
  }

  /** What the game asks before it sells an ordinary-coin item: a kingdom cleared first, a number of Power Moons. "" if nothing is missing. */
  private requirement(p: ShopPrice): string {
    const infos = this.store.get<WorldInfoEntry[]>("progress", "/WorldInfo");
    if (p.clearFirst >= 0) {
      const done = this.story.doneMain(p.clearFirst);
      if (done !== undefined && (infos[p.clearFirst]?.MainShineNo ?? -1) < done) return `Clear the ${this.worlds.name(p.clearFirst)} first (its story is not done)`;
    }
    const total = infos.reduce((sum, w) => sum + w.PayShineNum, 0);
    if (p.moons > total) return `Needs ${p.moons} Power Moons in total (the Moon totals add up to ${total})`;
    return "";
  }

  /** Why an item cannot be added now, as text; "" if it can: coins for a purple item, a cleared kingdom or Power Moons for the rest. */
  blocker(path: WardrobeListPath, name: string, replace?: { path: WardrobeListPath; names: readonly string[] }): string {
    const p = this.shop.price(path, name);
    if (!p) return "";
    if (!p.purple) return this.requirement(p);
    const missing = p.price - this.available(p.shop, replace);
    return missing > 0 ? `Needs ${missing} more purple coin${missing === 1 ? "" : "s"} collected in this kingdom` : "";
  }

  /** Whether an item can be added now. */
  affordable(path: WardrobeListPath, name: string): boolean {
    return this.blocker(path, name) === "";
  }

  /** What stops an item from being added, as text; "" if nothing. */
  shortfall(path: WardrobeListPath, name: string): string {
    return this.blocker(path, name);
  }

  /** `wanted` names to add to a list, cut down to the ones the coins can pay for, in order. */
  affordableAdditions(path: WardrobeListPath, wanted: readonly string[]): string[] {
    let names = this.wardrobe.ownedNames(path);
    const added: string[] = [];
    for (const name of wanted) {
      if (names.includes(name)) continue;
      const next = [...names, name];
      if (this.blocker(path, name, { path, names })) continue;
      names = next;
      added.push(name);
    }
    return added;
  }

  /** Set the owned names of one list and move "Purple coins spent" of every kingdom whose total changed. */
  async setNames(path: WardrobeListPath, names: string[]): Promise<boolean> {
    const edits: Edit[] = this.wardrobe.slotEdits(path, names);
    const kingdoms = this.store.get<unknown[]>("progress", "/WorldInfo").length;
    for (let kingdom = 0; kingdom < kingdoms; kingdom++) {
      const current = this.store.get<number>("progress", `/WorldInfo/${kingdom}/UseCoinCollectNum`);
      const next = this.spent(kingdom, { path, names });
      if (next !== this.spent(kingdom) && next !== current) edits.push([`/WorldInfo/${kingdom}/UseCoinCollectNum`, next]);
    }
    return edits.length === 0 || this.store.edit("progress", edits);
  }
}
