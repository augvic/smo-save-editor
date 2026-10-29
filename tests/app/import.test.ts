// Copying parts of another save: only what was asked for, only what differs.
import assert from "node:assert/strict";
import { test } from "node:test";

import { SaveImport } from "../../smo_save_editor/app/actions/save_import/index.ts";
import { CoinCatalog } from "../../smo_save_editor/app/game_data/coin_catalog/index.ts";
import { MoonCatalog } from "../../smo_save_editor/app/game_data/moon_catalog/index.ts";
import { Worlds } from "../../smo_save_editor/app/game_data/worlds/index.ts";
import type { Edit, Json, Kind } from "../../smo_save_editor/app/save_schema/index.ts";
import type { SaveStore } from "../../smo_save_editor/app/save_store/index.ts";

const worlds = new Worlds();

class TreeStore {
  tree: Json;
  constructor(tree: Json) { this.tree = tree; }
  get<T>(_kind: Kind, path: string): T {
    let node: unknown = this.tree;
    for (const key of path.split("/").filter(Boolean)) node = (node as Record<string, unknown>)?.[key];
    return node as T;
  }
  async edit(_kind: Kind, edits: Edit[]): Promise<boolean> {
    for (const [path, value] of edits) {
      const keys = path.split("/").filter(Boolean);
      const last = keys.pop() as string;
      let node = this.tree as Record<string, unknown>;
      for (const key of keys) node = node[key] as Record<string, unknown>;
      node[last] = value;
    }
    return true;
  }
}

const save = (iDone: boolean, pay: number): Json => ({
  ShineData: [{ UniqueId: 205, IsGet: iDone, Status: 0 }, { UniqueId: 496, IsGet: iDone, Status: 0 }],
  WorldInfo: Array.from({ length: 17 }, () => ({ PayShineNum: pay, ShopShine: 0, MainShineNo: -1, UseCoinCollectNum: 0 })),
  GetCoinCollectData: [{ UniqueId: 1021, IsGet: iDone }],
  ItemCap: ["Mario", iDone ? "MarioPoncho" : ""],
  CollectBgmList: iDone ? [{ BgmResourceName: "StmRsBgmHat", IsCollected: true }] : [],
});

const importer = (mine: Json) => new SaveImport(new TreeStore(mine) as unknown as SaveStore, worlds, new CoinCatalog(), new MoonCatalog());

test("moons are copied only for the chosen kingdoms, with that kingdom's totals", () => {
  const edits = new Map(importer(save(false, 0)).edits("moons", save(true, 9), [worlds.ids.sand]));
  assert.equal(edits.get("/ShineData/1/IsGet"), true);              // Sand moon 496
  assert.equal(edits.has("/ShineData/0/IsGet"), false);             // Cascade moon 205 was not asked for
  assert.equal(edits.get(`/WorldInfo/${worlds.ids.sand}/PayShineNum`), 9);
  assert.equal(edits.has(`/WorldInfo/${worlds.ids.cascade}/PayShineNum`), false);
});

test("what is the same is not an edit", () => {
  assert.deepEqual(importer(save(true, 9)).edits("moons", save(true, 9), [worlds.ids.sand, worlds.ids.cascade]), []);
});

test("purple coins by kingdom, lists slot by slot, and a list that grows is replaced whole", () => {
  const sand = new Map(importer(save(false, 0)).edits("coins", save(true, 0), [worlds.ids.sand]));
  assert.equal(sand.get("/GetCoinCollectData/0/IsGet"), true);
  assert.deepEqual(importer(save(false, 0)).edits("coins", save(true, 0), [worlds.ids.cascade]), []);

  assert.deepEqual(importer(save(false, 0)).edits("wardrobe", save(true, 0)), [["/ItemCap/1", "MarioPoncho"]]);
  assert.deepEqual(importer(save(false, 0)).edits("music", save(true, 0)), [["/CollectBgmList", [{ BgmResourceName: "StmRsBgmHat", IsCollected: true }]]]);
});
