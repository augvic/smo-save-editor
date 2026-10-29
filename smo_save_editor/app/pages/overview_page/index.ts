// The player's own numbers: coins, equipment, location, statistics, flags.

import type { RaiseTotalCoins } from "../../actions/index.ts";
import { Dom } from "../../dom/index.ts";
import type { StageCatalog, WardrobeListPath, Worlds } from "../../game_data/index.ts";
import type { WardrobeLedger } from "../../ledgers/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import {
  CheckField,
  GroupedSelectField,
  Layout,
  NumberField,
  SelectField,
  TextField,
} from "../../widgets/index.ts";
import type { NumberOptions, OptionGroup, SelectOption } from "../../widgets/index.ts";
import type { Page } from "../page/index.ts";
import type { KingdomSelect } from "./kingdom_select/index.ts";
import type { PlayTimeField } from "./play_time_field/index.ts";

const h = Dom.h;
const K = "progress";

export class OverviewPage implements Page {
  readonly title = "Overview";
  readonly needs = "progress" as const;
  private readonly store: SaveStore;
  private readonly worlds: Worlds;
  private readonly stages: StageCatalog;
  private readonly wardrobe: WardrobeLedger;
  private readonly raiseTotalCoins: RaiseTotalCoins;
  private readonly playTime: PlayTimeField;
  private readonly kingdomSelect: KingdomSelect;

  constructor(
    store: SaveStore,
    worlds: Worlds,
    stages: StageCatalog,
    wardrobe: WardrobeLedger,
    raiseTotalCoins: RaiseTotalCoins,
    playTime: PlayTimeField,
    kingdomSelect: KingdomSelect,
  ) {
    this.store = store;
    this.worlds = worlds;
    this.stages = stages;
    this.wardrobe = wardrobe;
    this.raiseTotalCoins = raiseTotalCoins;
    this.playTime = playTime;
    this.kingdomSelect = kingdomSelect;
  }

  /** Stages grouped by kingdom, with the kingdom currently selected listed first. */
  private stageGroups(): OptionGroup[] {
    const current = this.worlds.name(Number(this.store.get<number>(K, "/WorldId")));
    const groups = this.stages.groups.map((g) => ({
      label: g.group,
      options: g.stages.map(([id, label]) => ({ value: id, label: `${label} — ${id}` })),
    }));
    return [...groups.filter((g) => g.label === current), ...groups.filter((g) => g.label !== current)];
  }

  /** The items owned in a wardrobe list, labelled with their English name when known. */
  private owned(path: WardrobeListPath): SelectOption[] {
    const names = new Map(this.wardrobe.catalog.entries(path).map(([id, name]) => [id, name]));
    return this.wardrobe.ownedNames(path).map((id) => ({ value: id, label: names.get(id) ?? id }));
  }

  render(root: HTMLElement): void {
    const s = this.store;
    const number = (path: string, label: string, options: NumberOptions = {}) => new NumberField(s, K, path, label, { min: 0, ...options }).element;
    const check = (path: string, label: string) => new CheckField(s, K, path, label).element;

    root.append(
      Layout.card("Player", null, Layout.grid(
        number("/CoinNum", "Coins", { hint: "Coins you are carrying right now", after: () => this.raiseTotalCoins.execute() }),
        number("/TotalCoinNum", "Total coins", { hint: "Lifetime coin counter" }),
        this.playTime.build(),
        number("/JangoCount", "Jaxi / Jango count"),
      )),
      Layout.card("Equipment", "Only items you own (see the shops under Kingdoms) can be equipped.",
        Layout.grid(
          new SelectField(s, K, "/CurrentCapName", "Cap", this.owned("/ItemCap")).element,
          new SelectField(s, K, "/CurrentClothName", "Outfit", this.owned("/ItemCloth")).element,
        ),
        h("div", { class: "stack" },
          check("/IsCapRandom", "Random cap"),
          check("/IsCostumeRandom", "Random outfit"),
        ),
      ),
      Layout.card("Location", "Where the game puts you when it loads this save. Picking a kingdom moves you to its overworld; pick another stage below to start somewhere else in it.", Layout.grid(
        this.kingdomSelect.build(),
        new GroupedSelectField(s, K, "/StageName", "Stage", this.stageGroups(),
          "The stage that loads. The home stage of a kingdom is the main overworld.").element,
        new TextField(s, K, "/PlayerStartIdForSave", "Start point ID",
          "Which entrance/checkpoint you appear at. Leave empty to use the stage's default.").element,
      )),
      Layout.card("Statistics", null, Layout.grid(
        number("/PlayerJumpCount", "Jumps"),
        number("/PlayerThrowCapCount", "Cap throws"),
        number("/JumpingRopeBestCount", "Jump rope best"),
        number("/JumpingRopeBestCount2", "Jump rope best (2)"),
        number("/VolleyballBestCount", "Volleyball best"),
        number("/RaceLoseCountLv1", "Race losses (Lv 1)"),
        number("/RaceLoseCountLv2", "Race losses (Lv 2)"),
      )),
      Layout.card("Flags", null, Layout.grid(
        check("/IsEnableCap", "Mario has his cap (Cappy)"),
        check("/IsKidsMode", "Assist mode"),
        check("/IsRideMotorcycle", "Riding motorcycle"),
        check("/IsPlayDemoOpening", "Opening cutscene played"),
        check("/IsUnlockAchievement", "Achievements unlocked"),
      )),
    );
  }
}

export { KingdomSelect } from "./kingdom_select/index.ts";
export { PlayTimeField } from "./play_time_field/index.ts";
