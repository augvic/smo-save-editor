// The real backend: Rust commands over Tauri, and the operating system's file dialogs.

import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";

import type { BackendBridge } from "../index.ts";
import type { Edit, Kind, Loaded } from "../../save_schema/index.ts";

const FILTERS = [{ name: "Odyssey save", extensions: ["bin"] }];

export class TauriBackend implements BackendBridge {
  async pickSavesToOpen(): Promise<string[]> {
    return (await open({ multiple: true, filters: FILTERS })) ?? [];
  }

  pickSaveToWrite(defaultName: string): Promise<string | null> {
    return save({ defaultPath: defaultName, filters: FILTERS });
  }

  openSave(path: string): Promise<Loaded> {
    return invoke<Loaded>("open_save", { path });
  }

  setValues(kind: Kind, edits: Edit[]): Promise<void> {
    return invoke("set_values", { kind, edits });
  }

  writeSave(kind: Kind, path: string): Promise<void> {
    return invoke("write_save", { kind, path });
  }
}
