// Short messages that appear at the bottom of the window and go away by themselves.

import { Dom } from "../dom/index.ts";

const h = Dom.h;

export class Toaster {
  show(message: string, kind: "ok" | "error" = "ok"): void {
    const el = h("div", { class: `toast ${kind}` }, message);
    document.body.append(el);
    setTimeout(() => {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 220);
    }, kind === "error" ? 6000 : 2500);
  }
}
