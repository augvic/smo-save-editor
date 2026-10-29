// The jukebox: which music tracks the player has heard.

import type { MusicCatalog } from "../../../game_data/index.ts";
import type { MusicLedger } from "../../../ledgers/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { Layout, NameChecklist } from "../../../widgets/index.ts";

export class MusicCard {
  private readonly store: SaveStore;
  private readonly catalog: MusicCatalog;
  private readonly music: MusicLedger;

  constructor(store: SaveStore, catalog: MusicCatalog, music: MusicLedger) {
    this.store = store;
    this.catalog = catalog;
    this.music = music;
  }

  build(): HTMLElement {
    return Layout.card("Music", "The tracks of the jukebox. A track the save has not listed yet is added when you mark it.",
      new NameChecklist(this.store, {
        items: this.catalog.tracks().map(({ id, title }) => ({ id, label: title, detail: id })),
        noun: "tracks",
        isOn: (id) => this.music.collected().has(id),
        setMany: (ids, on) => this.music.set(ids, on),
      }).element);
  }
}
