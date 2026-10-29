// The two containers every page is made of.

import { Dom } from "../../dom/index.ts";
import { Icon } from "../../icon/index.ts";
import type { Child } from "../../dom/index.ts";

const h = Dom.h;

export class Layout {
  /** A titled card, with an optional note under the title. */
  static card(title: string, note: string | null, ...body: Child[]): HTMLElement {
    return h("section", { class: "card" }, h("h2", null, Icon.forTitle(title, 18), title), note && h("p", { class: "note" }, note), ...body);
  }

  /** A responsive grid of form fields. */
  static grid(...children: Child[]): HTMLElement {
    return h("div", { class: "grid" }, ...children);
  }
}
