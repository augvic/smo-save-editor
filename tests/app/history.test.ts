// Undo, redo and the list of changes in the save store, with a backend that accepts everything.
import assert from "node:assert/strict";
import { test } from "node:test";

import type { BackendBridge } from "../../smo_save_editor/app/backend_bridge/index.ts";
import type { Edit, Kind, Loaded } from "../../smo_save_editor/app/save_schema/index.ts";
import { SaveStore } from "../../smo_save_editor/app/save_store/index.ts";
import type { Toaster } from "../../smo_save_editor/app/toaster/index.ts";

class FakeBackend implements BackendBridge {
  applied: Edit[][] = [];
  async pickSavesToOpen(): Promise<string[]> { return ["File1.bin"]; }
  async pickSaveToWrite(): Promise<string | null> { return "out.bin"; }
  async openSave(): Promise<Loaded> {
    return { kind: "progress", fileName: "File1.bin", checksumOk: true, tree: { A: 1, B: { C: true }, List: [0, 0] } } as Loaded;
  }
  async setValues(_kind: Kind, edits: Edit[]): Promise<void> { this.applied.push(edits); }
  async writeSave(): Promise<void> {}
}

async function openStore() {
  const store = new SaveStore(new FakeBackend(), { show() {} } as unknown as Toaster);
  await store.openSaves();
  return store;
}

test("undo puts the old values back as one step, and redo does it again", async () => {
  const store = await openStore();
  await store.edit("progress", [["/A", 5], ["/B/C", false]]);
  await store.edit("progress", [["/A", 9]]);
  assert.equal(store.canUndo("progress"), true);

  await store.undo("progress");
  assert.equal(store.get<number>("progress", "/A"), 5);
  await store.undo("progress");
  assert.equal(store.get<number>("progress", "/A"), 1);
  assert.equal(store.get<boolean>("progress", "/B/C"), true);       // both values of the first edit came back
  assert.equal(store.canUndo("progress"), false);

  await store.redo("progress");
  assert.equal(store.get<number>("progress", "/A"), 5);
  assert.equal(store.get<boolean>("progress", "/B/C"), false);
});

test("a new edit after an undo drops what could have been redone", async () => {
  const store = await openStore();
  await store.edit("progress", [["/A", 2]]);
  await store.undo("progress");
  await store.edit("progress", [["/A", 3]]);
  assert.equal(store.canRedo("progress"), false);
});

test("changes list the first value seen, drop what went back, and start over after saving", async () => {
  const store = await openStore();
  await store.edit("progress", [["/A", 2]]);
  await store.edit("progress", [["/A", 3], ["/List/1", 7]]);
  assert.deepEqual(store.changes("progress"), [{ path: "/A", from: 1, to: 3 }, { path: "/List/1", from: 0, to: 7 }]);

  await store.edit("progress", [["/A", 1]]);
  assert.deepEqual(store.changes("progress").map((c) => c.path), ["/List/1"]);

  await store.saveDoc("progress");
  assert.deepEqual(store.changes("progress"), []);
});
