# ASON Rust Compressor

Rust implementation of ASON (Aliased Serialization Object Notation), a token-optimized JSON compression format designed for Large Language Models (LLMs).

## Features

- ✅ **Pure Rust** - No external dependencies (except serde for JSON)
- ✅ **Memory Safe** - Leverages Rust's ownership system
- ✅ **Zero-cost Abstractions** - High performance with no runtime overhead
- ✅ **Lossless** - Perfect round-trip fidelity
- ✅ **Token Optimization** - Up to 60% token reduction vs JSON

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
ason-compressor = "1.0"
```

## Quick Start

```rust
use ason_compressor::{SmartCompressor, CompressorOptions};
use serde_json::json;

fn main() {
    // Create compressor with default options
    let compressor = SmartCompressor::default();
    
    // Compress data
    let data = json!({
        "users": [
            {"id": 1, "name": "Alice", "email": "alice@ex.com"},
            {"id": 2, "name": "Bob", "email": "bob@ex.com"},
        ]
    });
    
    let ason = compressor.compress(&data);
    println!("{}", ason);
    
    // Decompress (perfect round-trip)
    let original = compressor.decompress(&ason).unwrap();
    assert_eq!(data, original);
}
```

## API Reference

### SmartCompressor

```rust
// Create with default options
let compressor = SmartCompressor::default();

// Create with custom options
let options = CompressorOptions {
    indent: 1,
    delimiter: "|".to_string(),
    use_references: true,
    use_sections: true,
    use_tabular: true,
    min_fields_for_section: 3,
    min_rows_for_tabular: 2,
    min_reference_occurrences: 2,
};
let compressor = SmartCompressor::new(options);
```

### Methods

- `compress(&self, data: &Value) -> String` - Compress JSON to ASON
- `decompress(&self, ason: &str) -> Result<Value, Error>` - Decompress ASON to JSON
- `compress_with_stats(&self, data: &Value) -> HashMap<String, Value>` - Compression with statistics
- `validate_round_trip(&self, data: &Value) -> HashMap<String, Value>` - Validate round-trip

## Running Tests

```bash
cargo test
```

## Building

```bash
cargo build --release
```

## Documentation

Generate and view documentation:

```bash
cargo doc --open
```

## License

MIT © 2025 ASON Project Contributors

## See Also

- [ASON 2.0 Specification](https://ason-format.github.io/ason/)
- [Python Implementation](../python-compressor/)
- [Go Implementation](../go-compressor/)
- [Node.js Implementation](../nodejs-compressor/)
