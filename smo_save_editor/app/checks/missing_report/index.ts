// A plain-text list of what is still missing in the save, kingdom by kingdom, to keep while playing.

import type { UnlockState } from "../../actions/index.ts";
import type { AchievementCatalog, CaptureCatalog, CheckpointCatalog, MoonCatalog, MusicCatalog, StageCatalog, Worlds } from "../../game_data/index.ts";
import type { CaptureLedger, CoinLedger, MoonLedger, MusicLedger, VisitLedger, WardrobeLedger } from "../../ledgers/index.ts";
import { CheckpointLedger } from "../../ledgers/index.ts";
import type { UnlockRules } from "../../rules/index.ts";
import type { AchievementEntry, ShineEntry } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";

export class MissingReport {
  private readonly p: {
    store: SaveStore; worlds: Worlds; moons: MoonLedger; moonCatalog: MoonCatalog; coins: CoinLedger; wardrobe: WardrobeLedger;
    checkpointCatalog: CheckpointCatalog; checkpoints: CheckpointLedger; stages: StageCatalog; visits: VisitLedger;
    captures: CaptureLedger; captureCatalog: CaptureCatalog; music: MusicLedger; musicCatalog: MusicCatalog;
    achievements: AchievementCatalog; unlockRules: UnlockRules; unlockState: UnlockState;
  };

  constructor(parts: MissingReport["p"]) {
    this.p = parts;
  }

  /** The report as Markdown. Only kingdoms that are unlocked are listed. */
  text(): string {
    const p = this.p;
    const open = [...p.unlockRules.unlockedWorlds(p.unlockState.read())].sort((a, b) => a - b);
    const shine = p.store.get<ShineEntry[]>("progress", "/ShineData");
    const reached = p.checkpoints.reached();
    const visited = p.visits.visited();
    const lines: string[] = ["# What is still missing", ""];

    for (const world of open) {
      const name = p.worlds.name(world);
      const missingMoons = shine.filter((m) => !m.IsGet && p.moons.kingdomOf(m) === world).map((m) => p.moonCatalog.name(m.UniqueId) ?? `Moon #${m.UniqueId}`);
      const coins = p.coins.stats(world);
      const items = p.wardrobe.catalog.lists.flatMap(({ path }) => {
        const owned = new Set(p.wardrobe.ownedNames(path));
        return p.wardrobe.entriesOf(path, name).filter(([id]) => !owned.has(id)).map(([, item]) => item);
      });
      const checkpoints = p.checkpointCatalog.of(world).filter((c) => !reached.has(CheckpointLedger.key(c.stage, c.obj))).map((c) => c.name);
      const areas = p.stages.visitable(world).filter((a) => !visited.has(a.stage)).map((a) => a.name);

      lines.push(`## ${name}`);
      lines.push(`- Power Moons (${missingMoons.length}): ${missingMoons.join("; ") || "none"}`);
      if (coins) lines.push(`- Purple coins: ${coins.total - coins.have} of ${coins.total} missing`);
      if (items.length > 0) lines.push(`- Shop items (${items.length}): ${items.join("; ")}`);
      if (checkpoints.length > 0) lines.push(`- Checkpoints (${checkpoints.length}): ${checkpoints.join("; ")}`);
      if (areas.length > 0) lines.push(`- Side areas (${areas.length}): ${areas.join("; ")}`);
      lines.push("");
    }

    const captures = p.captureCatalog.names().filter((id) => !p.captures.owned().has(id)).map((id) => p.captureCatalog.label(id));
    const heard = p.music.collected();
    const tracks = p.musicCatalog.tracks().filter((t) => !heard.has(t.id)).map((t) => t.title);
    const achievements = p.store.get<AchievementEntry[]>("progress", "/AchievementSaveData").filter((a) => !a.IsGet)
      .map((a) => p.achievements.title(a.Name) ?? a.Name);
    lines.push("## Everywhere");
    lines.push(`- Captures (${captures.length}): ${captures.join("; ") || "none"}`);
    lines.push(`- Music (${tracks.length}): ${tracks.join("; ") || "none"}`);
    lines.push(`- Achievements (${achievements.length}): ${achievements.join("; ") || "none"}`, "");
    return lines.join("\n");
  }
}
