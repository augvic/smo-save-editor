// WorldInfo[world].MainShineNo ("Main scenario") of each kingdom in a finished game, by game world
// index (see WORLD_NAMES). It counts the steps of the kingdom's story-moon sequence, and the in-game
// objective is the next step, so this is the value that says "the story of this kingdom is done".
//
// Source: 17 save files of one finished game written by the game itself
// (github.com/MysticExile/SuperMarioOdyssey-All-Kingdom-Saves), read with tools/byml_dump.py. All 17 carry the same WorldInfo. They are one player's finished game,
// so treat a value as "what it was there", not as a rule.
export const STORY_STEPS: readonly number[] = [2, 2, 4, 4, 1, 1, 0, 8, 2, 2, 5, 1, 4, 0, 1, 1, 1];

