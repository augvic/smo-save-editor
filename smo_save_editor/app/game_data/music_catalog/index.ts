// The music tracks of the game's jukebox. The save keeps one entry in /CollectBgmList for each track, named by
// the base resource (the part before "@"); tracks that share a base (a 2D or 8-bit variant) have the same
// name, so they are handled together here.

import { TRACKS } from "./tracks.ts";

export interface MusicTrack {
  /** The base name the save uses, e.g. "StmRsBgmForest". */
  id: string;
  /** The English titles of everything that shares the name, joined. */
  title: string;
  /** How many entries of the jukebox have this name. */
  variants: number;
}

export class MusicCatalog {
  private readonly list: MusicTrack[];

  constructor() {
    const byBase = new Map<string, MusicTrack>();
    for (const [resource, title] of TRACKS) {
      const id = resource.split("@")[0];
      const known = byBase.get(id);
      if (known) {
        known.title += ` / ${title}`;
        known.variants++;
      } else byBase.set(id, { id, title, variants: 1 });
    }
    this.list = [...byBase.values()];
  }

  tracks(): readonly MusicTrack[] {
    return this.list;
  }

  /** How many entries of the jukebox have this name (1 for an unknown one). */
  variants(id: string): number {
    return this.list.find((t) => t.id === id)?.variants ?? 1;
  }
}
