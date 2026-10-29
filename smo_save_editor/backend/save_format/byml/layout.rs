//! The numbers and the one rule of arithmetic the BYML layout is built from: the codes that say
//! what kind of value a node holds, two limits, and padding to a multiple of 4. Constants and a
//! helper, not a component, so they sit as a file inside the `byml` folder.

pub(crate) const T_STRING: u8 = 0xA0;
pub(crate) const T_ARRAY: u8 = 0xC0;
pub(crate) const T_DICT: u8 = 0xC1;
pub(crate) const T_TABLE: u8 = 0xC2;
pub(crate) const T_BOOL: u8 = 0xD0;
pub(crate) const T_INT: u8 = 0xD1;
pub(crate) const T_FLOAT: u8 = 0xD2;
pub(crate) const T_UINT: u8 = 0xD3;
pub(crate) const T_INT64: u8 = 0xD4;
pub(crate) const T_UINT64: u8 = 0xD5;
pub(crate) const T_DOUBLE: u8 = 0xD6;

pub(crate) const MAX_DEPTH: usize = 64;
pub(crate) const HEADER_SIZE: usize = 16;

/// Round up to the next multiple of 4, which is how the format aligns its tables and arrays.
pub(crate) fn pad4(n: usize) -> usize {
    (n + 3) & !3
}
