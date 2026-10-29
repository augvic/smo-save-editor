// Every value in the open files, for what the other pages do not cover.

import { Dom } from "../../dom/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import type { Page } from "../page/index.ts";
import type { RawNode } from "./raw_node/index.ts";

const h = Dom.h;

export class RawDataPage implements Page {
  readonly title = "Raw data";
  readonly needs = null;
  private readonly store: SaveStore;
  private readonly rawNode: RawNode;

  constructor(store: SaveStore, rawNode: RawNode) {
    this.store = store;
    this.rawNode = rawNode;
  }

  render(root: HTMLElement): void {
    root.append(
      h("p", { class: "note wide" }, "Every value in the file. Numbers keep their original type and range; a wrong kind of value is rejected."),
      ...this.store.open().map((doc) =>
        h("section", { class: "card" }, h("h2", null, doc.fileName),
          ...Object.entries(doc.tree as Record<string, unknown>).map(([key, value]) =>
            this.rawNode.build(doc.kind, `/${key}`, key, value)))),
    );
  }
}

export { RawNode } from "./raw_node/index.ts";
