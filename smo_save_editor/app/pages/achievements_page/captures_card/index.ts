// Which enemies and objects Mario has captured.

import type { CaptureLedger } from "../../../ledgers/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { Layout, NameChecklist } from "../../../widgets/index.ts";

export class CapturesCard {
  private readonly store: SaveStore;
  private readonly captures: CaptureLedger;

  constructor(store: SaveStore, captures: CaptureLedger) {
    this.store = store;
    this.captures = captures;
  }

  build(): HTMLElement {
    return Layout.card("Captures", "Everything Mario can capture, from the game's own list. ",
      new NameChecklist(this.store, {
        items: this.captures.catalog.names().map((id) => ({ id, label: this.captures.catalog.label(id), detail: id })),
        noun: "captures",
        isOn: (id) => this.captures.owned().has(id),
        setMany: (ids, on) => this.captures.set(ids, on),
      }).element);
  }
}
