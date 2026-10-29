// The game's own data: kingdoms, moons, stages, wardrobe items, purple coins.
//
// A container: it only exposes its children.

export { AchievementCatalog } from "./achievement_catalog/index.ts";
export { CaptureCatalog } from "./capture_catalog/index.ts";
export { CheckpointCatalog } from "./checkpoint_catalog/index.ts";
export type { CheckpointInfo } from "./checkpoint_catalog/index.ts";
export { CoinCatalog } from "./coin_catalog/index.ts";
export { LeaveCatalog } from "./leave_catalog/index.ts";
export type { LeaveRequirement } from "./leave_catalog/index.ts";
export { MOON_KIND_LABELS, MoonCatalog } from "./moon_catalog/index.ts";
export { StoryCatalog } from "./story_catalog/index.ts";
export { ScenarioCatalog } from "./scenario_catalog/index.ts";
export type { ScenarioOption } from "./scenario_catalog/index.ts";
export { ShopCatalog } from "./shop_catalog/index.ts";
export type { ShopPrice } from "./shop_catalog/index.ts";
export { MusicCatalog } from "./music_catalog/index.ts";
export type { MusicTrack } from "./music_catalog/index.ts";
export { StageCatalog } from "./stage_catalog/index.ts";
export type { StageGroup } from "./stage_catalog/index.ts";
export { WardrobeCatalog } from "./wardrobe_catalog/index.ts";
export type { WardrobeEntry, WardrobeListPath } from "./wardrobe_catalog/index.ts";
export { Worlds } from "./worlds/index.ts";
