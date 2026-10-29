// Works out every value in the save that has to change so it agrees with an unlock state.

import type { Worlds } from "../../game_data/index.ts";
import type { Edit } from "../../save_schema/index.ts";
import type { OdysseyRules } from "../odyssey_rules/index.ts";
import type { StoryRules } from "../story_rules/index.ts";
import type { Unlock, UnlockRules } from "../unlock_rules/index.ts";

/** What the rest of the save needs to show for the planner to compute the values that follow. */
export interface Context {
  homeStatus: number;
  waterfall: number;
  cascadeHasMoon: boolean;
  /** WorldInfo[i].MainShineNo for every world. */
  mainScenario: number[];
  /** WorldInfo[i].ScenarioNo for every world. */
  scenario: number[];
  /** Whether each world is unlocked in the save now (its UnlockedWorldId is not -1). */
  unlocked: boolean[];
}

export class ProgressPlanner {
  private readonly worlds: Worlds;
  private readonly unlockRules: UnlockRules;
  private readonly odyssey: OdysseyRules;
  private readonly story: StoryRules;

  constructor(worlds: Worlds, unlockRules: UnlockRules, odyssey: OdysseyRules, story: StoryRules) {
    this.story = story;
    this.worlds = worlds;
    this.unlockRules = unlockRules;
    this.odyssey = odyssey;
  }

  /** Every value in the save that has to change so it agrees with the given unlock state. */
  editsFor(u: Unlock, ctx: Context): Edit[] {
    const open = this.unlockRules.unlockedWorlds(u);
    const edits: Edit[] = [
      ["/GameProgressData/UnlockWorldNum", u.num],
      ["/GameProgressData/UnlockWorldStatusFirstBranch", u.first],
      ["/GameProgressData/UnlockWorldStatusSecondBranch", u.second],
      ["/GameProgressData/HomeLevel", this.odyssey.homeLevel(u.num)],
      ["/GameProgressData/HomeStatus", this.odyssey.homeStatus(u.num, ctx.homeStatus)],
      [
        "/GameProgressData/WaterfallWorldProgress",
        this.odyssey.waterfallProgress(u.num, ctx.waterfall, ctx.cascadeHasMoon),
      ],
    ];
    // Mario gets Cappy at the start of the Cap Kingdom. A save that moves on without it leaves him
    // capless and unable to do anything (IsEnableCap is false in a new save, true in a finished game).
    if (u.num > 1) edits.push(["/IsEnableCap", true]);
    // Every kingdom before the newest one has been left, so its story is done: its Main scenario and its
    // Current scenario are at least what a finished story shows (a value already past that is kept).
    const left = new Set(this.unlockRules.unlockOrder(u).slice(0, Math.max(0, u.num - 1)));
    const cap = this.worlds.ids.cap;
    for (let world = 0; world < this.worlds.count; world++) {
      const unlocked = open.has(world);
      const newest = unlocked && !left.has(world);
      const doneMain = this.story.doneMain(world);
      const doneScenario = this.story.doneScenario(world);
      if (left.has(world) && doneMain !== undefined && ctx.mainScenario[world] < doneMain) edits.push([`/WorldInfo/${world}/MainShineNo`, doneMain]);
      if (left.has(world) && doneScenario !== undefined && ctx.scenario[world] < doneScenario) edits.push([`/WorldInfo/${world}/ScenarioNo`, doneScenario]);

      // The game's own state for a kingdom that is unlocked but not visited yet: Main scenario -1 (not
      // reached), Current scenario 1 (start), "first visit pending". Entering it moves Main scenario to 0.
      const justUnlocked = unlocked && !ctx.unlocked[world];
      const notEntered = newest && world !== cap && (justUnlocked || ctx.mainScenario[world] < 0);
      if (justUnlocked && newest && world !== cap) {
        edits.push([`/WorldInfo/${world}/MainShineNo`, -1], [`/WorldInfo/${world}/ScenarioNo`, 1]);
      } else if (unlocked && world === cap && ctx.mainScenario[world] < 0) {
        edits.push([`/WorldInfo/${world}/MainShineNo`, 0]);
      }
      edits.push(
        [`/GameProgressData/IsFirstTimeWorld/${world}`, !unlocked || notEntered],
        [`/WorldInfo/${world}/UnlockedWorldId`, unlocked ? this.unlockRules.positionOf(world, u) : -1],
      );
      // A locked world is "not visited" (-1). The Metro Kingdom is the exception the game itself makes:
      // a save the game created has it at 0 while locked.
      const notVisited = world === this.worlds.ids.metro ? 0 : -1;
      if (!unlocked && ctx.mainScenario[world] > notVisited) edits.push([`/WorldInfo/${world}/MainShineNo`, notVisited]);
    }
    return edits;
  }
}
