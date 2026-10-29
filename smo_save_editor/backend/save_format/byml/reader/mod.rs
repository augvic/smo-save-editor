//! Reads a BYML document into a [`Node`] tree, recovering the order the game added things in.

use std::cmp::Reverse;
use std::collections::BinaryHeap;

use super::node::Node;
use super::layout::{pad4, 
    HEADER_SIZE, MAX_DEPTH, T_ARRAY, T_BOOL, T_DICT, T_DOUBLE, T_FLOAT, T_INT, T_INT64, T_STRING, T_TABLE,
    T_UINT, T_UINT64,
};
use crate::save_format::error::{Error, Result};

/// A parsed value plus where it lived in the file, used to rebuild insertion order.
struct Parsed {
    node: Node,
    /// File offset of the container itself (arrays and dicts only).
    container_at: Option<usize>,
    /// Lowest file offset of any 64-bit value in this subtree.
    first_wide: Option<usize>,
}

/// Reads BYML documents. Holds the key and string tables while one document is being read.
pub struct Reader<'a> {
    data: &'a [u8],
    names: Vec<String>,
    strings: Vec<String>,
}

impl Reader<'_> {
    /// Parse a BYML document. `data` must start at the `YB` header.
    pub fn read(data: &[u8]) -> Result<Node> {
        if data.len() < HEADER_SIZE || &data[0..2] != b"YB" {
            return Err(Error::BadFormat("missing BYML header"));
        }
        if u16::from_le_bytes([data[2], data[3]]) != 3 {
            return Err(Error::BadFormat("only BYML version 3 is supported"));
        }
        let mut reader = Reader { data, names: vec![], strings: vec![] };
        let names_at = reader.u32_at(4)? as usize;
        let strings_at = reader.u32_at(8)? as usize;
        let root_at = reader.u32_at(12)? as usize;

        if names_at != 0 {
            reader.names = reader.read_table(names_at)?;
        }
        if strings_at != 0 {
            reader.strings = reader.read_table(strings_at)?;
        }
        match reader.byte_at(root_at)? {
            t @ (T_ARRAY | T_DICT) => Ok(reader.read_value(t, root_at as u32, 0)?.node),
            _ => Err(Error::BadFormat("root must be an array or a dictionary")),
        }
    }

    fn byte_at(&self, off: usize) -> Result<u8> {
        self.data.get(off).copied().ok_or(Error::OutOfBounds(off))
    }

    fn u32_at(&self, off: usize) -> Result<u32> {
        let bytes = off
            .checked_add(4)
            .and_then(|end| self.data.get(off..end))
            .ok_or(Error::OutOfBounds(off))?;
        Ok(u32::from_le_bytes(bytes.try_into().unwrap()))
    }

    fn u64_at(&self, off: usize) -> Result<u64> {
        let bytes = off
            .checked_add(8)
            .and_then(|end| self.data.get(off..end))
            .ok_or(Error::OutOfBounds(off))?;
        Ok(u64::from_le_bytes(bytes.try_into().unwrap()))
    }

    /// Name and string tables: `0xC2 | count << 8`, `count + 1` offsets, then the text.
    fn read_table(&self, at: usize) -> Result<Vec<String>> {
        if self.byte_at(at)? != T_TABLE {
            return Err(Error::BadFormat("expected a string table"));
        }
        let count = (self.u32_at(at)? >> 8) as usize;
        (0..count)
            .map(|i| {
                let start = at + self.u32_at(at + 4 + 4 * i)? as usize;
                let tail = self.data.get(start..).ok_or(Error::OutOfBounds(start))?;
                let len = tail.iter().position(|&b| b == 0).ok_or(Error::OutOfBounds(start))?;
                String::from_utf8(tail[..len].to_vec()).map_err(|_| Error::InvalidUtf8)
            })
            .collect()
    }

    /// Decode a value from its type byte and 32-bit payload. For containers and 64-bit
    /// numbers the payload is an offset; for everything else it is the value itself.
    fn read_value(&self, ty: u8, raw: u32, depth: usize) -> Result<Parsed> {
        let scalar = |node| Ok(Parsed { node, container_at: None, first_wide: None });
        let wide = |node| {
            Ok(Parsed { node, container_at: None, first_wide: Some(raw as usize) })
        };
        match ty {
            T_BOOL => scalar(Node::Bool(raw != 0)),
            T_INT => scalar(Node::Int(raw as i32)),
            T_FLOAT => scalar(Node::Float(f32::from_bits(raw))),
            T_UINT => scalar(Node::UInt(raw)),
            T_STRING => {
                let s = self.strings.get(raw as usize).ok_or(Error::BadIndex(raw))?;
                scalar(Node::String(s.clone()))
            }
            T_INT64 => wide(Node::Int64(self.u64_at(raw as usize)? as i64)),
            T_UINT64 => wide(Node::UInt64(self.u64_at(raw as usize)?)),
            T_DOUBLE => wide(Node::Double(f64::from_bits(self.u64_at(raw as usize)?))),
            T_ARRAY => self.read_array(raw as usize, depth),
            T_DICT => self.read_dict(raw as usize, depth),
            other => Err(Error::UnknownNodeType(other)),
        }
    }

    fn read_array(&self, at: usize, depth: usize) -> Result<Parsed> {
        if depth > MAX_DEPTH {
            return Err(Error::TooDeep);
        }
        let count = (self.u32_at(at)? >> 8) as usize;
        let values_at = at + 4 + pad4(count);
        let mut items = Vec::with_capacity(count);
        let mut first_wide: Option<usize> = None;
        for i in 0..count {
            let ty = self.byte_at(at + 4 + i)?;
            let raw = self.u32_at(values_at + 4 * i)?;
            let child = self.read_value(ty, raw, depth + 1)?;
            first_wide = first_wide.or(child.first_wide);
            items.push(child.node);
        }
        Ok(Parsed { node: Node::Array(items), container_at: Some(at), first_wide })
    }

    fn read_dict(&self, at: usize, depth: usize) -> Result<Parsed> {
        if depth > MAX_DEPTH {
            return Err(Error::TooDeep);
        }
        let count = (self.u32_at(at)? >> 8) as usize;
        let mut entries = Vec::with_capacity(count);
        for i in 0..count {
            let e = at + 4 + 8 * i;
            let key = self.u32_at(e)? & 0x00FF_FFFF;
            let ty = self.byte_at(e + 3)?;
            let raw = self.u32_at(e + 4)?;
            let name = self.names.get(key as usize).ok_or(Error::BadIndex(key))?;
            entries.push((name.clone(), self.read_value(ty, raw, depth + 1)?));
        }

        let first_wide = entries.iter().filter_map(|(_, p)| p.first_wide).min();
        let order = insertion_order(&entries);
        let mut slots: Vec<Option<(String, Parsed)>> = entries.into_iter().map(Some).collect();
        let sorted = order
            .into_iter()
            .map(|i| slots[i].take().expect("each index is used once"))
            .map(|(name, parsed)| (name, parsed.node))
            .collect();
        Ok(Parsed { node: Node::Dict(sorted), container_at: Some(at), first_wide })
    }
}

