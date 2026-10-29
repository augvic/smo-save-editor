// The scenarios of each kingdom, from the game's own data.

import { SCENARIOS } from "./scenarios.ts";

export interface ScenarioOption {
  value: number;
  label: string;
}

export class ScenarioCatalog {
  /** Every scenario of a kingdom (1..count), each labelled with what is special about it. */
  options(world: number): ScenarioOption[] {
    const info = SCENARIOS[world];
    if (!info) return [];
    return Array.from({ length: info.count }, (_, i) => {
      const n = i + 1;
      const tags: string[] = [];
      if (n === 1) tags.push("start");
      if (n === info.clear) tags.push("story cleared");
      if (n === info.afterEnding) tags.push("after the ending");
      if (n === info.moonRock) tags.push("Moon Rock open");
      if (n === info.balloon) tags.push("Balloon World");
      return { value: n, label: tags.length > 0 ? `${n} — ${tags.join(", ")}` : String(n) };
    });
  }

  /** The least Main scenario a scenario goes with (the game's MainQuestInfo); 0 if the game lists none. */
  mainMin(world: number, scenario: number): number {
    return SCENARIOS[world]?.mainMin[scenario - 1] ?? 0;
  }

  /**
   * The scenario a kingdom shows once its story is done, which is what the save holds for a kingdom
   * the player has left. It is the game's ClearMainScenario; the Cascade Kingdom lists 7 there, past
   * its Moon Rock scenario, so for a "clear" number like that the first scenario that goes with the
   * finished Main scenario is used instead.
   */
  storyDone(world: number, finishedMain: number): number {
    const info = SCENARIOS[world];
    if (!info) return 1;
    if (info.clear <= info.moonRock) return info.clear;
    return info.mainMin.findIndex((m) => m >= finishedMain) + 1 || info.clear;
  }

  /** The scenario that goes with a Main scenario: the first one whose minimum is the highest that `main` reaches. */
  scenarioFor(world: number, main: number): number {
    const info = SCENARIOS[world];
    if (!info) return 1;
    const reached = Math.max(0, ...info.mainMin.filter((m) => m <= main));
    return info.mainMin.indexOf(reached) + 1;
  }

  /** The scenario in which a kingdom's Moon Rock is open; undefined for an unknown kingdom. */
  moonRock(world: number): number | undefined {
    return SCENARIOS[world]?.moonRock;
  }
}
