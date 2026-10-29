// The expected numbers below come from a save made with this editor (Sand Kingdom done, the next one
// unlocked) that the game then loaded and saved again without changing them. That shows the game accepts
// these values; it is NOT proof that the game would write the same ones by itself. The Odyssey level
// (2 on arriving in the Wooded Kingdom) is not from that save: it follows what was seen playing, and
// the game's upHomeLevel table.
import assert from "node:assert/strict";
import { test } from "node:test";

import { MoonCatalog } from "../../smo_save_editor/app/game_data/moon_catalog/index.ts";
import { ScenarioCatalog } from "../../smo_save_editor/app/game_data/scenario_catalog/index.ts";
import { StoryCatalog } from "../../smo_save_editor/app/game_data/story_catalog/index.ts";
import { Worlds } from "../../smo_save_editor/app/game_data/worlds/index.ts";
import { OdysseyRules } from "../../smo_save_editor/app/rules/odyssey_rules/index.ts";
import { ProgressPlanner } from "../../smo_save_editor/app/rules/progress_planner/index.ts";
import type { Context } from "../../smo_save_editor/app/rules/progress_planner/index.ts";
import { StoryRules } from "../../smo_save_editor/app/rules/story_rules/index.ts";
import { UnlockRules } from "../../smo_save_editor/app/rules/unlock_rules/index.ts";

const worlds = new Worlds();
const unlockRules = new UnlockRules(worlds);
const planner = new ProgressPlanner(worlds, unlockRules, new OdysseyRules(worlds), new StoryRules(new ScenarioCatalog(), new StoryCatalog(new MoonCatalog())));

/** WorldInfo[i].MainShineNo as a save in the Sand Kingdom has it: 0 for visited kingdoms and for Metro, -1 otherwise. */
/** `unlocked` for a save where the first `count` kingdoms are open. */
const worlds_unlocked = (count: number) => Array.from({ length: 17 }, (_, world) => world < count);
const realMainScenario = [0, 0, 0, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1];
const realContext: Context = { homeStatus: 2, waterfall: 2, cascadeHasMoon: true, mainScenario: realMainScenario, scenario: new Array<number>(17).fill(1), unlocked: worlds_unlocked(3) };

test("unlocking the kingdom after Sand gives the numbers a game-accepted save had", () => {
  const afterSand = unlockRules.unlock(worlds.ids.wooded, { num: 3, first: 0, second: 0 });
  const edits = new Map(planner.editsFor(afterSand, realContext));

  assert.equal(edits.get("/GameProgressData/UnlockWorldNum"), 4);
  assert.equal(edits.get("/GameProgressData/UnlockWorldStatusFirstBranch"), 1);
  assert.equal(edits.get("/GameProgressData/UnlockWorldStatusSecondBranch"), 0);
  assert.equal(edits.get("/GameProgressData/HomeLevel"), 2);
  assert.equal(edits.get("/GameProgressData/HomeStatus"), 2);
  assert.equal(edits.get("/GameProgressData/WaterfallWorldProgress"), 2);

  for (let world = 0; world < worlds.count; world++) {
    const open = world < 4;
    // the kingdom just unlocked (3) has not been entered yet, so it is still pending like the locked ones
    assert.equal(edits.get(`/GameProgressData/IsFirstTimeWorld/${world}`), world >= 3, `first visit of world ${world}`);
    assert.equal(edits.get(`/WorldInfo/${world}/UnlockedWorldId`), open ? world : -1, `map position of world ${world}`);
  }
});

test("a kingdom that was just unlocked starts the way the game has it before the first visit", () => {
  const afterSand = unlockRules.unlock(worlds.ids.wooded, { num: 3, first: 0, second: 0 });
  const edits = new Map(planner.editsFor(afterSand, realContext));
  const w = worlds.ids.wooded;
  assert.equal(edits.get(`/WorldInfo/${w}/MainShineNo`), -1);       // not reached
  assert.equal(edits.get(`/WorldInfo/${w}/ScenarioNo`), 1);          // start
  assert.equal(edits.get(`/GameProgressData/IsFirstTimeWorld/${w}`), true);
});

test("a kingdom that is already open and visited keeps its state; Metro's 0 while locked is left alone", () => {
  const visited = { ...realContext, unlocked: worlds_unlocked(4), mainScenario: realMainScenario.map((v, world) => (world === 3 ? 0 : v)) };
  const edits = new Map(planner.editsFor({ num: 4, first: 1, second: 0 }, visited));
  assert.equal(edits.has(`/WorldInfo/3/MainShineNo`), false);
  assert.equal(edits.has(`/WorldInfo/3/ScenarioNo`), false);
  assert.equal(edits.get(`/GameProgressData/IsFirstTimeWorld/3`), false);
  assert.equal(edits.has(`/WorldInfo/${worlds.ids.metro}/MainShineNo`), false);
});

