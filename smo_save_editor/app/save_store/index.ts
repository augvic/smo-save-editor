// Which saves are open, plus a local copy of their data for drawing. The Rust side is the source
// of truth: an edit is applied to the local copy only after Rust has accepted it.

import type { BackendBridge } from "../backend_bridge/index.ts";
import type { Edit, Json, Kind } from "../save_schema/index.ts";
import type { Toaster } from "../toaster/index.ts";

export interface Doc {
  kind: Kind;
  fileName: string;
  checksumOk: boolean;
  tree: Json;
  dirty: boolean;
}

/** One change as the user would see it: a path, what it was and what it is now. */
export interface Change {
  path: string;
  from: Json;
  to: Json;
}

/** One undoable step: the edits as applied, and the edits that put the old values back. */
interface Step {
  forward: Edit[];
  inverse: Edit[];
}

const HISTORY_LIMIT = 200;

export class SaveStore {
  private readonly backend: BackendBridge;
  private readonly toaster: Toaster;
  private readonly docs: Partial<Record<Kind, Doc>> = {};
  private readonly listeners = new Set<() => void>();
  private readonly undoSteps: Partial<Record<Kind, Step[]>> = {};
  private readonly redoSteps: Partial<Record<Kind, Step[]>> = {};
  /** What differs from the file as opened (or last saved): the first value seen for each path. */
  private readonly baseline: Partial<Record<Kind, Map<string, Json>>> = {};
  /** Edits run one at a time, in the order they were asked for (see `editWith`). */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(backend: BackendBridge, toaster: Toaster) {
    this.backend = backend;
    this.toaster = toaster;
  }

  /** Call `fn` after every change. Returns a function that stops the calls. */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  has(kind: Kind): boolean {
    return this.docs[kind] !== undefined;
  }

  doc(kind: Kind): Doc | undefined {
    return this.docs[kind];
  }

  /** The open saves, for the ones that exist. */
  open(): Doc[] {
    return [this.docs.progress, this.docs.common].filter((doc): doc is Doc => doc !== undefined);
  }

  /** Read a value, e.g. get<boolean>("progress", "/ShineData/3/IsGet"). */
  get<T>(kind: Kind, path: string): T {
    let node: unknown = this.docs[kind]?.tree;
    for (const key of path.split("/").filter(Boolean)) {
      if (node === null || typeof node !== "object") return undefined as T;
      node = (node as Record<string, unknown>)[key];
    }
    return node as T;
  }

