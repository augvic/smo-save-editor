// A card showing "have / total" with a bar, redrawn whenever the save changes.

import { Dom } from "../../dom/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import { Layout } from "../layout/index.ts";
import { LiveControl } from "../live_control/index.ts";

const h = Dom.h;

export class SummaryCard {
  readonly element: HTMLElement;

  constructor(
    store: SaveStore,
    title: string,
    noun: string,
    read: () => { have: number; total: number },
    ...extra: HTMLElement[]
  ) {
    const text = h("strong");
    const fill = h("div");
    const refresh = () => {
      const { have, total } = read();
      text.textContent = `${have} / ${total} ${noun}`;
      fill.style.width = `${total === 0 ? 0 : (100 * have) / total}%`;
    };
    this.element = Layout.card(title, null, text, h("div", { class: "bar" }, fill), ...extra);
    LiveControl.keepInSync(store, this.element, refresh);
    refresh();
  }
}
