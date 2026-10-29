// The side areas Mario has been to: stage names in /VisitStageData, a list that grows as he explores.

import type { SaveStore } from "../../save_store/index.ts";

const PATH = "/VisitStageData";

export class VisitLedger {
  private readonly store: SaveStore;

  constructor(store: SaveStore) {
    this.store = store;
  }

  visited(): Set<string> {
    return new Set(this.store.get<string[]>("progress", PATH));
  }

  /** Mark stages as visited or not. Stages the editor does not know are kept as they are. */
  async set(stages: string[], on: boolean): Promise<boolean> {
    const current = this.store.get<string[]>("progress", PATH);
    const next = on ? [...current, ...stages.filter((s) => !current.includes(s))] : current.filter((s) => !stages.includes(s));
    return next.length === current.length || this.store.edit("progress", [[PATH, next]]);
  }
}
