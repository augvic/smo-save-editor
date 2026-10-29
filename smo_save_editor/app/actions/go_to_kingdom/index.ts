// Put Mario in a kingdom, the way the game does when it travels there: the current, previous and
// next kingdom, the stage, and the first visit. A kingdom that is still locked is unlocked first.

import type { StageCatalog, Worlds } from "../../game_data/index.ts";
import type { CutsceneRules, UnlockRules } from "../../rules/index.ts";
import type { Edit } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import type { Toaster } from "../../toaster/index.ts";
import type { UnlockState } from "../unlock_state/index.ts";

export class GoToKingdom {
  private readonly store: SaveStore;
  private readonly worlds: Worlds;
  private readonly stages: StageCatalog;
  private readonly unlockRules: UnlockRules;
  private readonly state: UnlockState;
  private readonly toaster: Toaster;
  private readonly cutscenes: CutsceneRules;

  constructor(
    store: SaveStore,
    worlds: Worlds,
    stages: StageCatalog,
    unlockRules: UnlockRules,
    state: UnlockState,
    toaster: Toaster,
    cutscenes: CutsceneRules,
  ) {
    this.cutscenes = cutscenes;
    this.store = store;
    this.worlds = worlds;
    this.stages = stages;
    this.unlockRules = unlockRules;
    this.state = state;
    this.toaster = toaster;
  }

  /** The edits that put Mario in `world`; only the ones that change something. Empty for a kingdom that does not exist. */
  edits(world: number): Edit[] {
    if (world < 0 || world >= this.worlds.count) return [];
    const here = this.store.get<number>("progress", "/WorldId");
    const before = this.state.read();
    const after = this.unlockRules.unlock(world, before);
    const unlocking = after.num !== before.num || after.first !== before.first || after.second !== before.second;

    const edits: Edit[] = [
      ["/WorldId", world],
      ["/NextWorldId", world],
      ["/PrevWorldId", here],
      ["/PlayerStartIdForSave", ""],
      ...(unlocking ? this.state.edits(after) : []),
      // Entering a kingdom for the first time moves Main scenario from -1 (not reached) to 0 and ends the pending first visit.
      ...(unlocking || this.store.get<number>("progress", `/WorldInfo/${world}/MainShineNo`) < 0
        ? [[`/WorldInfo/${world}/MainShineNo`, 0] as Edit]
        : []),
      [`/GameProgressData/IsFirstTimeWorld/${world}`, false],
    ];
    // Arriving in a kingdom for the first time plays its intro and the start of its scenario.
    const slots = this.store.get<boolean[] | undefined>("progress", `/SequenceDemoSkipData/WorldData/${world}/IsFirstScenarioStartCamera`)?.length;
    const main = this.store.get<number>("progress", `/WorldInfo/${world}/MainShineNo`);
    if (slots !== undefined && (unlocking || main < 0)) {
      const scenario = this.store.get<number>("progress", `/WorldInfo/${world}/ScenarioNo`);
      edits.push(...this.cutscenes.edits(world, 0, slots), ...this.cutscenes.arrival(world, Math.max(1, scenario), slots));
    }
    const stage = this.stages.homeStageOf(this.worlds.name(world));
    if (stage) edits.push(["/StageName", stage]);

    return edits.filter(([path, value]) => this.store.get("progress", path) !== value);
  }

  async execute(world: number): Promise<boolean> {
    if (world < 0 || world >= this.worlds.count) return false;
    const before = this.state.read();
    const after = this.unlockRules.unlock(world, before);
    const changes = this.edits(world);
    if (changes.length > 0 && !(await this.store.edit("progress", changes))) return false;

    const wasOpen = this.unlockRules.unlockedWorlds(before);
    const newly = [...this.unlockRules.unlockedWorlds(after)].filter((w) => !wasOpen.has(w));
    const name = this.worlds.name(world);
    this.toaster.show(newly.length > 0 ? `Moved to ${name} (unlocked ${newly.map((w) => this.worlds.name(w)).join(", ")})` : `Moved to ${name}`);
    return true;
  }
}
