// SMO Save Editor, and the composition root of the interface: the one place where every component
// is built and wired together, in order. Infrastructure first, then the game's data and rules, what
// is built on them, and finally the screens.

import "./styles.css";

import { SaveImport, ClearLockedCoins, ClearLockedShops, FixMoonFlags, GoToKingdom, RaiseTotalCoins, SetKingdomLock, UnlockState } from "./actions/index.ts";
import { MissingReport, SaveChecks } from "./checks/index.ts";
import { AppShell, NavBar, TopBar } from "./app_shell/index.ts";
import type { BackendBridge } from "./backend_bridge/index.ts";
import { MockBackend, TauriBackend } from "./backend_bridge/index.ts";
import { AchievementCatalog, CaptureCatalog, CheckpointCatalog, CoinCatalog, LeaveCatalog, MoonCatalog, MusicCatalog, ScenarioCatalog, ShopCatalog, StageCatalog, StoryCatalog, WardrobeCatalog, Worlds } from "./game_data/index.ts";
import { AchievementLedger, CaptureLedger, CheckpointLedger, CoinLedger, CompletionLedger, MoonLedger, MusicLedger, ShopLedger, VisitLedger, WardrobeLedger } from "./ledgers/index.ts";
import {
  AchievementsPage,
  CapturesCard,
  MusicCard,
  RacesCard,
  CheckpointsCard,
  CutscenesCard,
  ChangesPage,
  ImportPage,
  ReportPage,
  ChecksPage,
  GameSettingsPage,
  GroupTile,
  KingdomProgressCard,
  KingdomSelect,
  KingdomsPage,
  KingdomTile,
  OverallProgressCard,
  OverviewPage,
  PlayTimeField,
  PowerMoonsCard,
  PurpleCoinsCard,
  RawDataPage,
  RawNode,
  ShopSections,
  StoryFlagsPage,
  SummaryRow,
  VisitedStagesCard,
} from "./pages/index.ts";
import { OdysseyRules, ProgressPlanner, StoryRules, UnlockRules } from "./rules/index.ts";
import { SaveStore } from "./save_store/index.ts";
import { Toaster } from "./toaster/index.ts";
import { AutoFields } from "./widgets/index.ts";

// Infrastructure: the backend (the real one under Tauri, a stand-in in a plain browser), messages,
// and the store of open saves.
const backend: BackendBridge = "__TAURI_INTERNALS__" in window ? new TauriBackend() : new MockBackend(location.search);
const toaster = new Toaster();
const store = new SaveStore(backend, toaster);

// The game's data and rules.
const worlds = new Worlds();
const moonCatalog = new MoonCatalog();
const stages = new StageCatalog();
const story = new StoryCatalog(moonCatalog);
const scenarios = new ScenarioCatalog();
const wardrobeCatalog = new WardrobeCatalog();
const shopCatalog = new ShopCatalog(worlds);
const leaveCatalog = new LeaveCatalog();
const achievementCatalog = new AchievementCatalog();
const captureCatalog = new CaptureCatalog();
const checkpointCatalog = new CheckpointCatalog();
const musicCatalog = new MusicCatalog();
const coinCatalog = new CoinCatalog();
const unlockRules = new UnlockRules(worlds);
const odysseyRules = new OdysseyRules(worlds);
const storyRules = new StoryRules(scenarios, story);
const planner = new ProgressPlanner(worlds, unlockRules, odysseyRules, storyRules);

// Counting what the player has.
const moons = new MoonLedger(store, moonCatalog, worlds);
const coins = new CoinLedger(store, coinCatalog);
const wardrobe = new WardrobeLedger(store, wardrobeCatalog);
const purse = new ShopLedger(store, shopCatalog, coins, wardrobe, storyRules, worlds);
const captureLedger = new CaptureLedger(store, captureCatalog);
const checkpointLedger = new CheckpointLedger(store);
const musicLedger = new MusicLedger(store, musicCatalog);
const visitLedger = new VisitLedger(store);
const completion = new CompletionLedger({
  worlds, moons, coins, wardrobe, checkpointCatalog, checkpoints: checkpointLedger, stages, visits: visitLedger,
});

// What the editor does.
const unlockState = new UnlockState(store, worlds, unlockRules, planner, moons);
const fixMoonFlags = new FixMoonFlags(store, moons, toaster);
const goToKingdom = new GoToKingdom(store, worlds, stages, unlockRules, unlockState, toaster);
const clearLockedCoins = new ClearLockedCoins(store, coins, purse, unlockRules, unlockState, toaster);
const clearLockedShops = new ClearLockedShops(store, wardrobe, purse, worlds, unlockRules, unlockState, toaster);
const setKingdomLock = new SetKingdomLock(unlockState, unlockRules, worlds, toaster, store, goToKingdom);
const raiseTotalCoins = new RaiseTotalCoins(store);

// The screens.
const overview = new OverviewPage(
  store, worlds, stages, wardrobe, raiseTotalCoins,
  new PlayTimeField(store),
  new KingdomSelect(store, worlds, goToKingdom),
);
const kingdoms = new KingdomsPage({
  worlds,
  moons,
  wardrobe,
  unlockRules,
  unlockState,
  setKingdomLock,
  overallProgress: new OverallProgressCard(store, worlds),
  summaryRow: new SummaryRow(store, moons, coins, wardrobe, fixMoonFlags, clearLockedCoins, clearLockedShops),
  kingdomTile: new KingdomTile(worlds, coins, wardrobe, completion),
  groupTile: new GroupTile(),
  kingdomProgress: new KingdomProgressCard(store, story, scenarios, storyRules, leaveCatalog, coins, purse),
  powerMoons: new PowerMoonsCard(store, moons, moonCatalog, scenarios),
  purpleCoins: new PurpleCoinsCard(store, coins, purse),
  shopSections: new ShopSections(store, wardrobe, shopCatalog, purse),
  checkpoints: new CheckpointsCard(store, checkpointCatalog, checkpointLedger),
  visitedStages: new VisitedStagesCard(store, stages, visitLedger),
  cutscenes: new CutscenesCard(store, scenarios),
});
const pages = [
  overview,
  kingdoms,
  new AchievementsPage(store, achievementCatalog, new CapturesCard(store, captureLedger), new MusicCard(store, musicCatalog, musicLedger), new RacesCard(store), new AchievementLedger(store, achievementCatalog, moonCatalog)),
  new ChecksPage(store, new SaveChecks({
    store, worlds, moons, moonCatalog, scenarios, odyssey: odysseyRules, unlockRules, unlockState,
    coins, purse, achievements: achievementCatalog, leave: leaveCatalog, goTo: goToKingdom,
  })),
  new StoryFlagsPage(store),
  new ReportPage(new MissingReport({
    store, worlds, moons, moonCatalog, coins, wardrobe, checkpointCatalog, checkpoints: checkpointLedger, stages, visits: visitLedger,
    captures: captureLedger, captureCatalog, music: musicLedger, musicCatalog, achievements: achievementCatalog, unlockRules, unlockState,
  }), toaster),
  new ImportPage(store, new SaveImport(store, worlds, coinCatalog, moonCatalog), worlds, toaster),
  new ChangesPage(store, moonCatalog, worlds),
  new RawDataPage(store, new RawNode(store)),
  new GameSettingsPage(store, new AutoFields(store)),
];

const root = document.getElementById("app");
if (!root) throw new Error("The page has no #app element to draw into.");
new AppShell(root, store, pages, new NavBar(), new TopBar(store)).start();
