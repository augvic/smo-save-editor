// What the achievements are called, say and ask for, from the game's own texts and AchievementInfo.

import { ACHIEVEMENT_GOALS } from "./achievement_goals.ts";
import { ACHIEVEMENT_TEXTS } from "./achievement_names.ts";

/**
 * Which kind of moon an achievement counts (a key of MOON_KIND_LABELS). This is the editor's inference from the
 * achievement names and the totals (each kind has at least as many moons as the highest goal), not something the
 * game states.
 */
const COUNTS_KIND: readonly (readonly [prefix: string, kind: string])[] = [
  ["Shine_Shine2D_", "twod"], ["Shine_TreasureBox_", "treasure"], ["Shine_MusicNote_", "music"],
  ["Shine_TimerAthretic_", "timer"], ["Shine_CaptainKinopio_", "toad"], ["Shine_TravelingPeach_", "peach"],
  ["Shine_CollectAnimalAll", "sheep"], ["Shine_KuriboGirl", "goombette"], ["Shine_Seed_", "seed"], ["Shine_Rabbit_", "rabbit"],
  ["Shine_DigPoint_", "dig"], ["Shine_CapHanger_", "caphanger"], ["Shine_HintPhoto_", "hintphoto"],
  ["Shine_HideAndSeekCapMan", "hideseek"],
];

const GOALS = new Map<string, number>(ACHIEVEMENT_GOALS);
const TEXTS = new Map<string, readonly [name: string, hint: string]>(ACHIEVEMENT_TEXTS.map(([id, name, hint]) => [id, [name, hint]]));

export class AchievementCatalog {
  /** How many it takes ("Collect 100 moons" -> 100); undefined for an achievement that counts nothing. */
  goal(name: string): number | undefined {
    return GOALS.get(name);
  }

  /** The achievement's English name; undefined if the game has no text for it. */
  title(id: string): string | undefined {
    return TEXTS.get(id)?.[0];
  }

  /** What the game tells the player to do for it; "" if it says nothing. */
  hint(id: string): string {
    return TEXTS.get(id)?.[1] ?? "";
  }

  /** The kind of moon an achievement counts, if it counts one. */
  moonKind(name: string): string | undefined {
    return COUNTS_KIND.find(([prefix]) => name.startsWith(prefix))?.[1];
  }
}
