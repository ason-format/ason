//! Reference analyzer stub

use serde_json::Value;
use std::collections::HashMap;

pub struct ReferenceAnalyzer;

impl ReferenceAnalyzer {
    pub fn new(_min_occurrences: usize) -> Self {
        Self
    }

    pub fn analyze(&self, _data: &Value) -> HashMap<String, Value> {
        HashMap::new()
    }
}
