// A tile for something that is not a kingdom (a shop group): a title and some lines.

import { Dom } from "../../../dom/index.ts";

const h = Dom.h;

export type Line = HTMLElement | false | null | undefined;

export class GroupTile {
  build(title: string, open: () => void, ...lines: Line[]): HTMLElement {
    return h("div", { class: "kingdom-card" }, h("button", { class: "tile-main", onclick: open }, h("strong", null, title), ...lines));
  }
}
