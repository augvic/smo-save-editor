//! Apply several edits to an open save. Either all of them apply or none do.

use std::sync::Arc;

use serde_json::Value;

use crate::desktop::documents::Documents;
use crate::save_format::JsonBridge;

pub struct SetValues {
    documents: Arc<Documents>,
}

impl SetValues {
    pub fn new(documents: Arc<Documents>) -> SetValues {
        SetValues { documents }
    }

    pub fn execute(&self, kind: &str, edits: Vec<(String, Value)>) -> Result<(), String> {
        self.documents.edit(kind, |save| {
            let mut trial = save.clone();
            for (path, value) in &edits {
                let node = trial.root.at_mut(path).ok_or_else(|| format!("no value at {path}"))?;
                JsonBridge::set(node, value).map_err(|e| format!("{path}: {e}"))?;
            }
            *save = trial;
            Ok(())
        })
    }
}
