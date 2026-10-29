// Run with: npm run test:logic
import assert from "node:assert/strict";
import { test } from "node:test";

import { Worlds } from "../../smo_save_editor/app/game_data/worlds/index.ts";
import { OdysseyRules } from "../../smo_save_editor/app/rules/odyssey_rules/index.ts";
import { UnlockRules } from "../../smo_save_editor/app/rules/unlock_rules/index.ts";
import type { Unlock } from "../../smo_save_editor/app/rules/unlock_rules/index.ts";

const worlds = new Worlds();
const WORLD = worlds.ids;
const unlockRules = new UnlockRules(worlds);
const odyssey = new OdysseyRules(worlds);

const fresh: Unlock = { num: 1, first: 0, second: 0 };
const names = (u: Unlock) => [...unlockRules.unlockedWorlds(u)].sort((a, b) => a - b);

test("a fresh save has only the Cap Kingdom", () => {
  assert.deepEqual(names(fresh), [0]);
});

test("unlocking a world unlocks everything before it", () => {
  const u = unlockRules.unlock(WORLD.sand, fresh);
  assert.deepEqual(names(u), [0, 1, 2]);
  assert.equal(u.num, 3);
});

test("reaching Lake first makes it the first of its pair, without Wooded", () => {
  const u = unlockRules.unlock(WORLD.lake, unlockRules.unlock(WORLD.sand, fresh));
  assert.deepEqual(names(u), [0, 1, 2, WORLD.lake]);
  assert.equal(u.first, 2);
  assert.equal(unlockRules.positionOf(WORLD.lake, u), 3);
  assert.equal(unlockRules.positionOf(WORLD.wooded, u), 4);
});

test("then unlocking Wooded completes the pair", () => {
  const u = unlockRules.unlock(WORLD.wooded, unlockRules.unlock(WORLD.lake, unlockRules.unlock(WORLD.sand, fresh)));
  assert.deepEqual(names(u), [0, 1, 2, 3, 4]);
});

test("Wooded first is the default when jumping past the pair", () => {
  const u = unlockRules.unlock(WORLD.metro, fresh);
  assert.equal(u.first, 1);
  assert.deepEqual(names(u), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test("Snow first works like Lake first", () => {
  const u = unlockRules.unlock(WORLD.snow, unlockRules.unlock(WORLD.metro, fresh));
  assert.equal(u.second, 4);
  assert.deepEqual(names(u), [0, 1, 2, 3, 4, 5, 6, 7, WORLD.snow]);
});

test("locking a world locks what comes after it and forgets undecided branches", () => {
  const all = unlockRules.unlock(WORLD.bowsers, fresh);
  const u = unlockRules.lock(WORLD.wooded, all);
  assert.deepEqual(names(u), [0, 1, 2]);
  assert.equal(u.first, 0);
  assert.equal(u.second, 0);
});

test("the Cap Kingdom cannot be locked", () => {
  assert.deepEqual(unlockRules.lock(WORLD.cap, unlockRules.unlock(WORLD.sand, fresh)), unlockRules.unlock(WORLD.sand, fresh));
});

test("Odyssey level grows with unlocked kingdoms and reaches 9 only after the Moon Kingdom", () => {
  assert.equal(odyssey.homeLevel(1), 0);
  assert.equal(odyssey.homeLevel(2), 0);   // Cascade: no part of the sail yet
  assert.equal(odyssey.homeLevel(3), 1);   // Sand: arrived with one part
  assert.equal(odyssey.homeLevel(4), 2);   // Wooded: after the moons of Sand paid for the second
  assert.equal(odyssey.homeLevel(WORLD.bowsers + 1), 8);
  assert.equal(odyssey.homeLevel(WORLD.moon + 1), 9);
});

test("Odyssey story state follows the kingdoms", () => {
  assert.equal(odyssey.homeStatus(1, 0), 0);
  assert.equal(odyssey.homeStatus(2, 0), 2);
  assert.equal(odyssey.homeStatus(WORLD.lost + 1, 2), 4);
  assert.equal(odyssey.homeStatus(WORLD.metro + 1, 4), 5);
  assert.equal(odyssey.homeStatus(WORLD.moon + 1, 5), 7);
});

test("Cascade progress", () => {
  assert.equal(odyssey.waterfallProgress(1, 0, false), 0);
  assert.equal(odyssey.waterfallProgress(2, 0, true), 1);
  assert.equal(odyssey.waterfallProgress(3, 0, false), 2);
});
