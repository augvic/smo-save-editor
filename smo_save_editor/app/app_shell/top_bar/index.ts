// The bar at the top: open saves, and one save button for each open file.

import { Dom } from "../../dom/index.ts";
import { Icon } from "../../icon/index.ts";
import type { Kind } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

const h = Dom.h;

export class TopBar {
  readonly element = h("div", { class: "actions" });
  private readonly store: SaveStore;

  constructor(store: SaveStore) {
    this.store = store;
  }

  /**
   * `onOpened` runs after the user opened one or more files; `kind` is the file the page being shown is about,
   * and `onHistory` runs after an undo or redo so the page can be drawn again.
   */
  render(onOpened: () => void, kind: Kind, onHistory: () => void): void {
    const step = (action: "undo" | "redo") => async () => {
      if (await this.store[action](kind)) onHistory();
    };
    const history = this.store.has(kind) ? [
      h("button", { disabled: !this.store.canUndo(kind), title: "Undo the last edit (Ctrl+Z)", onclick: step("undo") }, Icon.of("undo"), "Undo"),
      h("button", { disabled: !this.store.canRedo(kind), title: "Redo (Ctrl+Y)", onclick: step("redo") }, Icon.of("redo"), "Redo"),
    ] : [];
    const saveButtons = this.store.open().map((doc) =>
      h("button", { class: doc.dirty ? "primary" : "", onclick: () => this.store.saveDoc(doc.kind) },
        Icon.of("save"), `Save ${doc.fileName}…`, doc.dirty && h("span", { class: "dot", title: "Unsaved changes" })));
    const badChecksum = this.store.open().some((doc) => !doc.checksumOk);
    this.element.replaceChildren(
      ...(badChecksum
        ? [h("span", { class: "warn", title: "The checksum was wrong when opened. It is recalculated on save." }, "Checksum was invalid")]
        : []),
      ...history,
      h("button", {
        onclick: async () => {
          if ((await this.store.openSaves()).length > 0) onOpened();
        },
      }, Icon.of("folder"), "Open saves…"),
      ...saveButtons,
    );
  }
}
