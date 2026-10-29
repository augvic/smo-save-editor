//! BYML v3 (little endian): the binary tree format the game stores saves in.
//!
//! A container branch: it only exposes its children, [`node`], [`reader`] and [`writer`].
//!
//! File layout, as written by the game (all offsets relative to the `YB` header):
//!
//! ```text
//! header        "YB", version 3, name table off, string table off, root off
//! name table    sorted dictionary keys
//! string table  sorted string values (omitted when there are none)
//! 64-bit values int64 / uint64 / double, 8 bytes each, in the order they were added
//! containers    root first, then every array/dict in the order they were added
//! ```
//!
//! The only thing that is *not* recoverable from the tree alone is the order the game
//! added things in. A dictionary stores its entries sorted by key, yet its children are
//! laid out in insertion order. To rewrite a file byte for byte, [`Node::Dict`] keeps its
//! entries in insertion order and the reader reconstructs that order from the offsets.

mod layout;

pub mod node;
pub mod reader;
pub mod writer;

pub use node::Node;
pub use reader::Reader;
pub use writer::Writer;
