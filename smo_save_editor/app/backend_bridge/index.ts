// What the interface needs from the Rust backend and the system's file dialogs. The rest of the
// app depends on this contract, never on Tauri, so a stand-in can replace it (see MockBackend).

import type { Edit, Kind, Loaded } from "../save_schema/index.ts";

export interface BackendBridge {
  /** Ask the user which saves to open (one or several). Their paths; empty if they cancelled. */
  pickSavesToOpen(): Promise<string[]>;
  /** Ask the user where to write a save. A path, or null if they cancelled. */
  pickSaveToWrite(defaultName: string): Promise<string | null>;
  openSave(path: string): Promise<Loaded>;
  setValues(kind: Kind, edits: Edit[]): Promise<void>;
  writeSave(kind: Kind, path: string): Promise<void>;
}

export { MockBackend } from "./mock_backend/index.ts";
export { TauriBackend } from "./tauri_backend/index.ts";
