// How much of a kingdom is done, across everything the editor lists for it: moons, purple coins, shop
// items, checkpoints and side areas.

import type { CheckpointCatalog, StageCatalog, Worlds } from "../../game_data/index.ts";
import { CheckpointLedger } from "../checkpoint_ledger/index.ts";
import type { CoinLedger } from "../coin_ledger/index.ts";
import type { MoonLedger } from "../moon_ledger/index.ts";
import type { VisitLedger } from "../visit_ledger/index.ts";
import type { WardrobeLedger } from "../wardrobe_ledger/index.ts";

export interface Completion {
  have: number;
  total: number;
  /** have / total as a whole percent; 0 when there is nothing to count. */
  percent: number;
}

export class CompletionLedger {
  private readonly worlds: Worlds;
  private readonly moons: MoonLedger;
  private readonly coins: CoinLedger;
  private readonly wardrobe: WardrobeLedger;
  private readonly checkpointCatalog: CheckpointCatalog;
  private readonly checkpoints: CheckpointLedger;
  private readonly stages: StageCatalog;
  private readonly visits: VisitLedger;

  constructor(parts: {
    worlds: Worlds; moons: MoonLedger; coins: CoinLedger; wardrobe: WardrobeLedger;
    checkpointCatalog: CheckpointCatalog; checkpoints: CheckpointLedger; stages: StageCatalog; visits: VisitLedger;
  }) {
    this.worlds = parts.worlds;
    this.moons = parts.moons;
    this.coins = parts.coins;
    this.wardrobe = parts.wardrobe;
    this.checkpointCatalog = parts.checkpointCatalog;
    this.checkpoints = parts.checkpoints;
    this.stages = parts.stages;
    this.visits = parts.visits;
  }

  of(kingdom: number): Completion {
    const parts: { have: number; total: number }[] = [];
    const moons = this.moons.stats().get(kingdom);
    if (moons) parts.push(moons);
    const coins = this.coins.stats(kingdom);
    if (coins) parts.push(coins);
    parts.push(this.wardrobe.shopStats(this.worlds.name(kingdom)));
    const reached = this.checkpoints.reached();
    const checkpoints = this.checkpointCatalog.of(kingdom);
    parts.push({ have: checkpoints.filter((c) => reached.has(CheckpointLedger.key(c.stage, c.obj))).length, total: checkpoints.length });
    const visited = this.visits.visited();
    const areas = this.stages.visitable(kingdom);
    parts.push({ have: areas.filter((a) => visited.has(a.stage)).length, total: areas.length });

    const have = parts.reduce((sum, p) => sum + p.have, 0);
    const total = parts.reduce((sum, p) => sum + p.total, 0);
    return { have, total, percent: total === 0 ? 0 : Math.floor((100 * have) / total) };
  }
}
