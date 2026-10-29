// Moving from one view to another: what is on screen fades out, the new view is built, and its parts
// rise in one after the other. Only used when the user goes somewhere, never when a view redraws itself
// after an edit, so typing never makes the page flicker.

export type Direction = "forward" | "back" | "none";

const OUT_MS = 130;
const IN_MS = 260;
const STAGGER_MS = 35;
const MAX_STAGGERED = 14;

/** The latest move asked for on each container; an older one that is still fading out gives way to it. */
const latest = new WeakMap<Element, number>();

export class Transition {
  private static reduced(): boolean {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** A page keeps its parts one level down: they are what rises in, not the page as a whole. */
  private static parts(host: Element): Element[] {
    const only = host.children.length === 1 ? host.firstElementChild : null;
    return [...(only?.classList.contains("page") ? only.children : host.children)];
  }

  /**
   * Replace what `host` shows. `change` swaps the content (synchronously); the old content fades out
   * first and the new one slides in from the side `direction` says (up for "none").
   */
  static async run(host: HTMLElement, change: () => void, direction: Direction = "none"): Promise<void> {
    const ticket = (latest.get(host) ?? 0) + 1;
    latest.set(host, ticket);
    const animated = !this.reduced() && typeof host.animate === "function";
    const dx = direction === "forward" ? 1 : direction === "back" ? -1 : 0;

    if (animated && host.children.length > 0) {
      const leaving = [...host.children].map((el) =>
        el.animate(
          [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translate(${-14 * dx}px, ${dx === 0 ? -6 : 0}px)` }],
          { duration: OUT_MS, easing: "ease-in", fill: "forwards" },
        ).finished.catch(() => undefined));
      // A window that is not being drawn does not run animations: do not wait for them forever.
      await Promise.race([Promise.all(leaving), new Promise((done) => setTimeout(done, OUT_MS + 60))]);
      if (latest.get(host) !== ticket) return;
    }

    change();
    if (!animated) return;
    this.parts(host).slice(0, MAX_STAGGERED).forEach((el, i) => {
      el.animate(
        [{ opacity: 0, transform: `translate(${18 * dx}px, ${dx === 0 ? 12 : 0}px)` }, { opacity: 1, transform: "none" }],
        { duration: IN_MS, delay: i * STAGGER_MS, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" },
      );
    });
  }
}
