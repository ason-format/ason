# ASON Go Compressor

Go implementation of ASON (Aliased Serialization Object Notation), a token-optimized JSON compression format designed for Large Language Models (LLMs).

## Features

- ✅ **100% Automatic** - Zero configuration, detects patterns automatically
- ✅ **Lossless** - Perfect round-trip fidelity
- ✅ **Up to 60% Token Reduction** - Saves money on LLM API calls
- ✅ **Tabular Arrays** - Compact format for uniform data (`[N]{fields}`)
- ✅ **Sections** - Organized data structure (`@section`)
- ✅ **References** - Deduplicates repeated values (`$var`)
- ✅ **Pure Go** - No external dependencies, uses only standard library

## Installation

```bash
go get github.com/ason-format/ason/go-compressor
```

## Quick Start

```go
package main

import (
    "fmt"
    "github.com/ason-format/ason/go-compressor/pkg/ason"
)

func main() {
    // Create compressor
    opts := ason.DefaultOptions()
    compressor := ason.NewSmartCompressor(opts)
    
    // Compress data
    data := map[string]interface{}{
        "users": []interface{}{
            map[string]interface{}{"id": 1.0, "name": "Alice", "email": "alice@ex.com"},
            map[string]interface{}{"id": 2.0, "name": "Bob", "email": "bob@ex.com"},
        },
    }
    
    ason := compressor.Compress(data)
    fmt.Println(ason)
    // Output:
    // @users [2]{id,name,email}
    // 1|Alice|alice@ex.com
    // 2|Bob|bob@ex.com
    
    // Decompress (perfect round-trip)
    original, _ := compressor.Decompress(ason)
}
```

## API Reference

### SmartCompressor

```go
// Create compressor with default options
opts := ason.DefaultOptions()
compressor := ason.NewSmartCompressor(opts)

// Create compressor with custom options
opts := ason.CompressorOptions{
    Indent:                  1,      // Indentation spaces
    Delimiter:               "|",    // Field delimiter for tabular arrays
    UseReferences:           true,   // Enable reference detection
    UseSections:             true,   // Enable section organization
    UseTabular:              true,   // Enable tabular array format
    MinFieldsForSection:     3,      // Min fields to create section
    MinRowsForTabular:       2,      // Min rows for tabular format
    MinReferenceOccurrences: 2,      // Min occurrences for reference
}
compressor := ason.NewSmartCompressor(opts)
```

### Methods

#### Compress

```go
func (sc *SmartCompressor) Compress(data interface{}) string
```

Compresses JSON data to ASON 2.0 format.

**Example:**
```go
data := map[string]interface{}{
    "name": "Alice",
    "age": 30.0,
}
asonStr := compressor.Compress(data)
```

#### Decompress

```go
func (sc *SmartCompressor) Decompress(ason string) (interface{}, error)
```

Decompresses ASON 2.0 format back to JSON.

**Example:**
```go
data, err := compressor.Decompress(asonStr)
if err != nil {
    log.Fatal(err)
}
```

#### CompressWithStats

```go
func (sc *SmartCompressor) CompressWithStats(data interface{}) map[string]interface{}
```

Compresses data and returns detailed statistics.

**Example:**
```go
result := compressor.CompressWithStats(data)
fmt.Printf("Token reduction: %.2f%%\n", result["reduction_percent"])
```

#### ValidateRoundTrip

```go
func (sc *SmartCompressor) ValidateRoundTrip(data interface{}) map[string]interface{}
```

Validates that compress/decompress round-trips correctly.

**Example:**
```go
validation := compressor.ValidateRoundTrip(data)
if validation["valid"].(bool) {
    fmt.Println("Round-trip successful!")
}
```

#### GetOptimizationStats

```go
func (sc *SmartCompressor) GetOptimizationStats(data interface{}) map[string]interface{}
```

Gets optimization statistics without compressing.

## Running Tests

```bash
cd go-compressor
go test ./tests/... -v
```

## Running Examples

```bash
cd go-compressor
go run examples/basic_example.go
```

## Project Structure

```
go-compressor/
├── pkg/
│   └── ason/
│       ├── lexer/          # Tokenization
│       ├── parser/         # AST parsing  
│       ├── analyzer/       # Optimization detection
│       ├── compiler/       # Serialization
│       ├── utils/          # Utilities
│       └── compressor.go   # Main API
├── tests/                  # Test suite
├── examples/               # Usage examples
├── go.mod                  # Go module file
└── README.md              # This file
```

## Architecture

ASON Go follows a modular architecture:

1. **Lexer** - Tokenizes ASON format input
2. **Parser** - Builds AST from tokens
3. **Analyzer** - Detects optimization opportunities
   - ReferenceAnalyzer: Finds repeated values
   - SectionAnalyzer: Organizes data into sections
   - TabularAnalyzer: Identifies uniform arrays
4. **Compiler** - Serializes data to ASON format
5. **Utils** - Token counting and statistics

## Compatibility

- Go 1.21 or higher
- No external dependencies
- Compatible with Python and Node.js implementations

## License

MIT © 2025 ASON Project Contributors

## See Also

- [ASON 2.0 Specification](https://ason-format.github.io/ason/)
- [Python Implementation](../python-compressor/)
- [Node.js Implementation](../nodejs-compressor/)
- [Interactive Playground](https://ason-format.github.io/ason/)
