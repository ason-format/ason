# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-10

### Added
- **Initial Release** - ASON (Aliased Serialization Object Notation)
  - Complete Node.js implementation with SmartCompressor
  - Automatic pattern detection (zero configuration required)
  - Object references for repeated structures (`&obj0`, `&obj1`, etc.)
  - Inline-first value dictionary optimized for LLM readability (`#0`, `#1`, etc.)
  - Uniform array compression with `@keys` notation
  - Path flattening for nested single-property objects
  - Configurable indentation (1, 2, or 4 spaces)
  - Lossless compression with perfect round-trip fidelity

- **CLI Tool** - Command-line interface for JSON ↔ ASON conversion
  - Auto-detection of format from file extension or content
  - `--stats` flag for visual token count comparison with ASCII table
  - `--delimiter` option for comma/tab/pipe separators
  - Stdin/stdout support for piping workflows (e.g., `cat data.json | npx ason`)
  - Comprehensive help documentation with `-h/--help`
  - Support for `--no-references` and `--no-dictionary` flags

- **TypeScript Support** - Full type definitions included
  - `.d.ts` files for ESM (48.2 KB)
  - `.d.cts` files for CommonJS (48.2 KB)
  - Full IntelliSense and autocomplete support in VSCode and other IDEs
  - Proper type exports for both `import` and `require`

- **Build System** - Integrated tsup for optimized bundling
  - Minified ESM build (14.5 KB) - 70% smaller than source
  - Minified CJS build (14.5 KB) for Node.js legacy compatibility
  - Tree-shaking enabled for smaller bundle sizes
  - Dual package exports for seamless ESM/CJS interop

- **Testing & Quality**
  - Complete test suite with Jest
  - 33 passing tests across 3 test suites
  - Full coverage of compression/decompression cycles

- **Documentation & Community**
  - Interactive web visualizer with compress/decompress modes at `/docs/index.html`
  - Complete API documentation at `/docs/docs.html`
  - Interactive benchmarks at `/docs/benchmarks.html`
  - Premium README with head-to-head ASON vs Toon comparison
  - ASCII bar charts for visual benchmark comparison
  - Complete API reference with TypeScript examples
  - CLI usage guide with real-world examples
  - Professional badges (npm, TypeScript, License, Node.js)
  - Detailed table of contents with deep anchor links
  - "When to use" guide comparing ASON, Toon, JSON, and CSV
  - Examples in `/nodejs-compressor/examples/`
  - Community files: CODE_OF_CONDUCT, CONTRIBUTING, SECURITY
  - MIT License

### Performance
- **Up to 23.45% token reduction** on uniform arrays (Analytics dataset)
- **+4.94% average reduction** across 5 real-world datasets vs JSON
- Toon shows **-6.75% average** (uses MORE tokens than JSON on average)
- **ASON wins 3 out of 5** datasets vs JSON
- **Always performs better than Toon** - Even when ASON loses to JSON, it loses less than Toon
- Processes ~35ms for compression + decompression cycle
- Memory efficient: ~10MB for large datasets
- CLI `--stats` flag provides instant compression metrics

### Package Distribution
- Tarball size: 37.8 KB (includes types, CLI, and docs)
- Unpacked size: 148 KB
- Only 7 files published (optimized for production)
- Package ships with built/minified code instead of source files
- `package.json` configured with proper `exports` field for ESM/CJS resolution
- Updated `files` field to include only dist/, src/cli.js, and README.md
- Repository URL format corrected to use `git+` prefix (eliminates npm publish warning)

[1.0.0]: https://github.com/ason-format/ason/releases/tag/v1.0.0
