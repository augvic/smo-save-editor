// Story flags that belong to the whole game rather than one kingdom: boss fights, the last cutscenes, the shop's "NEW" markers.

import { Dom } from "../../dom/index.ts";
import { Icon } from "../../icon/index.ts";
import type { Edit } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import { CheckField, Layout } from "../../widgets/index.ts";
import type { Page } from "../page/index.ts";

const h = Dom.h;
const K = "progress";

export class StoryFlagsPage implements Page {
  readonly title = "Story flags";
  readonly needs = "progress" as const;
  private readonly store: SaveStore;

  constructor(store: SaveStore) {
    this.store = store;
  }

  private list(path: string, label: (i: number) => string, hint: string): HTMLElement[] {
    const items = this.store.get<boolean[] | undefined>(K, path) ?? [];
    return items.map((_, i) => new CheckField(this.store, K, `${path}/${i}`, label(i), hint).element);
  }

  /** The edits that clear every "NEW" marker of the shop: false for the flags, 0 for the counters. */
  private clearNew(): Edit[] {
    const edits: Edit[] = [];
    for (const key of ["IsShowNewItemAocList", "IsShowNewItemWorldList", "IsShowNewItemMoonNumList"]) {
      const items = this.store.get<(boolean | number)[] | undefined>(K, `/ShopTalkData/${key}`) ?? [];
      items.forEach((value, i) => { if (value !== false && value !== 0) edits.push([`/ShopTalkData/${key}/${i}`, typeof value === "boolean" ? false : 0]); });
    }
    return edits;
  }

  render(root: HTMLElement): void {
    const check = (path: string, label: string, hint: string) => new CheckField(this.store, K, path, label, hint).element;
    root.append(
      Layout.card("Bosses", "The game's own names for the fights are not in its data, so they are numbered in the save's order. On means it was seen or won.",
        Layout.grid(
          ...this.list("/BossSaveData/IsAlreadyDeadGK", (i) => `Gatekeeper fight ${i + 1} won`, "BossSaveData IsAlreadyDeadGK"),
          ...this.list("/BossSaveData/IsShowDemoBossBattleStartLv1", (i) => `Boss ${i + 1}: first fight intro shown`, "BossSaveData IsShowDemoBossBattleStartLv1"),
          ...this.list("/BossSaveData/IsShowDemoBossBattleStartLv2", (i) => `Boss ${i + 1}: rematch intro shown`, "BossSaveData IsShowDemoBossBattleStartLv2"),
        )),
      Layout.card("Cutscenes of the whole game", null,
        Layout.grid(
          check("/BossSaveData/IsShowDemoBattleEndKoopaLv2", "Bowser rematch ending shown", "BossSaveData IsShowDemoBattleEndKoopaLv2"),
          check("/BossSaveData/IsShowDemoMoonBasementCollapse", "Moon basement collapse shown", "BossSaveData IsShowDemoMoonBasementCollapse"),
          check("/SequenceDemoSkipData/IsShowDemoWorldWarpHole", "Warp hole cutscene shown", "SequenceDemoSkipData IsShowDemoWorldWarpHole"),
          check("/MoonRockData/IsShowDemoAfterOpenMoonRockFirst", "First Moon Rock opening aftermath shown", "MoonRockData IsShowDemoAfterOpenMoonRockFirst"),
          check("/MoonRockData/IsShowDemoOpenMoonRockFirst", "First Moon Rock opening shown", "MoonRockData IsShowDemoOpenMoonRockFirst"),
        )),
      Layout.card("Shop markers", "The shop shows a \"NEW\" marker on items you have not looked at yet.",
        h("button", {
          class: "ghost",
          onclick: async () => {
            const edits = this.clearNew();
            if (edits.length > 0) await this.store.edit(K, edits);
          },
        }, Icon.of("sparkle", 14), "Clear all NEW markers")),
    );
  }
}
