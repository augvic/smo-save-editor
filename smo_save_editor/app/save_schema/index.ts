// The shapes of the data the editor works with: plain data carriers, no behavior.

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** "progress" is a save slot (File1.bin…); "common" is Common.bin. */
export type Kind = "progress" | "common";

/** One edit: the path of a value (e.g. "/ShineData/3/IsGet") and what to set it to. */
export type Edit = [path: string, value: Json];

/** What the backend returns when a save has been opened. */
export interface Loaded {
  kind: Kind;
  fileName: string;
  checksumOk: boolean;
  tree: Json;
}

/** An entry of ShineData: one Power Moon slot. */
export interface ShineEntry {
  UniqueId: number;
  IsGet: boolean;
  Status: number;
  HintStatus: number;
}

/** An entry of WorldInfo: the numbers kept for one kingdom, in the game's world order. */
export interface WorldInfoEntry {
  MainShineNo: number;
  ScenarioNo: number;
  UnlockedWorldId: number;
  PayShineNum: number;
  ShopShine: number;
  UseCoinCollectNum: number;
}

/** An entry of GetCoinCollectData: one purple coin. */
export interface CoinEntry {
  UniqueId: number;
  IsGet: boolean;
}

/** An entry of AchievementSaveData. */
export interface AchievementEntry {
  Name: string;
  IsGet: boolean;
}
