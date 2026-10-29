// The shop prices come from the game's own ItemList; the purse logic is checked on a small fake save.
import assert from "node:assert/strict";
import { test } from "node:test";

import { CoinCatalog } from "../../smo_save_editor/app/game_data/coin_catalog/index.ts";
import { LeaveCatalog } from "../../smo_save_editor/app/game_data/leave_catalog/index.ts";
import { ShopCatalog } from "../../smo_save_editor/app/game_data/shop_catalog/index.ts";
import { WardrobeCatalog } from "../../smo_save_editor/app/game_data/wardrobe_catalog/index.ts";
import type { WardrobeListPath } from "../../smo_save_editor/app/game_data/wardrobe_catalog/index.ts";
import { ScenarioCatalog } from "../../smo_save_editor/app/game_data/scenario_catalog/index.ts";
import { StoryCatalog } from "../../smo_save_editor/app/game_data/story_catalog/index.ts";
import { StoryRules } from "../../smo_save_editor/app/rules/story_rules/index.ts";
import { Worlds } from "../../smo_save_editor/app/game_data/worlds/index.ts";
import { ClearLockedShops } from "../../smo_save_editor/app/actions/clear_locked_shops/index.ts";
import { ClearLockedCoins } from "../../smo_save_editor/app/actions/clear_locked_coins/index.ts";
import type { UnlockState } from "../../smo_save_editor/app/actions/unlock_state/index.ts";
import type { Toaster } from "../../smo_save_editor/app/toaster/index.ts";
import { UnlockRules } from "../../smo_save_editor/app/rules/unlock_rules/index.ts";
import { MoonCatalog } from "../../smo_save_editor/app/game_data/moon_catalog/index.ts";
import { MoonLedger } from "../../smo_save_editor/app/ledgers/moon_ledger/index.ts";
import { CoinLedger } from "../../smo_save_editor/app/ledgers/coin_ledger/index.ts";
import { ShopLedger } from "../../smo_save_editor/app/ledgers/shop_ledger/index.ts";
import { WardrobeLedger } from "../../smo_save_editor/app/ledgers/wardrobe_ledger/index.ts";
import type { Edit, Kind } from "../../smo_save_editor/app/save_schema/index.ts";
import type { SaveStore } from "../../smo_save_editor/app/save_store/index.ts";

const worlds = new Worlds();
const shop = new ShopCatalog(worlds);
const wardrobeCatalog = new WardrobeCatalog();

test("in every kingdom the purple-coin items cost exactly the kingdom's coins (the old table was wrong)", () => {
  const coins = new CoinCatalog();
  const cost = new Array<number>(worlds.count).fill(0);
  const seen = new Set<string>();
  for (const { path } of wardrobeCatalog.lists) {
    for (const [id] of wardrobeCatalog.entries(path)) {
      const p = shop.price(path, id);
      if (p?.purple && !seen.has(`${path}/${id}`)) { seen.add(`${path}/${id}`); cost[p.shop] += p.price; }
    }
  }
  for (let world = 0; world < worlds.count; world++) {
    let have = 0;
    for (let id = 1000; id <= 2100; id++) if (coins.kingdomOf(id) === world) have++;
    if (have > 0) assert.equal(cost[world], have, worlds.name(world));
  }
});

test("Sand: the Sombrero costs 5, the souvenirs 25 and 5, and the shop kingdom is the one that sells it", () => {
  assert.equal(shop.describe("/ItemCap", "MarioPoncho"), "5 purple coins");
  assert.equal(shop.price("/ItemGift", "SouvenirSand1")?.price, 25);
  assert.equal(shop.price("/ItemGift", "SouvenirSand2")?.price, 5);
  assert.equal(shop.price("/ItemGift", "SouvenirSand1")?.shop, worlds.ids.sand);
});

test("ordinary-coin items say what they need", () => {
  assert.equal(shop.describe("/ItemCap", "MarioNew3DS"), "50 coins, after clearing Lake Kingdom");
  assert.equal(shop.describe("/ItemCloth", "MarioColorLuigi"), "200 coins, with 180 Power Moons");
  assert.equal(shop.describe("/ItemCap", "Mario"), "");
});

test("leaving a kingdom: the numbers of the game's StageLockList", () => {
  const leave = new LeaveCatalog();
  assert.deepEqual(leave.requirement(worlds.ids.cascade), { moons: 5, overall: false });
  assert.deepEqual(leave.requirement(worlds.ids.sand), { moons: 16, overall: false });
  assert.deepEqual(leave.requirement(worlds.ids.wooded), { moons: 16, overall: false });
  assert.deepEqual(leave.requirement(worlds.ids.lake), { moons: 8, overall: false });
  assert.deepEqual(leave.requirement(16), { moons: 500, overall: true });
});

