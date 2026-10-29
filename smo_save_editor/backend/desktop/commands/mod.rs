//! The adapter: each command Tauri exposes to the interface translates one request into exactly
//! one action call. No logic lives here. (They are free functions because the framework's
//! `#[tauri::command]` requires it.)

use serde_json::Value;
use tauri::State;

use crate::desktop::actions::Loaded;
use crate::desktop::Desktop;

#[tauri::command]
pub fn open_save(path: String, desktop: State<Desktop>) -> Result<Loaded, String> {
    desktop.open_save.execute(&path)
}

#[tauri::command]
pub fn set_values(kind: String, edits: Vec<(String, Value)>, desktop: State<Desktop>) -> Result<(), String> {
    desktop.set_values.execute(&kind, edits)
}

#[tauri::command]
pub fn write_save(kind: String, path: String, desktop: State<Desktop>) -> Result<(), String> {
    desktop.write_save.execute(&kind, &path)
}
