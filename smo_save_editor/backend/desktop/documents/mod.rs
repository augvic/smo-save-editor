//! The saves currently open, by kind ("progress" for `File*.bin`, "common" for `Common.bin`).

use std::collections::HashMap;
use std::sync::Mutex;

use crate::save_format::{SaveFile, SaveKind};

pub struct Documents {
    saves: Mutex<HashMap<&'static str, SaveFile>>,
}

impl Documents {
    pub fn new() -> Documents {
        Documents { saves: Mutex::new(HashMap::new()) }
    }

    /// The name the interface uses for a kind of save.
    pub fn name_of(kind: SaveKind) -> &'static str {
        match kind {
            SaveKind::Progress => "progress",
            SaveKind::Common => "common",
        }
    }

    fn key(kind: &str) -> Result<&'static str, String> {
        match kind {
            "progress" => Ok("progress"),
            "common" => Ok("common"),
            other => Err(format!("unknown save kind {other:?}")),
        }
    }

    /// Keep a save as the open one of its kind, replacing any earlier one.
    pub fn store(&self, save: SaveFile) -> &'static str {
        let name = Documents::name_of(save.kind);
        self.saves.lock().unwrap().insert(name, save);
        name
    }

    /// Look at the open save of a kind.
    pub fn read<R>(&self, kind: &str, look: impl FnOnce(&SaveFile) -> Result<R, String>) -> Result<R, String> {
        let saves = self.saves.lock().unwrap();
        look(saves.get(Documents::key(kind)?).ok_or("no save is open")?)
    }

    /// Change the open save of a kind.
    pub fn edit<R>(&self, kind: &str, change: impl FnOnce(&mut SaveFile) -> Result<R, String>) -> Result<R, String> {
        let mut saves = self.saves.lock().unwrap();
        change(saves.get_mut(Documents::key(kind)?).ok_or("no save is open")?)
    }
}
