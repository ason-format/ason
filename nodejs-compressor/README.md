# ASON 2.0 - Aliased Serialization Object Notation

![NPM Version](https://img.shields.io/npm/v/%40ason-format%2Fason)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> **Token-optimized JSON serialization for Large Language Models.** Reduces tokens by 20-60% with perfect round-trip fidelity. ASON 2.0 uses smart compression: sections, tabular arrays, and reference deduplication.

![ASON Overview](https://raw.githubusercontent.com/ason-format/ason/main/preview.png)

## Table of Contents

- [Why ASON 2.0?](#why-ason-20)
- [Quick Start](#quick-start)
- [Features](#features)
- [Installation](#installation)
- [CLI Usage](#cli-usage)
- [API Usage](#api-usage)
- [ASON 2.0 Format](#ason-20-format)
- [Compression Techniques](#compression-techniques)
- [Use Cases](#use-cases)
- [API Reference](#api-reference)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Why ASON 2.0?

LLM tokens cost money. Standard JSON is verbose and token-expensive. **ASON 2.0** reduces token usage by **20-60%** while maintaining **100% lossless** round-trip fidelity.

### Before (JSON - 59 tokens)
```json
{
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@example.com" },
    { "id": 2, "name": "Bob", "email": "bob@example.com" }
  ]
}
```

### After (ASON 2.0 - 23 tokens, **61% reduction**)
```
users:[2]{id,name,email}
1|Alice|alice@example.com
2|Bob|bob@example.com
```

### What's New in ASON 2.0?

- ✅ **Sections** (`@section`) - Organize related objects, save tokens on deep structures
- ✅ **Tabular Arrays** (`key:[N]{fields}`) - CSV-like format for uniform arrays
- ✅ **Semantic References** (`$email`, `&address`) - Human-readable variable names
- ✅ **Pipe Delimiter** - More token-efficient than commas
- ✅ **Lexer-Parser Architecture** - Robust parsing with proper AST
- ✅ **Zero Configuration** - Smart analysis detects patterns automatically

## Quick Start

```bash
npm install @ason-format/ason
```

```javascript
import { SmartCompressor } from '@ason-format/ason';

const compressor = new SmartCompressor();

const data = {
  users: [
    { id: 1, name: "Alice", email: "alice@ex.com" },
    { id: 2, name: "Bob", email: "bob@ex.com" }
  ]
};

// Compress
const ason = compressor.compress(data);
console.log(ason);
// Output:
// users:[2]{id,name,email}
// 1|Alice|alice@ex.com
// 2|Bob|bob@ex.com

// Decompress (perfect round-trip)
const original = compressor.decompress(ason);
// Returns: { users: [{ id: 1, name: "Alice", ... }] }
```

## Features

- ✅ **20-60% Token Reduction** - Saves money on LLM API calls
- ✅ **100% Lossless** - Perfect round-trip fidelity
- ✅ **Fully Automatic** - Zero configuration, detects patterns automatically
- ✅ **Sections** - Organize objects with `@section` syntax
- ✅ **Tabular Arrays** - CSV-like format `key:[N]{fields}` for uniform arrays
- ✅ **Semantic References** - `$var`, `&obj`, `#N` for deduplication
- ✅ **TypeScript Support** - Full `.d.ts` type definitions
- ✅ **ESM + CJS** - Works in browser and Node.js
- ✅ **Robust Parser** - Lexer → AST → Compiler architecture

## Installation

```bash
# npm
npm install @ason-format/ason

# yarn
yarn add @ason-format/ason

# pnpm
pnpm add @ason-format/ason
```

## CLI Usage

Command-line tool for converting between JSON and ASON formats.

### Basic Commands

```bash
# Compress JSON to ASON
npx ason input.json -o output.ason

# Decompress ASON to JSON
npx ason data.ason -o output.json

# Show compression stats
npx ason input.json --stats

# Pipe from stdin
echo '{"name": "Ada"}' | npx ason
cat data.json | npx ason > output.ason
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Output file (stdout if omitted) |
| `-e, --encode` | Force encode mode (JSON → ASON) |
| `-d, --decode` | Force decode mode (ASON → JSON) |
| `--delimiter <char>` | Field delimiter: `|` (pipe), `,` (comma), `\t` (tab) |
| `--indent <number>` | Indentation spaces (default: 1) |
| `--stats` | Show token count and savings |
| `--no-references` | Disable reference detection |
| `--no-sections` | Disable section organization |
| `--no-tabular` | Disable tabular array format |
| `-h, --help` | Show help |

### CLI Examples

```bash
# Show detailed stats
npx ason data.json --stats

# Output:
# 📊 COMPRESSION STATS:
# ┌─────────────────┬──────────┬────────────┬──────────────┐
# │ Format          │ Tokens   │ Size       │ Reduction    │
# ├─────────────────┼──────────┼────────────┼──────────────┤
# │ JSON            │ 59       │ 151 B      │ -            │
# │ ASON 2.0        │ 23       │ 43 B       │ 61.02%       │
# └─────────────────┴──────────┴────────────┴──────────────┘
# ✓ Saved 36 tokens (61.02%) • 108 B (71.52%)

# Use pipe delimiter (more efficient)
npx ason data.json --delimiter "|" -o output.ason

# Disable specific features
npx ason data.json --no-tabular --no-references
```

## API Usage

### Basic Usage

```javascript
import { SmartCompressor, TokenCounter } from '@ason-format/ason';

// Create compressor
const compressor = new SmartCompressor();

// Compress data
const data = {
  id: 1,
  name: "Alice",
  email: "alice@example.com"
};

const ason = compressor.compress(data);
const original = compressor.decompress(ason);

// Compare token usage
const stats = TokenCounter.compareFormats(data, JSON.stringify(data), ason);
console.log(`Saved ${stats.reduction_percent}% tokens`);
```

### Configuration

```javascript
const compressor = new SmartCompressor({
  indent: 1,                     // Indentation spaces (default: 1)
  delimiter: '|',                 // Field delimiter (default: '|')
  useReferences: true,            // Enable $var deduplication (default: true)
  useSections: true,              // Enable @section (default: true)
  useTabular: true,               // Enable [N]{fields} arrays (default: true)
  minFieldsForSection: 3,         // Min fields for @section (default: 3)
  minRowsForTabular: 2,           // Min rows for tabular (default: 2)
  minReferenceOccurrences: 2      // Min occurrences for $var (default: 2)
});
```

### TypeScript Support

```typescript
import { SmartCompressor, TokenCounter } from '@ason-format/ason';

interface User {
  id: number;
  name: string;
  email: string;
}

const compressor = new SmartCompressor();
const users: User[] = [
  { id: 1, name: "Alice", email: "alice@ex.com" },
  { id: 2, name: "Bob", email: "bob@ex.com" }
];

const compressed: string = compressor.compress({ users });
const decompressed: any = compressor.decompress(compressed);
```

## ASON 2.0 Format

### 1. Sections (`@section`)

Organize related properties (saves tokens with 3+ fields):

```javascript
// JSON
{
  "customer": {
    "name": "John",
    "email": "john@ex.com",
    "phone": "+1-555-0100"
  }
}

// ASON 2.0
@customer
 name:John
 email:john@ex.com
 phone:"+1-555-0100"
```

### 2. Tabular Arrays (`[N]{fields}`)

CSV-like format for uniform data:

```javascript
// JSON
{
  "items": [
    { "id": 1, "name": "Laptop", "price": 999 },
    { "id": 2, "name": "Mouse", "price": 29 }
  ]
}

// ASON 2.0
items:[2]{id,name,price}
1|Laptop|999
2|Mouse|29
```

### 3. Semantic References (`$var`)

Deduplicate repeated values:

```javascript
// JSON
{
  "customer": { "email": "john@example.com" },
  "billing": { "email": "john@example.com" }
}

// ASON 2.0
$def:
 $email:john@example.com
$data:
@customer
 email:$email
@billing
 email:$email
```

### 4. Nested Objects

Indentation-based structure:

```javascript
// JSON
{
  "order": {
    "customer": {
      "address": {
        "city": "NYC"
      }
    }
  }
}

// ASON 2.0 (dot notation)
order.customer.address.city:NYC

// Or with sections
@order
 customer:
  address:
   city:NYC
```

## Compression Techniques

### Token Savings by Feature

| Feature | Best For | Token Reduction |
|---------|----------|-----------------|
| **Tabular Arrays** | Uniform arrays (3+ items) | ~60% |
| **Sections** | Objects with 3+ fields | ~30% |
| **References** | Repeated values/objects | ~50% |
| **Dot Notation** | Deep nested objects | ~20% |
| **Inline Objects** | Small objects (≤5 fields) | ~15% |
| **Schema Dot Notation** | Nested objects in tables | ~40% |
| **Array Fields** | Arrays in table rows | ~25% |

### Advanced Optimizations (New in 2.0)

#### 1. Inline Compact Objects

Small objects (≤5 properties, primitives only) are serialized inline without spaces:

```javascript
// JSON
{ "id": 1, "attrs": { "color": "red", "size": "M" } }

// ASON 2.0
id:1
attrs:{color:red,size:M}
```

#### 2. Dot Notation in Tabular Schemas

Nested objects are flattened in table schemas:

```javascript
// JSON
[
  { "id": 1, "price": { "amount": 100, "currency": "USD" } },
  { "id": 2, "price": { "amount": 200, "currency": "EUR" } }
]

// ASON 2.0
[2]{id,price.amount,price.currency}
1|100|USD
2|200|EUR
```

#### 3. Array Fields in Schemas

Arrays of primitives marked with `[]` suffix:

```javascript
// JSON
[
  { "id": 1, "tags": ["electronics", "sale"] },
  { "id": 2, "tags": ["clothing"] }
]

// ASON 2.0
[2]{id,tags[]}
1|[electronics,sale]
2|[clothing]
```

#### 4. Combined Optimizations

All optimizations work together:

```javascript
// JSON
[
  { "id": 1, "profile": { "age": 30, "city": "NYC" }, "tags": ["admin"] },
  { "id": 2, "profile": { "age": 25, "city": "LA" }, "tags": ["user", "premium"] }
]

// ASON 2.0
[2]{id,profile.age,profile.city,tags[]}
1|30|NYC|[admin]
2|25|LA|[user,premium]
```

### When ASON 2.0 Works Best

✅ **Highly Effective:**
- Uniform arrays (user lists, product catalogs)
- Repeated values (emails, addresses)
- Structured data (orders, records)
- Mixed nested structures

⚠️ **Less Effective:**
- Non-uniform arrays (mixed types)
- Single-occurrence values
- Very deeply nested unique objects

## Use Cases

### 1. Reduce LLM API Costs

```javascript
import { SmartCompressor } from '@ason-format/ason';
import OpenAI from 'openai';

const compressor = new SmartCompressor();
const openai = new OpenAI();

const largeData = await fetchDataFromDB();
const compressed = compressor.compress(largeData);

// Saves 20-60% on tokens = direct cost reduction
const response = await openai.chat.completions.create({
  messages: [{
    role: "user",
    content: `Analyze this data:\n\n${compressed}`
  }]
});
```

### 2. Optimize RAG Context

```javascript
// Compress documents for RAG systems
const documents = [/* ... large dataset ... */];
const compressed = compressor.compress({ documents });

// Fit more context in limited token window
const context = `Context: ${compressed}`;
```

### 3. Compact API Responses

```javascript
app.get('/api/data', (req, res) => {
  const data = getDataFromDB();

  if (req.query.format === 'ason') {
    return res.send(compressor.compress(data));
  }

  res.json(data);
});
```

### 4. Efficient Storage

```javascript
// Save to Redis/localStorage with less space
localStorage.setItem('cache', compressor.compress(bigObject));

// Retrieve
const data = compressor.decompress(localStorage.getItem('cache'));
```

## API Reference

### `SmartCompressor`

#### Constructor

```typescript
new SmartCompressor(options?: CompressorOptions)
```

**Options:**
```typescript
interface CompressorOptions {
  indent?: number;                   // Indentation spaces (default: 1)
  delimiter?: string;                // Field delimiter (default: '|')
  useReferences?: boolean;           // Enable references (default: true)
  useSections?: boolean;             // Enable sections (default: true)
  useTabular?: boolean;              // Enable tabular (default: true)
  minFieldsForSection?: number;      // Min fields for @section (default: 3)
  minRowsForTabular?: number;        // Min rows for tabular (default: 2)
  minReferenceOccurrences?: number;  // Min for $var (default: 2)
}
```

#### Methods

##### `compress(data: any): string`

Compresses JSON data to ASON 2.0 format.

```javascript
const ason = compressor.compress({ id: 1, name: "Alice" });
```

##### `decompress(ason: string): any`

Decompresses ASON 2.0 back to JSON.

```javascript
const data = compressor.decompress(ason);
```

##### `compressWithStats(data: any): CompressResult`

Compresses and returns detailed statistics.

```javascript
const result = compressor.compressWithStats(data);
console.log(result.reduction_percent); // e.g., 45.2
```

##### `validateRoundTrip(data: any): ValidationResult`

Validates compress/decompress round-trip.

```javascript
const result = compressor.validateRoundTrip(data);
if (!result.valid) {
  console.error('Round-trip failed:', result.error);
}
```

### `TokenCounter`

#### Static Methods

##### `estimateTokens(text: string): number`

Estimates token count using approximation (uses gpt-tokenizer if available).

```javascript
const tokens = TokenCounter.estimateTokens('Hello world');
```

##### `compareFormats(data: any, json: string, ason: string): ComparisonResult`

Compares token usage between formats.

```javascript
const stats = TokenCounter.compareFormats(data, jsonStr, asonStr);
console.log(stats.reduction_percent);
```

**Returns:**
```typescript
interface ComparisonResult {
  original_tokens: number;
  compressed_tokens: number;
  reduction_percent: number;
  bytes_saved: number;
}
```

## Documentation

- 🎮 **[Interactive Playground](https://ason-format.github.io/ason/)** - Try ASON 2.0 in your browser
- 📚 **[Full Documentation](https://ason-format.github.io/ason/docs.html)** - Complete guide
- 📊 **[Benchmarks](https://ason-format.github.io/ason/benchmarks.html)** - Performance comparisons
- 🔧 **[Tokenizer Tool](https://ason-format.github.io/ason/tokenizer.html)** - Test token efficiency
- 💻 **[GitHub Repository](https://github.com/ason-format/ason)** - Source code

## Benchmarks

Real-world token reduction on various datasets:

| Dataset | JSON Tokens | ASON 2.0 Tokens | Reduction |
|---------|-------------|-----------------|-----------|
| User List (uniform) | 247 | 98 | **60.3%** ✅ |
| E-commerce Order | 293 | 148 | **49.5%** ✅ |
| Shipping Record | 164 | 107 | **34.8%** ✅ |
| Analytics Data | 307 | 235 | **23.5%** ✅ |
| Nested Structure | 186 | 165 | **11.3%** ✅ |

**Average: 35.9% token reduction**

See [full benchmarks](https://ason-format.github.io/ason/benchmarks.html) for detailed comparisons.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](https://github.com/ason-format/ason/blob/main/CONTRIBUTING.md)

## License

[MIT](https://github.com/ason-format/ason/blob/main/LICENSE) © 2025 ASON Project Contributors

---

**ASON 2.0: Compress More. Pay Less. 🚀**
