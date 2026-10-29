// The captures Mario has made: the names in /HackDictionary, a fixed list of slots padded with "".

import type { CaptureCatalog } from "../../game_data/index.ts";
import type { Edit } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

const PATH = "/HackDictionary";

export class CaptureLedger {
  private readonly store: SaveStore;
  readonly catalog: CaptureCatalog;

  constructor(store: SaveStore, catalog: CaptureCatalog) {
    this.store = store;
    this.catalog = catalog;
  }

  owned(): Set<string> {
    return new Set(this.store.get<string[]>("progress", PATH).filter(Boolean));
  }

  /** Mark captures as made or not made. Names the catalog does not list are kept as they are. */
  async set(names: string[], on: boolean): Promise<boolean> {
    const slots = this.store.get<string[]>("progress", PATH);
    const current = slots.filter(Boolean);
    const next = on ? [...current, ...names.filter((n) => !current.includes(n))] : current.filter((n) => !names.includes(n));
    if (next.length > slots.length) return false;
    const edits: Edit[] = slots.map((_, i): Edit => [`${PATH}/${i}`, next[i] ?? ""]).filter(([, value], i) => value !== slots[i]);
    return edits.length === 0 || this.store.edit("progress", edits);
  }
}
