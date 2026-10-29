// What has changed since the file was opened or last saved, so nothing goes into a save unseen.

import { Dom } from "../../dom/index.ts";
import { Icon } from "../../icon/index.ts";
import type { MoonCatalog, Worlds } from "../../game_data/index.ts";
import type { Kind, ShineEntry } from "../../save_schema/index.ts";
import type { Change, SaveStore } from "../../save_store/index.ts";
import { Layout } from "../../widgets/index.ts";
import type { Page } from "../page/index.ts";

const h = Dom.h;

export class ChangesPage implements Page {
  readonly title = "Changes";
  readonly needs = null;
  private readonly store: SaveStore;
  private readonly moons: MoonCatalog;
  private readonly worlds: Worlds;

  constructor(store: SaveStore, moons: MoonCatalog, worlds: Worlds) {
    this.store = store;
    this.moons = moons;
    this.worlds = worlds;
  }

  /** A path in words: "/ShineData/12/IsGet" -> "Moon: Atop the Highest Tower › IsGet". */
  describe(kind: Kind, path: string): string {
    const [root, index, ...rest] = path.split("/").filter(Boolean);
    const tail = rest.length > 0 ? ` › ${rest.join(" › ")}` : "";
    if (kind !== "progress") return path;
    if (root === "ShineData") {
      const item = this.store.get<ShineEntry | undefined>(kind, `/ShineData/${index}`);
      return `Moon: ${item ? this.moons.name(item.UniqueId) ?? `#${item.UniqueId}` : index}${tail}`;
    }
    if (root === "WorldInfo") return `${this.worlds.name(Number(index))}${tail}`;
    if (root === "GetCoinCollectData") {
      const coin = this.store.get<{ UniqueId: number } | undefined>(kind, `/GetCoinCollectData/${index}`);
      return `Purple coin ${coin?.UniqueId ?? index}${tail}`;
    }
    if (root === "GameProgressData" && index === "IsFirstTimeWorld" && rest[0] !== undefined) return `First visit pending › ${this.worlds.name(Number(rest[0]))}`;
    return path;
  }

  private show(value: unknown): string {
    const text = typeof value === "string" ? (value === "" ? "(empty)" : value) : JSON.stringify(value);
    return text.length > 40 ? `${text.slice(0, 40)}…` : text;
  }

  render(root: HTMLElement): void {
    const docs = this.store.open();
    const cards = docs.map((doc) => {
      const changes: Change[] = this.store.changes(doc.kind);
      return Layout.card(doc.fileName, "Changes since the file was opened or last saved. Revert puts one value back.",
        changes.length === 0
          ? h("p", { class: "empty" }, "No changes.")
          : h("div", { class: "rows" }, ...changes.map((c) => h("div", { class: "row" },
              h("span", { class: "name" }, this.describe(doc.kind, c.path)),
              h("span", { class: "id-small" }, `${this.show(c.from)} → ${this.show(c.to)}`),
              h("button", { class: "ghost", onclick: async () => { if (await this.store.edit(doc.kind, [[c.path, c.from]])) this.render(root); } }, Icon.of("undo", 14), "Revert"),
            ))));
    });
    root.replaceChildren(...(cards.length > 0 ? cards : [h("p", { class: "empty" }, "Open a save first.")]));
  }
}
