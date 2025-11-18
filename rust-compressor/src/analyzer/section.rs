//! Section analyzer stub

use serde_json::Value;

pub struct SectionAnalyzer;

impl SectionAnalyzer {
    pub fn new(_min_fields: usize) -> Self {
        Self
    }

    pub fn analyze(&self, _data: &Value) -> Option<SectionPlan> {
        None
    }
}

pub struct SectionPlan;
