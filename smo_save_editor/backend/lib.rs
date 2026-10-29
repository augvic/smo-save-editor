//! SMO Save Editor backend, and the composition root of the Rust side.
//!
//! The tree: `save_format` (reading and writing the save files) and `desktop` (what the
//! interface can ask for). This is the one place where everything is built and wired together.

pub mod desktop;
pub mod save_format;

use std::sync::Arc;

use desktop::commands::{open_save, set_values, write_save};
use desktop::documents::Documents;
use desktop::file_store::{DiskFileStore, FileStore};
use desktop::Desktop;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Infrastructure, then the components built on it.
    let files: Arc<dyn FileStore> = Arc::new(DiskFileStore);
    let documents = Arc::new(Documents::new());
    let desktop = Desktop::new(documents, files);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(desktop)
        .invoke_handler(tauri::generate_handler![open_save, set_values, write_save])
        .run(tauri::generate_context!())
        .expect("error while running the application");
}
