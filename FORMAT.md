# Super Mario Odyssey save format

No encryption and no compression. The content is a **BYML v3 (little endian)** with a small header in front of it.

## File1.bin (2 MiB, the rest is padded with zeros)

| Offset | Size | Meaning |
|---|---|---|
| 0x00 | u32 | **CRC32** (IEEE) of all bytes from 0x04 to the end of the file |
| 0x04 | u32 | version (1) |
| 0x08 | u32 | total file size (`0x20000C`) |
| 0x0C | u32 | size of the BYML data (`0x1B148`) |
| 0x10 | — | start of the BYML (`59 42 03 00` = "YB", version 3) |

## Common.bin (1036 bytes)

Same BYML and same CRC32 at 0x00, but the BYML starts at `0x48`, after a larger header that holds the language (`USen`).
It stores settings (camera, vibration) and the list of DLCs (`Aoc`).

## BYML (header relative to the start of the BYML)

| Offset | Meaning |
|---|---|
| +0x00 | `YB` + version |
| +0x04 | offset of the name table (dictionary keys) |
| +0x08 | offset of the string table (values) |
| +0x0C | offset of the root node |

Node types: `0xA0` string, `0xC0` array, `0xC1` dictionary, `0xC2` string table,
`0xD0` bool, `0xD1` int32, `0xD2` float, `0xD3` uint32, `0xD4/D5/D6` int64/uint64/double (by offset).

## Main fields of File1

`CoinNum`, `TotalCoinNum`, `PlayTimeTotal` (seconds), `WorldId`, `StageName`, `CurrentCapName`,
`CurrentClothName`, `ItemCap`/`ItemCloth`/`ItemGift`/`ItemSticker` (lists of unlocked names),
`ShineData` (775 moons, `IsGet`, `UniqueId`), `WorldInfo` (one entry per kingdom), `GetCoinCollectData`
(purple coins), `GameProgressData`, `AchievementSaveData`.

## Tools

`tools/byml_dump.py <file>` dumps the content as JSON (a Python prototype; the real implementation
is in `smo_save_editor/backend/save_format`).

## Details needed to write the file back byte for byte

- The CRC32 in the header **must** be recalculated after any edit, or the game rejects the save.
- Order in the file: header, name table (sorted), string table (sorted, no duplicates),
  64-bit values (`0xD4`/`0xD5`/`0xD6`, 8 bytes each), and finally the containers (root first).
- The 64-bit values and the containers stay in the order the game added them, **not** in alphabetical
  order. The entries inside a dictionary, however, are written sorted by key.
- `Common.bin` has trailing junk (left over from an earlier write) after the BYML; it is preserved as is.
