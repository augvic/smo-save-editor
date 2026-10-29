//! Open a save file and hand its contents to the interface as JSON.

use std::path::Path;
use std::sync::Arc;

use serde::Serialize;
use serde_json::Value;

use crate::desktop::documents::Documents;
use crate::desktop::file_store::FileStore;
use crate::save_format::{JsonBridge, SaveFile};

/// What the interface receives when a save has been opened.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Loaded {
    pub kind: &'static str,
    pub file_name: String,
    pub checksum_ok: bool,
    pub tree: Value,
}

pub struct OpenSave {
    documents: Arc<Documents>,
    files: Arc<dyn FileStore>,
}

impl OpenSave {
    pub fn new(documents: Arc<Documents>, files: Arc<dyn FileStore>) -> OpenSave {
        OpenSave { documents, files }
    }

    pub fn execute(&self, path: &str) -> Result<Loaded, String> {
        let bytes = self.files.read(path)?;
        let save = SaveFile::from_bytes(&bytes).map_err(|e| e.to_string())?;
        let loaded = Loaded {
            kind: Documents::name_of(save.kind),
            file_name: Path::new(path)
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default(),
            checksum_ok: save.checksum_ok,
            tree: JsonBridge::to_json(&save.root),
        };
        self.documents.store(save);
        Ok(loaded)
    }
}
