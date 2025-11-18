# ASON Python Compressor

**ASON (Aliased Serialization Object Notation)** is a token-optimized format for Large Language Models (LLMs), achieving 20-60% token reduction compared to JSON while maintaining perfect round-trip fidelity.

## Installation

```bash
pip install -e .
```

## Quick Start

```python
from ason import SmartCompressor

# Create compressor
compressor = SmartCompressor(indent=1, use_references=True)

# Sample data
data = {
    "users": [
        {"id": 1, "name": "Alice", "email": "alice@example.com"},
        {"id": 2, "name": "Bob", "email": "bob@example.com"}
    ]
}

# Compress to ASON
ason_str = compressor.compress(data)
print(ason_str)

# Decompress back to Python
original = compressor.decompress(ason_str)
print(original)

# Get compression stats
result = compressor.compress_with_stats(data)
print(f"Token reduction: {result['reduction_percent']}%")
```

## Features

- **Reference Detection**: Automatically detects and extracts repeated values
- **Section Organization**: Organizes large objects into logical sections
- **Tabular Arrays**: Compresses uniform arrays into compact tabular format
- **Perfect Fidelity**: Lossless compression with guaranteed round-trip accuracy

## API Reference

### SmartCompressor

```python
compressor = SmartCompressor(
    indent=1,                        # Indentation spaces
    delimiter='|',                   # Tabular array delimiter
    use_references=True,             # Enable reference detection
    use_sections=True,               # Enable section organization
    use_tabular=True,                # Enable tabular arrays
    min_fields_for_section=3,        # Min fields for section
    min_rows_for_tabular=2,          # Min rows for tabular
    min_reference_occurrences=2      # Min occurrences for reference
)
```

### Methods

- `compress(data)` - Compress data to ASON format
- `decompress(ason)` - Decompress ASON back to Python
- `compress_with_stats(data)` - Compress with detailed statistics
- `validate_round_trip(data)` - Validate compression/decompression
- `get_optimization_stats(data)` - Get optimization analysis

## License

MIT License - See LICENSE file for details