test("the Cap Kingdom is never pending: the game starts there", () => {
  const edits = new Map(planner.editsFor({ num: 1, first: 0, second: 0 }, { ...realContext, unlocked: worlds_unlocked(0) }));
  assert.equal(edits.get("/GameProgressData/IsFirstTimeWorld/0"), false);
});

test("unlocking the kingdom after Sand marks the kingdoms before it as done: Main scenario and Current scenario", () => {
  const afterSand = unlockRules.unlock(worlds.ids.wooded, { num: 3, first: 0, second: 0 });
  const edits = new Map(planner.editsFor(afterSand, realContext));
  assert.equal(edits.get("/WorldInfo/2/MainShineNo"), 4);
  assert.equal(edits.get("/WorldInfo/2/ScenarioNo"), 3);
  assert.equal(edits.get("/WorldInfo/1/MainShineNo"), 2);
  assert.equal(edits.get("/WorldInfo/1/ScenarioNo"), 2);
  assert.equal(edits.get("/WorldInfo/0/MainShineNo"), 2);
  assert.equal(edits.get("/WorldInfo/3/ScenarioNo"), 1);   // the new kingdom starts at 1, not as a done one
});

test("a kingdom already past what a finished story shows is not lowered", () => {
  const past = { ...realContext, mainScenario: realMainScenario.map((v, w) => (w === 2 ? 4 : v)), scenario: realContext.scenario.map((v, w) => (w === 2 ? 4 : v)) };
  const edits = new Map(planner.editsFor(unlockRules.unlock(worlds.ids.wooded, { num: 3, first: 0, second: 0 }), past));
  assert.equal(edits.has("/WorldInfo/2/MainShineNo"), false);
  assert.equal(edits.has("/WorldInfo/2/ScenarioNo"), false);
});

test("locking a kingdom that was visited puts its Main scenario back to -1", () => {
  const visited = realMainScenario.map((value, world) => (world === worlds.ids.lake ? 0 : value));
  const locking = planner.editsFor({ num: 4, first: 1, second: 0 }, { ...realContext, mainScenario: visited });
  assert.ok(locking.some(([path, value]) => path === `/WorldInfo/${worlds.ids.lake}/MainShineNo` && value === -1));
});

// ---------------------------------------------------------------------------------------------
// Numbers below were written by the game itself: a finished game (17 kingdoms, played Lake before
// Wooded and Snow before Seaside), read from a published set of save files.
// ---------------------------------------------------------------------------------------------

test("a finished game, with Lake and Snow reached first, has the numbers the game itself wrote", () => {
  const finishedContext: Context = { homeStatus: 7, waterfall: 2, cascadeHasMoon: true, mainScenario: new Array<number>(17).fill(0), scenario: new Array<number>(17).fill(1), unlocked: worlds_unlocked(0) };
  const edits = new Map(planner.editsFor({ num: 17, first: 2, second: 4 }, finishedContext));

  assert.equal(edits.get("/GameProgressData/UnlockWorldNum"), 17);
  assert.equal(edits.get("/GameProgressData/UnlockWorldStatusFirstBranch"), 2);
  assert.equal(edits.get("/GameProgressData/UnlockWorldStatusSecondBranch"), 4);
  assert.equal(edits.get("/GameProgressData/HomeLevel"), 9);
  assert.equal(edits.get("/GameProgressData/HomeStatus"), 7);
  assert.equal(edits.get("/GameProgressData/WaterfallWorldProgress"), 2);

  const mapPositions = [0, 1, 2, 4, 3, 5, 6, 7, 9, 8, 10, 11, 12, 13, 14, 15, 16];
  mapPositions.forEach((position, world) => {
    assert.equal(edits.get(`/WorldInfo/${world}/UnlockedWorldId`), position, `map position of world ${world}`);
    // every kingdom was left except the last one, which is still to be visited
    assert.equal(edits.get(`/GameProgressData/IsFirstTimeWorld/${world}`), world === 16, `first visit of world ${world}`);
  });
});

test("moving past the Cap Kingdom gives Mario his cap back, and a fresh save does not", () => {
  const fresh = new Map(planner.editsFor({ num: 1, first: 0, second: 0 }, { ...realContext, mainScenario: [0, ...realMainScenario.slice(1)] }));
  assert.equal(fresh.has("/IsEnableCap"), false);

  const moved = new Map(planner.editsFor(unlockRules.unlock(worlds.ids.sand, { num: 1, first: 0, second: 0 }), realContext));
  assert.equal(moved.get("/IsEnableCap"), true);
});
