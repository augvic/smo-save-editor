// The save's overall progress numbers. They are worked out when a kingdom is unlocked or locked;
// the fields stay editable only to override them.

import type { Worlds } from "../../../game_data/index.ts";
import { FIRST_BRANCH, HOME_STATUS, SECOND_BRANCH } from "../../../rules/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { Layout, NumberField, SelectField } from "../../../widgets/index.ts";

const K = "progress";
const P = "/GameProgressData";

export class OverallProgressCard {
  private readonly store: SaveStore;
  private readonly worlds: Worlds;

  constructor(store: SaveStore, worlds: Worlds) {
    this.store = store;
    this.worlds = worlds;
  }

  /** `resync` runs after a number that decides what is unlocked was edited by hand. */
  build(resync: () => void): HTMLElement {
    const s = this.store;
    return Layout.card("Overall progress",
      "Worked out for you whenever you unlock or lock a kingdom, following the game's own rules. Change a value by hand only to override it.",
      Layout.grid(
        new NumberField(s, K, `${P}/UnlockWorldNum`, "Kingdoms unlocked", { min: 1, max: this.worlds.count, after: resync }).element,
        new NumberField(s, K, `${P}/HomeLevel`, "Odyssey level", { min: 0, max: 9 }).element,
        new SelectField(s, K, `${P}/HomeStatus`, "Odyssey status", HOME_STATUS.map((label, value) => ({ value, label }))).element,
        new SelectField(s, K, `${P}/WaterfallWorldProgress`, "Cascade progress", [
          { value: 0, label: "Not started" },
          { value: 1, label: "Got the first moon" },
          { value: 2, label: "Talked to the cap by the Odyssey" },
        ]).element,
        new SelectField(s, K, `${P}/UnlockWorldStatusFirstBranch`, "Wooded / Lake order", [
          { value: FIRST_BRANCH.none, label: "Not chosen yet" },
          { value: FIRST_BRANCH.wooded, label: "Wooded first" },
          { value: FIRST_BRANCH.lake, label: "Lake first" },
        ], undefined, resync).element,
        new SelectField(s, K, `${P}/UnlockWorldStatusSecondBranch`, "Seaside / Snow order", [
          { value: SECOND_BRANCH.none, label: "Not chosen yet" },
          { value: SECOND_BRANCH.seaside, label: "Seaside first" },
          { value: SECOND_BRANCH.snow, label: "Snow first" },
        ], undefined, resync).element,
      ));
  }
}
