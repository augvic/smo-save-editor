// The window: title bar, page list, and the page being shown. Owns which page is current.

import { Dom } from "../dom/index.ts";
import type { Page } from "../pages/index.ts";
import { Transition } from "../transition/index.ts";
import type { SaveStore } from "../save_store/index.ts";
import type { NavBar } from "./nav_bar/index.ts";
import type { TopBar } from "./top_bar/index.ts";

const h = Dom.h;

export class AppShell {
  private readonly root: HTMLElement;
  private readonly store: SaveStore;
  private readonly pages: readonly Page[];
  private readonly navBar: NavBar;
  private readonly topBar: TopBar;
  private readonly main = h("main");
  private current: Page;

  constructor(root: HTMLElement, store: SaveStore, pages: readonly Page[], navBar: NavBar, topBar: TopBar) {
    this.root = root;
    this.store = store;
    this.pages = pages;
    this.navBar = navBar;
    this.topBar = topBar;
    this.current = pages[0];
  }

  start(): void {
    this.root.append(
      h("header", null, h("h1", null, "SMO Save Editor"), this.topBar.element),
      h("div", { class: "body" }, this.navBar.element, this.main),
    );
    // Only the top bar follows edits; pages keep their own inputs in sync.
    this.store.subscribe(() => {
      this.renderTopBar();
      this.refreshNavSoon();
    });
    this.renderNav();
    this.renderTopBar();
    this.show(this.current);
    window.addEventListener("keydown", (event) => this.onKey(event));
  }

  /** Ctrl+Z undoes, Ctrl+Y or Ctrl+Shift+Z redoes, unless the user is typing in a field (which has its own undo). */
  private onKey(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey)) return;
    const target = event.target as HTMLElement | null;
    if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
    const key = event.key.toLowerCase();
    const redo = key === "y" || (key === "z" && event.shiftKey);
    if (key !== "z" && key !== "y") return;
    event.preventDefault();
    const kind = this.current.needs ?? (this.store.has("progress") ? "progress" : "common");
    void (redo ? this.store.redo(kind) : this.store.undo(kind)).then((done) => { if (done) this.show(this.current); });
  }

  /** The red dots follow the save, but are worked out once the edits settle, not after every keystroke. */
  private navTimer: ReturnType<typeof setTimeout> | undefined;

  private refreshNavSoon(): void {
    clearTimeout(this.navTimer);
    this.navTimer = setTimeout(() => this.renderNav(), 200);
  }

  private isAvailable(page: Page): boolean {
    return page.needs ? this.store.has(page.needs) : this.store.open().length > 0;
  }

  private renderNav(): void {
    this.navBar.render(this.pages, this.current, (page) => this.isAvailable(page), (page) => this.show(page, page !== this.current));
  }

  private renderTopBar(): void {
    const kind = this.current.needs ?? (this.store.has("progress") ? "progress" : "common");
    this.topBar.render(() => {
      // Opening a save fades the interface in, from the empty screen.
      this.show(this.isAvailable(this.current) ? this.current : (this.pages.find((p) => this.isAvailable(p)) as Page), true);
    }, kind, () => this.show(this.current));
  }

  /** `animate` is for going to another page; drawing the same one again (after an undo, say) happens in place. */
  private show(page: Page, animate = false): void {
    this.current = page;
    this.renderNav();
    const draw = () => {
      this.main.replaceChildren();
      this.main.scrollTop = 0;
      if (!this.isAvailable(page)) {
        this.main.append(h("p", { class: "empty-state" }, page.needs === "common"
          ? "Open Common.bin to edit the game settings."
          : "Open a save file (File1.bin, File2.bin, …) to begin."));
        return;
      }
      const wrap = h("div", { class: "page" }, h("h1", null, page.title));
      this.main.append(wrap);
      page.render(wrap);
    };
    if (animate) void Transition.run(this.main, draw);
    else draw();
  }
}

export { NavBar } from "./nav_bar/index.ts";
export { TopBar } from "./top_bar/index.ts";
