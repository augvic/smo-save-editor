// Achievements are stored by an internal name such as "Shine_Gather_1": a category, then a label.

import { Dom } from "../../dom/index.ts";
import type { AchievementCatalog } from "../../game_data/index.ts";
import type { AchievementEntry } from "../../save_schema/index.ts";
import type { SaveStore } from "../../save_store/index.ts";
import { FlagList, Layout } from "../../widgets/index.ts";
import type { AchievementLedger } from "../../ledgers/index.ts";
import type { CapturesCard } from "./captures_card/index.ts";
import type { MusicCard } from "./music_card/index.ts";
import type { RacesCard } from "./races_card/index.ts";
import type { Page } from "../page/index.ts";

const CATEGORIES: readonly (readonly [prefix: string, title: string])[] = [
  ["Scenario", "Story"],
  ["Shine", "Power Moon challenges"],
  ["MiniGame", "Mini-games"],
  ["Souvenir", "Souvenirs"],
  ["Capture", "Captures"],
  ["Costume", "Costumes"],
  ["Other", "Other"],
];

export class AchievementsPage implements Page {
  readonly title = "Achievements";
  readonly needs = "progress" as const;
  private readonly store: SaveStore;
  private readonly goals: AchievementCatalog;
  private readonly captures: CapturesCard;
  private readonly music: MusicCard;
  private readonly races: RacesCard;
  private readonly progress: AchievementLedger;

  constructor(store: SaveStore, goals: AchievementCatalog, captures: CapturesCard, music: MusicCard, races: RacesCard, progress: AchievementLedger) {
    this.progress = progress;
    this.music = music;
    this.races = races;
    this.store = store;
    this.goals = goals;
    this.captures = captures;
  }

  /** The game's own name for it, or "Shine_CaptainKinopio_1" -> "Captain Kinopio 1" when it has none. */
  private label(name: string): string {
    return this.goals.title(name) ?? Dom.humanize(name.slice(name.indexOf("_") + 1).replace(/_/g, " "));
  }

  render(root: HTMLElement): void {
    const races = this.races.build();
    root.append(
      this.captures.build(),
      this.music.build(),
      ...(races ? [races] : []),
      ...CATEGORIES.map(([prefix, title]) =>
        Layout.card(title, null, new FlagList<AchievementEntry>(this.store, {
          kind: "progress",
          path: "/AchievementSaveData",
          noun: "achievements",
          showId: false,
          include: (item) => item.Name.startsWith(`${prefix}_`),
          idOf: (item) => item.Name,
          nameOf: (item) => this.label(item.Name),
          noteOf: (item) => {
            const goal = this.goals.goal(item.Name);
            const counted = this.progress.progress(item.Name);
            const goalText = goal === undefined ? "" : counted ? `${counted.have} / ${goal} ${counted.what}` : `goal: ${goal}`;
            return [this.goals.hint(item.Name), goalText].filter(Boolean).join(" · ") || undefined;
          },
        }).element),
      ),
    );
  }
}

export { CapturesCard } from "./captures_card/index.ts";
export { MusicCard } from "./music_card/index.ts";
export { RacesCard } from "./races_card/index.ts";
