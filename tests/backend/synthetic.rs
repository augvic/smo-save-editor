//! Tests on saves built in memory, so they run for everyone: no real save file is needed.
//!
//! The helpers below assemble complete save files (header, checksum, fixed size) around a BYML
//! document, in the same two layouts the game uses.

use smo_save_editor_lib::save_format::byml::{Reader, Writer};
use smo_save_editor_lib::save_format::crc32::Crc32;
use smo_save_editor_lib::save_format::{Error, Node, SaveFile, SaveKind};

// ---------------------------------------------------------------------------------------
// Building saves
// ---------------------------------------------------------------------------------------

fn s(text: &str) -> Node {
    Node::String(text.to_owned())
}

fn dict(entries: Vec<(&str, Node)>) -> Node {
    Node::Dict(entries.into_iter().map(|(k, v)| (k.to_owned(), v)).collect())
}

/// A tree shaped like a real progress save: wide numbers mixed with containers, arrays of dicts,
/// fixed-size string lists, and keys that were added in a non-alphabetical order.
fn progress_tree() -> Node {
    let shines = (0..40)
        .map(|i| {
            dict(vec![
                ("UniqueId", Node::Int(1000 + i)),
                ("IsGet", Node::Bool(i % 3 == 0)),
                ("GetTime", Node::UInt64(u64::from(i as u32) * 90_000_000_000)),
                ("Status", Node::UInt((i % 3 == 0) as u32)),
                ("HintStatus", Node::Int(0)),
            ])
        })
        .collect();
    let worlds = (0..20)
        .map(|i| {
            dict(vec![
                ("UnlockedWorldId", Node::Int(if i == 0 { 0 } else { -1 })),
                ("PayShineNum", Node::Int(0)),
                ("ScenarioNo", Node::Int(1)),
                ("MainShineNo", Node::Int(if i == 0 { 0 } else { -1 })),
            ])
        })
        .collect();
    let mut cloth = vec![s("Mario")];
    cloth.extend((1..64).map(|_| s("")));
    dict(vec![
        ("ShineData", Node::Array(shines)),
        ("SaveDataIdForPrepo", Node::UInt64(1_793_157_394)),
        ("WorldInfo", Node::Array(worlds)),
        ("ItemCloth", Node::Array(cloth)),
        ("LastUpdateTime", Node::Int64(1_793_146_765)),
        ("CoinNum", Node::Int(0)),
        ("StageName", s("CapWorldHomeStage")),
        ("GameProgressData", dict(vec![
            ("UnlockWorldNum", Node::Int(1)),
            ("IsFirstTimeWorld", Node::Array(vec![Node::Bool(false), Node::Bool(true), Node::Bool(true)])),
            ("HomeLevel", Node::Int(0)),
        ])),
        ("CurrentCapName", s("Mario")),
    ])
}

/// Header of 0x10 bytes: checksum, version, total size, length of the document.
fn progress_file(root: &Node, spare: usize) -> Vec<u8> {
    let body = Writer::write(root).unwrap();
    let total = 0x10 + body.len() + spare;
    let mut file = vec![0u8; total];
    file[4..8].copy_from_slice(&1u32.to_le_bytes());
    file[8..12].copy_from_slice(&(total as u32).to_le_bytes());
    file[12..16].copy_from_slice(&(body.len() as u32).to_le_bytes());
    file[0x10..0x10 + body.len()].copy_from_slice(&body);
    seal(&mut file);
    file
}

/// Header of 0x48 bytes, document length at 0x44, and leftover bytes after the document.
fn common_file(root: &Node, leftover: &[u8]) -> Vec<u8> {
    let body = Writer::write(root).unwrap();
    let total = 0x48 + body.len() + leftover.len();
    let mut file = vec![0u8; total];
    file[4..8].copy_from_slice(&1u32.to_le_bytes());
    file[8..12].copy_from_slice(&(total as u32).to_le_bytes());
    file[0x18..0x1C].copy_from_slice(b"USen");
    file[0x44..0x48].copy_from_slice(&(body.len() as u32).to_le_bytes());
    file[0x48..0x48 + body.len()].copy_from_slice(&body);
    file[0x48 + body.len()..].copy_from_slice(leftover);
    seal(&mut file);
    file
}

fn seal(file: &mut [u8]) {
    let checksum = Crc32::checksum(&file[4..]);
    file[..4].copy_from_slice(&checksum.to_le_bytes());
}

fn stored_checksum(file: &[u8]) -> u32 {
    u32::from_le_bytes(file[..4].try_into().unwrap())
}

// ---------------------------------------------------------------------------------------
// Whole files
// ---------------------------------------------------------------------------------------