/** A save with only what the purse reads: the owned lists, WorldInfo and the purple coins marked. */
class FakeStore {
  data: Record<string, unknown>;
  constructor(coinsInSand: number) {
    const coins = new CoinCatalog();
    const sandIds: number[] = [];
    for (let id = 1000; id <= 2100; id++) if (coins.kingdomOf(id) === worlds.ids.sand) sandIds.push(id);
    this.data = {
      "/ItemCap": ["Mario", "", "", "", "", ""], "/ItemCloth": ["Mario", "", "", "", "", ""],
      "/ItemGift": ["", "", "", "", "", ""], "/ItemSticker": ["", "", "", "", "", ""],
      "/WorldInfo": Array.from({ length: worlds.count }, () => ({ UseCoinCollectNum: 0, PayShineNum: 0, MainShineNo: -1 })),
      "/GetCoinCollectData": sandIds.map((UniqueId, i) => ({ UniqueId, IsGet: i < coinsInSand })),
    };
  }
  get<T>(_kind: Kind, path: string): T {
    let node: unknown = this.data;
    for (const part of path.split("/").filter(Boolean)) {
      node = (node as Record<string, unknown>)[part] ?? (this.data[`/${part}`] as unknown);
    }
    return node as T;
  }
  async edit(_kind: Kind, edits: Edit[]): Promise<boolean> {
    for (const [path, value] of edits) {
      const parts = path.split("/").filter(Boolean);
      let node = this.data[`/${parts[0]}`] as Record<string, unknown>;
      for (const part of parts.slice(1, -1)) node = node[part] as Record<string, unknown>;
      node[parts[parts.length - 1]] = value;
    }
    return true;
  }
}

function purse(coinsInSand: number) {
  const fake = new FakeStore(coinsInSand);
  const store = fake as unknown as SaveStore;
  const wardrobe = new WardrobeLedger(store, wardrobeCatalog);
  return { fake, purse: new ShopLedger(store, shop, new CoinLedger(store, new CoinCatalog()), wardrobe, new StoryRules(new ScenarioCatalog(), new StoryCatalog(new MoonCatalog())), worlds) };
}

test("with 7 Sand coins you can buy the 5-coin Sombrero but not the 25-coin souvenir", () => {
  const { purse: p } = purse(7);
  assert.equal(p.affordable("/ItemCap", "MarioPoncho"), true);
  assert.equal(p.affordable("/ItemGift", "SouvenirSand1"), false);
  assert.match(p.shortfall("/ItemGift", "SouvenirSand1"), /Needs 18 more purple coins/);
});

test("buying moves 'Purple coins spent' of that kingdom, and returning the item moves it back", async () => {
  const { fake, purse: p } = purse(30);
  await p.setNames("/ItemCap", ["Mario", "MarioPoncho", "MarioGunman"]);
  assert.equal((fake.data["/WorldInfo"] as { UseCoinCollectNum: number }[])[worlds.ids.sand].UseCoinCollectNum, 25);
  assert.equal(p.available(worlds.ids.sand), 5);
  await p.setNames("/ItemCap", ["Mario"]);
  assert.equal((fake.data["/WorldInfo"] as { UseCoinCollectNum: number }[])[worlds.ids.sand].UseCoinCollectNum, 0);
});

test("'Add all' only adds what the coins pay for", () => {
  const { purse: p } = purse(40);
  const wanted = ["SouvenirSand1", "SouvenirSand2"] as const;
  const path: WardrobeListPath = "/ItemGift";
  assert.deepEqual(p.affordableAdditions(path, wanted), ["SouvenirSand1", "SouvenirSand2"]);
  const { purse: poor } = purse(10);
  assert.deepEqual(poor.affordableAdditions(path, wanted), ["SouvenirSand2"]);
});

test("clearing coins in locked kingdoms leaves open kingdoms alone and keeps the coins that paid for items", async () => {
  const { fake, purse: p } = purse(30);       // 30 Sand coins marked
  await p.setNames("/ItemCap", ["Mario", "MarioPoncho", "MarioGunman"]);   // 25 spent in Sand
  const store = fake as unknown as SaveStore;
  const coins = new CoinLedger(store, new CoinCatalog());
  const messages: string[] = [];
  const toaster = { show: (m: string) => void messages.push(m) } as unknown as Toaster;
  const locked = (num: number) => ({ read: () => ({ num, first: 0, second: 0 }) }) as unknown as UnlockState;

  await new ClearLockedCoins(store, coins, p, new UnlockRules(worlds), locked(5), toaster).execute();   // Sand is open
  assert.equal(coins.stats(worlds.ids.sand)?.have, 30);
  assert.match(messages[messages.length - 1] ?? "", /No purple coins/);

  await new ClearLockedCoins(store, coins, p, new UnlockRules(worlds), locked(1), toaster).execute();   // Sand is locked
  assert.equal(coins.stats(worlds.ids.sand)?.have, 25);
});

