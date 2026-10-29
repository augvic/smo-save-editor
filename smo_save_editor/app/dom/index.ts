// Building DOM elements and the one text helper the interface needs.

export type Child = Node | string | null | undefined | false;
export type Props = Record<string, unknown> | null;

export class Dom {
  /** Create an element: Dom.h("div", { class: "card" }, "text", childElement). */
  static h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: Props = null,
    ...children: Child[]
  ): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
      if (value == null || value === false) continue;
      if (key.startsWith("on") && typeof value === "function") {
        el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
      } else if (key === "class") {
        el.className = String(value);
      } else if (key === "list" || !(key in el)) {
        el.setAttribute(key, String(value));
      } else {
        Reflect.set(el, key, value);
      }
    }
    for (const child of children) if (child) el.append(child);
    return el;
  }

  /** "UseCoinCollectNum" -> "Use Coin Collect Num" */
  static humanize(name: string): string {
    return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  }
}
