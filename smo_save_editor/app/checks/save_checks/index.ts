// Goes through the save and lists what does not agree with the game's rules, each with a fix when one is safe.
// It only reads: nothing is changed until the user presses a fix.

import type { GoToKingdom, UnlockState } from "../../actions/index.ts";
import type { AchievementCatalog, LeaveCatalog, MoonCatalog, ScenarioCatalog, Worlds } from "../../game_data/index.ts";
import type { CoinLedger, MoonLedger, ShopLedger } from "../../ledgers/index.ts";
import type { OdysseyRules, UnlockRules } from "../../rules/index.ts";
import type { AchievementEntry, Edit, ShineEntry, WorldInfoEntry } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

export interface Issue {
  /** Short statement of what is off. */
  title: string;
  /** The kingdom it is about, if any. */
  kingdom?: number;
  /** What the fix does, and the edits; absent when only the user can decide. Used by "Fix all". */
  fix?: Fix;
  /** Several ways out, for when the right one is the user's call; "Fix all" leaves these alone. */
  options?: Fix[];
}

export interface Fix {
  label: string;
  edits: Edit[];
}

const K = "progress" as const;

export class SaveChecks {
  private readonly store: SaveStore;
  private readonly worlds: Worlds;
  private readonly moons: MoonLedger;
  private readonly moonCatalog: MoonCatalog;
  private readonly scenarios: ScenarioCatalog;
  private readonly odyssey: OdysseyRules;
  private readonly unlockRules: UnlockRules;
  private readonly unlockState: UnlockState;
  private readonly coins: CoinLedger;
  private readonly purse: ShopLedger;
  private readonly achievements: AchievementCatalog;
  private readonly leave: LeaveCatalog;
  private readonly goTo: GoToKingdom;

  constructor(parts: {
    store: SaveStore; worlds: Worlds; moons: MoonLedger; moonCatalog: MoonCatalog; scenarios: ScenarioCatalog;
    odyssey: OdysseyRules; unlockRules: UnlockRules; unlockState: UnlockState; coins: CoinLedger; purse: ShopLedger; achievements: AchievementCatalog; leave: LeaveCatalog; goTo: GoToKingdom;
  }) {
    this.store = parts.store;
    this.worlds = parts.worlds;
    this.moons = parts.moons;
    this.moonCatalog = parts.moonCatalog;
    this.scenarios = parts.scenarios;
    this.odyssey = parts.odyssey;
    this.unlockRules = parts.unlockRules;
    this.unlockState = parts.unlockState;
    this.coins = parts.coins;
    this.purse = parts.purse;
    this.achievements = parts.achievements;
    this.leave = parts.leave;
    this.goTo = parts.goTo;
  }