test("clearing items in locked kingdoms takes back what a locked shop sold and zeroes its coins spent", async () => {
  const { fake, purse: p } = purse(30);
  await p.setNames("/ItemCap", ["Mario", "MarioPoncho", "MarioGunman"]);   // two Sand items, 25 spent
  const store = fake as unknown as SaveStore;
  const wardrobe = new WardrobeLedger(store, wardrobeCatalog);
  const messages: string[] = [];
  const toaster = { show: (m: string) => void messages.push(m) } as unknown as Toaster;
  const locked = (num: number) => ({ read: () => ({ num, first: 0, second: 0 }) }) as unknown as UnlockState;
  const clear = (num: number) => new ClearLockedShops(store, wardrobe, p, worlds, new UnlockRules(worlds), locked(num), toaster).execute();

  await clear(5);   // Sand is open
  assert.deepEqual(wardrobe.ownedNames("/ItemCap"), ["Mario", "MarioPoncho", "MarioGunman"]);
  assert.match(messages[messages.length - 1] ?? "", /No shop items/);

  await clear(1);   // Sand is locked
  assert.deepEqual(wardrobe.ownedNames("/ItemCap"), ["Mario"]);
  assert.equal((fake.data["/WorldInfo"] as { UseCoinCollectNum: number }[])[worlds.ids.sand].UseCoinCollectNum, 0);
});

test("marking the moon bought in a shop adds to 'Moons bought in shop' of its kingdom; an ordinary moon does not", () => {
  const fake = new FakeStore(0);
  fake.data["/ShineData"] = [{ UniqueId: 565, IsGet: false, Status: 0 }, { UniqueId: 496, IsGet: false, Status: 0 }];
  fake.data["/WorldInfo"] = Array.from({ length: worlds.count }, () => ({ UseCoinCollectNum: 0, PayShineNum: 3, ShopShine: 2 }));
  const ledger = new MoonLedger(fake as unknown as SaveStore, new MoonCatalog(), worlds);
  const sand = worlds.ids.sand;

  const both = new Map(ledger.sideEffects([{ index: 0, value: true }, { index: 1, value: true }]));
  assert.equal(both.get(`/WorldInfo/${sand}/ShopShine`), 3);   // only the shop moon (565, "Shopping in Tostarena")
  assert.equal(both.get(`/WorldInfo/${sand}/PayShineNum`), 5); // both moons count in the total

  fake.data["/ShineData"] = [{ UniqueId: 565, IsGet: true, Status: 2 }];
  const off = new Map(ledger.sideEffects([{ index: 0, value: false }]));
  assert.equal(off.get(`/WorldInfo/${sand}/ShopShine`), 1);

  const ordinary = new Map(new MoonLedger(fake as unknown as SaveStore, new MoonCatalog(), worlds).sideEffects([]));
  assert.equal(ordinary.size, 0);
});

test("a Multi Moon moves the kingdom's Moon total by 3, an ordinary moon by 1", () => {
  const fake = new FakeStore(0);
  fake.data["/ShineData"] = [{ UniqueId: 218, IsGet: false, Status: 0 }, { UniqueId: 205, IsGet: false, Status: 0 }];
  fake.data["/GameProgressData"] = { WaterfallWorldProgress: 0, HomeStatus: 2 };
  fake.data["/WorldInfo"] = Array.from({ length: worlds.count }, () => ({ UseCoinCollectNum: 0, PayShineNum: 10, ShopShine: 0 }));
  const ledger = new MoonLedger(fake as unknown as SaveStore, new MoonCatalog(), worlds);
  const multi = new Map(ledger.sideEffects([{ index: 0, value: true }]));
  assert.equal(multi.get(`/WorldInfo/${worlds.ids.cascade}/PayShineNum`), 13);
  const ordinary = new Map(ledger.sideEffects([{ index: 1, value: true }]));
  assert.equal(ordinary.get(`/WorldInfo/${worlds.ids.cascade}/PayShineNum`), 11);
});

test("ordinary-coin items wait for the kingdom to be cleared and for the Power Moons they ask", () => {
  const { fake, purse: p } = purse(0);
  const infos = fake.data["/WorldInfo"] as { PayShineNum: number; MainShineNo: number }[];
  assert.match(p.blocker("/ItemCap", "MarioNew3DS"), /Clear the Lake Kingdom first/);
  infos[worlds.ids.lake].MainShineNo = 1;                              // Lake's story is done at step 1
  assert.equal(p.blocker("/ItemCap", "MarioNew3DS"), "");
  assert.match(p.blocker("/ItemCloth", "MarioColorLuigi"), /Needs 180 Power Moons/);
  infos[0].PayShineNum = 180;
  assert.equal(p.blocker("/ItemCloth", "MarioColorLuigi"), "");
  assert.equal(p.blocker("/ItemCap", "Mario"), "");                    // not sold: no rule
});