#[test]
fn progress_file_roundtrips_byte_for_byte() {
    let file = progress_file(&progress_tree(), 4096);
    let save = SaveFile::from_bytes(&file).unwrap();
    assert_eq!(save.kind, SaveKind::Progress);
    assert!(save.checksum_ok);
    assert_eq!(save.to_bytes().unwrap(), file);
}

#[test]
fn common_file_roundtrips_and_keeps_leftover_bytes() {
    let root = dict(vec![
        ("GameConfigData", dict(vec![("IsPadRumble", Node::Bool(true)), ("PadRumbleLevel", Node::Int(0))])),
        ("Aoc", dict(vec![("Ver", Node::Int(14))])),
    ]);
    // Real Common.bin files carry stale text after the document; it must survive untouched.
    let leftover = b"ectData\0GetTime\0GrowPot\0HackDict";
    let file = common_file(&root, leftover);
    let save = SaveFile::from_bytes(&file).unwrap();
    assert_eq!(save.kind, SaveKind::Common);
    assert!(save.checksum_ok);
    assert_eq!(save.to_bytes().unwrap(), file);
}

#[test]
fn the_two_layouts_are_told_apart_by_content_not_by_name() {
    assert_eq!(SaveFile::from_bytes(&progress_file(&progress_tree(), 0)).unwrap().kind, SaveKind::Progress);
    assert_eq!(SaveFile::from_bytes(&common_file(&progress_tree(), &[])).unwrap().kind, SaveKind::Common);
}

#[test]
fn an_edited_file_gets_a_valid_checksum() {
    let file = progress_file(&progress_tree(), 4096);
    let mut save = SaveFile::from_bytes(&file).unwrap();
    *save.root.at_mut("/CoinNum").unwrap() = Node::Int(500);
    *save.root.at_mut("/ShineData/5/IsGet").unwrap() = Node::Bool(true);

    let out = save.to_bytes().unwrap();
    assert_ne!(out, file);
    assert_eq!(stored_checksum(&out), Crc32::checksum(&out[4..]), "checksum must cover the edited bytes");
    let reloaded = SaveFile::from_bytes(&out).unwrap();
    assert!(reloaded.checksum_ok);
    assert_eq!(reloaded.root.at("/CoinNum"), Some(&Node::Int(500)));
    assert_eq!(out.len(), file.len(), "the file keeps its size");
}

#[test]
fn a_wrong_checksum_is_reported_but_does_not_stop_loading() {
    let mut file = progress_file(&progress_tree(), 64);
    file[0] ^= 0xFF;
    let save = SaveFile::from_bytes(&file).unwrap();
    assert!(!save.checksum_ok);
    // Saving repairs it.
    let out = save.to_bytes().unwrap();
    assert!(SaveFile::from_bytes(&out).unwrap().checksum_ok);
}

#[test]
fn a_shorter_document_leaves_no_stale_bytes() {
    let mut root = progress_tree();
    *root.at_mut("/StageName").unwrap() = s(&"LongStageName".repeat(20));
    let file = progress_file(&root, 4096);
    let old_len = u32::from_le_bytes(file[12..16].try_into().unwrap()) as usize;

    let mut save = SaveFile::from_bytes(&file).unwrap();
    *save.root.at_mut("/StageName").unwrap() = s("Short");
    let out = save.to_bytes().unwrap();

    let new_len = u32::from_le_bytes(out[12..16].try_into().unwrap()) as usize;
    assert!(new_len < old_len);
    assert!(out[0x10 + new_len..0x10 + old_len].iter().all(|&b| b == 0), "old tail must be cleared");
    assert_eq!(out.len(), file.len());
}

#[test]
fn a_document_that_no_longer_fits_is_refused() {
    let file = progress_file(&progress_tree(), 0);
    let mut save = SaveFile::from_bytes(&file).unwrap();
    *save.root.at_mut("/StageName").unwrap() = s(&"x".repeat(10_000));
    assert!(matches!(save.to_bytes(), Err(Error::TooLarge { .. })));
}

#[test]
fn new_items_can_be_added_to_a_string_list() {
    // The reason the whole document is rewritten: a new name needs a new entry in the string table.
    let file = progress_file(&progress_tree(), 4096);
    let mut save = SaveFile::from_bytes(&file).unwrap();
    *save.root.at_mut("/ItemCloth/1").unwrap() = s("MarioPoncho");
    let reloaded = SaveFile::from_bytes(&save.to_bytes().unwrap()).unwrap();
    assert_eq!(reloaded.root.at("/ItemCloth/1"), Some(&s("MarioPoncho")));
    assert_eq!(reloaded.root.at("/ItemCloth/0"), Some(&s("Mario")));
}

