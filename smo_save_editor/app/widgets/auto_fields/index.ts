// Draws a field for every simple value of an object, picked by the value's type.

import { Dom } from "../../dom/index.ts";
import type { Kind } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import { CheckField } from "../check_field/index.ts";
import { NumberField } from "../number_field/index.ts";
import { TextField } from "../text_field/index.ts";

export class AutoFields {
  private readonly store: SaveStore;

  constructor(store: SaveStore) {
    this.store = store;
  }

  build(kind: Kind, path: string, skip: string[] = []): HTMLElement[] {
    const object = this.store.get<Record<string, unknown> | undefined>(kind, path) ?? {};
    return Object.keys(object)
      .filter((key) => !skip.includes(key) && typeof object[key] !== "object")
      .map((key) => {
        const fieldPath = `${path}/${key}`;
        const label = Dom.humanize(key);
        switch (typeof object[key]) {
          case "boolean": return new CheckField(this.store, kind, fieldPath, label).element;
          case "number": return new NumberField(this.store, kind, fieldPath, label).element;
          default: return new TextField(this.store, kind, fieldPath, label).element;
        }
      });
  }
}
