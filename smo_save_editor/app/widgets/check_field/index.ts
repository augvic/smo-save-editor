import { Dom } from "../../dom/index.ts";
import type { Kind } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import { Field } from "../field/index.ts";

const h = Dom.h;

/** A switch for a boolean in the save. `locked` shows it without letting the user change it (something else keeps it right). */
export class CheckField extends Field {
  readonly element: HTMLElement;

  constructor(store: SaveStore, kind: Kind, path: string, label: string, hint?: string, locked = false) {
    super(store, kind, path);
    const box = h("input", { type: "checkbox", checked: Boolean(this.current<boolean>()), disabled: locked });
    box.addEventListener("change", async () => {
      if (!(await store.edit(kind, [[path, box.checked]]))) box.checked = Boolean(this.current<boolean>());
    });
    this.keepInSync(box, () => (box.checked = Boolean(this.current<boolean>())));
    this.element = h("label", { class: "field check", title: hint }, box, h("span", null, label));
  }
}
