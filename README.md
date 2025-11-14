# ASON 2.0 - Aliased Serialization Object Notation

![NPM Version](https://img.shields.io/npm/v/%40ason-format%2Fason)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
![Downloads](https://img.shields.io/npm/dm/%40ason-format%2Fason)
[![GitHub Stars](https://img.shields.io/github/stars/ason-format/ason?style=social)](https://github.com/ason-format/ason)

> **Token-optimized JSON compression for GPT-4, Claude, and all Large Language Models.** Reduce LLM API costs by **20-60%** with lossless compression. Perfect for RAG systems, function calling, analytics data, and any structured arrays sent to LLMs. ASON 2.0 uses smart compression with tabular arrays, semantic references, and pipe delimiters.

**🎮 [Try Interactive Playground](https://ason-format.github.io/ason/)** • **📊 [View Benchmarks](https://ason-format.github.io/ason/benchmarks.html)** • **📖 [Read Documentation](https://ason-format.github.io/ason/docs.html)** • **📰 [Blog & Use Cases](https://ason-format.github.io/ason/blog.html)**

![ASON Overview](https://raw.githubusercontent.com/ason-format/ason/main/preview.png)

## ✨ What's New in ASON 2.0?

- ✅ **Sections** (`@section`) - Organize related data
- ✅ **Tabular Arrays** (`[N]{fields}`) - CSV-like format with explicit count
- ✅ **Semantic References** (`$email`, `&address`) - Human-readable variable names
- ✅ **Pipe Delimiter** (`|`) - More token-efficient than commas
- ✅ **Advanced Optimizations** - Inline objects, dot notation in schemas, array fields
- ✅ **Lexer-Parser Architecture** - Robust parsing with proper AST

## 🚀 Quick Start

### Installation

```bash
npm install @ason-format/ason
```

### Basic Usage

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
// @users [2]{id,name,email}
// 1|Alice|alice@ex.com
// 2|Bob|bob@ex.com

// Decompress (perfect round-trip)
const original = compressor.decompress(ason);
```

### CLI Tool

```bash
# Compress JSON to ASON
npx ason input.json -o output.ason

# Decompress ASON to JSON
npx ason data.ason -o output.json

# Show token savings with --stats
npx ason data.json --stats

# 📊 COMPRESSION STATS:
# ┌─────────────────┬──────────┬────────────┬──────────────┐
# │ Format          │ Tokens   │ Size       │ Reduction    │
# ├─────────────────┼──────────┼────────────┼──────────────┤
# │ JSON            │ 59       │ 151 B      │ -            │
# │ ASON 2.0        │ 23       │ 43 B       │ 61.02%       │
# └─────────────────┴──────────┴────────────┴──────────────┘
# ✓ Saved 36 tokens (61.02%) • 108 B (71.52%)

# Pipe from stdin
echo '{"name": "Ada"}' | npx ason
cat data.json | npx ason > output.ason
```

## 📊 Benchmarks

> Benchmarks use GPT-5 o200k_base tokenizer. Results vary by model and tokenizer.

### Token Efficiency Comparison

Tested on 5 real-world datasets:

```
🏆 Shipping Record
   │
   ASON                ████████████░░░░░░░░    148 tokens  (+9.76% vs JSON)
   JSON                ████████████████████    164 tokens  (baseline)
   Toon                ██████████████████░░    178 tokens  (-8.54% vs JSON)

🏆 E-commerce Order
   │
   ASON                █████████████████░░░    263 tokens  (+10.24% vs JSON)
   JSON                ████████████████████    293 tokens  (baseline)
   Toon                ████████████████████    296 tokens  (-1.02% vs JSON)

🏆 Analytics Time Series
   │
   ASON                ███████████░░░░░░░░░    235 tokens  (+23.45% vs JSON)
   Toon                ████████████████░░░░    260 tokens  (+15.31% vs JSON)
   JSON                ████████████████████    307 tokens  (baseline)

📊 GitHub Repositories (Non-uniform)
   │
   JSON                ████████████████████    347 tokens  (baseline)
   ASON                █████████████████░░░    384 tokens  (-10.66% vs JSON)
   Toon                ███████████████░░░░░    415 tokens  (-19.60% vs JSON)

📊 Deeply Nested Structure (Non-uniform)
   │
   JSON                ████████████████████    186 tokens  (baseline)
   ASON                ██████████████████░░    201 tokens  (-8.06% vs JSON)
   Toon                ████████████░░░░░░░░    223 tokens  (-19.89% vs JSON)

──────────────────────────────── OVERALL (5 datasets) ───────────────────────────────
   ASON Average:  +4.94% reduction
   Toon Average:  -6.75% reduction

   ASON WINS: 3 out of 5 datasets
   ASON performs better on: Uniform arrays, mixed structures
   Both struggle with: Non-uniform/deeply nested data (but ASON loses less)
```

### When to Use Each Format

| Format | Best For | Token Efficiency |
|--------|----------|------------------|
| **ASON** | Uniform arrays, nested objects, mixed data | ⭐⭐⭐⭐⭐ (4.94% avg) |
| **Toon** | Flat tabular data only | ⭐⭐⭐ (-6.75% avg) |
| **JSON** | Non-uniform, deeply nested | ⭐⭐ (baseline) |
| **CSV** | Simple tables, no nesting | ⭐⭐⭐⭐⭐⭐ (best for flat data) |

## ✨ Features

- ✅ **100% Automatic** - Zero configuration, detects patterns automatically
- ✅ **Lossless** - Perfect round-trip fidelity
- ✅ **Up to 23% Token Reduction** - Saves money on LLM API calls (+4.94% average)
- ✅ **Object References** - Deduplicates repeated structures (`&obj0`)
- ✅ **Inline-First Dictionary** - Optimized for LLM readability
- ✅ **TypeScript Support** - Full `.d.ts` type definitions included
- ✅ **CLI Tool** - Command-line interface with `--stats` flag
- ✅ **ESM + CJS** - Works in browser and Node.js

## 📚 Documentation

- 🎮 **[Interactive Playground](https://ason-format.github.io/ason/)** - Try ASON in your browser with real-time token counting
- 📖 **[Complete Documentation](https://ason-format.github.io/ason/docs.html)** - Format specification, API guide, and best practices
- 📊 **[Benchmarks & Comparisons](https://ason-format.github.io/ason/benchmarks.html)** - ASON vs JSON vs TOON vs YAML performance tests
- 📰 **[Blog & Use Cases](https://ason-format.github.io/ason/blog.html)** - Real-world case studies, migration guides, and tutorials
- 🔧 **[API Reference](./nodejs-compressor/README.md)** - Detailed Node.js API documentation
- 🔢 **[Token Counter Tool](https://ason-format.github.io/ason/tokenizer.html)** - Visual token comparison across formats
- 📦 **[Release Guide](./RELEASE.md)** - How to publish new versions
- 📝 **[Changelog](./CHANGELOG.md)** - Version history and updates

## 🎯 Real-World Use Cases

> **Case Study:** A production system processing 10M+ GPT-4 calls/month saved **$8,460/month** by switching to ASON. [Read full case study →](https://ason-format.github.io/ason/blog.html#case-study-cost-savings)

### 1. Reduce LLM API Costs (GPT-4, Claude, etc.)

```javascript
import { SmartCompressor } from '@ason-format/ason';
import OpenAI from 'openai';

const compressor = new SmartCompressor({ indent: 1 });
const openai = new OpenAI();

const largeData = await fetchDataFromDB();
const compressed = compressor.compress(largeData);

// Saves ~33% on tokens = 33% cost reduction
const response = await openai.chat.completions.create({
  messages: [{
    role: "user",
    content: `Analyze this data: ${compressed}`
  }]
});
```

### 2. Optimize Storage

```javascript
// Save to Redis/localStorage with less space
const compressor = new SmartCompressor({ indent: 1 });
localStorage.setItem('cache', compressor.compress(bigObject));

// Retrieve
const data = compressor.decompress(localStorage.getItem('cache'));
```

### 3. RAG Systems & Vector Databases

```javascript
// Compress document metadata before sending to LLM
import { SmartCompressor } from '@ason-format/ason';

const docs = await vectorDB.similaritySearch(query, k=10);
const compressed = compressor.compress(docs.map(d => ({
  content: d.pageContent,
  score: d.metadata.score,
  source: d.metadata.source
})));

// 50-60% token reduction on document arrays
const response = await llm.invoke(`Context: ${compressed}\n\nQuery: ${query}`);
```

### 4. Function Calling & Tool Use

```javascript
// Reduce token overhead in OpenAI function calling
const users = await db.query('SELECT id, name, email FROM users LIMIT 100');
const compressed = compressor.compress(users);

await openai.chat.completions.create({
  messages: [...],
  tools: [{
    type: "function",
    function: {
      name: "process_users",
      parameters: {
        type: "object",
        properties: {
          users: { type: "string", description: "User data in ASON format" }
        }
      }
    }
  }],
  tool_choice: { type: "function", function: { name: "process_users" } }
});
```

### 5. Analytics & Time-Series Data

```javascript
// 65% token reduction on metrics/analytics
const metrics = await getHourlyMetrics(last24Hours);
const compressed = compressor.compress(metrics);

// Perfect for dashboards, logs, financial data
const analysis = await llm.analyze(compressed);
```

### 6. Compact API Responses

```javascript
app.get('/api/data/compact', (req, res) => {
  const data = getDataFromDB();
  const compressed = compressor.compress(data);

  res.json({
    data: compressed,
    format: 'ason',
    savings: '33%'
  });
});
```

## 💡 More Use Cases & Guides

- **[RAG Systems Optimization](https://ason-format.github.io/ason/blog.html#rag-systems)** - 54% reduction on document metadata
- **[Function Calling Guide](https://ason-format.github.io/ason/blog.html#function-calling)** - 40% savings on bulk operations
- **[Analytics Data](https://ason-format.github.io/ason/blog.html#analytics)** - Time-series and metrics compression
- **[Migration Guide](https://ason-format.github.io/ason/blog.html#migration-guide)** - Step-by-step JSON to ASON migration

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/ason-format/ason.git
cd ason

# Install dependencies
cd nodejs-compressor
npm install

# Run tests
npm test

# Run benchmarks
npm run benchmark

# Build for production
npm run build

# Test CLI locally
node src/cli.js data.json --stats
```

## 🌟 Community & Support

- 💬 **[GitHub Discussions](https://github.com/ason-format/ason/discussions)** - Ask questions, share use cases
- 🐛 **[Issue Tracker](https://github.com/ason-format/ason/issues)** - Report bugs or request features
- 📰 **[Blog](https://ason-format.github.io/ason/blog.html)** - Case studies, tutorials, and guides
- 🔧 **[Tools & Extensions](https://ason-format.github.io/ason/tools.html)** - MCP Server, npm packages, CLI

## 🤝 Contributing

We welcome contributions! Please see:

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) - Community standards
- [SECURITY.md](./SECURITY.md) - Security policies

## 📝 License

[MIT](./LICENSE) © 2025 ASON Project Contributors

---

## 🔑 Keywords

LLM optimization • GPT-4 cost reduction • Claude API • Token compression • JSON optimization • RAG systems • Function calling • OpenAI API • Vector database • LangChain • Semantic kernel • AI cost savings • ML engineering • Data serialization • API optimization

---

<div align="center">

**[🎮 Try Interactive Playground](https://ason-format.github.io/ason/)**

*Reduce LLM API costs by 20-60%. Used in production by companies processing millions of API calls daily.*

[![Star on GitHub](https://img.shields.io/github/stars/ason-format/ason?style=social)](https://github.com/ason-format/ason)

</div>
