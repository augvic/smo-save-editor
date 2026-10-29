// Kingdom names by the game's world index: WorldInfo[i], WorldId, IsFirstTimeWorld[i] and the
// kingdom numbers used in the other data files all use this order.
//
// Source: the game's own code, `GameDataFunction::getWorldIndexForest()` and friends, from
// https://github.com/MonsterDruide1/OdysseyDecomp (src/System/GameDataFunction.cpp). Note that
// Wooded comes before Lake, and Seaside before Snow.
export const WORLD_NAMES = [
  "Cap Kingdom",
  "Cascade Kingdom",
  "Sand Kingdom",
  "Wooded Kingdom",
  "Lake Kingdom",
  "Cloud Kingdom",
  "Lost Kingdom",
  "Metro Kingdom",
  "Seaside Kingdom",
  "Snow Kingdom",
  "Luncheon Kingdom",
  "Ruined Kingdom",
  "Bowser's Kingdom",
  "Moon Kingdom",
  "Mushroom Kingdom",
  "Dark Side",
  "Darker Side",
];

/** World indices that the unlock logic treats specially. */
export const WORLD = {
  cap: 0,
  cascade: 1,
  sand: 2,
  wooded: 3,
  lake: 4,
  cloud: 5,
  lost: 6,
  metro: 7,
  seaside: 8,
  snow: 9,
  luncheon: 10,
  ruined: 11,
  bowsers: 12,
  moon: 13,
  mushroom: 14,
  darkSide: 15,
  darkerSide: 16,
} as const;
