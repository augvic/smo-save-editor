//! Reading and writing Super Mario Odyssey save files (`File1.bin`, `Common.bin`, ...).
//!
//! A container branch: it only exposes its children.

pub mod byml;
pub mod crc32;
pub mod error;
pub mod json_bridge;
pub mod save_file;

pub use byml::Node;
pub use error::{Error, Result};
pub use json_bridge::JsonBridge;
pub use save_file::{SaveFile, SaveKind};
