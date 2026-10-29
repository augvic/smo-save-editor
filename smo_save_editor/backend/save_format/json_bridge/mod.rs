//! Conversion between [`Node`] trees and JSON, for talking to the user interface.
//!
//! JavaScript numbers are doubles and cannot hold every 64-bit integer, so those are sent
//! as numbers when they fit safely and as decimal strings otherwise.

use serde_json::{json, Map, Number, Value};

use crate::save_format::byml::Node;
use crate::save_format::error::{Error, Result};

/// Largest integer a JavaScript number represents exactly (2^53 - 1).
const JS_SAFE_INT: u64 = (1 << 53) - 1;

/// Converts between the editor's tree and the JSON the interface works with.
pub struct JsonBridge;

impl JsonBridge {
    pub fn to_json(node: &Node) -> Value {
        match node {
            Node::Bool(v) => json!(v),
            Node::Int(v) => json!(v),
            Node::UInt(v) => json!(v),
            Node::Float(v) => Number::from_f64(*v as f64).map_or(Value::Null, Value::Number),
            Node::Double(v) => Number::from_f64(*v).map_or(Value::Null, Value::Number),
            Node::Int64(v) if v.unsigned_abs() <= JS_SAFE_INT => json!(v),
            Node::Int64(v) => json!(v.to_string()),
            Node::UInt64(v) if *v <= JS_SAFE_INT => json!(v),
            Node::UInt64(v) => json!(v.to_string()),
            Node::String(s) => json!(s),
            Node::Array(items) => Value::Array(items.iter().map(Self::to_json).collect()),
            Node::Dict(entries) => {
                Value::Object(entries.iter().map(|(k, v)| (k.clone(), Self::to_json(v))).collect::<Map<_, _>>())
            }
        }
    }

    /// Replace a plain value with one from JSON, keeping its type (an `Int` stays an `Int`).
    /// A list can be replaced by a list (it may grow or shrink; see [`Self::from_json`] for what its
    /// items become). An object cannot be replaced: edit its children instead.
    pub fn set(node: &mut Node, value: &Value) -> Result<()> {
        let mismatch = |want: &str| Error::TypeMismatch(format!("expected {want}, got {value}"));
        match node {
            Node::Bool(v) => *v = value.as_bool().ok_or_else(|| mismatch("a boolean"))?,
            Node::Int(v) => {
                let n = value.as_i64().ok_or_else(|| mismatch("an integer"))?;
                *v = i32::try_from(n).map_err(|_| mismatch("a 32-bit integer"))?;
            }
            Node::UInt(v) => {
                let n = value.as_u64().ok_or_else(|| mismatch("an unsigned integer"))?;
                *v = u32::try_from(n).map_err(|_| mismatch("a 32-bit unsigned integer"))?;
            }
            Node::Int64(v) => *v = int_from(value).ok_or_else(|| mismatch("a 64-bit integer"))?,
            Node::UInt64(v) => *v = uint_from(value).ok_or_else(|| mismatch("a 64-bit unsigned integer"))?,
            Node::Float(v) => *v = value.as_f64().ok_or_else(|| mismatch("a number"))? as f32,
            Node::Double(v) => *v = value.as_f64().ok_or_else(|| mismatch("a number"))?,
            Node::String(v) => *v = value.as_str().ok_or_else(|| mismatch("a string"))?.to_owned(),
            Node::Array(items) => {
                let new = value.as_array().ok_or_else(|| mismatch("a list"))?;
                *items = new.iter().map(Self::from_json).collect::<Result<Vec<_>>>()?;
            }
            Node::Dict(_) => return Err(Error::TypeMismatch("objects cannot be replaced".into())),
        }
        Ok(())
    }

    /// Build a node from JSON for the items of a replaced list: whole numbers become `Int`, other numbers
    /// `Float`, and an object keeps its keys sorted, as the game writes them. `null` has no node.
    pub fn from_json(value: &Value) -> Result<Node> {
        Ok(match value {
            Value::Bool(v) => Node::Bool(*v),
            Value::Number(n) if n.is_i64() => {
                Node::Int(i32::try_from(n.as_i64().unwrap_or(0)).map_err(|_| Error::TypeMismatch(format!("{n} does not fit in 32 bits")))?)
            }
            Value::Number(n) => Node::Float(n.as_f64().unwrap_or(0.0) as f32),
            Value::String(s) => Node::String(s.clone()),
            Value::Array(items) => Node::Array(items.iter().map(Self::from_json).collect::<Result<Vec<_>>>()?),
            Value::Object(map) => {
                let mut entries = map.iter().map(|(k, v)| Ok((k.clone(), Self::from_json(v)?))).collect::<Result<Vec<_>>>()?;
                entries.sort_by(|a, b| a.0.cmp(&b.0));
                Node::Dict(entries)
            }
            Value::Null => return Err(Error::TypeMismatch("null has no node".into())),
        })
    }
}

fn int_from(value: &Value) -> Option<i64> {
    value.as_i64().or_else(|| value.as_str()?.parse().ok())
}

fn uint_from(value: &Value) -> Option<u64> {
    value.as_u64().or_else(|| value.as_str()?.parse().ok())
}
