//! The save file wrapper: a small header in front of a BYML document.

use super::byml::{Node, Reader, Writer};
use super::crc32::Crc32;
use super::error::{Error, Result};

// The first 4 bytes of every save are a CRC-32 of everything after them. The game rejects
// a save whose checksum is wrong, so it must be recomputed after every edit.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SaveKind {
    Progress,
    Common,
}

impl SaveKind {
    /// Where the BYML document starts.
    fn byml_start(self) -> usize {
        match self {
            SaveKind::Progress => 0x10,
            SaveKind::Common => 0x48,
        }
    }

    /// Where the header stores the length of the BYML document.
    fn length_field(self) -> usize {
        self.byml_start() - 4
    }
}

/// A loaded save. Edit [`SaveFile::root`], then call [`SaveFile::to_bytes`].
#[derive(Debug, Clone)]
pub struct SaveFile {
    pub kind: SaveKind,
    pub root: Node,
    /// Whether the checksum in the file matched when it was loaded.
    pub checksum_ok: bool,
    /// The original file, kept so everything we do not understand is written back as is.
    original: Vec<u8>,
    /// Length of the BYML document in `original`.
    byml_len: usize,
}

impl SaveFile {
    pub fn from_bytes(data: &[u8]) -> Result<SaveFile> {
        // The two kinds differ only in how long the header is, so look for the BYML marker.
        let has_byml = |at: usize| data.get(at..at + 4) == Some(b"YB\x03\x00".as_slice());
        let kind = if has_byml(SaveKind::Progress.byml_start()) {
            SaveKind::Progress
        } else if has_byml(SaveKind::Common.byml_start()) {
            SaveKind::Common
        } else {
            return Err(Error::BadFormat("not an Odyssey save file"));
        };
        let field = kind.length_field();
        let len_bytes = data.get(field..field + 4).ok_or(Error::OutOfBounds(field))?;
        let byml_len = u32::from_le_bytes(len_bytes.try_into().unwrap()) as usize;
        let start = kind.byml_start();
        let body = data
            .get(start..start + byml_len)
            .ok_or(Error::OutOfBounds(start + byml_len))?;
        Ok(SaveFile {
            kind,
            root: Reader::read(body)?,
            checksum_ok: Crc32::checksum(&data[4..]) == u32::from_le_bytes(data[..4].try_into().unwrap()),
            original: data.to_vec(),
            byml_len,
        })
    }

    /// Serialize the save. The file keeps its original size, as the game expects.
    pub fn to_bytes(&self) -> Result<Vec<u8>> {
        let body = Writer::write(&self.root)?;
        let start = self.kind.byml_start();
        let available = self.original.len() - start;
        if body.len() > available {
            return Err(Error::TooLarge { needed: body.len(), available });
        }
        let mut out = self.original.clone();
        // Clear what the old document used, so a shorter one leaves no stale bytes.
        let old_end = start + self.byml_len.max(body.len());
        out[start..old_end].fill(0);
        out[start..start + body.len()].copy_from_slice(&body);
        let field = self.kind.length_field();
        out[field..field + 4].copy_from_slice(&(body.len() as u32).to_le_bytes());
        let checksum = Crc32::checksum(&out[4..]);
        out[..4].copy_from_slice(&checksum.to_le_bytes());
        Ok(out)
    }
}
