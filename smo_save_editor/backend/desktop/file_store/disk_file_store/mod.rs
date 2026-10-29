//! The real file system.

use crate::desktop::file_store::FileStore;

pub struct DiskFileStore;

impl FileStore for DiskFileStore {
    fn read(&self, path: &str) -> Result<Vec<u8>, String> {
        std::fs::read(path).map_err(|e| format!("cannot read {path}: {e}"))
    }

    fn write(&self, path: &str, bytes: &[u8]) -> Result<(), String> {
        std::fs::write(path, bytes).map_err(|e| format!("cannot write {path}: {e}"))
    }
}
