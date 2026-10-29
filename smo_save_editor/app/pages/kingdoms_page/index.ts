// The kingdoms: a grid to unlock and open them, and for each one everything about it in a single
// place (progress, moons, purple coins, shop).

import type { SetKingdomLock, UnlockState } from "../../actions/index.ts";
import { Dom } from "../../dom/index.ts";
import { Transition } from "../../transition/index.ts";
import type { Direction } from "../../transition/index.ts";
import { Icon } from "../../icon/index.ts";
import type { Worlds } from "../../game_data/index.ts";
import { UNKNOWN_KINGDOM, WardrobeLedger } from "../../ledgers/index.ts";
import type { MoonLedger } from "../../ledgers/index.ts";
import type { UnlockRules } from "../../rules/index.ts";
import type { Page } from "../page/index.ts";
import type { CheckpointsCard } from "./checkpoints_card/index.ts";
import type { CutscenesCard } from "./cutscenes_card/index.ts";
import type { GroupTile } from "./group_tile/index.ts";
import type { KingdomProgressCard } from "./kingdom_progress_card/index.ts";
import type { KingdomTile } from "./kingdom_tile/index.ts";
import type { OverallProgressCard } from "./overall_progress_card/index.ts";
import type { PowerMoonsCard } from "./power_moons_card/index.ts";
import type { PurpleCoinsCard } from "./purple_coins_card/index.ts";
import type { VisitedStagesCard } from "./visited_stages_card/index.ts";
import type { ShopSections } from "./shop_sections/index.ts";
import type { SummaryRow } from "./summary_row/index.ts";
import { TileStat } from "./tile_stat/index.ts";

const h = Dom.h;

/** Everything the page is built from; the composition root wires it. */
export interface KingdomsPageParts {
  worlds: Worlds;
  moons: MoonLedger;
  wardrobe: WardrobeLedger;
  unlockRules: UnlockRules;
  unlockState: UnlockState;
  setKingdomLock: SetKingdomLock;
  overallProgress: OverallProgressCard;
  summaryRow: SummaryRow;
  kingdomTile: KingdomTile;
  groupTile: GroupTile;
  kingdomProgress: KingdomProgressCard;
  powerMoons: PowerMoonsCard;
  purpleCoins: PurpleCoinsCard;
  shopSections: ShopSections;
  checkpoints: CheckpointsCard;
  visitedStages: VisitedStagesCard;
  cutscenes: CutscenesCard;
}

export class KingdomsPage implements Page {
  readonly title = "Kingdoms";
  readonly needs = "progress" as const;
  private readonly p: KingdomsPageParts;

  constructor(parts: KingdomsPageParts) {
    this.p = parts;
  }

  render(root: HTMLElement): void {
    this.showKingdoms(root);
  }

  /** Go to another view of this page with the slide; redrawing the current one (after an edit) calls the show methods directly. */
  private go(root: HTMLElement, show: () => void, direction: Direction): void {
    void Transition.run(root, () => {
      show();
      root.closest("main")?.scrollTo(0, 0);
    }, direction);
  }

  private backButton(root: HTMLElement): HTMLElement {
    return h("button", { class: "back", onclick: () => this.go(root, () => this.showKingdoms(root), "back") }, Icon.of("map", 14), "All kingdoms");
  }

