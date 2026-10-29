// Which kingdom each purple coin belongs to, from the game's own data.

import { COIN_RANGES } from "./purple_coins.ts";

export class CoinCatalog {
  /** The kingdom (game world index) of a purple coin, or undefined for an ID the game does not list. */
  kingdomOf(uniqueId: number): number | undefined {
    return COIN_RANGES.find(([first, last]) => uniqueId >= first && uniqueId <= last)?.[2];
  }
}
