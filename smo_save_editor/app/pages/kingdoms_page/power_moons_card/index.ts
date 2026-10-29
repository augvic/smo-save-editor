// The moons of one kingdom, as a list of switches.

import { MOON_KIND_LABELS } from "../../../game_data/index.ts";
import type { MoonCatalog, ScenarioCatalog } from "../../../game_data/index.ts";
import type { MoonLedger } from "../../../ledgers/index.ts";
import type { ShineEntry, WorldInfoEntry } from "../../../save_schema/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { FlagList, Layout } from "../../../widgets/index.ts";

export class PowerMoonsCard {
  private readonly store: SaveStore;
  private readonly moons: MoonLedger;
  private readonly catalog: MoonCatalog;
  private readonly scenarios: ScenarioCatalog;

  constructor(store: SaveStore, moons: MoonLedger, catalog: MoonCatalog, scenarios: ScenarioCatalog) {
    this.scenarios = scenarios;
    this.store = store;
    this.moons = moons;
    this.catalog = catalog;
  }

  /** Why a moon cannot be there yet in the kingdom's current scenario: the game's ProgressBitFlag, or its Moon Rock. */
  private notYetOut(kingdom: number, item: ShineEntry): { scenario: number; now: number } | undefined {
    const now = this.store.get<WorldInfoEntry[]>("progress", "/WorldInfo")[kingdom]?.ScenarioNo;
    if (now === undefined) return undefined;
    const from = this.catalog.isMoonRockMoon(item.UniqueId)
      ? this.scenarios.moonRock(kingdom)
      : this.catalog.scenarios(item.UniqueId)?.[0];
    return from !== undefined && from > now ? { scenario: from, now } : undefined;
  }

  /** The remark after a moon: "!" marks a warning (the moon is collected although it is not out yet). */
  private noteOf(kingdom: number, item: ShineEntry): string | undefined {
    const late = this.notYetOut(kingdom, item);
    const hint = item.HintStatus === 1 ? "Toad hint bought" : "";
    if (!late) return hint || undefined;
    const rock = this.catalog.isMoonRockMoon(item.UniqueId) ? "Moon Rock moon, open at" : "only from";
    const text = [`${rock} scenario ${late.scenario} (kingdom is at ${late.now})`, hint].filter(Boolean).join(" · ");
    return item.IsGet ? `!${text}` : text;
  }

  build(kingdom: number): HTMLElement {
    return Layout.card("Power Moons", "A moon that only appears in a later scenario than the kingdom is at is locked: change Current scenario to unlock it. (A moon already marked stays editable.)", new FlagList<ShineEntry>(this.store, {
      kind: "progress",
      path: "/ShineData",
      noun: "moons",
      sortById: true,
      showId: false,
      include: (item) => this.moons.kingdomOf(item) === kingdom,
      alsoSet: (changes) => this.moons.sideEffects(changes),
      idOf: (item) => String(item.UniqueId),
      groups: Object.entries(MOON_KIND_LABELS).map(([kind, label]) => ({ label, test: (item: ShineEntry) => this.catalog.kind(item.UniqueId) === kind })),
      noteOf: (item) => this.noteOf(kingdom, item),
      lockedOn: (item) => this.notYetOut(kingdom, item) !== undefined,
      nameOf: (item) => (this.catalog.name(item.UniqueId) ?? `Moon #${item.UniqueId}`) + (this.catalog.isMultiMoon(item.UniqueId) ? " (Multi Moon)" : "") + (this.catalog.kind(item.UniqueId) ? ` · ${MOON_KIND_LABELS[this.catalog.kind(item.UniqueId) as string]}` : ""),
    }).element);
  }
}
