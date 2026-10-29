// Play time is stored in seconds; this edits it as hours and minutes.

import { Dom } from "../../../dom/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";

const h = Dom.h;
const PATH = "/PlayTimeTotal";

export class PlayTimeField {
  private readonly store: SaveStore;

  constructor(store: SaveStore) {
    this.store = store;
  }

  /** Built when the page is drawn, so it shows the save that is open at that moment. */
  build(): HTMLElement {
    const seconds = Number(this.store.get<number>("progress", PATH));
    const hours = h("input", { type: "number", min: "0", value: String(Math.floor(seconds / 3600)) });
    const minutes = h("input", { type: "number", min: "0", max: "59", value: String(Math.floor((seconds % 3600) / 60)) });
    const apply = async () => {
      const old = Number(this.store.get<number>("progress", PATH));
      const next = Math.max(0, Number(hours.value)) * 3600 + Math.min(59, Math.max(0, Number(minutes.value))) * 60 + (old % 60);
      if (!(await this.store.edit("progress", [[PATH, Math.round(next)]]))) {
        hours.value = String(Math.floor(old / 3600));
        minutes.value = String(Math.floor((old % 3600) / 60));
      }
    };
    hours.addEventListener("change", apply);
    minutes.addEventListener("change", apply);
    return h("div", { class: "field" }, h("span", null, "Play time"),
      h("div", { class: "inline" }, hours, h("em", null, "h"), minutes, h("em", null, "min")));
  }
}