#[test]
fn a_replaced_list_with_new_objects_survives_writing_and_reading() {
    use serde_json::json;
    use smo_save_editor_lib::save_format::JsonBridge;
    let file = progress_file(&progress_tree(), 4096);
    let mut save = SaveFile::from_bytes(&file).unwrap();
    // The music and visited-stage lists of a new save are empty; the editor fills them with objects and names.
    JsonBridge::set(
        save.root.at_mut("/GameProgressData/IsFirstTimeWorld").unwrap(),
        &json!([{ "BgmResourceName": "StmRsBgmHat", "IsCollected": true }, { "BgmResourceName": "StmRsBgmFall", "IsCollected": true }]),
    )
    .unwrap();
    JsonBridge::set(save.root.at_mut("/ItemCloth").unwrap(), &json!(["SandWorldKillerExStage", "SandWorldSphinxExStage"])).unwrap();

    let out = save.to_bytes().unwrap();
    let reloaded = SaveFile::from_bytes(&out).unwrap();
    assert!(reloaded.checksum_ok);
    assert_eq!(reloaded.root.at("/GameProgressData/IsFirstTimeWorld/1/BgmResourceName"), Some(&s("StmRsBgmFall")));
    assert_eq!(reloaded.root.at("/GameProgressData/IsFirstTimeWorld/0/IsCollected"), Some(&Node::Bool(true)));
    assert_eq!(reloaded.root.at("/ItemCloth/1"), Some(&s("SandWorldSphinxExStage")));
    assert_eq!(reloaded.root.at("/ShineData/5/UniqueId"), Some(&Node::Int(1005)), "the rest is untouched");
    assert_eq!(out.len(), file.len());
}

// ---------------------------------------------------------------------------------------
// Random trees
// ---------------------------------------------------------------------------------------

/// A small deterministic generator (xorshift), so a failure can be reproduced from its seed.
struct Rng(u64);

impl Rng {
    fn next(&mut self) -> u64 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        self.0
    }
    fn below(&mut self, n: u64) -> u64 {
        self.next() % n
    }
}

fn random_node(rng: &mut Rng, depth: u32) -> Node {
    let kinds = if depth >= 3 { 9 } else { 11 };
    match rng.below(kinds) {
        0 => Node::Bool(rng.below(2) == 1),
        1 => Node::Int(rng.next() as i32),
        2 => Node::UInt(rng.next() as u32),
        3 => Node::Float(rng.below(1000) as f32 / 4.0),
        4 => Node::Int64(rng.next() as i64),
        5 => Node::UInt64(rng.next()),
        6 => Node::Double(rng.below(1000) as f64 / 8.0),
        7 | 8 => Node::String(["", "Mario", "Luigi", "CapWorldHomeStage", "A"][rng.below(5) as usize].to_owned()),
        9 => Node::Array((0..rng.below(6)).map(|_| random_node(rng, depth + 1)).collect()),
        _ => random_dict(rng, depth + 1),
    }
}

fn random_dict(rng: &mut Rng, depth: u32) -> Node {
    let mut keys: Vec<u64> = Vec::new();
    while keys.len() < rng.below(7) as usize {
        let key = rng.below(40);
        if !keys.contains(&key) {
            keys.push(key); // insertion order is whatever the generator picked, not sorted
        }
    }
    Node::Dict(keys.into_iter().map(|k| (format!("Key{k}"), random_node(rng, depth))).collect())
}

fn sorted(node: &Node) -> Node {
    match node {
        Node::Array(items) => Node::Array(items.iter().map(sorted).collect()),
        Node::Dict(entries) => {
            let mut entries: Vec<_> = entries.iter().map(|(k, v)| (k.clone(), sorted(v))).collect();
            entries.sort_by(|a, b| a.0.cmp(&b.0));
            Node::Dict(entries)
        }
        other => other.clone(),
    }
}

#[test]
fn random_trees_survive_reading_and_writing() {
    for seed in 1..=300u64 {
        let mut rng = Rng(seed.wrapping_mul(0x9E37_79B9_7F4A_7C15) | 1);
        let tree = random_dict(&mut rng, 0);

        let bytes = Writer::write(&tree).unwrap();
        let back = Reader::read(&bytes).unwrap_or_else(|e| panic!("seed {seed}: {e}"));
        assert_eq!(sorted(&back), sorted(&tree), "seed {seed}: content changed");
        assert_eq!(Writer::write(&back).unwrap(), bytes, "seed {seed}: rewriting gave different bytes");
    }
}
