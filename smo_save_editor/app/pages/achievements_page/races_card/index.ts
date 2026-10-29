// The race records the game keeps: whether each race was won, and the best time.

import { Dom } from "../../../dom/index.ts";
import { RaceTime } from "../../../rules/index.ts";
import type { SaveStore } from "../../../save_store/index.ts";
import { CheckField, Layout } from "../../../widgets/index.ts";

const h = Dom.h;
const K = "progress";

interface RaceEntry {
  IsExistRecord: boolean;
  IsWin: boolean;
  LapRecord: number;
  Record: number;
}

export class RacesCard {
  private readonly store: SaveStore;

  constructor(store: SaveStore) {
    this.store = store;
  }

  /** "RaceManRace_3" -> "Race Man Race 3" */
  private label(key: string): string {
    return Dom.humanize(key.replace(/_/g, " "));
  }

  private timeField(path: string, label: string): HTMLElement {
    const value = () => Number(this.store.get<number>(K, path));
    const show = (n: number) => (n >= RaceTime.NONE ? "" : RaceTime.format(n));
    const input = h("input", { type: "text", placeholder: "none", value: show(value()), size: "8" });
    input.addEventListener("change", async () => {
      const parsed = input.value.trim() === "" ? RaceTime.NONE : RaceTime.parse(input.value);
      if (parsed === undefined || !(await this.store.edit(K, [[path, parsed]]))) input.value = show(value());
      else input.value = show(parsed);
    });
    const stop = this.store.subscribe(() => (input.isConnected ? (document.activeElement !== input && (input.value = show(value()))) : stop()));
    return h("label", { class: "field" }, h("span", null, label), input);
  }

  build(): HTMLElement | null {
    const records = this.store.get<Record<string, RaceEntry> | undefined>(K, "/RaceRecord");
    if (!records) return null;
    return Layout.card("Races", "Best times as m:ss.cc, empty for none. The game's own names for the races are not in the data, so these are its internal ones.",
      Layout.grid(...Object.keys(records).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).flatMap((key) => [
        h("div", { class: "field" }, h("strong", null, this.label(key))),
        new CheckField(this.store, K, `/RaceRecord/${key}/IsWin`, "Won").element,
        this.timeField(`/RaceRecord/${key}/Record`, "Best time"),
        this.timeField(`/RaceRecord/${key}/LapRecord`, "Best lap"),
      ])));
  }
}
