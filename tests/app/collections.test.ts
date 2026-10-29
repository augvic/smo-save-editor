// Captures, checkpoints and achievement goals: the game's own lists, and writing them into the fixed slots of a save.
import assert from "node:assert/strict";
import { test } from "node:test";

import { AchievementCatalog } from "../../smo_save_editor/app/game_data/achievement_catalog/index.ts";
import { CaptureCatalog } from "../../smo_save_editor/app/game_data/capture_catalog/index.ts";
import { CheckpointCatalog } from "../../smo_save_editor/app/game_data/checkpoint_catalog/index.ts";
import { Worlds } from "../../smo_save_editor/app/game_data/worlds/index.ts";
import { MoonCatalog } from "../../smo_save_editor/app/game_data/moon_catalog/index.ts";
import { MusicCatalog } from "../../smo_save_editor/app/game_data/music_catalog/index.ts";
import { StageCatalog } from "../../smo_save_editor/app/game_data/stage_catalog/index.ts";
import { MusicLedger } from "../../smo_save_editor/app/ledgers/music_ledger/index.ts";
import { VisitLedger } from "../../smo_save_editor/app/ledgers/visit_ledger/index.ts";
import { RaceTime } from "../../smo_save_editor/app/rules/race_time/index.ts";
import { CaptureLedger } from "../../smo_save_editor/app/ledgers/capture_ledger/index.ts";
import { CheckpointLedger } from "../../smo_save_editor/app/ledgers/checkpoint_ledger/index.ts";
import type { Edit, Kind } from "../../smo_save_editor/app/save_schema/index.ts";
import type { SaveStore } from "../../smo_save_editor/app/save_store/index.ts";

const worlds = new Worlds();

class FakeStore {
  data: Record<string, unknown[]> = {
    "/CollectBgmList": [],
    "/VisitStageData": [],
    "/HackDictionary": new Array<string>(4).fill(""),
    "/Checkpoint": Array.from({ length: 4 }, () => ({ StageName: "", ObjId: "" })),
  };
  get<T>(_kind: Kind, path: string): T {
    return this.data[path] as T;
  }
  async edit(_kind: Kind, edits: Edit[]): Promise<boolean> {
    for (const [path, value] of edits) {
      const [, root, index, field] = path.split("/");
      if (index === undefined) { this.data[`/${root}`] = value as unknown[]; continue; }
      const list = this.data[`/${root}`] as unknown[];
      if (field) (list[Number(index)] as Record<string, unknown>)[field] = value;
      else list[Number(index)] = value;
    }
    return true;
  }
}

test("the game lists 85 checkpoints, 52 captures, and the achievements that count something", () => {
  const checkpoints = new CheckpointCatalog();
  let total = 0;
  for (let world = 0; world < worlds.count; world++) total += checkpoints.of(world).length;
  assert.equal(total, 85);
  assert.equal(new CaptureCatalog().names().length, 52);
  assert.equal(new AchievementCatalog().goal("Shine_Gather_1"), 100);
  assert.equal(new AchievementCatalog().goal("Scenario_Ending"), undefined);
});

test("captures are written packed into the first slots and removed again, keeping the rest", async () => {
  const fake = new FakeStore();
  const ledger = new CaptureLedger(fake as unknown as SaveStore, new CaptureCatalog());
  assert.equal(await ledger.set(["Frog", "Tank"], true), true);
  assert.deepEqual(fake.data["/HackDictionary"], ["Frog", "Tank", "", ""]);
  await ledger.set(["Frog"], false);
  assert.deepEqual(fake.data["/HackDictionary"], ["Tank", "", "", ""]);
  assert.equal(await ledger.set(["A", "B", "C", "D"], true), false);     // more than the slots hold: refused
  assert.deepEqual([...ledger.owned()], ["Tank"]);
});