  private showKingdoms(root: HTMLElement): void {
    const { worlds, moons, wardrobe, unlockRules, unlockState } = this.p;
    const stats = moons.stats();
    const open = unlockRules.unlockedWorlds(unlockState.read());
    const extraShops = WardrobeLedger.SPECIAL_SHOPS.filter((shop) => wardrobe.shopStats(shop).total > 0);
    const otherMoons = stats.get(UNKNOWN_KINGDOM);
    const hasExtras = extraShops.length > 0 || wardrobe.hasUnknownItems() || otherMoons !== undefined;

    const toggleLock = async (world: number, wantUnlocked: boolean) => {
      if (await this.p.setKingdomLock.execute(world, wantUnlocked)) this.showKingdoms(root);
    };
    // Numbers that decide what is unlocked were edited by hand: bring the rest of the save in line.
    const resync = async () => {
      await unlockState.resync();
      this.showKingdoms(root);
    };

    root.replaceChildren(
      h("h1", null, "Kingdoms"),
      this.p.overallProgress.build(resync),
      this.p.summaryRow.build(),
      h("p", { class: "note wide" }, "Unlock a kingdom to open it. Unlocking one also unlocks every kingdom before it, as in the game."),
      h("div", { class: "kingdom-grid" },
        ...worlds.names.map((_, world) => this.p.kingdomTile.build({
          world,
          unlocked: open.has(world),
          moons: stats.get(world),
          onOpen: () => this.go(root, () => this.showKingdom(root, world), "forward"),
          onToggleLock: () => toggleLock(world, !open.has(world)),
        })),
      ),
      ...(hasExtras
        ? [
            h("h2", { class: "section-title" }, Icon.of("star", 18), "Not tied to a kingdom"),
            h("div", { class: "kingdom-grid" },
              ...extraShops.map((shop) => {
                const { have, total } = wardrobe.shopStats(shop);
                return this.p.groupTile.build(WardrobeLedger.shopTitle(shop), () => this.go(root, () => this.showExtraShop(root, shop), "forward"), TileStat.line("Items", `${have} / ${total}`));
              }),
              wardrobe.hasUnknownItems() && this.p.groupTile.build("Not in the catalog", () => this.go(root, () => this.showUnknownItems(root), "forward")),
              otherMoons && this.p.groupTile.build("Other moons", () => this.go(root, () => this.showOtherMoons(root), "forward"), TileStat.line("Moons", `${otherMoons.have} / ${otherMoons.total}`)),
            ),
          ]
        : []),
    );
  }

  private showKingdom(root: HTMLElement, world: number): void {
    const { worlds, wardrobe } = this.p;
    const again = () => this.showKingdom(root, world);
    const name = worlds.name(world);
    const coins = this.p.purpleCoins.build(world);
    const checkpoints = this.p.checkpoints.build(world);
    const visited = this.p.visitedStages.build(world);
    const cutscenes = this.p.cutscenes.build(world);
    root.replaceChildren(
      h("h1", null, name),
      this.backButton(root),
      this.p.kingdomProgress.build(world),
      this.p.powerMoons.build(world),
      ...(coins ? [coins] : []),
      ...(checkpoints ? [checkpoints] : []),
      ...(visited ? [visited] : []),
      ...(cutscenes ? [cutscenes] : []),
      ...(wardrobe.shopStats(name).total > 0
        ? [h("h2", { class: "section-title" }, Icon.of("bag", 18), `Shop: ${name}`), ...this.p.shopSections.build(name, again)]
        : []),
    );
  }

  private showExtraShop(root: HTMLElement, shop: string): void {
    root.replaceChildren(
      h("h1", null, WardrobeLedger.shopTitle(shop)),
      this.backButton(root),
      ...this.p.shopSections.build(shop, () => this.showExtraShop(root, shop)),
    );
  }

  private showUnknownItems(root: HTMLElement): void {
    root.replaceChildren(h("h1", null, "Not in the catalog"), this.backButton(root), this.p.shopSections.unknownItemsCard(() => this.showUnknownItems(root)));
  }

  private showOtherMoons(root: HTMLElement): void {
    root.replaceChildren(h("h1", null, "Other moons"), this.backButton(root), this.p.powerMoons.build(UNKNOWN_KINGDOM));
  }
}

export { CheckpointsCard } from "./checkpoints_card/index.ts";
export { GroupTile } from "./group_tile/index.ts";
export { KingdomProgressCard } from "./kingdom_progress_card/index.ts";
export { KingdomTile } from "./kingdom_tile/index.ts";
export { OverallProgressCard } from "./overall_progress_card/index.ts";
export { PowerMoonsCard } from "./power_moons_card/index.ts";
export { PurpleCoinsCard } from "./purple_coins_card/index.ts";
export { ShopSections } from "./shop_sections/index.ts";
export { SummaryRow } from "./summary_row/index.ts";
export { VisitedStagesCard } from "./visited_stages_card/index.ts";
export { CutscenesCard } from "./cutscenes_card/index.ts";
