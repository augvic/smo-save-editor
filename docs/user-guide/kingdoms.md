# 🗺️ Kingdoms

The biggest tab. It starts with the whole game, then one page per kingdom.

## 🌍 The whole game

### Overall progress
Worked out for you whenever you unlock or lock a kingdom, following the game's own rules. Change a value by hand only to override it.
- **Kingdoms unlocked**, **Odyssey level**, **Odyssey status**.
- **Cascade progress**, and the choices that decide the order of **Wooded / Lake** and **Seaside / Snow**.

### Summary cards
Three cards count what you have collected: **Power Moons**, **Purple Coins** and **Shop items**, each with a bar.
- **Fix moon flags** makes every moon's status agree with whether it is collected.
- **Clear locked coins** unmarks the purple coins of kingdoms that are still locked (nobody can have collected them). The coins that paid for a shop item are kept until you remove the item.
- **Clear locked items** removes the shop items of kingdoms that are still locked and sets their "Purple coins spent" back to 0.

### The kingdom grid
One tile per kingdom with its moons, purple coins, shop items and completion. The round badge at the corner is a **lock**:
- A **closed red** lock means the kingdom is locked. Hover to see the open lock: clicking **unlocks** it **and every kingdom before it**, as in the game.
- An **open green** lock means unlocked. Clicking **locks** it and the ones after it. Mario is moved back if he was in a kingdom that gets locked.
- The Cap Kingdom is always unlocked.

Unlocking leaves the new kingdom the way the game does before you arrive: Main scenario −1 (not reached), Current scenario 1, first visit pending. It also sets the Odyssey level and the other numbers that depend on how many kingdoms are open.

Below the grid, **Not tied to a kingdom** holds the Crazy Cap shop, items that no shop sells, items in your save that this editor does not know, and moons whose kingdom is unknown.

## 🏝️ Inside a kingdom

Click an unlocked tile; **All kingdoms** goes back.

### 📈 Progress
- **Main scenario**: how far along the kingdom's story-moon sequence you are. −1 means not reached. Raising it also raises Current scenario to what the game pairs with it.
- **Map position**: where the kingdom is on the Odyssey's map (−1 means locked); set by unlocking and locking.
- **Current scenario**: the kingdom's map stage, how the world looks. Raising it raises Main scenario to match. A scenario the game itself names is marked in the list.
- **Moon total**, **Moons bought in shop**, **Purple coins spent**. The last one follows the shop items you own.
- **Warp hole used**, **Spoke local language**.
- **First visit still pending**: locked; it follows Main scenario (on while −1, or while the kingdom is locked).
- A line says what it takes to **leave** the kingdom (the Odyssey's Power Moon requirement) and how many you still need.

### 🌙 Power Moons
The kingdom's moons with filters (search, collected or missing, by kind). **Collect shown** and **Clear shown** change every moon in the list at once.
- A moon that is only out from a later scenario than the kingdom is at is **locked**; change Current scenario to unlock it. One already marked stays editable.
- Multi Moons count as three in the Moon total; the moon bought in the shop also adds to "Moons bought in shop".

### 🟣 Purple coins
Each coin of the kingdom. The coins that paid for a shop item stay locked until you remove the item.

### 🛍️ Shop
Caps, outfits, souvenirs and stickers sold in the kingdom, with their real prices.
- An item bought with purple coins can only be added while the coins you marked cover it, and **Purple coins spent** follows.
- Other items say what they ask: coins, a kingdom cleared first, or a number of Power Moons.
- **Add all** adds what you can afford; **Remove all** takes them back.

### 🚩 Checkpoints, 🧭 Side areas visited, 🎬 Cutscenes
- **Checkpoints**: the flags Mario has touched, with the names the map shows.
- **Side areas visited**: the sub-areas and secret rooms the game remembers.
- **Cutscenes**: whether the intro and the start of each scenario are still to play (on means it will still play), and the Moon Rock cutscenes. The intro follows Main scenario (still to play only at −1); the scenario starts are yours to set, because the game plays them when Mario arrives, not in order.
