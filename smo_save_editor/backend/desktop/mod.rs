//! The desktop shell: what the interface can ask of the backend.
//!
//! An active branch: `Desktop` holds the actions, built by the composition root, that the
//! [`commands`] adapter calls.

pub mod actions;
pub mod commands;
pub mod documents;
pub mod file_store;

use std::sync::Arc;

use actions::{OpenSave, SetValues, WriteSave};
use documents::Documents;
use file_store::FileStore;

pub struct Desktop {
    pub open_save: OpenSave,
    pub set_values: SetValues,
    pub write_save: WriteSave,
}

impl Desktop {
    pub fn new(documents: Arc<Documents>, files: Arc<dyn FileStore>) -> Desktop {
        Desktop {
            open_save: OpenSave::new(Arc::clone(&documents), Arc::clone(&files)),
            set_values: SetValues::new(Arc::clone(&documents)),
            write_save: WriteSave::new(documents, files),
        }
    }
}
