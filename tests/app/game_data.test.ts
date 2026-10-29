// Facts read from the game's own data (SystemData/WorldList), and one observation made in the game.
import assert from "node:assert/strict";
import { test } from "node:test";

import { CoinCatalog } from "../../smo_save_editor/app/game_data/coin_catalog/index.ts";
import { MoonCatalog } from "../../smo_save_editor/app/game_data/moon_catalog/index.ts";
import { ScenarioCatalog } from "../../smo_save_editor/app/game_data/scenario_catalog/index.ts";
import { StoryCatalog } from "../../smo_save_editor/app/game_data/story_catalog/index.ts";
import { StoryRules } from "../../smo_save_editor/app/rules/story_rules/index.ts";
import { Worlds } from "../../smo_save_editor/app/game_data/worlds/index.ts";

const worlds = new Worlds();
const coins = new CoinCatalog();
const scenarios = new ScenarioCatalog();
const story = new StoryCatalog(new MoonCatalog());

test("every kingdom has the number of purple coins the game says (CollectCoinNum)", () => {
  const perKingdom = new Array<number>(worlds.count).fill(0);
  for (let id = 1000; id <= 2100; id++) {
    const kingdom = coins.kingdomOf(id);
    if (kingdom !== undefined) perKingdom[kingdom]++;
  }
  assert.deepEqual(perKingdom, [50, 50, 100, 100, 50, 0, 50, 100, 100, 50, 100, 0, 100, 50, 100, 0, 0]);
  assert.equal(perKingdom.reduce((a, b) => a + b, 0), 1000);
});

test("IDs the game does not list belong to no kingdom", () => {
  assert.equal(coins.kingdomOf(1033), undefined); // a gap in the numbering
  assert.equal(coins.kingdomOf(2042), undefined); // UniqueIdMax
  assert.equal(coins.kingdomOf(0), undefined);
});

test("purple coins are not grouped by ID blocks: the first one is in the Sand Kingdom, not the Cap Kingdom", () => {
  assert.equal(coins.kingdomOf(1021), worlds.ids.sand);
});

test("what was observed in the game: 1189 to 1192 are Sand coins, and their neighbours are not", () => {
  for (const id of [1189, 1190, 1191, 1192]) assert.equal(coins.kingdomOf(id), worlds.ids.sand, `coin ${id}`);
  assert.equal(coins.kingdomOf(1188), worlds.ids.metro);
  assert.equal(coins.kingdomOf(1193), worlds.ids.moon);
});

test("the Sand Kingdom has 7 scenarios; 3 is the cleared story and 4 the one after the ending (both seen in game)", () => {
  const options = scenarios.options(worlds.ids.sand);
  assert.equal(options.length, 7);
  assert.equal(options[0].label, "1 — start");
  assert.equal(options[2].label, "3 — story cleared");
  assert.equal(options[3].label, "4 — after the ending");
  assert.equal(options[4].label, "5 — Moon Rock open");
  assert.equal(options[5].label, "6 — Balloon World");
});

test("a kingdom with no Balloon World has no such label, and an unknown kingdom has no scenarios", () => {
  assert.ok(!scenarios.options(worlds.ids.cloud).some((o) => o.label.includes("Balloon")));
  assert.deepEqual(scenarios.options(99), []);
});

test("Sand Main scenario: 0 is the tower and 4 is the story done (the objective seen in game)", () => {
  const options = story.options(worlds.ids.sand);
  assert.deepEqual(options.map((o) => o.value), [-1, 0, 1, 2, 3, 4]);
  assert.equal(options[1].label, "0 — next: Atop the Highest Tower");
  assert.equal(options[5].label, "4 — story done, on to the next kingdom");
});

test("Main scenario with several moons for one step, and kingdoms the game lists no story moons for", () => {
  assert.match(story.options(worlds.ids.seaside)[1].label, /\(or 3 more\)$/);
  assert.equal(story.options(worlds.ids.cap)[1].label, "0 — story step");
  assert.equal(story.options(worlds.ids.lost)[1]?.label, "0 — no story sequence");
});

test("every story moon of the game is a moon of its kingdom in the catalog", () => {
  for (const world of Object.values(worlds.ids)) {
    const done = story.finishedMainScenario(world) ?? 0;
    for (let step = 0; step < done; step++) for (const n of story.objectives(world, step)) assert.ok(!/^Moon \d+$/.test(n), n);
  }
});

test("Main scenario and Current scenario go together as the game's MainQuestInfo says (Sand: 4 steps done is scenario 3)", () => {
  const rules = new StoryRules(scenarios, story);
  assert.equal(rules.mainFor(worlds.ids.sand, 3), 4);
  assert.equal(rules.mainFor(worlds.ids.sand, 2), 3);
  assert.equal(rules.scenarioFor(worlds.ids.sand, 4), 3);
  assert.equal(rules.scenarioFor(worlds.ids.sand, 3), 2);
  assert.equal(rules.scenarioFor(worlds.ids.sand, 1), 1);
  assert.equal(rules.doneScenario(worlds.ids.cascade), 2);
  assert.equal(rules.doneScenario(worlds.ids.metro), 4);
});

test("the 13 shop moons of the game are the moons the catalog names 'Shopping …'", () => {
  const catalog = new MoonCatalog();
  const named = Array.from({ length: 1300 }, (_, id) => id).filter((id) => catalog.name(id)?.startsWith("Shopping"));
  assert.equal(named.length, 13);
  for (const id of named) assert.equal(catalog.isShopMoon(id), true, String(id));
});

test("ProgressBitFlag: the moons of the Wooded Kingdom's second scenario, and moons that are not listed", () => {
  const catalog = new MoonCatalog();
  assert.deepEqual(catalog.scenarios(181), [2]);                    // Defend the Secret Flower Field!
  assert.deepEqual(catalog.scenarios(205), [1, 2, 3, 4, 7]);        // Our First Power Moon (Cascade)
  assert.deepEqual(catalog.scenarios(497), [1, 2, 3, 4, 5]);       // Atop the Highest Tower (Sand): not in the balloon scenarios
  assert.equal(catalog.scenarios(999999), undefined);                // a moon not listed is in every scenario
});
