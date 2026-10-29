// One "label ... value" line inside a tile.

import { Dom } from "../../../dom/index.ts";

const h = Dom.h;

export class TileStat {
  static line(label: string, text: string): HTMLElement {
    return h("div", { class: "stat" }, h("span", null, label), h("span", null, text));
  }
}
