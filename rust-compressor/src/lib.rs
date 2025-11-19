//! ASON Compressor - Rust Implementation
//! 
//! This library provides compression and decompression for ASON 2.0 format,
//! a token-optimized JSON compression format designed for Large Language Models.

pub mod lexer;
pub mod parser;
pub mod analyzer;
pub mod compiler;
pub mod utils;

use serde_json::Value;
use std::collections::HashMap;

/// Configuration options for the SmartCompressor
#[derive(Debug, Clone)]
pub struct CompressorOptions {
    pub indent: usize,
    pub delimiter: String,
    pub use_references: bool,
    pub use_sections: bool,
    pub use_tabular: bool,
    pub min_fields_for_section: usize,
    pub min_rows_for_tabular: usize,
    pub min_reference_occurrences: usize,
}

impl Default for CompressorOptions {
    fn default() -> Self {
        Self {
            indent: 1,
            delimiter: "|".to_string(),
            use_references: true,
            use_sections: true,
            use_tabular: true,
            min_fields_for_section: 3,
            min_rows_for_tabular: 2,
            min_reference_occurrences: 2,
        }
    }
}

/// Main compressor struct
pub struct SmartCompressor {
    options: CompressorOptions,
}

impl SmartCompressor {
    /// Create a new SmartCompressor with the given options
    pub fn new(options: CompressorOptions) -> Self {
        Self { options }
    }

    /// Create a SmartCompressor with default options
    pub fn default() -> Self {
        Self::new(CompressorOptions::default())
    }

    /// Compress JSON data to ASON 2.0 format
    pub fn compress(&self, data: &Value) -> String {
        use crate::analyzer::{reference::ReferenceAnalyzer, section::SectionAnalyzer, tabular::TabularAnalyzer};
        use crate::compiler::serializer::Serializer;

        // Step 1: Analyze references
        let references = if self.options.use_references {
            let analyzer = ReferenceAnalyzer::new(self.options.min_reference_occurrences);
            analyzer.analyze(data)
        } else {
            HashMap::new()
        };

        // Step 2: Analyze sections
        let section_plan = if self.options.use_sections {
            let analyzer = SectionAnalyzer::new(self.options.min_fields_for_section);
            analyzer.analyze(data)
        } else {
            None
        };

        // Step 3: Analyze tabular arrays
        let tabular_arrays = if self.options.use_tabular {
            let analyzer = TabularAnalyzer::new(self.options.min_rows_for_tabular);
            analyzer.find_arrays(data)
        } else {
            HashMap::new()
        };

        // Step 4: Serialize
        let serializer = Serializer::new(self.options.indent, self.options.delimiter.clone());
        serializer.serialize(data, &references, section_plan.as_ref(), &tabular_arrays)
    }

    /// Decompress ASON 2.0 format back to JSON
    pub fn decompress(&self, ason: &str) -> Result<Value, Box<dyn std::error::Error>> {
        use crate::lexer::Lexer;
        use crate::parser;

        // Step 1: Tokenize
        let mut lexer = Lexer::new(ason);
        let tokens = lexer.tokenize();

        // Step 2: Parse
        let ast = parser::parse(tokens)?;

        // Step 3: Convert to Value
        Ok(ast.to_value())
    }

    /// Compress with statistics
    pub fn compress_with_stats(&self, data: &Value) -> HashMap<String, Value> {
        let compressed = self.compress(data);
        let mut result = HashMap::new();
        result.insert("ason".to_string(), Value::String(compressed));
        result
    }

    /// Validate round-trip compression
    pub fn validate_round_trip(&self, data: &Value) -> HashMap<String, Value> {
        let compressed = self.compress(data);
        match self.decompress(&compressed) {
            Ok(decompressed) => {
                let mut result = HashMap::new();
                result.insert("valid".to_string(), Value::Bool(data == &decompressed));
                result.insert("compressed".to_string(), Value::String(compressed));
                result
            }
            Err(e) => {
                let mut result = HashMap::new();
                result.insert("valid".to_string(), Value::Bool(false));
                result.insert("error".to_string(), Value::String(e.to_string()));
                result
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_create_compressor() {
        let compressor = SmartCompressor::default();
        assert_eq!(compressor.options.indent, 1);
    }

    #[test]
    fn test_basic_round_trip() {
        let compressor = SmartCompressor::default();
        let data = json!({"name": "Alice", "age": 30.0});
        let compressed = compressor.compress(&data);
        let decompressed = compressor.decompress(&compressed).unwrap();
        assert_eq!(data, decompressed);
    }
}
