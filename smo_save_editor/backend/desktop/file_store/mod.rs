//! Where saves are read from and written to. The actions depend on this contract, never on the
//! disk, so they can be exercised with any stand-in that honors it.

pub mod disk_file_store;

pub use disk_file_store::DiskFileStore;

pub trait FileStore: Send + Sync {
    fn read(&self, path: &str) -> Result<Vec<u8>, String>;
    fn write(&self, path: &str, bytes: &[u8]) -> Result<(), String>;
}
