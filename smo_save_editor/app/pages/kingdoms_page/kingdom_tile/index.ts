// A kingdom on the grid: its progress, and a badge to unlock or lock it. A locked kingdom cannot be opened.

import { Dom } from "../../../dom/index.ts";
import { Icon } from "../../../icon/index.ts";
import type { Worlds } from "../../../game_data/index.ts";
import type { CoinLedger, CompletionLedger, Count, WardrobeLedger } from "../../../ledgers/index.ts";
import { TileStat } from "../tile_stat/index.ts";

const h = Dom.h;

export interface KingdomTileView {
  world: number;
  unlocked: boolean;
  moons: Count | undefined;
  onOpen: () => void;
  onToggleLock: () => void;
}

export class KingdomTile {
  private readonly worlds: Worlds;
  private readonly coins: CoinLedger;
  private readonly wardrobe: WardrobeLedger;
  private readonly completion: CompletionLedger;

  constructor(worlds: Worlds, coins: CoinLedger, wardrobe: WardrobeLedger, completion: CompletionLedger) {
    this.completion = completion;
    this.worlds = worlds;
    this.coins = coins;
    this.wardrobe = wardrobe;
  }

  build({ world, unlocked, moons, onOpen, onToggleLock }: KingdomTileView): HTMLElement {
    const name = this.worlds.name(world);
    const coins = this.coins.stats(world);
    const shop = this.wardrobe.shopStats(name);
    const isCap = world === this.worlds.ids.cap;
    const badge = h("button", {
      class: "lock-badge",
      disabled: isCap,
      title: isCap
        ? "The Cap Kingdom is always unlocked"
        : unlocked
          ? "Lock this kingdom and the ones after it"
          : "Unlock this kingdom and the ones before it",
      onclick: onToggleLock,
    },
      h("span", { class: "badge-now" }, Icon.of(unlocked ? "unlock" : "lock", 14)),
      !isCap && h("span", { class: "badge-hover" }, Icon.of(unlocked ? "lock" : "unlock", 14)),
    );
    return h("div", { class: `kingdom-card${unlocked ? "" : " locked"}` },
      h("button", { class: "tile-main", disabled: !unlocked, onclick: onOpen },
        h("strong", null, name),
        moons && TileStat.line("Moons", `${moons.have} / ${moons.total}`),
        coins && TileStat.line("Purple coins", `${coins.have} / ${coins.total}`),
        shop.total > 0 && TileStat.line("Shop items", `${shop.have} / ${shop.total}`),
        unlocked && TileStat.line("Completion", `${this.completion.of(world).percent}%`),
      ),
      badge,
    );
  }
}