/// Recover the order the game added a dictionary's entries in.
///
/// Entries sit in the file sorted by key, but two other things remember the real order:
/// child containers are laid out in insertion order, and so are the 64-bit values. Each
/// gives a partial order; this merges them into one (a topological sort). Entries that
/// are neither (plain ints, bools, strings) leave no trace and so no order is needed.
fn insertion_order(entries: &[(String, Parsed)]) -> Vec<usize> {
    let n = entries.len();
    let mut edges: Vec<Vec<usize>> = vec![vec![]; n];
    let mut indegree = vec![0usize; n];

    let mut chain = |mut idx: Vec<(usize, usize)>| {
        idx.sort_by_key(|&(pos, _)| pos);
        for pair in idx.windows(2) {
            if pair[0].0 != pair[1].0 {
                edges[pair[0].1].push(pair[1].1);
                indegree[pair[1].1] += 1;
            }
        }
    };
    chain(entries.iter().enumerate().filter_map(|(i, (_, p))| Some((p.container_at?, i))).collect());
    chain(entries.iter().enumerate().filter_map(|(i, (_, p))| Some((p.first_wide?, i))).collect());

    let mut ready: BinaryHeap<Reverse<usize>> =
        (0..n).filter(|&i| indegree[i] == 0).map(Reverse).collect();
    let mut order = Vec::with_capacity(n);
    while let Some(Reverse(i)) = ready.pop() {
        order.push(i);
        for &next in &edges[i] {
            indegree[next] -= 1;
            if indegree[next] == 0 {
                ready.push(Reverse(next));
            }
        }
    }
    if order.len() == n {
        order
    } else {
        // Contradictory offsets (not produced by the game): fall back to file order.
        (0..n).collect()
    }
}

