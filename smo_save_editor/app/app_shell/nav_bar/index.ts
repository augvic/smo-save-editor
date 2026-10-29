// The page list on the left. A page that needs a file that is not open is disabled, and says what to open.

import { Dom } from "../../dom/index.ts";
import { Icon } from "../../icon/index.ts";
import type { Page } from "../../pages/index.ts";

const h = Dom.h;

export class NavBar {
  readonly element = h("nav");

  render(pages: readonly Page[], current: Page, isAvailable: (page: Page) => boolean, select: (page: Page) => void): void {
    this.element.replaceChildren(
      ...pages.map((page) => {
        const available = isAvailable(page);
        // Game settings live in Common.bin, a separate file from the save slots.
        const hint = !available && page.needs === "common" ? "Open Common.bin to unlock" : null;
        return h("div", { class: "nav-entry", title: hint ? 'Use "Open saves…" and pick Common.bin (you can pick it together with a save)' : null },
          h("button", {
            class: `nav-item${page === current ? " active" : ""}`,
            disabled: !available,
            onclick: () => select(page),
          }, Icon.forTitle(page.title, 17), page.title, available && (page.badge?.() ?? 0) > 0 && h("span", { class: "nav-dot", title: `${page.badge?.()} to look at` })),
          hint && h("span", { class: "nav-hint" }, hint),
        );
      }),
    );
  }
}
