// The story-moon sequence of each kingdom, and how far along it a finished game was.

import type { MoonCatalog } from "../moon_catalog/index.ts";
import { STORY_MOONS } from "./story_moons.ts";
import { STORY_STEPS } from "./story_steps.ts";

export interface StoryOption {
  value: number;
  label: string;
}

export class StoryCatalog {
  private readonly moons: MoonCatalog;

  constructor(moons: MoonCatalog) {
    this.moons = moons;
  }

  /** The Main scenario of a kingdom whose story is finished, as seen in a finished game; undefined if unknown. */
  finishedMainScenario(world: number): number | undefined {
    return STORY_STEPS[world];
  }

  /** The names of the story moons that are the objective while Main scenario is `step` (empty if the game lists none). */
  objectives(world: number, step: number): string[] {
    return STORY_MOONS.filter(([w, n]) => w === world && n === step).map(([, , id]) => this.moons.name(id) ?? `Moon ${id}`);
  }

  /** Every value Main scenario can take in a kingdom, each labelled with the objective it gives; empty if unknown. */
  options(world: number): StoryOption[] {
    const done = this.finishedMainScenario(world);
    if (done === undefined) return [];
    const steps = Array.from({ length: done }, (_, step) => {
      const names = this.objectives(world, step);
      const label = names.length === 0 ? "story step" : `next: ${names[0]}${names.length > 1 ? ` (or ${names.length - 1} more)` : ""}`;
      return { value: step, label: `${step} — ${label}` };
    });
    const last = done === 0 ? "no story sequence" : "story done, on to the next kingdom";
    return [{ value: -1, label: "-1 — not reached" }, ...steps, { value: done, label: `${done} — ${last}` }];
  }
}
