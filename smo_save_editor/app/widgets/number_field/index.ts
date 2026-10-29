import { Dom } from "../../dom/index.ts";
import type { Kind } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import { Field } from "../field/index.ts";

const h = Dom.h;

export interface NumberOptions {
  hint?: string;
  min?: number;
  max?: number;
  /** Limits that depend on the rest of the save, read when a value is typed; the value is clamped into them. */
  limits?: () => { min: number; max: number };
  /** Called after the new value was accepted. */
  after?: () => void;
}

export class NumberField extends Field {
  readonly element: HTMLElement;

  constructor(store: SaveStore, kind: Kind, path: string, label: string, options: NumberOptions = {}) {
    super(store, kind, path);
    const input = h("input", {
      type: "number",
      value: String(this.current<number>()),
      min: options.min != null ? String(options.min) : null,
      max: options.max != null ? String(options.max) : null,
      step: "any",
    });
    input.addEventListener("change", async () => {
      let n = Number(input.value);
      if (options.limits && Number.isFinite(n)) {
        const { min, max } = options.limits();
        n = Math.min(Math.max(n, min), Math.max(min, max));
      }
      const ok = input.value.trim() !== "" && Number.isFinite(n) && (await store.edit(kind, [[path, n]]));
      if (!ok) input.value = String(this.current<number>());
      else {
        input.value = String(n);
        options.after?.();
      }
    });
    this.keepInSync(input, () => (input.value = String(this.current<number>())));
    this.element = Field.labelled(label, input, options.hint);
  }
}
