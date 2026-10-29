// A searchable list of on/off switches with a counter and bulk actions. Used for moons, purple
// coins and achievements, which are all "a long array of { ..., IsGet: bool }".

import { Dom } from "../../dom/index.ts";
import type { Edit, Kind } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

const h = Dom.h;

/** One switch that changed: the item's position in the array and its new state. */
export interface FlagChange {
  index: number;
  value: boolean;
}

export interface FlagListOptions<T extends { IsGet: boolean }> {
  kind: Kind;
  /** Path of the array, e.g. "/ShineData". */
  path: string;
  /** Plural noun for the counter, e.g. "moons". */
  noun: string;
  idOf: (item: T, index: number) => string;
  /** Show the ID column. Default true. */
  showId?: boolean;
  /** A readable name for an item, if known. */
  nameOf?: (item: T) => string | undefined;
  /** Only list items this accepts (e.g. the moons of one kingdom). Counter and bulk actions follow. */
  include?: (item: T) => boolean;
  /** Extra edits to apply together with a change, e.g. to keep related counters in step. */
  alsoSet?: (changes: FlagChange[]) => Edit[];
  /** List by ascending numeric ID instead of the order stored in the save. */
  sortById?: boolean;
  /** A short remark shown after an item, re-read whenever the save changes; "!" at the start marks a warning. */
  noteOf?: (item: T, index: number) => string | undefined;
  /** Groups to filter by: a choice in the toolbar that keeps only the items a group's test accepts. */
  groups?: readonly { label: string; test: (item: T) => boolean }[];
  /** Items that cannot be switched on right now (switching one off is always allowed). */
  lockedOn?: (item: T, index: number) => boolean;
  /** How many of the listed items must stay on (e.g. coins already spent). Switching more off is refused. */
  keepOn?: () => number;
  /** Why an item cannot be switched off while `keepOn` holds it. */
  keepReason?: string;
}

export class FlagList<T extends { IsGet: boolean }> {
  readonly element: HTMLElement;
  private readonly store: SaveStore;
  private readonly options: FlagListOptions<T>;
  private readonly counter = h("strong");
  private readonly search = h("input", { type: "search", placeholder: "Search…" });
  private readonly filter = h("select", null,
    h("option", { value: "all" }, "All"),
    h("option", { value: "on" }, "Collected"),
    h("option", { value: "off" }, "Missing"),
  );
  private readonly group = h("select");
  private readonly rows = h("div", { class: "rows" });
  private readonly boxes = new Map<number, HTMLInputElement>();
  private readonly notes = new Map<number, HTMLElement>();

  constructor(store: SaveStore, options: FlagListOptions<T>) {
    this.store = store;
    this.options = options;
    this.search.addEventListener("input", () => this.render());
    this.filter.addEventListener("change", () => this.render());
    this.group.append(h("option", { value: "-1" }, "Any kind"), ...(options.groups ?? []).map((g, i) => h("option", { value: String(i) }, g.label)));
    this.group.addEventListener("change", () => this.render());
    this.render();
    // Other parts of the page (the shop) can change how many items must stay on.
    const stop = store.subscribe(() => (this.rows.isConnected ? this.applyLocks() : stop()));
    this.element = h("div", { class: "flaglist" },
      h("div", { class: "counter-line" }, this.counter),
      h("div", { class: "toolbar" },
        this.search,
        this.filter,
        options.groups && h("span", null, this.group),
        h("button", { class: "ghost", onclick: () => this.bulk(true) }, "Collect shown"),
        h("button", { class: "ghost", onclick: () => this.bulk(false) }, "Clear shown"),
      ),
      this.rows,
    );
  }

  private items(): T[] {
    return this.store.get<T[] | undefined>(this.options.kind, this.options.path) ?? [];
  }

  /** Indices of the items this list is about, in display order. */
  private pool(): number[] {
    const { include, sortById, idOf } = this.options;
    const all = this.items();
    const order = all.map((_, i) => i).filter((i) => include?.(all[i]) ?? true);
    if (sortById) {
      const id = (i: number) => Number(idOf(all[i], i));
      order.sort((a, b) => id(a) - id(b));
    }
    return order;
  }