  run(): Issue[] {
    const infos = this.store.get<WorldInfoEntry[]>(K, "/WorldInfo");
    const shine = this.store.get<ShineEntry[]>(K, "/ShineData");
    const unlock = this.unlockState.read();
    const open = this.unlockRules.unlockedWorlds(unlock);
    const name = (w: number) => this.worlds.name(w);
    const issues: Issue[] = [];

    for (let world = 0; world < this.worlds.count; world++) {
      const info = infos[world];
      if (!info) continue;
      const path = (field: string) => `/WorldInfo/${world}/${field}`;
      const collected = shine.filter((m) => m.IsGet && this.moons.kingdomOf(m) === world);

      // Moons that cannot have been found in the scenario the kingdom is at.
      const early = collected.filter((m) => {
        const from = this.moonCatalog.isMoonRockMoon(m.UniqueId) ? this.scenarios.moonRock(world) : this.moonCatalog.scenarios(m.UniqueId)?.[0];
        return from !== undefined && from > info.ScenarioNo;
      });
      if (early.length > 0) issues.push({ title: `${name(world)}: ${early.length} collected moon${early.length === 1 ? " is" : "s are"} not out yet in scenario ${info.ScenarioNo}`, kingdom: world });

      // The moon total, the shop moons, and the shop-coin counter follow the moons and items.
      const worth = collected.reduce((sum, m) => sum + (this.moonCatalog.isMultiMoon(m.UniqueId) ? 3 : 1), 0);
      // A finished game by the game itself is up to 1 short here in some kingdoms, so only a bigger gap counts.
      if (info.PayShineNum < worth - 1) {
        issues.push({ title: `${name(world)}: Moon total is ${info.PayShineNum}, but the collected moons are worth ${worth}`, kingdom: world, fix: { label: `Set to ${worth}`, edits: [[path("PayShineNum"), worth]] } });
      }
      const shopMoons = collected.filter((m) => this.moonCatalog.isShopMoon(m.UniqueId)).length;
      if (info.ShopShine < shopMoons) {
        issues.push({ title: `${name(world)}: Moons bought in shop is ${info.ShopShine}, but the shop moon is collected`, kingdom: world, fix: { label: `Set to ${shopMoons}`, edits: [[path("ShopShine"), shopMoons]] } });
      }
      const spent = this.purse.spent(world);
      const have = this.coins.stats(world)?.have ?? 0;
      if (spent > have) issues.push({ title: `${name(world)}: shop items cost ${spent} purple coins, but only ${have} are collected`, kingdom: world });
      else if (info.UseCoinCollectNum !== spent) {
        issues.push({ title: `${name(world)}: Purple coins spent is ${info.UseCoinCollectNum}, the owned items cost ${spent}`, kingdom: world, fix: { label: `Set to ${spent}`, edits: [[path("UseCoinCollectNum"), spent]] } });
      }

      // Scenario and story steps.
      const pending = this.store.get<boolean[]>(K, "/GameProgressData/IsFirstTimeWorld")[world];
      const shouldBePending = info.MainShineNo < 0 || !open.has(world);
      // A locked kingdom is reported below, with its own ways out; its flag follows from that.
      if (open.has(world) && pending !== undefined && pending !== shouldBePending) {
        issues.push({ title: `${name(world)}: "First visit still pending" is ${pending ? "on" : "off"}, Main scenario ${info.MainShineNo} means it should be ${shouldBePending ? "on" : "off"}`, kingdom: world, fix: { label: "Match Main scenario", edits: [[`/GameProgressData/IsFirstTimeWorld/${world}`, shouldBePending]] } });
      }

      // Things marked in a kingdom that is still locked: either it should be unlocked, or what is marked there should go.
      if (!open.has(world)) {
        const coinIndexes = this.coins.collectedByKingdom().get(world) ?? [];
        if (coinIndexes.length > 0 || collected.length > 0) {
          const keepCoins = spent;
          const moonChanges = collected.map((m) => ({ index: shine.indexOf(m), value: false }));
          const clearEdits: Edit[] = [
            ...moonChanges.map((c): Edit => [`/ShineData/${c.index}/IsGet`, false]),
            ...this.moons.sideEffects(moonChanges),
            ...coinIndexes.slice(keepCoins).map((i): Edit => [`/GetCoinCollectData/${i}/IsGet`, false]),
          ];
          issues.push({
            title: `${name(world)} is locked, but has ${collected.length} collected moons and ${coinIndexes.length} purple coins`,
            kingdom: world,
            options: [
              { label: `Unlock ${name(world)}`, edits: this.unlockState.edits(this.unlockRules.unlock(world, unlock)) },
              { label: "Clear its moons and coins", edits: clearEdits },
            ],
          });
        }
      }
    }

    // A kingdom that was left must have had the moons the Odyssey asks for (the kingdom just unlocked is not left yet).
    const total = infos.reduce((sum, w) => sum + w.PayShineNum, 0);
    this.unlockRules.unlockOrder(unlock).slice(0, Math.max(0, unlock.num - 1)).forEach((world) => {
      const need = this.leave.requirement(world);
      if (!need || need.moons === 0) return;
      const have = need.overall ? total : infos[world]?.PayShineNum ?? 0;
      if (have >= need.moons) return;
      const where = need.overall ? "in the whole game" : "in the kingdom";
      issues.push({
        title: `${name(world)} was left, but the Odyssey asks for ${need.moons} Power Moons ${where} and the Moon total is ${have}`,
        kingdom: world,
        fix: need.overall ? undefined : { label: `Set to ${need.moons}`, edits: [[`/WorldInfo/${world}/PayShineNum`, need.moons]] },
      });
    });

    // Mario and the Odyssey.
    const here = this.store.get<number>(K, "/WorldId");
    if (!open.has(here)) {
      const last = this.unlockRules.unlockOrder(unlock)[unlock.num - 1];
      issues.push({ title: `Mario is in ${name(here)}, which is locked`, fix: { label: `Move Mario to ${name(last)}`, edits: this.goTo.edits(last) } });
    }
    const level = this.odyssey.homeLevel(unlock.num);
    const homeLevel = this.store.get<number>(K, "/GameProgressData/HomeLevel");
    if (homeLevel !== level) {
      issues.push({ title: `Odyssey level is ${homeLevel}; ${unlock.num} unlocked kingdoms give ${level}`, fix: { label: `Set to ${level}`, edits: [["/GameProgressData/HomeLevel", level]] } });
    }

    // Achievements that count moons.
    const marked = this.store.get<AchievementEntry[]>(K, "/AchievementSaveData");
    marked.forEach((a) => {
      const goal = this.achievements.goal(a.Name);
      if (!a.Name.startsWith("Shine_Gather_") || goal === undefined) return;
      if (a.IsGet && total < goal) issues.push({ title: `Achievement ${a.Name} is marked, but the Moon totals add up to ${total} (it asks for ${goal})` });
    });
    return issues;
  }
}
