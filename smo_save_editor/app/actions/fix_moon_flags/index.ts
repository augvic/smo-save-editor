// Make every moon's Status agree with whether it is collected.

import type { MoonLedger } from "../../ledgers/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import type { Toaster } from "../../toaster/index.ts";

export class FixMoonFlags {
  private readonly store: SaveStore;
  private readonly moons: MoonLedger;
  private readonly toaster: Toaster;

  constructor(store: SaveStore, moons: MoonLedger, toaster: Toaster) {
    this.store = store;
    this.moons = moons;
    this.toaster = toaster;
  }

  async execute(): Promise<void> {
    const edits = this.moons.flagEdits();
    if (edits.length === 0) return this.toaster.show("The moon flags already agree");
    if (await this.store.edit("progress", edits)) {
      this.toaster.show(`Fixed ${edits.length} value${edits.length === 1 ? "" : "s"}`);
    }
  }
}
