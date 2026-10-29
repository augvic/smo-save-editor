//! Writes a [`Node`] tree as a BYML document, laid out exactly the way the game does it.

use std::collections::{BTreeSet, HashMap};

use super::node::Node;
use super::layout::{pad4, 
    HEADER_SIZE, T_ARRAY, T_BOOL, T_DICT, T_DOUBLE, T_FLOAT, T_INT, T_INT64, T_STRING, T_TABLE, T_UINT,
    T_UINT64,
};
use crate::save_format::error::{Error, Result};

/// Overwrite 4 bytes at `at`. A function (rather than `out[..].copy_from_slice(&out.len()..)`)
/// because Rust will not let us read `out` while a slice of it is borrowed for writing.
fn set_u32(out: &mut [u8], at: usize, value: u32) {
    out[at..at + 4].copy_from_slice(&value.to_le_bytes());
}

/// Store the current length of `out` (the offset of whatever is written next) at `at`.
fn mark_here(out: &mut [u8], at: usize) {
    let here = out.len() as u32;
    set_u32(out, at, here);
}

fn align4(out: &mut Vec<u8>) {
    out.resize(pad4(out.len()), 0);
}

fn is_container(node: &Node) -> bool {
    matches!(node, Node::Array(_) | Node::Dict(_))
}

fn is_wide(node: &Node) -> bool {
    matches!(node, Node::Int64(_) | Node::UInt64(_) | Node::Double(_))
}

/// What the writer needs to know before it can emit anything.
///
/// Nodes are identified by address (`*const Node`): a tree owns each node exactly once,
/// so an address is a unique id, and we only compare addresses, never dereference them.
struct Plan<'a> {
    containers: Vec<&'a Node>,
    wides: Vec<&'a Node>,
    names: BTreeSet<&'a str>,
    strings: BTreeSet<&'a str>,
}

impl<'a> Plan<'a> {
    /// Walk the tree in insertion order, collecting everything the file must contain.
    fn visit(&mut self, node: &'a Node) {
        match node {
            Node::Array(items) => {
                self.containers.push(node);
                items.iter().for_each(|child| self.visit(child));
            }
            Node::Dict(entries) => {
                self.containers.push(node);
                for (key, child) in entries {
                    self.names.insert(key);
                    self.visit(child);
                }
            }
            Node::String(s) => {
                self.strings.insert(s);
            }
            n if is_wide(n) => self.wides.push(n),
            _ => {}
        }
    }
}

fn container_size(node: &Node) -> usize {
    match node {
        Node::Array(items) => 4 + pad4(items.len()) + 4 * items.len(),
        Node::Dict(entries) => 4 + 8 * entries.len(),
        _ => unreachable!("only containers have a size"),
    }
}

fn write_table(out: &mut Vec<u8>, items: &BTreeSet<&str>) {
    let start = out.len();
    out.extend_from_slice(&(T_TABLE as u32 | (items.len() as u32) << 8).to_le_bytes());
    let offsets_at = out.len();
    out.resize(offsets_at + 4 * (items.len() + 1), 0);
    for (i, s) in items.iter().enumerate() {
        let off = (out.len() - start) as u32;
        set_u32(out, offsets_at + 4 * i, off);
        out.extend_from_slice(s.as_bytes());
        out.push(0);
    }
    let end = (out.len() - start) as u32;
    set_u32(out, offsets_at + 4 * items.len(), end);
    align4(out);
}

/// Serializes a [`Node`] tree to BYML.
pub struct Writer;

impl Writer {
    /// Serialize a tree to BYML, laid out exactly the way the game does it.
    pub fn write(root: &Node) -> Result<Vec<u8>> {
        if !is_container(root) {
            return Err(Error::BadFormat("root must be an array or a dictionary"));
        }
        let mut plan = Plan {
            containers: vec![],
            wides: vec![],
            names: BTreeSet::new(),
            strings: BTreeSet::new(),
        };
        plan.visit(root);

        let name_index: HashMap<&str, u32> =
            plan.names.iter().enumerate().map(|(i, s)| (*s, i as u32)).collect();
        let string_index: HashMap<&str, u32> =
            plan.strings.iter().enumerate().map(|(i, s)| (*s, i as u32)).collect();

        let mut out = vec![0u8; HEADER_SIZE];
        out[0..2].copy_from_slice(b"YB");
        out[2..4].copy_from_slice(&3u16.to_le_bytes());

        mark_here(&mut out, 4);
        write_table(&mut out, &plan.names);

        if !plan.strings.is_empty() {
            mark_here(&mut out, 8);
            write_table(&mut out, &plan.strings);
        }

        let mut wide_at: HashMap<*const Node, u32> = HashMap::new();
        for node in &plan.wides {
            wide_at.insert(*node as *const Node, out.len() as u32);
            match node {
                Node::Int64(v) => out.extend_from_slice(&v.to_le_bytes()),
                Node::UInt64(v) => out.extend_from_slice(&v.to_le_bytes()),
                Node::Double(v) => out.extend_from_slice(&v.to_le_bytes()),
                _ => unreachable!(),
            }
        }

        let mut container_at: HashMap<*const Node, u32> = HashMap::new();
        let mut cursor = out.len();
        for node in &plan.containers {
            container_at.insert(*node as *const Node, cursor as u32);
            cursor += container_size(node);
        }
        mark_here(&mut out, 12);

        // Type byte and 32-bit payload of a value, as stored inside its parent.
        let encode = |node: &Node| -> (u8, u32) {
            let id = node as *const Node;
            match node {
                Node::Bool(v) => (T_BOOL, *v as u32),
                Node::Int(v) => (T_INT, *v as u32),
                Node::Float(v) => (T_FLOAT, v.to_bits()),
                Node::UInt(v) => (T_UINT, *v),
                Node::String(s) => (T_STRING, string_index[s.as_str()]),
                Node::Int64(_) => (T_INT64, wide_at[&id]),
                Node::UInt64(_) => (T_UINT64, wide_at[&id]),
                Node::Double(_) => (T_DOUBLE, wide_at[&id]),
                Node::Array(_) => (T_ARRAY, container_at[&id]),
                Node::Dict(_) => (T_DICT, container_at[&id]),
            }
        };

        for node in &plan.containers {
            match node {
                Node::Array(items) => {
                    out.extend_from_slice(&(T_ARRAY as u32 | (items.len() as u32) << 8).to_le_bytes());
                    let types_at = out.len();
                    out.resize(types_at + pad4(items.len()), 0);
                    for (i, item) in items.iter().enumerate() {
                        let (ty, raw) = encode(item);
                        out[types_at + i] = ty;
                        out.extend_from_slice(&raw.to_le_bytes());
                    }
                }
                Node::Dict(entries) => {
                    out.extend_from_slice(&(T_DICT as u32 | (entries.len() as u32) << 8).to_le_bytes());
                    // The file stores entries sorted by key, whatever order they were added in.
                    let mut sorted: Vec<&(String, Node)> = entries.iter().collect();
                    sorted.sort_by(|a, b| a.0.cmp(&b.0));
                    for (key, child) in sorted {
                        let (ty, raw) = encode(child);
                        out.extend_from_slice(&name_index[key.as_str()].to_le_bytes()[..3]);
                        out.push(ty);
                        out.extend_from_slice(&raw.to_le_bytes());
                    }
                }
                _ => unreachable!(),
            }
        }
        Ok(out)
    }
}
