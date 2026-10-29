// The tracks of the jukebox the player has heard: { BgmResourceName, IsCollected } in /CollectBgmList.
// A new save has none listed yet, so marking a track adds its entry.

import type { MusicCatalog } from "../../game_data/index.ts";
import type { Edit } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

const PATH = "/CollectBgmList";

interface Entry {
  BgmResourceName: string;
  IsCollected: boolean;
}

export class MusicLedger {
  private readonly store: SaveStore;
  private readonly catalog: MusicCatalog;

  constructor(store: SaveStore, catalog: MusicCatalog) {
    this.store = store;
    this.catalog = catalog;
  }

  private entries(): Entry[] {
    return this.store.get<Entry[]>("progress", PATH);
  }

  collected(): Set<string> {
    return new Set(this.entries().filter((e) => e.IsCollected).map((e) => e.BgmResourceName));
  }

  /**
   * Mark tracks as heard or not. A track that is not listed yet is added when marked, once for every entry of the
   * jukebox that has its name (see MusicCatalog), and the save keeps its entries in alphabetical order.
   */
  async set(ids: string[], on: boolean): Promise<boolean> {
    const entries = this.entries();
    const known = new Set(entries.map((e) => e.BgmResourceName));
    const added = on ? ids.filter((id) => !known.has(id)) : [];
    if (added.length > 0) {
      const next = [...entries.map((e) => ({ ...e, IsCollected: ids.includes(e.BgmResourceName) ? true : e.IsCollected })),
        ...added.flatMap((id) => Array.from({ length: this.catalog.variants(id) }, () => ({ BgmResourceName: id, IsCollected: true })))]
        .sort((a, b) => (a.BgmResourceName < b.BgmResourceName ? -1 : a.BgmResourceName > b.BgmResourceName ? 1 : 0));
      return this.store.edit("progress", [[PATH, next]]);
    }
    const edits: Edit[] = [];
    entries.forEach((e, i) => {
      if (ids.includes(e.BgmResourceName) && e.IsCollected !== on) edits.push([`${PATH}/${i}/IsCollected`, on]);
    });
    return edits.length === 0 || this.store.edit("progress", edits);
  }
}
