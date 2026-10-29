// What the shop items cost, from the game's own ItemList.

import type { Worlds } from "../worlds/index.ts";
import { SHOP_PRICES } from "./shop_prices.ts";

export interface ShopPrice {
  /** true: paid in the purple coins of kingdom `shop`; false: ordinary coins. */
  purple: boolean;
  price: number;
  /** The kingdom (game world index) whose shop sells it, -1 for the ordinary-coin items. */
  shop: number;
  /** The kingdom that has to be cleared first, -1 if none. */
  clearFirst: number;
  /** Power Moons needed before it is sold, 0 if none. */
  moons: number;
}

export class ShopCatalog {
  private readonly worlds: Worlds;
  private readonly prices = new Map<string, ShopPrice>();

  constructor(worlds: Worlds) {
    this.worlds = worlds;
    for (const [list, name, purple, price, shop, clearFirst, moons] of SHOP_PRICES) {
      this.prices.set(`${list}/${name}`, { purple: purple === 1, price, shop, clearFirst, moons });
    }
  }

  /** The price of an item (list is the save's path, e.g. "/ItemCap"), or undefined if it is not sold. */
  price(list: string, name: string): ShopPrice | undefined {
    return this.prices.get(`${list}/${name}`);
  }

  /** The price as text, with whatever has to happen before it is sold; "" for an item that is not sold. */
  describe(list: string, name: string): string {
    const p = this.price(list, name);
    if (!p) return "";
    const parts = [p.purple ? `${p.price} purple coins` : `${p.price} coins`];
    if (p.clearFirst >= 0) parts.push(`after clearing ${this.worlds.name(p.clearFirst)}`);
    if (p.moons > 0) parts.push(`with ${p.moons} Power Moons`);
    return parts.join(", ");
  }
}