test("checkpoints are written as stage and object, and read back by key", async () => {
  const fake = new FakeStore();
  const ledger = new CheckpointLedger(fake as unknown as SaveStore);
  const [first] = new CheckpointCatalog().of(worlds.ids.sand);
  const key = CheckpointLedger.key(first.stage, first.obj);
  await ledger.set([key], true);
  assert.deepEqual(fake.data["/Checkpoint"][0], { StageName: first.stage, ObjId: first.obj });
  assert.equal(ledger.reached().has(key), true);
  await ledger.set([key], false);
  assert.equal(ledger.reached().size, 0);
});

test("the game names its captures, achievements and music, and lists the tracks of its jukebox", () => {
  assert.equal(new CaptureCatalog().label("Wanwan"), "Chain Chomp");
  assert.equal(new AchievementCatalog().title("Shine_CollectBgm"), "Music Maestro");
  assert.match(new AchievementCatalog().hint("Shine_CollectBgm"), /music that Toad/);
  assert.equal(new MusicCatalog().tracks().length, 65);          // 82 jukebox entries share 65 names
  assert.equal(new MusicCatalog().variants("StmRsBgmForest"), 3);
});

test("marking a track adds its entry to the list; unmarking only turns it off", async () => {
  const fake = new FakeStore();
  const ledger = new MusicLedger(fake as unknown as SaveStore, new MusicCatalog());
  await ledger.set(["StmRsBgmHat", "StmRsBgmFall"], true);
  assert.deepEqual(fake.data["/CollectBgmList"], [
    { BgmResourceName: "StmRsBgmFall", IsCollected: true },          // two entries share this name
    { BgmResourceName: "StmRsBgmFall", IsCollected: true },
    { BgmResourceName: "StmRsBgmHat", IsCollected: true },
  ]);
  await ledger.set(["StmRsBgmFall"], false);
  assert.deepEqual([...ledger.collected()], ["StmRsBgmHat"]);
  assert.equal((fake.data["/CollectBgmList"] as unknown[]).length, 3);
});

test("side areas: visited stages are added and removed, others kept", async () => {
  const fake = new FakeStore();
  fake.data["/VisitStageData"] = ["SomeOtherStage"];
  const ledger = new VisitLedger(fake as unknown as SaveStore);
  const sand = new StageCatalog().visitable(2);
  assert.ok(sand.length > 0 && sand.some((s) => s.stage === "SandWorldKillerExStage"));
  await ledger.set(["SandWorldKillerExStage"], true);
  assert.deepEqual(fake.data["/VisitStageData"], ["SomeOtherStage", "SandWorldKillerExStage"]);
  await ledger.set(["SandWorldKillerExStage"], false);
  assert.deepEqual(fake.data["/VisitStageData"], ["SomeOtherStage"]);
});

test("race times: hundredths of a second as m:ss.cc, and back", () => {
  assert.equal(RaceTime.format(6150), "1:01.50");
  assert.equal(RaceTime.format(RaceTime.NONE), "59:59.99");
  assert.equal(RaceTime.parse("1:01.50"), 6150);
  assert.equal(RaceTime.parse("61.5"), 6150);
  assert.equal(RaceTime.parse("61"), 6100);
  assert.equal(RaceTime.parse("abc"), undefined);
});

test("each achievement that counts a kind of moon has at least as many moons of it as it asks for", () => {
  const catalog = new AchievementCatalog();
  const moons = new MoonCatalog();
  for (const [name, goal] of [["Shine_TreasureBox_2", 25], ["Shine_DigPoint_2", 45], ["Shine_MusicNote_2", 20], ["Shine_TimerAthretic_2", 25], ["Shine_Shine2D_2", 20], ["Shine_HintPhoto_2", 15], ["Shine_Rabbit_2", 10], ["Shine_Seed_2", 10]] as const) {
    const kind = catalog.moonKind(name) as string;
    assert.ok(kind, name);
    assert.ok(moons.ofKind(kind).length >= goal, `${name}: ${moons.ofKind(kind).length} < ${goal}`);
    assert.equal(catalog.goal(name), goal);
  }
  assert.equal(catalog.moonKind("Shine_Gather_1"), undefined);
});
