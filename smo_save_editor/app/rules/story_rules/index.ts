// How a kingdom's Main scenario (story steps done) and Current scenario (map stage) go together,
// from the game's own data: the story moons, MainQuestInfo and ClearMainScenario.

import type { ScenarioCatalog, StoryCatalog } from "../../game_data/index.ts";

export class StoryRules {
  private readonly scenarios: ScenarioCatalog;
  private readonly story: StoryCatalog;

  constructor(scenarios: ScenarioCatalog, story: StoryCatalog) {
    this.scenarios = scenarios;
    this.story = story;
  }

  /** The Main scenario of a kingdom whose story is done; undefined if not known. */
  doneMain(world: number): number | undefined {
    return this.story.finishedMainScenario(world);
  }

  /** The Current scenario of a kingdom whose story is done; undefined if the Main scenario is not known. */
  doneScenario(world: number): number | undefined {
    const main = this.doneMain(world);
    return main === undefined ? undefined : this.scenarios.storyDone(world, main);
  }

  /** The least Main scenario the game allows with a Current scenario (its MainQuestInfo). */
  mainFor(world: number, scenario: number): number {
    return this.scenarios.mainMin(world, scenario);
  }

  /** The Current scenario that goes with a Main scenario: the one a finished story shows, or the first that fits. */
  scenarioFor(world: number, main: number): number {
    const done = this.doneMain(world);
    if (done !== undefined && main >= done) return this.doneScenario(world) ?? 1;
    return this.scenarios.scenarioFor(world, main);
  }
}
