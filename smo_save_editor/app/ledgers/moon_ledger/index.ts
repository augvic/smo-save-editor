// Counting Power Moons: per kingdom, in total, and the extra values the game keeps in step with
// them (each moon's Status, each kingdom's moon total, the first step of the Cascade story).

import type { MoonCatalog, Worlds } from "../../game_data/index.ts";
import type { Edit, ShineEntry } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

/** Stand-in "kingdom" for moons whose ID the catalog does not list. */
export const UNKNOWN_KINGDOM = -1;

export interface Count {
  have: number;
  total: number;
}

/** The Status the game writes on a collected moon (seen on all 603 collected moons of a finished game). */
const COLLECTED_STATUS = 2;

export interface MoonChange {
  index: number;
  value: boolean;
}

export class MoonLedger {
  private readonly store: SaveStore;
  private readonly moons: MoonCatalog;
  private readonly worlds: Worlds;

  constructor(store: SaveStore, moons: MoonCatalog, worlds: Worlds) {
    this.store = store;
    this.moons = moons;
    this.worlds = worlds;
  }

  private items(): ShineEntry[] {
    return this.store.get<ShineEntry[]>("progress", "/ShineData");
  }

  /** Kingdom of a moon: from the catalog, or UNKNOWN_KINGDOM for an ID it does not list. */
  kingdomOf(item: ShineEntry): number {
    return this.moons.kingdom(item.UniqueId) ?? UNKNOWN_KINGDOM;
  }

  /** Collected and total moons per kingdom (UNKNOWN_KINGDOM for moons the catalog does not list). */
  stats(): Map<number, Count> {
    const result = new Map<number, Count>();
    for (const item of this.items()) {
      const kingdom = this.kingdomOf(item);
      const entry = result.get(kingdom) ?? { have: 0, total: 0 };
      entry.total++;
      if (item.IsGet) entry.have++;
      result.set(kingdom, entry);
    }
    return result;
  }

  /** Moons collected, and moon slots in the save. */
  totals(): { collected: number; slots: number } {
    const items = this.items();
    return { collected: items.filter((item) => item.IsGet).length, slots: items.length };
  }

  /** The first step of the Cascade story follows the first Cascade moon. */
  private cascadeStoryEdits(collectedInCascade: number): Edit[] {
    const path = "/GameProgressData/WaterfallWorldProgress";
    const progress = this.store.get<number>("progress", path);
    if (collectedInCascade > 0 && progress < 1) return [[path, 1]];
    if (collectedInCascade === 0 && progress === 1) return [[path, 0]];
    return [];
  }

  /**
   * What else the game keeps in step when moons are collected: each moon's Status, the kingdom's
   * PayShineNum, and the first step of the Cascade story. Meant to be applied in the same edit as the
   * IsGet change so they cannot disagree.
   *
   * PayShineNum is moved by a step per moon, never recounted: a Multi Moon is worth 3 and an ordinary moon 1.
   * In a finished game (13 of 17 kingdoms match exactly) it is the collected moons plus 2 for each Multi Moon
   * plus the extra moons bought in shops, which have no ID of their own, so only a step is safe.
   */
  sideEffects(changes: MoonChange[]): Edit[] {
    const items = this.items();
    const after = new Map(changes.map((c) => [c.index, c.value]));
    const edits: Edit[] = [];
    const steps = new Map<number, number>();
    const shopSteps = new Map<number, number>();
    for (const { index, value } of changes) {
      const item = items[index];
      if (value) edits.push([`/ShineData/${index}/Status`, COLLECTED_STATUS]);
      else if (item.Status === COLLECTED_STATUS) edits.push([`/ShineData/${index}/Status`, 0]);
      if (value !== item.IsGet) {
        const kingdom = this.kingdomOf(item);
        const worth = this.moons.isMultiMoon(item.UniqueId) ? 3 : 1;
        steps.set(kingdom, (steps.get(kingdom) ?? 0) + (value ? worth : -worth));
        if (this.moons.isShopMoon(item.UniqueId)) shopSteps.set(kingdom, (shopSteps.get(kingdom) ?? 0) + (value ? 1 : -1));
      }
    }
    // A moon bought in a shop also counts in "Moons bought in shop" (ShopShine) of its kingdom.
    for (const [kingdom, step] of shopSteps) {
      if (kingdom === UNKNOWN_KINGDOM || step === 0) continue;
      const path = `/WorldInfo/${kingdom}/ShopShine`;
      edits.push([path, Math.max(0, this.store.get<number>("progress", path) + step)]);
    }
    for (const [kingdom, step] of steps) {
      if (kingdom === UNKNOWN_KINGDOM || step === 0) continue;
      const path = `/WorldInfo/${kingdom}/PayShineNum`;
      edits.push([path, Math.max(0, this.store.get<number>("progress", path) + step)]);
    }

    const cascade = this.worlds.ids.cascade;
    if (steps.has(cascade)) {
      const collected = items.filter((item, i) => this.kingdomOf(item) === cascade && (after.get(i) ?? item.IsGet)).length;
      edits.push(...this.cascadeStoryEdits(collected));
    }
    return edits;
  }

  /**
   * Edits that make every moon's Status agree with its IsGet flag, and the Cascade story step with the
   * Cascade moons. A moon that is not collected but has Status 1 is left alone: a finished game has a few.
   * Empty when everything already agrees.
   */
  flagEdits(): Edit[] {
    const edits: Edit[] = [];
    let collectedInCascade = 0;
    this.items().forEach((item, i) => {
      if (item.IsGet && this.kingdomOf(item) === this.worlds.ids.cascade) collectedInCascade++;
      if (item.IsGet && item.Status !== COLLECTED_STATUS) edits.push([`/ShineData/${i}/Status`, COLLECTED_STATUS]);
      if (!item.IsGet && item.Status === COLLECTED_STATUS) edits.push([`/ShineData/${i}/Status`, 0]);
    });
    return [...edits, ...this.cascadeStoryEdits(collectedInCascade)];
  }
}
