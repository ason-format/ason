//! Tabular analyzer stub

use serde_json::Value;
use std::collections::HashMap;

pub struct TabularAnalyzer;

pub struct TabularAnalysis;

impl TabularAnalyzer {
    pub fn new(_min_rows: usize) -> Self {
        Self
    }

    pub fn find_arrays(&self, _data: &Value) -> HashMap<String, TabularAnalysis> {
        HashMap::new()
    }
}
