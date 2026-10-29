// The settings stored in Common.bin, shared by all save slots.

import { Dom } from "../../dom/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import type { AutoFields } from "../../widgets/index.ts";
import { Layout } from "../../widgets/index.ts";
import type { Page } from "../page/index.ts";

const h = Dom.h;

export class GameSettingsPage implements Page {
  readonly title = "Game settings";
  readonly needs = "common" as const;
  private readonly store: SaveStore;
  private readonly autoFields: AutoFields;

  constructor(store: SaveStore, autoFields: AutoFields) {
    this.store = store;
    this.autoFields = autoFields;
  }

  render(root: HTMLElement): void {
    if (!this.store.has("common")) return;
    root.append(
      Layout.card("Game settings", "Stored in Common.bin and shared by all save slots.",
        Layout.grid(...this.autoFields.build("common", "/GameConfigData"))),
      h("p", { class: "note wide" }, "The DLC list (Aoc → UnlockId) can be edited on the Raw data page."),
    );
  }
}
