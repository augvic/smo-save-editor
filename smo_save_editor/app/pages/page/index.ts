// What every page offers the app shell.

import type { Kind } from "../../save_schema/index.ts";

export interface Page {
  readonly title: string;
  /** Which save has to be open for this page; null means either. */
  readonly needs: Kind | null;
  /** How many things the page wants to point out; the navigation shows a red dot when it is not 0. Optional. */
  badge?(): number;
  /** Draw the page into `root`. */
  render(root: HTMLElement): void;
}
