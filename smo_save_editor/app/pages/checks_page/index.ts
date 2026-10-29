// A page that lists what does not agree in the save, with a button to fix each.

import { Dom } from "../../dom/index.ts";
import { Icon } from "../../icon/index.ts";
import type { SaveChecks } from "../../checks/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import { Layout } from "../../widgets/index.ts";
import type { Page } from "../page/index.ts";

const h = Dom.h;

export class ChecksPage implements Page {
  readonly title = "Checks";
  readonly needs = "progress" as const;
  private readonly store: SaveStore;
  private readonly checks: SaveChecks;

  constructor(store: SaveStore, checks: SaveChecks) {
    this.store = store;
    this.checks = checks;
  }

  /** The number of things the checks found, 0 while no save is open. */
  badge(): number {
    return this.store.has("progress") ? this.checks.run().length : 0;
  }

  render(root: HTMLElement): void {
    const issues = this.checks.run();
    const fixable = issues.filter((issue) => issue.fix);
    const fixAll = async () => {
      const edits = fixable.flatMap((issue) => issue.fix?.edits ?? []);
      if (await this.store.edit("progress", edits)) this.render(root);
    };
    root.replaceChildren(
      h("h1", null, "Checks"),
      Layout.card("Does the save agree with itself?",
        "Numbers the game keeps in step, compared with its own rules. Nothing is changed until you press a fix; a line without one needs your decision.",
        issues.length === 0
          ? h("p", { class: "empty" }, "Nothing to report.")
          : h("div", { class: "rows" },
              ...issues.map((issue) => h("div", { class: "row" },
                h("span", { class: "name" }, issue.title),
                ...[...(issue.fix ? [issue.fix] : []), ...(issue.options ?? [])].map((fix) => h("button", {
                  class: "ghost",
                  onclick: async () => { if (await this.store.edit("progress", fix.edits)) this.render(root); },
                }, Icon.of("wrench", 14), fix.label)))),
            ),
        fixable.length > 1 ? h("div", { class: "toolbar" }, h("button", { class: "ghost", onclick: fixAll }, Icon.of("sparkle", 14), `Fix all (${fixable.length})`)) : null,
      ),
    );
  }
}
