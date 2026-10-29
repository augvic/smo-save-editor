// Every cap, outfit, souvenir and sticker, by the internal name the save uses.

import { WARDROBE } from "./wardrobe.ts";
import type { WardrobeEntry } from "./wardrobe.ts";

export type { WardrobeEntry };
export type WardrobeListPath = keyof typeof WARDROBE;

export class WardrobeCatalog {
  /** The four lists the save keeps, with the title shown for each. */
  readonly lists: readonly { path: WardrobeListPath; title: string }[] = [
    { path: "/ItemCap", title: "Caps" },
    { path: "/ItemCloth", title: "Outfits" },
    { path: "/ItemGift", title: "Souvenirs" },
    { path: "/ItemSticker", title: "Stickers" },
  ];

  entries(path: WardrobeListPath): readonly WardrobeEntry[] {
    return WARDROBE[path];
  }
}
