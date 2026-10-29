// What every form field has in common: it edits one value of a save, shows it in a labelled
// control, and keeps showing the right value when the data changes elsewhere.

import { Dom } from "../../dom/index.ts";
import type { Kind } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import { LiveControl } from "../live_control/index.ts";

const h = Dom.h;

export abstract class Field {
  /** The finished field, ready to put on a page. */
  abstract readonly element: HTMLElement;
  protected readonly store: SaveStore;
  protected readonly kind: Kind;
  protected readonly path: string;

  constructor(store: SaveStore, kind: Kind, path: string) {
    this.store = store;
    this.kind = kind;
    this.path = path;
  }

  /** The value as it is now in the save. */
  protected current<T>(): T {
    return this.store.get<T>(this.kind, this.path);
  }

  protected keepInSync(control: HTMLElement, refresh: () => void): void {
    LiveControl.keepInSync(this.store, control, refresh);
  }

  /** A labelled form control. */
  static labelled(label: string, control: HTMLElement, hint?: string): HTMLElement {
    return h("label", { class: "field", title: hint }, h("span", null, label), control);
  }
}
