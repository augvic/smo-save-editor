// Power Moon names and kingdoms, by the UniqueId the save stores.

import { MOON_TRAITS } from "./moon_traits.ts";
import { MOON_KINDS } from "./moon_kinds.ts";
import { MOON_SCENARIOS } from "./moon_scenarios.ts";
import { MOONS } from "./moons.ts";
import { SHOP_MOONS } from "./shop_moons.ts";

const SHOP_MOON_IDS = new Set(SHOP_MOONS);
const TRAITS = new Map<number, readonly [multi: number, achievement: number, moonRock: number]>(MOON_TRAITS.map(([id, ...t]) => [id, t as [number, number, number]]));
const KIND_OF = new Map<number, string>(MOON_KINDS);
const SCENARIO_MASKS = new Map<number, number>(MOON_SCENARIOS);

/** The kinds of moon the editor can tell apart, with their names. */
export const MOON_KIND_LABELS: Readonly<Record<string, string>> = {
  twod: "2D moon",
  treasure: "Treasure chest",
  music: "Music notes",
  timer: "Timer challenge",
  toad: "Captain Toad",
  peach: "Princess Peach traveling",
  sheep: "Sheep",
  goombette: "Goombette",
  seed: "Seed",
  rabbit: "Rabbit",
  dig: "Dig spot",
  caphanger: "Cap hanger",
  hintphoto: "Hint photo",
  hideseek: "Hide and seek (Bonneter)",
  shards: "Moon shards",
};

export class MoonCatalog {
  /** The moon's name, or undefined for an ID the catalog does not list. */
  name(uniqueId: number): string | undefined {
    return MOONS[uniqueId]?.[0];
  }

  /** The moon's kingdom (game world index), or undefined for an ID the catalog does not list. */
  kingdom(uniqueId: number): number | undefined {
    return MOONS[uniqueId]?.[1];
  }

  /** Whether the moon is the one a Crazy Cap shop hands out when bought. */
  isShopMoon(uniqueId: number): boolean {
    return SHOP_MOON_IDS.has(uniqueId);
  }

  /** The scenarios of its kingdom a moon can be found in (1, 2, ...); undefined if it is in every scenario. */
  scenarios(uniqueId: number): number[] | undefined {
    const mask = SCENARIO_MASKS.get(uniqueId);
    if (mask === undefined) return undefined;
    return Array.from({ length: 32 }, (_, bit) => bit + 1).filter((scenario) => (mask >> (scenario - 1)) & 1);
  }

  /** A Multi Moon (worth 3 in the Moon total). */
  isMultiMoon(uniqueId: number): boolean {
    return TRAITS.get(uniqueId)?.[0] === 1;
  }

  /** A moon that only appears once the kingdom's Moon Rock is open. */
  isMoonRockMoon(uniqueId: number): boolean {
    return TRAITS.get(uniqueId)?.[2] === 1;
  }

  /** How the moon is found (a key of MOON_KIND_LABELS); undefined if it is none of the named kinds. */
  kind(uniqueId: number): string | undefined {
    return KIND_OF.get(uniqueId);
  }

  /** The moons of a kind, by UniqueId. */
  ofKind(kind: string): number[] {
    return MOON_KINDS.filter(([, k]) => k === kind).map(([id]) => id);
  }
}
