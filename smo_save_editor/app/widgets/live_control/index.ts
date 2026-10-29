// Keeps a control showing current data when the save changes somewhere else (moons updating a
// kingdom's total, an unlock changing the Odyssey level…). A control being typed in is left
// alone, and one that is no longer on the page stops listening.

import type { SaveStore } from "../../save_store/index.ts";

export class LiveControl {
  static keepInSync(store: SaveStore, control: HTMLElement, refresh: () => void): void {
    const stop = store.subscribe(() => {
      if (!control.isConnected) stop();
      else if (document.activeElement !== control) refresh();
    });
  }
}
