import { Dom } from "../../dom/index.ts";
import type { Kind } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import { Field } from "../field/index.ts";

const h = Dom.h;

export class TextField extends Field {
  readonly element: HTMLElement;

  constructor(store: SaveStore, kind: Kind, path: string, label: string, hint?: string) {
    super(store, kind, path);
    const input = h("input", { type: "text", value: String(this.current<string>()), spellcheck: false });
    input.addEventListener("change", async () => {
      if (!(await store.edit(kind, [[path, input.value]]))) input.value = String(this.current<string>());
    });
    this.keepInSync(input, () => (input.value = String(this.current<string>())));
    this.element = Field.labelled(label, input, hint);
  }
}
