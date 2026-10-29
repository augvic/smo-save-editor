// How far the save is towards the achievements that count things, worked out from what the save already holds.
// It is an estimate: the game keeps its own counters, which the save does not show.

import { MOON_KIND_LABELS } from "../../game_data/index.ts";
import type { AchievementCatalog, MoonCatalog } from "../../game_data/index.ts";
import type { ShineEntry, WorldInfoEntry } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

export interface AchievementProgress {
  have: number;
  /** What was counted, e.g. "treasure chest moons collected". */
  what: string;
}

export class AchievementLedger {
  private readonly store: SaveStore;
  private readonly achievements: AchievementCatalog;
  private readonly moons: MoonCatalog;

  constructor(store: SaveStore, achievements: AchievementCatalog, moons: MoonCatalog) {
    this.store = store;
    this.achievements = achievements;
    this.moons = moons;
  }

  /** The count behind an achievement, or undefined for one this cannot count. */
  progress(name: string): AchievementProgress | undefined {
    const shine = this.store.get<ShineEntry[]>("progress", "/ShineData");
    if (name.startsWith("Shine_Gather_")) return { have: shine.filter((m) => m.IsGet).length, what: "moons collected" };
    if (name === "Shine_CollectCoinShop") {
      const infos = this.store.get<WorldInfoEntry[]>("progress", "/WorldInfo");
      return { have: infos.filter((w) => w.UseCoinCollectNum > 0).length, what: "kingdoms where purple coins were spent" };
    }
    const kind = this.achievements.moonKind(name);
    if (!kind) return undefined;
    return { have: shine.filter((m) => m.IsGet && this.moons.kind(m.UniqueId) === kind).length, what: `${MOON_KIND_LABELS[kind].toLowerCase()} moons collected` };
  }
}
