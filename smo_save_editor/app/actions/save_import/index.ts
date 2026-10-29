// Bring parts of another save into the one that is open, and say how two saves differ, by the same sections.
// Nothing is changed until the caller applies the edits; they go in as one step, so undo takes them back together.

import type { CoinCatalog, MoonCatalog, Worlds } from "../../game_data/index.ts";
import type { Edit, Json } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

export interface ImportSection {
  id: string;
  label: string;
  /** Whether the section is about chosen kingdoms (moons, purple coins, progress) or the whole save. */
  perKingdom: boolean;
}

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

function at(tree: Json, path: string): Json | undefined {
  let node: Json | undefined = tree;
  for (const key of path.split("/").filter(Boolean)) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, Json>)[key];
  }
  return node;
}

export class SaveImport {
  static readonly SECTIONS: readonly ImportSection[] = [
    { id: "moons", label: "Power Moons and Moon totals", perKingdom: true },
    { id: "coins", label: "Purple coins and coins spent", perKingdom: true },
    { id: "progress", label: "Kingdom progress (Main and Current scenario, map position)", perKingdom: true },
    { id: "unlock", label: "Unlocked kingdoms, Odyssey and Mario's location", perKingdom: false },
    { id: "wardrobe", label: "Caps, outfits, souvenirs and stickers", perKingdom: false },
    { id: "captures", label: "Captures", perKingdom: false },
    { id: "music", label: "Music", perKingdom: false },
    { id: "checkpoints", label: "Checkpoints", perKingdom: false },
    { id: "areas", label: "Side areas visited", perKingdom: false },
    { id: "achievements", label: "Achievements", perKingdom: false },
    { id: "races", label: "Race records", perKingdom: false },
  ];

  private readonly store: SaveStore;
  private readonly worlds: Worlds;
  private readonly coins: CoinCatalog;
  private readonly moons: MoonCatalog;

  constructor(store: SaveStore, worlds: Worlds, coins: CoinCatalog, moons: MoonCatalog) {
    this.moons = moons;
    this.store = store;
    this.worlds = worlds;
    this.coins = coins;
  }

  /** The edits that make the open save match `other` in one section (for the given kingdoms, if it has them). */
  edits(sectionId: string, other: Json, kingdoms: readonly number[] = []): Edit[] {
    const mine = (path: string) => this.store.get<Json | undefined>("progress", path);
    const theirs = (path: string) => at(other, path);
    const out: Edit[] = [];
    const copy = (path: string) => {
      const value = theirs(path);
      if (value !== undefined && !same(value, mine(path))) out.push([path, value]);
    };
    /** Copy a list slot by slot when both have the same length, otherwise replace the whole list. */
    const copyList = (path: string) => {
      const a = mine(path);
      const b = theirs(path);
      if (!Array.isArray(b) || same(a, b)) return;
      if (Array.isArray(a) && a.length === b.length) b.forEach((_, i) => copy(`${path}/${i}`));
      else out.push([path, b]);
    };
    /** Copy the fields of the entries of a list that both saves have, matched by an identifying field. */
    const copyEntries = (path: string, idField: string, fields: readonly string[], wanted: (entry: Record<string, Json>) => boolean = () => true) => {
      const ours = (mine(path) ?? []) as Record<string, Json>[];
      const others = new Map(((theirs(path) ?? []) as Record<string, Json>[]).map((e) => [String(e[idField]), e]));
      ours.forEach((entry, i) => {
        const that = others.get(String(entry[idField]));
        if (!that || !wanted(entry)) return;
        for (const field of fields) if (that[field] !== undefined && !same(that[field], entry[field])) out.push([`${path}/${i}/${field}`, that[field]]);
      });
    };

    const kingdomSet = new Set(kingdoms);
    switch (sectionId) {
      case "moons": {
        // Moons are matched by UniqueId; the kingdom of a moon comes from the catalog, since the save does not say.
        const theirMoons = new Map(((theirs("/ShineData") ?? []) as Record<string, Json>[]).map((m) => [String(m.UniqueId), m]));
        ((mine("/ShineData") ?? []) as Record<string, Json>[]).forEach((moon, i) => {
          const that = theirMoons.get(String(moon.UniqueId));
          if (!that || !kingdomSet.has(this.moons.kingdom(Number(moon.UniqueId)) ?? -1)) return;
          for (const field of ["IsGet", "Status", "HintStatus", "GetTime"]) {
            if (that[field] !== undefined && !same(that[field], moon[field])) out.push([`/ShineData/${i}/${field}`, that[field]]);
          }
        });
        for (const k of kingdoms) for (const f of ["PayShineNum", "ShopShine"]) copy(`/WorldInfo/${k}/${f}`);
        break;
      }
      case "coins":
        copyEntries("/GetCoinCollectData", "UniqueId", ["IsGet"], (e) => kingdomSet.has(this.coins.kingdomOf(Number(e.UniqueId)) ?? -1));
        for (const k of kingdoms) copy(`/WorldInfo/${k}/UseCoinCollectNum`);
        break;
      case "progress":
        for (const k of kingdoms) ["MainShineNo", "ScenarioNo", "UnlockedWorldId", "WorldWarpHoleThrough", "TalkLocalLanguage"].forEach((f) => copy(`/WorldInfo/${k}/${f}`));
        for (const k of kingdoms) copy(`/GameProgressData/IsFirstTimeWorld/${k}`);
        break;
      case "unlock":
        for (const f of ["UnlockWorldNum", "UnlockWorldStatusFirstBranch", "UnlockWorldStatusSecondBranch", "HomeLevel", "HomeStatus", "WaterfallWorldProgress"]) copy(`/GameProgressData/${f}`);
        for (const f of ["WorldId", "NextWorldId", "PrevWorldId", "StageName", "IsEnableCap"]) copy(`/${f}`);
        break;
      case "wardrobe":
        ["/ItemCap", "/ItemCloth", "/ItemGift", "/ItemSticker"].forEach(copyList);
        break;
      case "captures":
        copyList("/HackDictionary");
        break;
      case "music":
        copyList("/CollectBgmList");
        break;
      case "checkpoints":
        copyList("/Checkpoint");
        break;
      case "areas":
        copyList("/VisitStageData");
        break;
      case "achievements":
        copyEntries("/AchievementSaveData", "Name", ["IsGet", "GetTime"]);
        break;
      case "races":
        for (const key of Object.keys((theirs("/RaceRecord") as Record<string, Json> | undefined) ?? {})) {
          for (const f of ["IsExistRecord", "IsWin", "LapRecord", "Record"]) copy(`/RaceRecord/${key}/${f}`);
        }
        break;
    }
    return out;
  }

  kingdomName(world: number): string {
    return this.worlds.name(world);
  }
}
