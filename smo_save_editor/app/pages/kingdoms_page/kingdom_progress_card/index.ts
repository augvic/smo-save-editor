// The save's progress numbers for one kingdom.

import type { LeaveCatalog, ScenarioCatalog, StoryCatalog } from "../../../game_data/index.ts";
import { Dom } from "../../../dom/index.ts";
import type { CoinLedger, ShopLedger } from "../../../ledgers/index.ts";
import type { CutsceneRules, StoryRules } from "../../../rules/index.ts";
import type { Edit, WorldInfoEntry } from "../../../save_schema/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { CheckField, Layout, NumberField, SelectField } from "../../../widgets/index.ts";

const K = "progress";

export class KingdomProgressCard {
  private readonly store: SaveStore;
  private readonly story: StoryCatalog;
  private readonly scenarios: ScenarioCatalog;
  private readonly rules: StoryRules;
  private readonly leave: LeaveCatalog;
  private readonly coins: CoinLedger;
  private readonly purse: ShopLedger;
  private readonly cutscenes: CutsceneRules;

  constructor(store: SaveStore, story: StoryCatalog, scenarios: ScenarioCatalog, rules: StoryRules, leave: LeaveCatalog, coins: CoinLedger, purse: ShopLedger, cutscenes: CutsceneRules) {
    this.cutscenes = cutscenes;
    this.coins = coins;
    this.purse = purse;
    this.store = store;
    this.story = story;
    this.scenarios = scenarios;
    this.rules = rules;
    this.leave = leave;
  }

  /** The Odyssey's price for leaving a kingdom, next to what the save has: updates as moons are marked. */
  private leaveLine(world: number): HTMLElement | null {
    const need = this.leave.requirement(world);
    if (!need || need.moons === 0) return null;
    const line = Dom.h("p", { class: "note wide" });
    const refresh = () => {
      const infos = this.store.get<WorldInfoEntry[]>("progress", "/WorldInfo");
      const have = need.overall ? infos.reduce((sum, w) => sum + w.PayShineNum, 0) : infos[world]?.PayShineNum ?? 0;
      const where = need.overall ? "in the whole game" : "in this kingdom";
      line.textContent = `To leave: ${need.moons} Power Moons ${where} — ${have >= need.moons ? "enough" : `${need.moons - have} more needed`} (Moon total counts ${have}).`;
    };
    refresh();
    const stop = this.store.subscribe(() => (line.isConnected ? refresh() : stop()));
    return line;
  }

  /**
   * "First visit still pending" follows Main scenario: -1 (not reached) means the kingdom has not been
   * entered yet. A locked kingdom is always pending, whatever its Main scenario (the Metro Kingdom
   * has 0 there in a new save).
   */
  private async syncFirstVisit(world: number): Promise<void> {
    const info = this.store.get<WorldInfoEntry[]>("progress", "/WorldInfo")[world];
    const path = `/GameProgressData/IsFirstTimeWorld/${world}`;
    const pending = info.MainShineNo < 0 || info.UnlockedWorldId < 0;
    const slots = this.store.get<boolean[] | undefined>(K, `/SequenceDemoSkipData/WorldData/${world}/IsFirstScenarioStartCamera`)?.length;
    // The camera cutscenes follow Main scenario: not reached means none has played, reached means the intro has.
    const cutscenes = slots === undefined ? [] : this.cutscenes.edits(world, info.MainShineNo, slots);
    const edits = [[path, pending] as Edit, ...cutscenes].filter(([p, value]) => this.store.get(K, p) !== value);
    if (edits.length > 0) await this.store.edit(K, edits);
  }

  /** Raise Main scenario to what the chosen Current scenario goes with, never lower it. */
  private raiseMain(world: number): () => void {
    return async () => {
      const info = this.store.get<WorldInfoEntry[]>("progress", "/WorldInfo")[world];
      const least = this.rules.mainFor(world, info.ScenarioNo);
      if (info.MainShineNo < least) await this.store.edit(K, [[`/WorldInfo/${world}/MainShineNo`, least]]);
      await this.syncFirstVisit(world);
    };
  }

  /** Raise Current scenario to what the chosen Main scenario goes with, never lower it. */
  private raiseScenario(world: number): () => void {
    return async () => {
      const info = this.store.get<WorldInfoEntry[]>("progress", "/WorldInfo")[world];
      const wanted = this.rules.scenarioFor(world, info.MainShineNo);
      if (info.MainShineNo >= 0 && info.ScenarioNo < wanted) await this.store.edit(K, [[`/WorldInfo/${world}/ScenarioNo`, wanted]]);
      await this.syncFirstVisit(world);
    };
  }

  build(world: number): HTMLElement {
    const s = this.store;
    const p = `/WorldInfo/${world}`;
    const firstTime = s.get<boolean[]>(K, "/GameProgressData/IsFirstTimeWorld");
    const number = (path: string, label: string, min: number, hint: string) => new NumberField(s, K, `${p}/${path}`, label, { min, hint }).element;
    const check = (path: string, label: string) => new CheckField(s, K, `${p}/${path}`, label).element;

    const note =
      "Field meanings are inferred from the game's code and the names; -1 means \"not reached\". " +
      "Main scenario is how far along this kingdom's story-moon sequence you are (0 = none yet): the objective " +
      "shown in game is the next step of that sequence, whatever moons are marked as collected. " +
      "\"First visit still pending\" follows it: it is on while Main scenario is -1 (not reached) or the kingdom is locked." +
      " Current scenario is the kingdom's map stage, how the world looks; the list marks the stages the game itself names.";
    const scenarioOptions = this.scenarios.options(world);
    const storyOptions = this.story.options(world);

    return Layout.card("Progress", note,
      this.leaveLine(world),
      Layout.grid(
        new SelectField(s, K, `${p}/MainShineNo`, "Main scenario", storyOptions, "MainShineNo: steps of the story-moon sequence done; drives the in-game objective", this.raiseScenario(world)).element,
        number("UnlockedWorldId", "Map position (-1 = locked)", -1, "UnlockedWorldId: set by Unlock/Lock"),
        new SelectField(s, K, `${p}/ScenarioNo`, "Current scenario", scenarioOptions, "ScenarioNo: the kingdom's map stage (how it looks); raises Main scenario to what the game pairs it with", this.raiseMain(world)).element,
        number("PayShineNum", "Moon total", 0, "PayShineNum: moved by one for each moon you mark; it also counts shop and Multi Moons"),
        number("ShopShine", "Moons bought in shop", 0, "ShopShine"),
        new NumberField(s, K, `${p}/UseCoinCollectNum`, "Purple coins spent", {
          min: 0,
          hint: "UseCoinCollectNum: follows the shop items you own; typed values are kept between what the owned items cost and the coins collected here",
          limits: () => ({ min: this.purse.spent(world), max: this.coins.stats(world)?.have ?? 0 }),
        }).element,
        check("WorldWarpHoleThrough", "Warp hole used"),
        check("TalkLocalLanguage", "Spoke local language"),
        world < firstTime.length && new CheckField(s, K, `/GameProgressData/IsFirstTimeWorld/${world}`, "First visit still pending", "Follows Main scenario: on while it is -1 (not reached) or the kingdom is locked", true).element,
      ),
    );
  }
}
