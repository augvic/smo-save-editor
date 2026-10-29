// Copy parts of another save into this one, and see how the two differ, section by section.

import { SaveImport } from "../../actions/index.ts";
import { Dom } from "../../dom/index.ts";
import { Icon } from "../../icon/index.ts";
import type { Worlds } from "../../game_data/index.ts";
import type { Edit, Json } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import type { Toaster } from "../../toaster/index.ts";
import { Layout } from "../../widgets/index.ts";
import type { Page } from "../page/index.ts";

const h = Dom.h;

export class ImportPage implements Page {
  readonly title = "Import";
  readonly needs = "progress" as const;
  private readonly store: SaveStore;
  private readonly importer: SaveImport;
  private readonly worlds: Worlds;
  private readonly toaster: Toaster;
  private other: { fileName: string; tree: Json } | null = null;
  /** What is ticked: "section" for a whole-save section, "section:kingdom" for one kingdom of the others. */
  private readonly chosen = new Set<string>();

  constructor(store: SaveStore, importer: SaveImport, worlds: Worlds, toaster: Toaster) {
    this.store = store;
    this.importer = importer;
    this.worlds = worlds;
    this.toaster = toaster;
  }

  private chosenEdits(): Edit[] {
    if (!this.other) return [];
    const { tree } = this.other;
    const edits = new Map<string, Json>();
    for (const section of SaveImport.SECTIONS) {
      const kingdoms = [...Array(this.worlds.count).keys()].filter((k) => this.chosen.has(`${section.id}:${k}`));
      const wanted = section.perKingdom ? kingdoms.length > 0 : this.chosen.has(section.id);
      if (wanted) this.importer.edits(section.id, tree, kingdoms).forEach(([path, value]) => edits.set(path, value));
    }
    return [...edits];
  }

  render(root: HTMLElement): void {
    const pick = h("button", {
      onclick: async () => {
        const picked = await this.store.peek();
        if (!picked) return;
        this.other = picked;
        this.chosen.clear();
        this.render(root);
      },
    }, Icon.of("file"), this.other ? "Choose another save…" : "Choose a save…");

    const sections = this.other ? SaveImport.SECTIONS.map((section) => this.sectionRow(section)) : [];
    const apply = h("button", {
      class: "primary",
      disabled: !this.other,
      onclick: async () => {
        const edits = this.chosenEdits();
        if (edits.length === 0) return this.toaster.show("Nothing ticked differs from this save");
        if (await this.store.edit("progress", edits)) {
          this.toaster.show(`Copied ${edits.length} value${edits.length === 1 ? "" : "s"} (Undo takes them back)`);
          this.chosen.clear();
          this.render(root);
        }
      },
    }, "Copy ticked parts into this save");

    root.replaceChildren(
      Layout.card("Another save", "Pick a save to compare with. Each section shows how many values differ from the open save; tick what to copy, nothing changes until you press the button.",
        pick,
        this.other && h("p", { class: "note" }, `Comparing with ${this.other.fileName}`)),
      ...(this.other ? [Layout.card("Differences", null, h("div", { class: "rows" }, ...sections), apply)] : []),
    );
  }

  private sectionRow(section: (typeof SaveImport.SECTIONS)[number]): HTMLElement {
    const tree = (this.other as { tree: Json }).tree;
    const box = (key: string, label: string, count: number) => {
      const input = h("input", { type: "checkbox", checked: this.chosen.has(key), disabled: count === 0 });
      input.addEventListener("change", () => { if (input.checked) this.chosen.add(key); else this.chosen.delete(key); });
      return h("label", { class: "chip", title: `${count} differ` }, input, ` ${label}${count > 0 ? ` (${count})` : ""}`);
    };
    if (!section.perKingdom) {
      const count = this.importer.edits(section.id, tree).length;
      return h("div", { class: "row" }, h("span", { class: "name" }, section.label), box(section.id, count === 0 ? "same" : "copy", count));
    }
    const kingdoms = [...Array(this.worlds.count).keys()].map((k) => ({ k, count: this.importer.edits(section.id, tree, [k]).length })).filter((x) => x.count > 0);
    return h("div", { class: "row" }, h("span", { class: "name" }, section.label),
      kingdoms.length === 0 ? h("span", { class: "id-small" }, "same") : h("span", null, ...kingdoms.map(({ k, count }) => box(`${section.id}:${k}`, this.worlds.name(k).replace(" Kingdom", ""), count))));
  }
}
