// Take back the shop items of kingdoms that are still locked: no one can have bought them there.

import type { Worlds } from "../../game_data/index.ts";
import { WardrobeLedger } from "../../ledgers/index.ts";
import type { ShopLedger } from "../../ledgers/index.ts";
import type { UnlockRules } from "../../rules/index.ts";
import type { Edit } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import type { Toaster } from "../../toaster/index.ts";
import type { UnlockState } from "../unlock_state/index.ts";

export class ClearLockedShops {
  private readonly store: SaveStore;
  private readonly wardrobe: WardrobeLedger;
  private readonly purse: ShopLedger;
  private readonly worlds: Worlds;
  private readonly unlockRules: UnlockRules;
  private readonly unlockState: UnlockState;
  private readonly toaster: Toaster;

  constructor(store: SaveStore, wardrobe: WardrobeLedger, purse: ShopLedger, worlds: Worlds, unlockRules: UnlockRules, unlockState: UnlockState, toaster: Toaster) {
    this.store = store;
    this.wardrobe = wardrobe;
    this.purse = purse;
    this.worlds = worlds;
    this.unlockRules = unlockRules;
    this.unlockState = unlockState;
    this.toaster = toaster;
  }

  /** The edits that remove the items sold in locked kingdoms and zero their "Purple coins spent", plus how many items that is. */
  plan(): { edits: Edit[]; items: number } {
    const open = this.unlockRules.unlockedWorlds(this.unlockState.read());
    const locked = new Map<string, number>();
    for (let world = 0; world < this.worlds.count; world++) if (!open.has(world)) locked.set(this.worlds.name(world), world);

    const edits: Edit[] = [];
    let items = 0;
    const emptied = new Set<number>();
    for (const { path } of this.wardrobe.catalog.lists) {
      const doomed = new Set<string>();
      for (const [id, , shop] of this.wardrobe.catalog.entries(path)) {
        const world = locked.get(shop);
        if (world !== undefined && id !== WardrobeLedger.DEFAULT_ITEM) doomed.add(id);
        if (world !== undefined) emptied.add(world);
      }
      const owned = this.wardrobe.ownedNames(path);
      items += new Set(owned.filter((name) => doomed.has(name))).size;
      edits.push(...this.wardrobe.slotEdits(path, owned.filter((name) => !doomed.has(name))));
    }
    // With the items gone, nothing of these kingdoms is paid for any more.
    for (const world of emptied) {
      const path = `/WorldInfo/${world}/UseCoinCollectNum`;
      if (this.purse.spent(world) > 0 && this.store.get<number>("progress", path) !== 0) edits.push([path, 0]);
    }
    return { edits, items };
  }

  async execute(): Promise<void> {
    const { edits, items } = this.plan();
    if (edits.length === 0) return this.toaster.show("No shop items are owned from a locked kingdom");
    if (await this.store.edit("progress", edits)) {
      this.toaster.show(`Removed ${items} shop item${items === 1 ? "" : "s"} of locked kingdoms`);
    }
  }
}
