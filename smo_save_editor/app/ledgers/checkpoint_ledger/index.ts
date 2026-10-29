// The checkpoints Mario has reached: { StageName, ObjId } pairs in /Checkpoint, a fixed list of slots.

import type { Edit } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

const PATH = "/Checkpoint";

interface Slot {
  StageName: string;
  ObjId: string;
}

export class CheckpointLedger {
  private readonly store: SaveStore;

  constructor(store: SaveStore) {
    this.store = store;
  }

  /** The key of a checkpoint, as used by `reached` and `set`. */
  static key(stage: string, obj: string): string {
    return `${stage}/${obj}`;
  }

  private slots(): Slot[] {
    return this.store.get<Slot[]>("progress", PATH);
  }

  reached(): Set<string> {
    return new Set(this.slots().filter((s) => s.ObjId).map((s) => CheckpointLedger.key(s.StageName, s.ObjId)));
  }

  /** Mark checkpoints (by key) as reached or not. Entries that are not asked about are kept as they are. */
  async set(keys: string[], on: boolean): Promise<boolean> {
    const slots = this.slots();
    const current = slots.filter((s) => s.ObjId);
    const has = (list: Slot[], key: string) => list.some((s) => CheckpointLedger.key(s.StageName, s.ObjId) === key);
    const added = on ? keys.filter((k) => !has(current, k)).map((k): Slot => ({ StageName: k.slice(0, k.indexOf("/")), ObjId: k.slice(k.indexOf("/") + 1) })) : [];
    const next = on ? [...current, ...added] : current.filter((s) => !keys.includes(CheckpointLedger.key(s.StageName, s.ObjId)));
    if (next.length > slots.length) return false;
    const edits: Edit[] = [];
    slots.forEach((old, i) => {
      const want = next[i] ?? { StageName: "", ObjId: "" };
      if (want.StageName !== old.StageName) edits.push([`${PATH}/${i}/StageName`, want.StageName]);
      if (want.ObjId !== old.ObjId) edits.push([`${PATH}/${i}/ObjId`, want.ObjId]);
    });
    return edits.length === 0 || this.store.edit("progress", edits);
  }
}