  /**
   * Let the user pick one or more saves and open them. Returns the kinds that were opened.
   * A progress save and Common.bin can be open together; a second progress save replaces the first.
   */
  async openSaves(): Promise<Kind[]> {
    const paths = await this.backend.pickSavesToOpen();
    const opened: Kind[] = [];
    for (const path of paths) {
      try {
        const loaded = await this.backend.openSave(path);
        this.docs[loaded.kind] = { ...loaded, dirty: false };
        this.undoSteps[loaded.kind] = [];
        this.redoSteps[loaded.kind] = [];
        this.baseline[loaded.kind] = new Map();
        opened.push(loaded.kind);
      } catch (e) {
        this.toaster.show(`${path.split(/[\\/]/).pop()}: ${e}`, "error");
      }
    }
    if (new Set(opened).size < opened.length) {
      this.toaster.show("Two files of the same kind were chosen; only the last one is open.", "error");
    }
    if (opened.length > 0) this.notify();
    return opened;
  }

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(job);
    this.queue = run.catch(() => undefined);
    return run;
  }

  /**
   * Let the user pick a save and read it without opening it: its name and data, to copy from or compare with.
   * Returns null if they cancelled or the file is not a progress save.
   */
  async peek(): Promise<{ fileName: string; tree: Json } | null> {
    const [path] = await this.backend.pickSavesToOpen();
    if (!path) return null;
    try {
      const loaded = await this.backend.openSave(path);
      if (loaded.kind !== "progress") {
        this.toaster.show("That is not a save slot (File1.bin, …)", "error");
        return null;
      }
      return { fileName: path.split(/[\\/]/).pop() ?? path, tree: loaded.tree };
    } catch (e) {
      this.toaster.show(String(e), "error");
      return null;
    }
  }

  /** `record` false is for undo and redo themselves, which move through the history instead of adding to it. */
  private async apply(kind: Kind, edits: Edit[], record = true): Promise<boolean> {
    const doc = this.docs[kind];
    if (!doc || edits.length === 0) return false;
    const inverse: Edit[] = edits.map(([path]) => [path, this.get<Json>(kind, path)]);
    try {
      await this.backend.setValues(kind, edits);
    } catch (e) {
      this.toaster.show(String(e), "error");
      return false;
    }
    for (const [path, value] of edits) {
      const keys = path.split("/").filter(Boolean);
      const last = keys.pop() as string;
      let parent: unknown = doc.tree;
      for (const key of keys) parent = (parent as Record<string, unknown>)[key];
      (parent as Record<string, unknown>)[last] = value;
    }
    doc.dirty = true;
    const base = (this.baseline[kind] ??= new Map());
    inverse.forEach(([path, old]) => { if (!base.has(path)) base.set(path, old); });
    if (record) {
      const undo = (this.undoSteps[kind] ??= []);
      undo.push({ forward: edits, inverse });
      if (undo.length > HISTORY_LIMIT) undo.shift();
      this.redoSteps[kind] = [];
    }
    this.notify();
    return true;
  }

  canUndo(kind: Kind): boolean {
    return (this.undoSteps[kind]?.length ?? 0) > 0;
  }

  canRedo(kind: Kind): boolean {
    return (this.redoSteps[kind]?.length ?? 0) > 0;
  }

  /** Put back what the last edit changed. Returns false if there is nothing to undo. */
  undo(kind: Kind): Promise<boolean> {
    return this.enqueue(async () => {
      const step = this.undoSteps[kind]?.pop();
      if (!step) return false;
      if (!(await this.apply(kind, step.inverse, false))) { this.undoSteps[kind]?.push(step); return false; }
      (this.redoSteps[kind] ??= []).push(step);
      return true;
    });
  }

  /** Do again what the last undo took back. */
  redo(kind: Kind): Promise<boolean> {
    return this.enqueue(async () => {
      const step = this.redoSteps[kind]?.pop();
      if (!step) return false;
      if (!(await this.apply(kind, step.forward, false))) { this.redoSteps[kind]?.push(step); return false; }
      (this.undoSteps[kind] ??= []).push(step);
      return true;
    });
  }

  /** What differs now from the file as opened or last saved, in the order the first edit touched it. */
  changes(kind: Kind): Change[] {
    const result: Change[] = [];
    this.baseline[kind]?.forEach((from, path) => {
      const to = this.get<Json>(kind, path);
      if (JSON.stringify(from) !== JSON.stringify(to)) result.push({ path, from, to });
    });
    return result;
  }

  /** Apply edits. Returns false, after showing why, if the backend rejected them. */
  edit(kind: Kind, edits: Edit[]): Promise<boolean> {
    return this.enqueue(() => this.apply(kind, edits));
  }

  /**
   * Like `edit`, but the edits are worked out when their turn comes. Use this when they depend on
   * the current data (a running total, say), so that rapid changes cannot read stale values.
   */
  editWith(kind: Kind, build: () => Edit[]): Promise<boolean> {
    return this.enqueue(() => this.apply(kind, build()));
  }

  async saveDoc(kind: Kind): Promise<void> {
    const doc = this.docs[kind];
    if (!doc) return;
    const path = await this.backend.pickSaveToWrite(doc.fileName);
    if (!path) return;
    try {
      await this.backend.writeSave(kind, path);
      doc.dirty = false;
      this.baseline[kind] = new Map();
      this.notify();
      this.toaster.show(`Saved ${path.split(/[\\/]/).pop()}`, "ok");
    } catch (e) {
      this.toaster.show(String(e), "error");
    }
  }
}
