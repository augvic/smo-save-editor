// The checkpoint flags of one kingdom.

import type { CheckpointCatalog } from "../../../game_data/index.ts";
import { CheckpointLedger } from "../../../ledgers/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { Layout, NameChecklist } from "../../../widgets/index.ts";

export class CheckpointsCard {
  private readonly store: SaveStore;
  private readonly catalog: CheckpointCatalog;
  private readonly ledger: CheckpointLedger;

  constructor(store: SaveStore, catalog: CheckpointCatalog, ledger: CheckpointLedger) {
    this.store = store;
    this.catalog = catalog;
    this.ledger = ledger;
  }

  /** The card, or null if the kingdom has no checkpoint. */
  build(kingdom: number): HTMLElement | null {
    const items = this.catalog.of(kingdom);
    if (items.length === 0) return null;
    const keyOf = new Map(items.map((i) => [i.obj, CheckpointLedger.key(i.stage, i.obj)]));
    return Layout.card("Checkpoints", "The flags Mario has touched, with the names the game shows on the map.",
      new NameChecklist(this.store, {
        items: items.map((i) => ({ id: keyOf.get(i.obj) as string, label: i.name, detail: i.stage === items[0].stage ? i.obj : `${i.obj} · ${i.stage}` })),
        noun: "checkpoints",
        isOn: (id) => this.ledger.reached().has(id),
        setMany: (ids, on) => this.ledger.set(ids, on),
      }).element);
  }
}
