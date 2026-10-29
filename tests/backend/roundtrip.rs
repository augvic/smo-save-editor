//! Reading a save and writing it back must reproduce the original file exactly.
//!
//! The real saves are personal data and are not part of the repository. Put `File1.bin`
//! and/or `Common.bin` in the repository root to run these; otherwise they are skipped.

use std::path::PathBuf;

use smo_save_editor_lib::save_format::byml::{Reader, Writer};
use smo_save_editor_lib::save_format::{Node, SaveFile};

fn fixture(name: &str) -> Option<Vec<u8>> {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join(name);
    match std::fs::read(&path) {
        Ok(bytes) => Some(bytes),
        Err(_) => {
            eprintln!("skipping: {} not found", path.display());
            None
        }
    }
}

fn assert_identical(name: &str) {
    let Some(original) = fixture(name) else { return };
    let save = SaveFile::from_bytes(&original).expect("parse");
    assert!(save.checksum_ok);
    let rewritten = save.to_bytes().expect("write");
    assert_eq!(rewritten.len(), original.len());
    if let Some(i) = (0..original.len()).find(|&i| original[i] != rewritten[i]) {
        panic!("{name}: first difference at offset {i:#x}");
    }
}

#[test]
fn progress_save_roundtrips_byte_for_byte() {
    assert_identical("File1.bin");
}

#[test]
fn common_save_roundtrips_byte_for_byte() {
    assert_identical("Common.bin");
}

#[test]
fn edits_survive_a_roundtrip() {
    let Some(original) = fixture("File1.bin") else { return };
    let mut save = SaveFile::from_bytes(&original).unwrap();
    *save.root.at_mut("/CoinNum").unwrap() = Node::Int(1234);
    *save.root.at_mut("/ShineData/0/IsGet").unwrap() = Node::Bool(true);
    *save.root.at_mut("/ItemCloth/1").unwrap() = Node::String("Luigi".into());

    let reloaded = SaveFile::from_bytes(&save.to_bytes().unwrap()).unwrap();
    assert!(reloaded.checksum_ok, "edited save must carry a valid checksum");
    assert_eq!(reloaded.root.at("/CoinNum"), Some(&Node::Int(1234)));
    assert_eq!(reloaded.root.at("/ShineData/0/IsGet"), Some(&Node::Bool(true)));
    assert_eq!(reloaded.root.at("/ItemCloth/1"), Some(&Node::String("Luigi".into())));
    assert_eq!(reloaded.root.at("/CurrentCapName"), save.root.at("/CurrentCapName"));
}

/// The same tree with every dictionary sorted by key, so trees can be compared by content.
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
fn synthetic_tree_roundtrips() {
    let root = Node::Dict(vec![
        ("Zeta".into(), Node::UInt64(u64::MAX)),
        ("Alpha".into(), Node::Array(vec![Node::Int(-1), Node::Float(1.5), Node::UInt(7)])),
        ("Mid".into(), Node::Dict(vec![
            ("Time".into(), Node::Int64(-5)),
            ("Name".into(), Node::String("Mario".into())),
            ("Flag".into(), Node::Bool(true)),
        ])),
        ("Pi".into(), Node::Double(3.14159)),
        ("Empty".into(), Node::Array(vec![])),
    ]);
    let bytes = Writer::write(&root).unwrap();
    let back = Reader::read(&bytes).unwrap();
    // Same content (the order of plain fields is not stored in the file)...
    assert_eq!(sorted(&back), sorted(&root));
    // ...and writing what we read gives the very same bytes.
    assert_eq!(Writer::write(&back).unwrap(), bytes);
}

#[test]
fn garbage_is_rejected_not_panicked_on() {
    assert!(SaveFile::from_bytes(&[]).is_err());
    assert!(SaveFile::from_bytes(&[0u8; 64]).is_err());
    assert!(Reader::read(b"YB\x03\x00").is_err());
}
