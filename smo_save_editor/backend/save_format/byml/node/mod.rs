//! One value in a BYML tree, and how to reach a value inside it by path.
//!
//! A [`Node::Dict`] keeps its entries in insertion order, not sorted: the file lays children out
//! in the order the game added them, and rewriting it byte for byte needs that order.

/// One value in the tree.
#[derive(Debug, Clone, PartialEq)]
pub enum Node {
    Bool(bool),
    Int(i32),
    Float(f32),
    UInt(u32),
    Int64(i64),
    UInt64(u64),
    Double(f64),
    String(String),
    Array(Vec<Node>),
    /// Entries in insertion order (see the module docs), not sorted.
    Dict(Vec<(String, Node)>),
}

impl Node {
    /// Look up a child by dictionary key or array index.
    pub fn child(&self, segment: &str) -> Option<&Node> {
        match self {
            Node::Dict(entries) => entries.iter().find(|(k, _)| k == segment).map(|(_, v)| v),
            Node::Array(items) => items.get(segment.parse::<usize>().ok()?),
            _ => None,
        }
    }

    pub fn child_mut(&mut self, segment: &str) -> Option<&mut Node> {
        match self {
            Node::Dict(entries) => entries
                .iter_mut()
                .find(|(k, _)| k == segment)
                .map(|(_, v)| v),
            Node::Array(items) => items.get_mut(segment.parse::<usize>().ok()?),
            _ => None,
        }
    }

    /// Follow a path such as `/ShineData/3/IsGet`.
    pub fn at(&self, path: &str) -> Option<&Node> {
        path.split('/')
            .filter(|s| !s.is_empty())
            .try_fold(self, |node, seg| node.child(seg))
    }

    pub fn at_mut(&mut self, path: &str) -> Option<&mut Node> {
        path.split('/')
            .filter(|s| !s.is_empty())
            .try_fold(self, |node, seg| node.child_mut(seg))
    }
}
