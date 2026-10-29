// Counting and changing the caps, outfits, souvenirs and stickers the player owns.

import type { WardrobeCatalog, WardrobeEntry, WardrobeListPath } from "../../game_data/index.ts";
import type { Edit } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

export interface Count {
  have: number;
  total: number;
}

export class WardrobeLedger {
  /** The default cap and outfit: always owned, never offered for removal. */
  static readonly DEFAULT_ITEM = "Mario";
  static readonly CRAZY_CAP = "Crazy Cap";
  static readonly NOT_SOLD = "Not sold";
  /** Items not tied to one kingdom's shop, as shop names for `entriesOf` and `shopStats`. */
  static readonly SPECIAL_SHOPS: readonly string[] = [WardrobeLedger.CRAZY_CAP, WardrobeLedger.NOT_SOLD];

  readonly catalog: WardrobeCatalog;
  private readonly store: SaveStore;

  constructor(store: SaveStore, catalog: WardrobeCatalog) {
    this.store = store;
    this.catalog = catalog;
  }

  /** The title shown for a shop: a kingdom's own name, or a description of a special group. */
  static shopTitle(shop: string): string {
    if (shop === WardrobeLedger.CRAZY_CAP) return "Crazy Cap (any kingdom, coins)";
    if (shop === WardrobeLedger.NOT_SOLD) return "Not sold in shops";
    return shop;
  }

  /** The names currently owned in one list (the save keeps empty slots as ""). */
  ownedNames(path: WardrobeListPath): string[] {
    return this.store.get<string[]>("progress", path).filter(Boolean);
  }

  /** Items in the save that the catalog does not list. */
  unknownNames(path: WardrobeListPath): string[] {
    const known = new Set(this.catalog.entries(path).map(([id]) => id));
    return this.ownedNames(path).filter((name) => !known.has(name));
  }

  hasUnknownItems(): boolean {
    return this.catalog.lists.some(({ path }) => this.unknownNames(path).length > 0);
  }

  /** Catalog entries sold by one shop, in one list. */
  entriesOf(path: WardrobeListPath, shop: string): WardrobeEntry[] {
    return this.catalog.entries(path).filter((entry) => entry[2] === shop);
  }

  /** Items owned and in total, over every shop. */
  totals(): Count {
    let have = 0;
    let total = 0;
    for (const { path } of this.catalog.lists) {
      const owned = new Set(this.ownedNames(path));
      total += this.catalog.entries(path).length;
      have += this.catalog.entries(path).filter(([id]) => owned.has(id)).length;
    }
    return { have, total };
  }

  /** Items owned and in total, for one shop. */
  shopStats(shop: string): Count {
    let have = 0;
    let total = 0;
    for (const { path } of this.catalog.lists) {
      const owned = new Set(this.ownedNames(path));
      const entries = this.entriesOf(path, shop);
      total += entries.length;
      have += entries.filter(([id]) => owned.has(id)).length;
    }
    return { have, total };
  }

  /** The edits that write `names` into the fixed-size slot array, packed at the front and padded with "". */
  slotEdits(path: WardrobeListPath, names: string[]): Edit[] {
    const slots = this.store.get<string[]>("progress", path);
    return slots
      .map((_, i): Edit => [`${path}/${i}`, names[i] ?? ""])
      .filter(([, name], i) => name !== slots[i]);
  }

  async setNames(path: WardrobeListPath, names: string[]): Promise<boolean> {
    const edits = this.slotEdits(path, names);
    return edits.length === 0 || this.store.edit("progress", edits);
  }
}