  private visible(): number[] {
    const q = this.search.value.trim().toLowerCase();
    const all = this.items();
    const { idOf, nameOf } = this.options;
    return this.pool().filter((i) => {
      const item = all[i];
      if (this.filter.value === "on" && !item.IsGet) return false;
      if (this.filter.value === "off" && item.IsGet) return false;
      const wanted = this.options.groups?.[Number(this.group.value)];
      if (wanted && !wanted.test(item)) return false;
      if (!q) return true;
      return [idOf(item, i), nameOf?.(item) ?? ""].join(" ").toLowerCase().includes(q);
    });
  }

  /** Items that can still be switched off before the ones that have to stay on are reached. */
  private spare(): number {
    const { keepOn } = this.options;
    if (!keepOn) return Infinity;
    const all = this.items();
    return this.pool().filter((i) => all[i].IsGet).length - keepOn();
  }

  /** Disable the switches that would drop below what has to stay on, and enable the rest. */
  private applyLocks(): void {
    const all = this.items();
    const locked = this.spare() <= 0;
    for (const [i, box] of this.boxes) {
      box.checked = Boolean(all[i]?.IsGet);
      box.disabled = (locked && box.checked) || (!box.checked && Boolean(this.options.lockedOn?.(all[i], i)));
      box.parentElement?.setAttribute("title", box.disabled ? this.options.keepReason ?? "" : box.parentElement.getAttribute("data-id") ?? "");
    }
    const { noteOf } = this.options;
    for (const [i, note] of this.notes) {
      const text = noteOf?.(all[i], i) ?? "";
      note.textContent = text.replace(/^!/, "");
      note.className = text.startsWith("!") ? "note-small warn" : "note-small";
    }
    this.updateCounter();
  }

  private updateCounter(): void {
    const all = this.items();
    const mine = this.pool();
    const on = mine.filter((i) => all[i].IsGet).length;
    this.counter.textContent = `${on} / ${mine.length} ${this.options.noun} collected`;
  }

  private render(): void {
    const { kind, path, idOf, nameOf, showId = true, alsoSet } = this.options;
    this.updateCounter();
    const shown = this.visible();
    this.boxes.clear();
    this.notes.clear();
    this.rows.replaceChildren(
      ...shown.map((i) => {
        const item = this.items()[i];
        const box = h("input", { type: "checkbox", checked: Boolean(item.IsGet) });
        box.addEventListener("change", async () => {
          const change: FlagChange = { index: i, value: box.checked };
          const ok = await this.store.editWith(kind, () => [
            [`${path}/${i}/IsGet`, change.value],
            ...(alsoSet?.([change]) ?? []),
          ]);
          if (!ok) box.checked = Boolean(this.items()[i].IsGet);
          this.applyLocks();
        });
        this.boxes.set(i, box);
        const note = this.options.noteOf ? h("span", { class: "note-small" }) : null;
        if (note) this.notes.set(i, note);
        const name = nameOf?.(item);
        return h("label", { class: "row", title: idOf(item, i), "data-id": idOf(item, i) },
          box,
          showId && h("span", { class: "id" }, idOf(item, i)),
          nameOf && h("span", { class: name ? "name" : "name unknown" }, name ?? "—"),
          note,
        );
      }),
    );
    if (shown.length === 0) this.rows.append(h("p", { class: "empty" }, "Nothing matches."));
    this.applyLocks();
  }

  private async bulk(value: boolean): Promise<void> {
    const { kind, path, alsoSet } = this.options;
    let candidates = this.visible();
    if (value && this.options.lockedOn) {
      const all = this.items();
      candidates = candidates.filter((i) => !this.options.lockedOn?.(all[i], i));
    }
    if (!value) {
      // Switch off only as many as can go without dropping below what has to stay on.
      const all = this.items();
      candidates = candidates.filter((i) => all[i].IsGet).slice(0, Math.max(0, this.spare()));
    }
    const changes: FlagChange[] = candidates.map((index) => ({ index, value }));
    const edits: Edit[] = changes.map(({ index }) => [`${path}/${index}/IsGet`, value]);
    if (await this.store.editWith(kind, () => [...edits, ...(alsoSet?.(changes) ?? [])])) this.render();
  }
}
