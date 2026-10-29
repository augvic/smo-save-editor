use std::fmt;

/// Everything that can go wrong while reading or writing a save.
#[derive(Debug, PartialEq)]
pub enum Error {
    /// A read went past the end of the file (offset that failed).
    OutOfBounds(usize),
    /// The file does not look like an Odyssey save or a BYML document.
    BadFormat(&'static str),
    /// A node type byte we do not know how to handle.
    UnknownNodeType(u8),
    /// A name/string index that is not in its table.
    BadIndex(u32),
    /// Text in the file is not valid UTF-8.
    InvalidUtf8,
    /// Containers nest deeper than any real save does (probably a loop).
    TooDeep,
    /// The new data does not fit in the space the file has for it.
    TooLarge { needed: usize, available: usize },
    /// A path like `/ShineData/3/IsGet` did not lead to a value.
    PathNotFound(String),
    /// The value given for an edit does not match the type of the field.
    TypeMismatch(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::OutOfBounds(o) => write!(f, "read past the end of the file at offset {o:#x}"),
            Error::BadFormat(m) => write!(f, "unsupported file: {m}"),
            Error::UnknownNodeType(t) => write!(f, "unknown node type {t:#x}"),
            Error::BadIndex(i) => write!(f, "index {i} is not in the string table"),
            Error::InvalidUtf8 => write!(f, "invalid UTF-8 text"),
            Error::TooDeep => write!(f, "data is nested too deeply"),
            Error::TooLarge { needed, available } => {
                write!(f, "data needs {needed} bytes but only {available} are available")
            }
            Error::PathNotFound(p) => write!(f, "no value at path {p}"),
            Error::TypeMismatch(m) => write!(f, "{m}"),
        }
    }
}

impl std::error::Error for Error {}

pub type Result<T> = std::result::Result<T, Error>;
