// Reading what is unlocked, and making the whole save agree with a new unlock state.

import type { Worlds } from "../../game_data/index.ts";
import type { MoonLedger } from "../../ledgers/index.ts";
import type { Context, ProgressPlanner, Unlock, UnlockRules } from "../../rules/index.ts";
import type { Edit, WorldInfoEntry } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

export class UnlockState {
  private readonly store: SaveStore;
  private readonly worlds: Worlds;
  private readonly unlockRules: UnlockRules;
  private readonly planner: ProgressPlanner;
  private readonly moons: MoonLedger;

  constructor(store: SaveStore, worlds: Worlds, unlockRules: UnlockRules, planner: ProgressPlanner, moons: MoonLedger) {
    this.store = store;
    this.worlds = worlds;
    this.unlockRules = unlockRules;
    this.planner = planner;
    this.moons = moons;
  }

  /** What the save currently says is unlocked. */
  read(): Unlock {
    return this.unlockRules.normalize({
      num: this.store.get<number>("progress", "/GameProgressData/UnlockWorldNum"),
      first: this.store.get<number>("progress", "/GameProgressData/UnlockWorldStatusFirstBranch"),
      second: this.store.get<number>("progress", "/GameProgressData/UnlockWorldStatusSecondBranch"),
    });
  }

  private context(): Context {
    return {
      homeStatus: this.store.get<number>("progress", "/GameProgressData/HomeStatus"),
      waterfall: this.store.get<number>("progress", "/GameProgressData/WaterfallWorldProgress"),
      cascadeHasMoon: (this.moons.stats().get(this.worlds.ids.cascade)?.have ?? 0) > 0,
      startSlots: this.store.get<{ IsFirstScenarioStartCamera: boolean[] }[]>("progress", "/SequenceDemoSkipData/WorldData")?.map((w) => w.IsFirstScenarioStartCamera.length),
      mainScenario: this.store.get<WorldInfoEntry[]>("progress", "/WorldInfo").map((w) => w.MainShineNo),
      scenario: this.store.get<WorldInfoEntry[]>("progress", "/WorldInfo").map((w) => w.ScenarioNo),
      unlocked: this.store.get<WorldInfoEntry[]>("progress", "/WorldInfo").map((w) => w.UnlockedWorldId >= 0),
    };
  }

  /** The edits that bring the whole save in line with an unlock state, minus what is already right. */
  edits(next: Unlock): Edit[] {
    return this.planner.editsFor(next, this.context()).filter(([path, value]) => this.store.get("progress", path) !== value);
  }

  /** Make the whole save agree with an unlock state. Returns false if the edit was refused. */
  async apply(next: Unlock): Promise<boolean> {
    const edits = this.edits(next);
    return edits.length === 0 || this.store.edit("progress", edits);
  }

  /** Bring the rest of the save in line with the unlock numbers as they stand now. */
  resync(): Promise<boolean> {
    return this.apply(this.read());
  }
}
