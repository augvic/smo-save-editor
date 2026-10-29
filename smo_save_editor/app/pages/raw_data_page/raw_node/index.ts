// One value of a save in the raw tree: a control for a plain value, or a collapsible list/object.

import { Dom } from "../../../dom/index.ts";
import type { Kind } from "../../../save_schema/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";

const h = Dom.h;

export class RawNode {
  private readonly store: SaveStore;

  constructor(store: SaveStore) {
    this.store = store;
  }

  build(kind: Kind, path: string, key: string, value: unknown): HTMLElement {
    if (value === null || typeof value !== "object") return this.leaf(kind, path, key, value);
    return this.branch(kind, path, key, value);
  }

  private leaf(kind: Kind, path: string, key: string, value: unknown): HTMLElement {
    const revert = (control: HTMLInputElement) => {
      const v = this.store.get<unknown>(kind, path);
      if (control.type === "checkbox") control.checked = Boolean(v);
      else control.value = String(v);
    };
    let control: HTMLInputElement;
    if (typeof value === "boolean") {
      control = h("input", { type: "checkbox", checked: value });
      control.addEventListener("change", async () => {
        if (!(await this.store.edit(kind, [[path, control.checked]]))) revert(control);
      });
    } else if (typeof value === "number") {
      control = h("input", { type: "number", step: "any", value: String(value) });
      control.addEventListener("change", async () => {
        const n = Number(control.value);
        if (control.value.trim() === "" || !Number.isFinite(n) || !(await this.store.edit(kind, [[path, n]]))) revert(control);
      });
    } else {
      control = h("input", { type: "text", value: String(value ?? "null"), spellcheck: false });
      control.addEventListener("change", async () => {
        if (!(await this.store.edit(kind, [[path, control.value]]))) revert(control);
      });
    }
    return h("div", { class: "leaf" }, h("span", { class: "key", title: key }, key), control);
  }

  /** Containers build their children only when first opened: ShineData alone has thousands. */
  private branch(kind: Kind, path: string, key: string, value: object): HTMLElement {
    const entries: [string, unknown][] = Array.isArray(value)
      ? value.map((v, i): [string, unknown] => [String(i), v])
      : Object.entries(value);
    const body = h("div", { class: "children" });
    const details = h("details", null,
      h("summary", null, h("span", { class: "key" }, key), h("em", null, Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`)),
      body,
    );
    details.addEventListener("toggle", () => {
      if (details.open && body.childElementCount === 0) {
        body.append(...entries.map(([k, v]) => this.build(kind, `${path}/${k}`, k, v)));
      }
    }, { once: true });
    return details;
  }
}
