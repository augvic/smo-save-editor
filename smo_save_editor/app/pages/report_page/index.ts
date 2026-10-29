// The list of what is still missing, as text to copy.

import { Dom } from "../../dom/index.ts";
import { Icon } from "../../icon/index.ts";
import type { MissingReport } from "../../checks/index.ts";
import type { Toaster } from "../../toaster/index.ts";
import { Layout } from "../../widgets/index.ts";
import type { Page } from "../page/index.ts";

const h = Dom.h;

export class ReportPage implements Page {
  readonly title = "Report";
  readonly needs = "progress" as const;
  private readonly report: MissingReport;
  private readonly toaster: Toaster;

  constructor(report: MissingReport, toaster: Toaster) {
    this.report = report;
    this.toaster = toaster;
  }

  render(root: HTMLElement): void {
    const text = this.report.text();
    const box = h("textarea", { readonly: true, rows: "28", style: "width:100%;font-family:monospace" }, text);
    root.append(Layout.card("What is still missing", "Everything the editor knows about and the save does not have yet, for the kingdoms that are unlocked.",
      h("div", { class: "toolbar" }, h("button", {
        class: "ghost",
        onclick: async () => {
          try {
            await navigator.clipboard.writeText(text);
            this.toaster.show("Report copied");
          } catch {
            box.select();
            this.toaster.show("Copy failed: select the text and copy it", "error");
          }
        },
      }, Icon.of("copy", 14), "Copy")),
      box));
  }
}
