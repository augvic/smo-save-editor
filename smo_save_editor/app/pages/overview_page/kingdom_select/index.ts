// Which kingdom Mario is in. Changing it moves him there as the game would: it also sets the
// previous and next kingdom and the stage, and unlocks the kingdom (and those before it) if needed.

import { Dom } from "../../../dom/index.ts";
import type { GoToKingdom } from "../../../actions/index.ts";
import type { Worlds } from "../../../game_data/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { Field, LiveControl } from "../../../widgets/index.ts";

const h = Dom.h;

export class KingdomSelect {
  private readonly store: SaveStore;
  private readonly worlds: Worlds;
  private readonly goToKingdom: GoToKingdom;

  constructor(store: SaveStore, worlds: Worlds, goToKingdom: GoToKingdom) {
    this.store = store;
    this.worlds = worlds;
    this.goToKingdom = goToKingdom;
  }

  /** Built when the page is drawn, so it shows the save that is open at that moment. */
  build(): HTMLElement {
    const select = h("select", null, ...this.worlds.names.map((name, i) => h("option", { value: String(i) }, name)));
    const show = () => (select.value = String(this.store.get<number>("progress", "/WorldId")));
    show();
    select.addEventListener("change", async () => {
      if (!(await this.goToKingdom.execute(Number(select.value)))) show();
    });
    LiveControl.keepInSync(this.store, select, show);
    return Field.labelled(
      "Kingdom",
      select,
      "Moving here also sets the stage, the previous/next kingdom, and unlocks the kingdom if it is locked.",
    );
  }
}
