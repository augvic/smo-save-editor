// A searchable list of things to tick on or off, each known by an id, with a counter and bulk actions.
// The state lives elsewhere (`isOn`, `setMany`); the list follows the save as it changes.

import { Dom } from "../../dom/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

const h = Dom.h;

export interface ChecklistItem {
  id: string;
  label: string;
  /** Small text after the label, e.g. the internal name. */
  detail?: string;
}

export interface ChecklistOptions {
  items: readonly ChecklistItem[];
  /** Plural noun for the counter, e.g. "captures". */
  noun: string;
  isOn: (id: string) => boolean;
  setMany: (ids: string[], on: boolean) => Promise<boolean>;
}

export class NameChecklist {
  readonly element: HTMLElement;
  private readonly options: ChecklistOptions;
  private readonly counter = h("strong");
  private readonly search = h("input", { type: "search", placeholder: "Search…" });
  private readonly rows = h("div", { class: "rows" });
  private readonly boxes = new Map<string, HTMLInputElement>();

  constructor(store: SaveStore, options: ChecklistOptions) {
    this.options = options;
    this.search.addEventListener("input", () => this.render());
    this.render();
    const stop = store.subscribe(() => (this.rows.isConnected ? this.sync() : stop()));
    this.element = h("div", { class: "flaglist" },
      h("div", { class: "counter-line" }, this.counter),
      h("div", { class: "toolbar" },
        this.search,
        h("button", { class: "ghost", onclick: () => this.bulk(true) }, "Collect shown"),
        h("button", { class: "ghost", onclick: () => this.bulk(false) }, "Clear shown"),
      ),
      this.rows,
    );
  }

  private visible(): ChecklistItem[] {
    const q = this.search.value.trim().toLowerCase();
    return this.options.items.filter((item) => !q || `${item.label} ${item.detail ?? ""}`.toLowerCase().includes(q));
  }

  private sync(): void {
    for (const [id, box] of this.boxes) box.checked = this.options.isOn(id);
    this.counter.textContent = `${this.options.items.filter((i) => this.options.isOn(i.id)).length} / ${this.options.items.length} ${this.options.noun}`;
  }

  private render(): void {
    this.boxes.clear();
    const shown = this.visible();
    this.rows.replaceChildren(...shown.map((item) => {
      const box = h("input", { type: "checkbox", checked: this.options.isOn(item.id) });
      box.addEventListener("change", async () => {
        if (!(await this.options.setMany([item.id], box.checked))) box.checked = this.options.isOn(item.id);
      });
      this.boxes.set(item.id, box);
      return h("label", { class: "row", title: item.detail ?? item.id }, box, h("span", { class: "name" }, item.label),
        item.detail && h("span", { class: "id-small" }, item.detail));
    }));
    if (shown.length === 0) this.rows.append(h("p", { class: "empty" }, "Nothing matches."));
    this.sync();
  }

  private async bulk(on: boolean): Promise<void> {
    if (await this.options.setMany(this.visible().map((i) => i.id), on)) this.sync();
  }
}
