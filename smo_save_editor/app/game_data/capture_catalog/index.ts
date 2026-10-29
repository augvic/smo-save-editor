// Everything Mario can capture, by the name the save keeps in /HackDictionary.

import { CAPTURES } from "./captures.ts";

export class CaptureCatalog {
  names(): readonly string[] {
    return CAPTURES.map(([id]) => id);
  }

  /** The English name the game shows for a capture. */
  label(id: string): string {
    return CAPTURES.find(([name]) => name === id)?.[1] ?? id;
  }
}
