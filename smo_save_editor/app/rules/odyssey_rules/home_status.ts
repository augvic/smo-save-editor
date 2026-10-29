// HomeStatus values, from GameProgressData::HomeStatus in the game's code, by number.
// Constants, so a file inside the `odyssey_rules` folder rather than a component.

export const HOME_STATUS = [
  "None",
  "Odyssey activated",
  "Odyssey launched",
  "Found Bowser",
  "Odyssey crashed",
  "Odyssey repaired",
  "Attacked by the boss",
  "Repaired after the boss",
] as const;
