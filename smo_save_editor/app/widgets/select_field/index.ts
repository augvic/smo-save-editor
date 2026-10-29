import { Dom } from "../../dom/index.ts";
import type { Kind } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import { Field } from "../field/index.ts";

const h = Dom.h;

export interface SelectOption {
  value: string | number;
  label: string;
}

/** A dropdown over a fixed list of options. A current value that is not listed is kept, marked "unknown". */
export class SelectField extends Field {
  readonly element: HTMLElement;

  constructor(
    store: SaveStore,
    kind: Kind,
    path: string,
    label: string,
    options: SelectOption[],
    hint?: string,
    after?: () => void,
  ) {
    super(store, kind, path);
    const current = this.current<string | number>();
    const known = options.some((o) => o.value === current);
    const all = known ? options : [{ value: current, label: `${current} (unknown)` }, ...options];
    const select = h("select", null, ...all.map((o) => h("option", { value: String(o.value), selected: o.value === current }, o.label)));
    select.addEventListener("change", async () => {
      const chosen = all.find((o) => String(o.value) === select.value) as SelectOption;
      if (!(await store.edit(kind, [[path, chosen.value]]))) select.value = String(this.current<string | number>());
      else after?.();
    });
    this.keepInSync(select, () => (select.value = String(this.current<string | number>())));
    this.element = Field.labelled(label, select, hint);
  }
}
