//! Write an open save to a file the user chose.

use std::sync::Arc;

use crate::desktop::documents::Documents;
use crate::desktop::file_store::FileStore;

pub struct WriteSave {
    documents: Arc<Documents>,
    files: Arc<dyn FileStore>,
}

impl WriteSave {
    pub fn new(documents: Arc<Documents>, files: Arc<dyn FileStore>) -> WriteSave {
        WriteSave { documents, files }
    }

    pub fn execute(&self, kind: &str, path: &str) -> Result<(), String> {
        let bytes = self.documents.read(kind, |save| save.to_bytes().map_err(|e| e.to_string()))?;
        self.files.write(path, &bytes)
    }
}
