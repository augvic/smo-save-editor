<p align="center">
  <img src="src-tauri/icons/icon.png" alt="SMO Save Editor icon: Mario's cap with a floppy disk" width="160">
</p>

<h1 align="center">SMO Save Editor</h1>

<p align="center">
  A save editor for <b>Super Mario Odyssey</b> that never touches your original file. 🌙
</p>

<p align="center">
  <img alt="Tauri 2" src="https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white">
  <img alt="Rust" src="https://img.shields.io/badge/Rust-backend-DEA584?logo=rust&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20+-5FA04E?logo=nodedotjs&logoColor=white">
  <img alt="Python tools" src="https://img.shields.io/badge/Python-tools-3776AB?logo=python&logoColor=white">
</p>

<p align="center">
  <img alt="Platforms" src="https://img.shields.io/badge/platforms-Linux%20%7C%20Windows%20%7C%20macOS-lightgrey">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green">
  <img alt="Built with GitHub Actions" src="https://img.shields.io/badge/builds-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white">
</p>

---

A cross-platform save editor for **Super Mario Odyssey** 🍄, built with [Tauri](https://tauri.app) 🦀
(Rust backend, strict TypeScript interface). It opens `File1.bin` / `Common.bin`, lets you edit coins, play time,
kingdoms, Power Moons, purple coins, shop items, achievements and game settings, and writes a **new** file.

> 🛡️ Your original save is never modified: **Save…** always asks where to write the result.
>
> ⚠️ Back up your saves and use at your own risk. Editing a save can break progress. The checks follow the game's own rules,
> but they are not a guarantee, and the editor has been tried only in an emulator.

## ✨ What it does

### 🗺️ Kingdoms
- 🔓 **Unlock and lock** kingdoms with everything the game ties to it: the unlock chain, the Odyssey level, the Main scenario
  and the first-visit flag, Mario's location (he is moved back when his kingdom is locked again), and the Cascade story step.
  A newly unlocked kingdom starts the way the game leaves it before you arrive (Main scenario −1, scenario 1, first visit pending).
- 🌙 **Power Moons** per kingdom, with the kind of each moon, a filter, and moons that are **locked until their scenario**
  (a moon that is not out yet in the kingdom's scenario cannot be marked). Multi Moons count 3, the shop moon adds to
  "Moons bought in shop", and the kingdom's Moon total follows along.
- 🟣 **Purple coins**, tied to the kingdom's shop: an item can only be bought while the coins you marked pay for it,
  and "Purple coins spent" is worked out for you. Coins that paid for an item stay locked until you remove the item.
- 🛍️ **Shop items** with the real prices and conditions (coins, cleared kingdom, Power Moons needed), plus "Add all / Remove all".
- 🚩 Checkpoints (with the names the map shows), side areas visited, cutscenes still to play, and a completion percentage per kingdom.
- 🚪 What it takes to **leave** a kingdom (the game's own Power Moon requirement) is shown, and the chain stays consistent
  (unlocking a kingdom completes the ones before it).
- 🧹 **Clear locked coins / Clear locked items:** one click takes back what no one could have collected or bought in a locked kingdom.

### 🏆 Achievements
- Goals and progress computed from the moons, captures, music and races; **captures**, the **jukebox** and **race records** (m:ss.cc).

### 🛡️ Checks and 📋 Report
- ✅ **Checks** goes through the save and lists what does not agree with itself, with a fix button for each line
  (and a choice of fixes when the right one is yours to make). **Fix all** applies the safe ones. A red dot on the tab tells
  you when there is something to look at.
- 📋 **Report** lists everything still missing in the kingdoms you have unlocked, ready to copy.

### 🕘 Changes, Undo, Redo and Import
- ↩️ **Undo / Redo** (Ctrl+Z / Ctrl+Y) for every edit, and a **Changes** page that shows each value as it was and as it is,
  with a Revert for each.
- 📥 **Import:** open a second save to see how it differs by section (moons, coins, progress, wardrobe, captures, music,
  checkpoints, areas, achievements, races) and copy only what you tick.

### 🧰 And also
- 📖 **Story flags** (boss fights, the game's cutscenes, shop "NEW" markers), 🔧 **Raw data** (every value of the file, searchable)
  and ⚙️ **Game settings** (`Common.bin`).
- 🎨 Line icons, smooth page transitions and fades, with `prefers-reduced-motion` respected.

## 🧱 Layout

The project follows Fractal Component Architecture (FCA): the software is a
tree of components, and the folders *are* that tree. The repository root is the **development level**
(how it is built, tested and shipped); the software itself lives in `smo_save_editor/`, with one folder
per language.

```text
smo-save-editor/                  ← development level
├── smo_save_editor/              ← the software
│   ├── backend/                  ← Rust (composition root: lib.rs)
│   │   ├── save_format/          ← reading and writing save files: byml/, crc32/, save_file/, json_bridge/, error/
│   │   └── desktop/              ← what the interface can ask for: actions/, commands/, documents/, file_store/
│   └── app/                      ← TypeScript (composition root: index.ts)
│       ├── game_data/            ← catalogs: kingdoms, moons, shop prices, captures, music, checkpoints, wardrobe …
│       ├── rules/                ← unlock rules, Odyssey level, story rules, the progress planner
│       ├── ledgers/              ← counting and changing moons, coins, shop items, captures, music, completion …
│       ├── actions/              ← things that change several parts of the save at once
│       ├── checks/               ← the save checker and the missing-items report
│       ├── pages/  widgets/      ← the screens (overview_page/, kingdoms_page/ …) and what they are made of
│       └── app_shell/  save_store/  backend_bridge/  icon/  transition/  toaster/  dom/  save_schema/
├── src-tauri/                    ← packaging of the desktop shell (Tauri config, icons, Cargo manifest)
├── tests/                        ← backend/ (Rust) and app/ (TypeScript)
├── tools/                        ← Python helpers for reading game files and generating the data tables
└── package.json  tsconfig.json  vite.config.ts  Cargo.toml  FORMAT.md
```

Every component is a folder with an entry point (`index.ts`, or `mod.rs` in Rust) and is named after the
class or struct it defines. Dependencies are handed in through constructors and wired in one place per
language: `smo_save_editor/app/index.ts` and `smo_save_editor/backend/lib.rs`.

🔁 The library rewrites an untouched save **byte for byte** and recomputes the CRC32 the game
checks (see `tests/backend/roundtrip.rs`). The file format is described in [`FORMAT.md`](FORMAT.md).

## 🛠️ Develop

Needs Rust, Node.js and the [Tauri Linux prerequisites](https://tauri.app/start/prerequisites/)
(on Arch: `webkit2gtk-4.1`, `base-devel`).

```bash
npm install
npm run tauri dev      # run the app
cargo test             # core library tests (Rust)
npm run test:logic     # rules, ledgers, checks, import, history (TypeScript)
npx tsc --noEmit       # type check
npm run tauri build    # package it (see Build it yourself)
```

🧪 Today that is 20 Rust tests and 58 TypeScript tests. The tests in `tests/backend/synthetic.rs` build saves in memory,
so they run for everyone. `roundtrip.rs` additionally checks your own saves: copy `File1.bin` / `Common.bin` into the
repository root to enable it (they are git-ignored); without them those tests are skipped.

🌐 `npm run dev` serves the interface in a plain browser using a mock backend that reads
`public/dev-fixture-progress.json` and `public/dev-fixture-common.json`
(made with `python3 tools/byml_dump.py`; git-ignored).

🧬 The game data tables in `smo_save_editor/app/game_data/` are generated from a RomFS dump of your own copy of the game:

```bash
python3 tools/gen_game_data.py /path/to/romfs
```

## 🤖 Automated builds

The repository has two [GitHub Actions](https://github.com/features/actions) workflows in `.github/workflows/`:

- **Tests:** on every push and pull request, a clean Linux machine runs the type check, the TypeScript tests, the Rust tests
  and the interface build.
- **Release:** when a version tag such as `v0.1.0` is pushed, the app is built on **Linux and Windows** and the installers are attached
  to a release. 📥 You can download them from the [Releases](https://github.com/augvic/smo-save-editor/releases) page, with nothing to install or compile.
  (There is no macOS build; on a Mac, build it yourself as described below.)

The installers are not signed, so Windows may show a SmartScreen warning the first time you open one.

## 📦 Build it yourself

You can also build the app on your own machine from a clone (the only way on macOS). 🔨

1. **Install the tools:** [Rust](https://rustup.rs) (stable), [Node.js](https://nodejs.org) 20 or newer, and the
   [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your system:
   - 🐧 Linux: the WebKitGTK and GTK development packages (on Arch: `webkit2gtk-4.1`, `base-devel`; on Debian/Ubuntu: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `libxdo-dev`, `libssl-dev`)
   - 🪟 Windows: the Microsoft C++ Build Tools and WebView2 (already part of Windows 11)
   - 🍎 macOS: the Xcode command line tools (`xcode-select --install`)
2. **Clone and install:**
   ```bash
   git clone https://github.com/augvic/smo-save-editor.git
   cd smo-save-editor
   npm install
   ```
3. **Build the app:**
   ```bash
   npm run tauri build
   ```
   The first build downloads and compiles the Rust dependencies, so it takes a while. The program and its installers
   end up in `target/release/` (the installers in `target/release/bundle/`). The installers are not signed, so your
   system may warn you when you open them.
4. **Or just run it** without packaging: `npm run tauri dev`.

Nothing else is needed: the saves, the game data and the generated files are not part of the repository, and the build does not use them.
Before building you can run the tests (`cargo test`, `npm run test:logic`, `npx tsc --noEmit`) to check that everything works on your machine.

## 🧭 Known limits

- 🎮 The editor follows the game's own rules, read from its data and decompiled code, but its output has not been
  verified on every setup; test on a copy first.
- 🔢 The Power Moon *kinds* counter is an estimate: two of the mappings overshoot the numbers of a real finished save.
- ➖ The save checks leave out rules that the game's own saves break (for example, Moon Kingdom's Main scenario
  versus its scenario number), so the checker does not flag what the real game does.
- 🎈 The balloon-game time table (`BalloonGameTimeTable`) could not be read yet, so the editor does not cover those records.

## 🔍 How it was made

This editor was built step by step, between me (who plays the game) and an AI assistant (who can read bytes really fast), and most of its rules were found by investigating rather than guessing. 🕵️

1. 🧩 **Reading the file.** The first step was understanding the save: a CRC32 plus a BYML document. The Rust side reads it,
   rewrites it and recomputes the checksum, and a test proves an untouched save comes back byte for byte.
2. 📚 **Borrowing what others had learned.** The moon list came from the community editors credited below, and the stage names from the modding wiki.
3. 🎮 **Playing to find out.** Many rules were found by changing the save, loading it in the game and reporting what happened. For example:
   - unlocking a kingdom and entering it showed that a kingdom you can reach but have not visited has *Main scenario −1*
     and a pending first visit, and that the first visit turns it to 0;
   - a wrong Odyssey level in a test led to reading how the game computes it from the number of unlocked kingdoms;
   - a jump in play time turned out to be the emulator's own clock, not the editor.
4. 🔬 **Reverse engineering.** When playing was not enough, we read the game's decompiled code ([OdysseyDecomp](https://github.com/MonsterDruide1/OdysseyDecomp))
   and dumped the RomFS of the author's own copy of the game, with small Python tools (`tools/`) that read its archives and message files.
   That is where the shop prices, the Power Moons needed to leave each kingdom, the scenarios each moon appears in, the checkpoints and the achievements come from.
5. 🧪 **Checking against real saves.** A published set of saves from a finished game was used to test the rules. Some of the rules we
   had written were *wrong* for the real game (a counter off by one, a story step that does not match its scenario), so we relaxed them
   instead of forcing the save to agree. The editor tries to describe what the game does, not what we expected.
6. ✨ **Polishing.** Then came the Checks page, undo and redo, import, icons and animations, and the tests.

The result is a tool whose important rules each have a reason you can trace: the game's code, its data, or a test in the game itself.

## 🙏 Credits and data sources

This project stands on the work of people who documented the game and its save format. Thank you! 💛

### 👥 People and projects

| Who | What we used |
|---|---|
| [**anorum**](https://github.com/anorum/mario_odyssey_save_editor) (MIT) | The save editor that inspired this one: ideas for what an editor should expose, and the Power Moon IDs, names and kingdoms in `moon_catalog/moons.ts`, which in turn derive from the next entry |
| [**Kgamer77 / SuperMarioOdysseyArchipelago**](https://github.com/Kgamer77/SuperMarioOdysseyArchipelago) (MIT) | The moon list behind the one above, and the published game data we read the outfit, cap, souvenir and sticker names from (`ItemList.szs`, read with `tools/itemlist_dump.py`) |
| [**MonsterDruide1 / OdysseyDecomp**](https://github.com/MonsterDruide1/OdysseyDecomp) | The game's own code: kingdom order, unlock rules, Odyssey level and status, the scenario and hint rules, in `src/System/GameProgressData.cpp`, `GameDataFunction.cpp` and `GameDataFile.cpp` |
| [**GRAnimated / SMO-Modding wiki**](https://github.com/GRAnimated/SMO-Modding/wiki/Stages) | Stage names (`stage_catalog/stages.ts`) |
| [**MysticExile / SuperMarioOdyssey-All-Kingdom-Saves**](https://github.com/MysticExile/SuperMarioOdyssey-All-Kingdom-Saves) | A published set of save files of one finished game: the Main scenario of each finished kingdom and the finished-game numbers in `tests/app/progress_planner.test.ts`. They are one player's game, so they say what the values were there, not a rule |

### 📊 Where each table comes from

| Data | Where | Source |
|---|---|---|
| Moon names and kingdoms | `game_data/moon_catalog/moons.ts` | anorum and SuperMarioOdysseyArchipelago (above); the English names are the game's own texts |
| Stage names | `game_data/stage_catalog/stages.ts` | SMO-Modding wiki |
| Outfit, cap, souvenir and sticker names | `game_data/wardrobe_catalog/wardrobe.ts` | `ItemList.szs`; English names matched by hand |
| Kingdom order, unlock rules, Odyssey level and status | `game_data/worlds/`, `rules/` | OdysseyDecomp |
| Kingdom of every purple coin, scenario numbers, story moons, shop prices, Power Moons needed to leave, shop moons, the scenarios each moon appears in, moon kinds, checkpoints, captures, achievements, music, visited stages | `game_data/coin_catalog/`, `scenario_catalog/`, `story_catalog/`, `shop_catalog/`, `leave_catalog/`, `moon_catalog/`, `checkpoint_catalog/`, `capture_catalog/`, `achievement_catalog/`, `music_catalog/`, `stage_catalog/visit_stages.ts` | The game's own data, read from a RomFS dump of the author's own copy with `tools/gen_game_data.py` (with `tools/szs.py` for Yaz0/SARC/BYML and `tools/msbt.py` for the message files). Only numbers and names are kept, no game assets |
| Main scenario of each finished kingdom, finished-game numbers | `game_data/story_catalog/`, `tests/app/progress_planner.test.ts` | MysticExile's saves (above), read with `tools/byml_dump.py` |
| Power Moon, checkpoint, capture and music names | `game_data/` | The game's own English message texts (`StageMessage` and the other message files), read with `tools/msbt.py` |

### 🧩 Built with
- [Tauri](https://tauri.app) 2 and [Rust](https://www.rust-lang.org), [TypeScript](https://www.typescriptlang.org) and [Vite](https://vitejs.dev).
- The line icons are drawn in the style of [Lucide](https://lucide.dev) (ISC license); the paths in `smo_save_editor/app/icon/` are written out in the code, with no dependency.
- The [Eden](https://eden-emu.dev) emulator was used to dump the author's own game and test the saves.

### 📄 License
The code of this project is under the [MIT License](LICENSE). The game data it reads is not covered by it (see Legal below).

### ⚖️ Legal
Super Mario Odyssey and everything in it (moon, stage, item, capture and music names, and the game itself) belong to **Nintendo**.
This is an unofficial fan tool, not affiliated with or endorsed by Nintendo. It ships no game assets and no copyrighted files,
and you need your own copy of the game to get your saves. Contributions to `smo_save_editor/app/game_data/` are welcome. 🎉
