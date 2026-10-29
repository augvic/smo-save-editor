// The cutscenes of one kingdom the game remembers: its intro, the start of each scenario, and the Moon Rock.

import type { SaveStore } from "../../../save_store/index.ts";
import { CheckField, Layout } from "../../../widgets/index.ts";
import type { ScenarioCatalog } from "../../../game_data/index.ts";

const K = "progress";

export class CutscenesCard {
  private readonly store: SaveStore;
  private readonly scenarios: ScenarioCatalog;

  constructor(store: SaveStore, scenarios: ScenarioCatalog) {
    this.store = store;
    this.scenarios = scenarios;
  }

  /** The card, or null if the save has no cutscene data for the kingdom. */
  build(world: number): HTMLElement | null {
    const base = `/SequenceDemoSkipData/WorldData/${world}`;
    const data = this.store.get<{ IsFirstScenarioStartCamera: boolean[] } | undefined>(K, base);
    if (!data) return null;
    const check = (path: string, label: string, hint: string) => new CheckField(this.store, K, path, label, hint).element;
    const starts = Array.from({ length: Math.min(data.IsFirstScenarioStartCamera.length, this.scenarios.options(world).length) }, (_, i) =>
      check(`${base}/IsFirstScenarioStartCamera/${i}`, `Start of scenario ${i + 1} still to play`, "IsFirstScenarioStartCamera: on until the game has played it once"));
    const rock = (list: string, label: string) =>
      this.store.get<boolean[] | undefined>(K, `/MoonRockData/${list}`)?.[world] === undefined ? null : check(`/MoonRockData/${list}/${world}`, label, `MoonRockData ${list}`);
    return Layout.card("Cutscenes", "For the intro and scenario starts, on means the game will still play it; for the Moon Rock, on means it was already shown.",
      Layout.grid(
        check(`${base}/IsFirstWorldIntroCamera`, "Intro of the kingdom still to play", "IsFirstWorldIntroCamera: on until the game has played it once"),
        ...starts,
        rock("IsShowDemoMoonRockMapWorld", "Moon Rock map cutscene already shown"),
        rock("IsShowDemoOpenMoonRockWorld", "Moon Rock opening cutscene already shown"),
        rock("IsAppearedMoonRockTalkMessage", "Moon Rock message already shown"),
      ));
  }
}
