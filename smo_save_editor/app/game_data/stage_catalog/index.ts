// The stages the game can load, grouped by kingdom.

import { VISIT_STAGES } from "./visit_stages.ts";
import { STAGE_GROUPS } from "./stages.ts";
import type { StageGroup } from "./stages.ts";

export type { StageGroup };

export class StageCatalog {
  readonly groups: readonly StageGroup[] = STAGE_GROUPS;

  /** The overworld stage of a kingdom (given by its name), e.g. "SandWorldHomeStage". */
  homeStageOf(kingdomName: string): string | undefined {
    return this.groups.find((g) => g.group === kingdomName)?.stages[0]?.[0];
  }

  /** The side areas of a kingdom (game world index) the save can list as visited, as stage names. */
  visitable(kingdom: number): { stage: string; name: string }[] {
    return VISIT_STAGES.filter(([k]) => k === kingdom).map(([, stage]) => ({ stage, name: this.nameOf(stage) }));
  }

  /** The name of a stage as listed in the stage menu; the internal name if it is not there. */
  nameOf(stage: string): string {
    for (const group of this.groups) for (const [id, name] of group.stages) if (id === stage) return name;
    return stage;
  }
}
