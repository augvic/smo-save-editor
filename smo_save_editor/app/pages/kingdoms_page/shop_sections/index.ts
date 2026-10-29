// The caps, outfits, souvenirs and stickers one shop sells, as lists of items to own or not.

import { Dom } from "../../../dom/index.ts";
import type { ShopCatalog, WardrobeEntry, WardrobeListPath } from "../../../game_data/index.ts";
import { WardrobeLedger } from "../../../ledgers/index.ts";
import type { ShopLedger } from "../../../ledgers/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { Layout } from "../../../widgets/index.ts";

const h = Dom.h;

export class ShopSections {
  private readonly store: SaveStore;
  private readonly wardrobe: WardrobeLedger;
  private readonly shop: ShopCatalog;
  private readonly purse: ShopLedger;

  constructor(store: SaveStore, wardrobe: WardrobeLedger, shop: ShopCatalog, purse: ShopLedger) {
    this.store = store;
    this.wardrobe = wardrobe;
    this.shop = shop;
    this.purse = purse;
  }

  /** One card for each list the shop sells something in; none if it sells nothing. `again` redraws the page. */
  build(shop: string, again: () => void): HTMLElement[] {
    return this.wardrobe.catalog.lists
      .map(({ path, title }) => this.section(path, title, shop, again))
      .filter((card): card is HTMLElement => card !== null);
  }

  /** Items in the save that no shop group lists, so they can still be removed. */
  unknownItemsCard(again: () => void): HTMLElement {
    return Layout.card("Not in the catalog", "These items are in your save but unknown to this editor.",
      ...this.wardrobe.catalog.lists.flatMap(({ path, title }) => this.wardrobe.unknownNames(path).map((name) =>
        h("span", { class: "chip" }, `${title}: ${name}`,
          h("button", {
            title: "Remove",
            onclick: async () => {
              if (await this.wardrobe.setNames(path, this.wardrobe.ownedNames(path).filter((n) => n !== name))) again();
            },
          }, "×")))),
    );
  }

  private section(path: WardrobeListPath, title: string, shop: string, again: () => void): HTMLElement | null {
    const wardrobe = this.wardrobe;
    const catalog = wardrobe.entriesOf(path, shop);
    if (catalog.length === 0) return null;
    const counter = h("strong");
    const search = h("input", { type: "search", placeholder: "Search…" });
    const rows = h("div", { class: "rows" });

    const updateCounter = () => {
      const owned = new Set(wardrobe.ownedNames(path));
      counter.textContent = `${catalog.filter(([id]) => owned.has(id)).length} / ${catalog.length} owned`;
    };

    const costOf = (id: string) => this.shop.describe(path, id);
    const matches = ([id, name]: WardrobeEntry) =>
      [id, name, costOf(id)].join(" ").toLowerCase().includes(search.value.trim().toLowerCase());

    const renderRows = () => {
      updateCounter();
      const owned = new Set(wardrobe.ownedNames(path));
      rows.replaceChildren(
        ...catalog.filter(matches).map(([id, name]) => {
          // An item bought with purple coins can only be added while the kingdom's coins pay for it.
          const locked = !owned.has(id) && !this.purse.affordable(path, id);
          const cost = costOf(id);
          const box = h("input", { type: "checkbox", checked: owned.has(id), disabled: id === WardrobeLedger.DEFAULT_ITEM || locked });
          box.addEventListener("change", async () => {
            const names = wardrobe.ownedNames(path);
            const ok = await this.purse.setNames(path, box.checked ? [...names, id] : names.filter((n) => n !== id));
            if (!ok) box.checked = !box.checked;
            updateCounter();
          });
          return h("label", { class: locked ? "row wardrobe-row locked" : "row wardrobe-row", title: locked ? this.purse.shortfall(path, id) : id },
            box,
            h("span", { class: "name" }, name),
            h("span", { class: "where" }, cost),
            h("span", { class: "id-small" }, id),
          );
        }),
      );
    };

    const setAll = async (on: boolean) => {
      const mine = new Set(catalog.map(([id]) => id));
      const names = wardrobe.ownedNames(path);
      const next = on
        ? [...names, ...this.purse.affordableAdditions(path, catalog.map(([id]) => id))]
        : names.filter((n) => !mine.has(n) || n === WardrobeLedger.DEFAULT_ITEM);
      if (await this.purse.setNames(path, next)) again();
    };

    search.addEventListener("input", renderRows);
    // Coins marked elsewhere on the page change what can be bought: redraw unless the search box is in use.
    const stop = this.store.subscribe(() => {
      if (!rows.isConnected) stop();
      else if (document.activeElement !== search) renderRows();
    });
    renderRows();

    return Layout.card(title, null,
      h("div", { class: "toolbar" },
        counter,
        search,
        h("button", { class: "ghost", title: "Adds what the purple coins collected here can pay for", onclick: () => setAll(true) }, "Add all"),
        h("button", { class: "ghost", onclick: () => setAll(false) }, "Remove all"),
      ),
      rows,
    );
  }
}
