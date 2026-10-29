// The side areas of one kingdom Mario has been to.

import type { StageCatalog } from "../../../game_data/index.ts";
import type { VisitLedger } from "../../../ledgers/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { Layout, NameChecklist } from "../../../widgets/index.ts";

export class VisitedStagesCard {
  private readonly store: SaveStore;
  private readonly stages: StageCatalog;
  private readonly visits: VisitLedger;

  constructor(store: SaveStore, stages: StageCatalog, visits: VisitLedger) {
    this.store = store;
    this.stages = stages;
    this.visits = visits;
  }

  /** The card, or null if the kingdom has no side area. */
  build(kingdom: number): HTMLElement | null {
    const items = this.stages.visitable(kingdom);
    if (items.length === 0) return null;
    return Layout.card("Side areas visited", "The sub-areas and secret rooms the game remembers Mario has entered.",
      new NameChecklist(this.store, {
        items: items.map(({ stage, name }) => ({ id: stage, label: name, detail: stage })),
        noun: "areas",
        isOn: (id) => this.visits.visited().has(id),
        setMany: (ids, on) => this.visits.set(ids, on),
      }).element);
  }
}
