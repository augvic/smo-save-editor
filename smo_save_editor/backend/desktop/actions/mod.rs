//! The things the desktop shell can do with saves, one use case each.
//!
//! A container branch: it only exposes its children.

pub mod open_save;
pub mod set_values;
pub mod write_save;

pub use open_save::{Loaded, OpenSave};
pub use set_values::SetValues;
pub use write_save::WriteSave;
