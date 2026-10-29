// A stand-in backend for running the interface in a plain browser (`npm run dev`, no Tauri). It
// serves two fixtures from /public (dev-fixture-progress.json, dev-fixture-common.json), accepts
// every edit and writes nothing.

import type { BackendBridge } from "../index.ts";
import type { Edit, Json, Kind, Loaded } from "../../save_schema/index.ts";

export class MockBackend implements BackendBridge {
  private readonly twoFiles: boolean;
  private opened = 0;

  /** `?pick=2` in the address makes "open" return a progress save and Common.bin together. */
  constructor(search: string) {
    this.twoFiles = new URLSearchParams(search).get("pick") === "2";
  }

  async pickSavesToOpen(): Promise<string[]> {
    return this.twoFiles ? ["mock", "mock"] : ["mock"];
  }

  async pickSaveToWrite(defaultName: string): Promise<string | null> {
    return `mock/${defaultName}`;
  }

  async openSave(_path: string): Promise<Loaded> {
    const kind: Kind = this.opened++ % 2 === 0 ? "progress" : "common";
    const response = await fetch(`/dev-fixture-${kind}.json`);
    const tree = (await response.json()) as Json;
    return { kind, fileName: kind === "progress" ? "File1.bin" : "Common.bin", checksumOk: true, tree };
  }

  async setValues(_kind: Kind, _edits: Edit[]): Promise<void> {}

  async writeSave(_kind: Kind, _path: string): Promise<void> {}
}
