# 🚀 Getting started

## 📂 The files

The game keeps your progress in two kinds of files:

- **`File1.bin`, `File2.bin`, …**: one per save slot. Moons, coins, kingdoms, wardrobe, achievements.
- **`Common.bin`**: settings shared by all slots (camera, vibration, language, DLC list).

You need to get these files out of your console or emulator first; the editor does not read the console itself.

## 🔓 Opening

Press **Open saves…** at the top and pick a save slot. You can pick `File1.bin` and `Common.bin` together; both open at once.
Opening a second save slot replaces the first one. Tabs that need a file that is not open are greyed out; **Game settings**
says "Open Common.bin to unlock" until you open it.

## 💾 Saving

The button **Save File1.bin…** (it shows the name of the open file) always asks where to write the result. Your original file is
**never modified**, so you can compare the two or go back at any time. A white dot on the button means there are unsaved edits.

When a file is written the editor recalculates the checksum the game checks. If the file you opened had a wrong checksum, the top bar shows
"Checksum was invalid": it is fixed on save.

Put the new file back where the game (or the emulator) keeps your saves, under the right name (for example `File1.bin`), after keeping a copy of the old one.

## ↩️ Undo and Redo

Every edit can be taken back with **Undo** (Ctrl+Z) and repeated with **Redo** (Ctrl+Y or Ctrl+Shift+Z). The shortcuts do nothing while you
are typing in a field, which has its own undo. For the whole list of what you changed, see [Changes](import-and-changes.md).

## 🔒 How the editor helps

- Values that the game keeps in step are changed together. Marking a moon also moves that kingdom's **Moon total** and the moon's status.
- Things the game would not allow are locked: a moon that is not out yet in the kingdom's scenario, a shop item the kingdom's purple coins cannot pay for.
- The red dot on the **Checks** tab tells you when the save has something that does not agree. See [Checks and Report](checks-and-report.md).

## 🎨 The window

The left side lists the tabs; the title bar holds Open, Save, Undo and Redo. A tab opens with a short fade; if you prefer no motion, the editor follows your
system's "reduce motion" setting.
