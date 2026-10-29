import { Dom } from "../../dom/index.ts";
import type { Kind } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import { Field } from "../field/index.ts";

const h = Dom.h;

export interface OptionGroup {
  label: string;
  options: { value: string; label: string }[];
}

/** A dropdown with grouped options. A current value that is not listed is kept, marked "custom". */
export class GroupedSelectField extends Field {
  readonly element: HTMLElement;

  constructor(store: SaveStore, kind: Kind, path: string, label: string, groups: OptionGroup[], hint?: string) {
    super(store, kind, path);
    const current = String(this.current<string>());
    const listed = groups.some((g) => g.options.some((o) => o.value === current));
    const select = h("select", null,
      !listed && h("option", { value: current, selected: true }, current === "" ? "(none)" : `${current} (custom)`),
      ...groups.map((g) =>
        h("optgroup", { label: g.label },
          ...g.options.map((o) => h("option", { value: o.value, selected: o.value === current }, o.label)))),
    );
    select.addEventListener("change", async () => {
      if (!(await store.edit(kind, [[path, select.value]]))) select.value = String(this.current<string>());
    });
    this.keepInSync(select, () => (select.value = String(this.current<string>())));
    this.element = Field.labelled(label, select, hint);
  }
}
