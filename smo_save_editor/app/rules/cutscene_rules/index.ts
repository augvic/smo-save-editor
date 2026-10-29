// Which of a kingdom's camera cutscenes the game still has to play. The save keeps them as "still to play" flags:
// on until the game has played the cutscene once.
//
// Only what is certain is a rule. A kingdom that has not been entered (Main scenario -1) has played none of them. Once
// it is entered, its intro has played. Which scenario starts have played in between is not a rule: they play when Mario
// arrives in the kingdom at that scenario, so a kingdom can be at scenario 7 with the starts of 3 and 4 never played.

import type { Edit } from "../../save_schema/index.ts";

export class CutsceneRules {
  /** The intro of a kingdom plays when Mario first enters it, so it is still to play only while Main scenario is -1 (not reached). */
  introPending(main: number): boolean {
    return main < 0;
  }

  /**
   * The edits that bring a kingdom's cutscene flags in line with its Main scenario: not reached means the intro and every
   * scenario start are still to play; reached means the intro has played, and the starts are left as they are.
   */
  edits(world: number, main: number, slots: number): Edit[] {
    const base = `/SequenceDemoSkipData/WorldData/${world}`;
    const starts = main < 0 ? Array.from({ length: slots }, (_, i): Edit => [`${base}/IsFirstScenarioStartCamera/${i}`, true]) : [];
    return [[`${base}/IsFirstWorldIntroCamera`, this.introPending(main)], ...starts];
  }

  /** Arriving in a kingdom at a scenario plays the start of that scenario. */
  arrival(world: number, scenario: number, slots: number): Edit[] {
    return scenario >= 1 && scenario <= slots ? [[`/SequenceDemoSkipData/WorldData/${world}/IsFirstScenarioStartCamera/${scenario - 1}`, false]] : [];
  }
}
