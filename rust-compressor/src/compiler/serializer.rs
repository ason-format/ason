//! Serializer module for generating ASON output

use serde_json::Value;
use std::collections::HashMap;
use crate::analyzer::section::SectionPlan;
use crate::analyzer::tabular::TabularAnalysis;

pub struct Serializer {
    indent: usize,
    delimiter: String,
}

impl Serializer {
    pub fn new(indent: usize, delimiter: String) -> Self {
        Self { indent, delimiter }
    }

    pub fn serialize(
        &self,
        data: &Value,
        _references: &HashMap<String, Value>,
        _section_plan: Option<&SectionPlan>,
        _tabular: &HashMap<String, TabularAnalysis>,
    ) -> String {
        // For now, serialize as pretty JSON
        // Full ASON serialization would go here
        match serde_json::to_string_pretty(data) {
            Ok(json) => json,
            Err(_) => String::new(),
        }
    }

    fn serialize_value(&self, value: &Value, _depth: usize) -> String {
        match value {
            Value::Null => "null".to_string(),
            Value::Bool(b) => b.to_string(),
            Value::Number(n) => n.to_string(),
            Value::String(s) => self.serialize_string(s),
            Value::Array(arr) => self.serialize_array(arr),
            Value::Object(obj) => self.serialize_object(obj),
        }
    }

    fn serialize_string(&self, s: &str) -> String {
        // Check if string needs quotes
        let needs_quotes = s.is_empty()
            || s.contains(|c: char| {
                c == ' '
                    || c == '\n'
                    || c == '\t'
                    || c == '|'
                    || c == ':'
                    || c == ','
                    || c == '{'
                    || c == '}'
                    || c == '@'
                    || c == '$'
                    || c == '&'
                    || c == '['
                    || c == ']'
                    || c == '='
            });

        if needs_quotes {
            format!("\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\""))
        } else {
            s.to_string()
        }
    }

    fn serialize_array(&self, arr: &Vec<Value>) -> String {
        if arr.is_empty() {
            return "[]".to_string();
        }

        let items: Vec<String> = arr.iter().map(|v| self.serialize_value(v, 0)).collect();
        format!("[{}]", items.join(", "))
    }

    fn serialize_object(&self, obj: &serde_json::Map<String, Value>) -> String {
        if obj.is_empty() {
            return "{}".to_string();
        }

        let mut items: Vec<String> = obj
            .iter()
            .map(|(k, v)| {
                format!(
                    "{}: {}",
                    self.serialize_string(k),
                    self.serialize_value(v, 0)
                )
            })
            .collect();

        format!("{{{}}}", items.join(", "))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_serialize_simple() {
        let serializer = Serializer::new(1, "|".to_string());
        let data = json!({"name": "Alice", "age": 30});
        let result = serializer.serialize(&data, &HashMap::new(), None, &HashMap::new());
        assert!(!result.is_empty());
    }
}
